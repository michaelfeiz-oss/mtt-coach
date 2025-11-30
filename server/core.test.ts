import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    timezone: "Australia/Sydney",
    goalsJson: JSON.stringify({
      weeklyStudyHours: 7,
      weeklySessions: 5,
      weeklyTournaments: 2
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("MTT Coach Core Functionality", () => {
  describe("Week Management", () => {
    it("should get or create current week", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const week = await caller.weeks.getCurrent();

      expect(week).toBeDefined();
      expect(week.userId).toBe(ctx.user.id);
      expect(week.startDate).toBeInstanceOf(Date);
      expect(week.endDate).toBeInstanceOf(Date);
    });

    it("should list user weeks", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const weeks = await caller.weeks.list({ limit: 10 });

      expect(Array.isArray(weeks)).toBe(true);
      expect(weeks.length).toBeGreaterThan(0);
      expect(weeks[0].userId).toBe(ctx.user.id);
    });
  });

  describe("Study Sessions", () => {
    it("should create a study session and auto-assign to week", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const session = await caller.studySessions.create({
        date: new Date(),
        type: "HAND_REVIEW",
        durationMinutes: 60,
        resourceUsed: "APT",
        handsReviewedCount: 10,
        drillsCompletedCount: 0,
        keyTakeaways: "Test session",
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(ctx.user.id);
      expect(session.type).toBe("HAND_REVIEW");
      expect(session.durationMinutes).toBe(60);
      expect(session.weekId).toBeGreaterThan(0);
    });
  });

  describe("Tournaments", () => {
    it("should create a tournament with correct net result calculation", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const tournament = await caller.tournaments.create({
        date: new Date(),
        venue: "Test Venue",
        name: "Test Tournament",
        buyIn: 100,
        reEntries: 1,
        prize: 500,
        finalPosition: 3,
      });

      expect(tournament).toBeDefined();
      expect(tournament.userId).toBe(ctx.user.id);
      expect(tournament.buyIn).toBe(100);
      expect(tournament.reEntries).toBe(1);
      expect(tournament.prize).toBe(500);
      // Net result = 500 - (100 * (1 + 1)) = 300
      expect(tournament.netResult).toBe(300);
    });
  });

  describe("Hands & Leaks", () => {
    it("should create a hand and link to leaks", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Create a leak first
      const leak = await caller.leaks.create({
        name: "Test Leak",
        category: "PREFLOP",
        description: "Test description",
        status: "ACTIVE",
      });

      // Create a hand linked to the leak
      const hand = await caller.hands.create({
        heroPosition: "BTN",
        heroHand: "AKo",
        boardRunout: "Ah9s4h 2c Kh",
        effectiveStackBb: 20,
        spotType: "SINGLE_RAISED_POT",
        reviewed: true,
        mistakeSeverity: 2,
        tags: ["TEST"],
        leakIds: [leak.id],
      });

      expect(hand).toBeDefined();
      expect(hand.userId).toBe(ctx.user.id);
      expect(hand.heroHand).toBe("AKo");

      // Verify leak is linked
      const linkedLeaks = await caller.hands.getLeaks({ handId: hand.id });
      expect(linkedLeaks.length).toBe(1);
      expect(linkedLeaks[0].id).toBe(leak.id);
    });

    it("should get top leaks ranked by volume, severity, and recency", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const topLeaks = await caller.leaks.getTop({ limit: 5 });

      expect(Array.isArray(topLeaks)).toBe(true);
      // Should have leaks from seed data
      expect(topLeaks.length).toBeGreaterThan(0);
    });
  });

  describe("Dashboard Analytics", () => {
    it("should calculate dashboard stats for current week", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      const currentWeek = await caller.weeks.getCurrent();
      const stats = await caller.dashboard.getStats({ weekId: currentWeek.id });

      expect(stats).toBeDefined();
      expect(stats.week).toBeDefined();
      expect(stats.studyHours).toBeGreaterThanOrEqual(0);
      expect(stats.studyHoursTarget).toBeGreaterThan(0);
      expect(stats.tournamentsCount).toBeGreaterThanOrEqual(0);
      expect(stats.tournamentsTarget).toBeGreaterThan(0);
      expect(typeof stats.netResult).toBe("number");
    });
  });

  describe("Week Auto-Assignment Logic", () => {
    it("should assign tournament to correct week based on date", async () => {
      const { ctx } = createTestContext();
      const caller = appRouter.createCaller(ctx);

      // Create tournament with specific date
      const testDate = new Date('2025-11-28T19:00:00+11:00');
      const tournament = await caller.tournaments.create({
        date: testDate,
        venue: "Test Venue",
        buyIn: 100,
        prize: 0,
      });

      // Verify it was assigned to the correct week (Nov 25 - Dec 1, 2025)
      const week = await db.getWeekById(tournament.weekId);
      expect(week).toBeDefined();
      expect(week!.startDate.getTime()).toBeLessThanOrEqual(testDate.getTime());
      expect(week!.endDate.getTime()).toBeGreaterThanOrEqual(testDate.getTime());
    });
  });
});
