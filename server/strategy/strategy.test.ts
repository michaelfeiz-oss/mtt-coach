/**
 * server/strategy/strategy.test.ts
 * Tests for the Strategy Module service layer.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  listAvailableSpots,
  getChartWithActions,
  getTrainerSpot,
  submitTrainerAttempt,
  createChart,
  bulkInsertActions,
} from "./service";
import { getDb } from "../db";
import { rangeCharts, rangeChartActions, trainerAttempts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ── helpers ──────────────────────────────────────────────────────────────────

async function seedTestChart() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Clean up any leftover test data
  const existing = await db
    .select({ id: rangeCharts.id })
    .from(rangeCharts)
    .where(eq(rangeCharts.spotKey, "TEST_BTN_RFI"));

  for (const row of existing) {
    await db.delete(rangeChartActions).where(eq(rangeChartActions.chartId, row.id));
    await db.delete(rangeCharts).where(eq(rangeCharts.id, row.id));
  }

  const chartId = await createChart({
    title: "Test BTN RFI @ 25bb",
    stackDepth: 25,
    spotGroup: "RFI",
    spotKey: "TEST_BTN_RFI",
    heroPosition: "BTN",
    villainPosition: null,
    sourceLabel: "Test",
    notesJson: null,
    isActive: true,
  });

  await bulkInsertActions([
    { chartId, handCode: "AA", primaryAction: "RAISE", weightPercent: 100, mixJson: null, colorToken: null, note: null },
    { chartId, handCode: "AKo", primaryAction: "CALL", weightPercent: 100, mixJson: null, colorToken: null, note: null },
    { chartId, handCode: "AJo", primaryAction: "FOLD", weightPercent: 100, mixJson: null, colorToken: null, note: null },
    { chartId, handCode: "T2o", primaryAction: "FOLD", weightPercent: 100, mixJson: null, colorToken: null, note: null },
  ]);

  return chartId;
}

// ── tests ─────────────────────────────────────────────────────────────────────

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("Strategy Module", () => {
  let testChartId: number;

  beforeAll(async () => {
    testChartId = await seedTestChart();
  });

  describe("listAvailableSpots", () => {
    it("returns at least the seeded test chart", async () => {
      const spots = await listAvailableSpots({});
      expect(spots.length).toBeGreaterThan(0);
      const testSpot = spots.find(s => s.spotKey === "TEST_BTN_RFI");
      expect(testSpot).toBeDefined();
      expect(testSpot?.title).toBe("Test BTN RFI @ 25bb");
      expect(testSpot?.stackDepth).toBe(25);
    });

    it("filters by stackDepth", async () => {
      const spots = await listAvailableSpots({ stackDepth: 25 });
      expect(spots.every(s => s.stackDepth === 25)).toBe(true);
    });

    it("filters by spotGroup", async () => {
      const spots = await listAvailableSpots({ spotGroup: "RFI" });
      expect(spots.every(s => s.spotGroup === "RFI")).toBe(true);
    });
  });

  describe("getChartWithActions", () => {
    it("returns chart with all seeded actions", async () => {
      const chart = await getChartWithActions(testChartId);
      expect(chart).not.toBeNull();
      expect(chart!.title).toBe("Test BTN RFI @ 25bb");
      expect(chart!.actions.length).toBe(4);
      const aaPrimary = chart!.actions.find(a => a.handCode === "AA")?.primaryAction;
      expect(aaPrimary).toBe("RAISE");
    });

    it("returns null for non-existent chart", async () => {
      const chart = await getChartWithActions(999999);
      expect(chart).toBeNull();
    });
  });

  describe("getTrainerSpot", () => {
    it("returns a trainer hand from the chart", async () => {
      const spot = await getTrainerSpot({ chartId: testChartId });
      expect(spot).not.toBeNull();
      expect(["AA", "AKo", "AJo"]).toContain(spot!.handCode);
      expect(["RAISE", "CALL", "FOLD"]).toContain(spot!.correctAction);
    });

    it("can include marginal fold reps when continue hands are in recent history", async () => {
      const spot = await getTrainerSpot({
        chartId: testChartId,
        recentHandKeys: [`${testChartId}:AA`, `${testChartId}:AKo`],
      });

      expect(spot).not.toBeNull();
      expect(spot!.handCode).toBe("AJo");
      expect(spot!.correctAction).toBe("FOLD");
    });

    it("excludes garbage folds far from the continue boundary", async () => {
      for (let index = 0; index < 12; index += 1) {
        const spot = await getTrainerSpot({
          chartId: testChartId,
          recentHandKeys: [`${testChartId}:AA`, `${testChartId}:AKo`],
        });

        expect(spot).not.toBeNull();
        expect(spot!.handCode).not.toBe("T2o");
      }
    });

    it("includes chart metadata", async () => {
      const spot = await getTrainerSpot({ chartId: testChartId });
      expect(spot!.chart.id).toBe(testChartId);
      expect(spot!.chart.title).toBe("Test BTN RFI @ 25bb");
    });

    it("supports current decision family setup filters", async () => {
      const spot = await getTrainerSpot({
        stackDepth: 25,
        spotGroup: "RFI",
      });

      expect(spot).not.toBeNull();
      expect(spot!.chart.stackDepth).toBe(25);
      expect(spot!.chart.spotGroup).toBe("RFI");
    });

    it("keeps current spot mode pinned to the requested chart", async () => {
      const spot = await getTrainerSpot({
        chartId: testChartId,
        recentChartIds: [testChartId],
      });

      expect(spot).not.toBeNull();
      expect(spot!.chartId).toBe(testChartId);
    });

    it("provides answer choices including the correct action", async () => {
      const spot = await getTrainerSpot({ chartId: testChartId });
      expect(spot!.choices).toContain(spot!.correctAction);
      expect(spot!.choices.length).toBeGreaterThan(1);
    });
  });

  describe("submitTrainerAttempt", () => {
    it("returns correct result for a correct answer (unauthenticated)", async () => {
      const result = await submitTrainerAttempt(null, {
        chartId: testChartId,
        handCode: "AA",
        selectedAction: "RAISE",
      });
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(true);
      expect(result!.correctAction).toBe("RAISE");
    });

    it("returns incorrect result for a wrong answer (unauthenticated)", async () => {
      const result = await submitTrainerAttempt(null, {
        chartId: testChartId,
        handCode: "AA",
        selectedAction: "FOLD",
      });
      expect(result).not.toBeNull();
      expect(result!.isCorrect).toBe(false);
      expect(result!.correctAction).toBe("RAISE");
    });

    it("returns null for an unknown hand", async () => {
      const result = await submitTrainerAttempt(null, {
        chartId: testChartId,
        handCode: "ZZZZ",
        selectedAction: "RAISE",
      });
      expect(result).toBeNull();
    });
  });
});
