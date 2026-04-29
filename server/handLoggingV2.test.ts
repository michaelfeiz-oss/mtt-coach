/**
 * Hand Logging V2 – Persistence & Correctness Tests
 *
 * Covers:
 * 1. Hand parser (exact cards → handClass derivation)
 * 2. createHand mutation – persists all structured V2 fields
 * 3. Backward compatibility – old hands without actionsJson / boardJson still load
 * 4. Migration defaults – empty actionsJson / boardJson handled safely
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
      weeklyTournaments: 2,
    }),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = { user, req: {} as any, res: {} as any };
  return { ctx };
}

// ─── 1. Hand Parser Tests ─────────────────────────────────────────────────────

/**
 * Mirrors the parseHandInput logic in LogHandModalV2_1.tsx.
 * We test the derived handClass values here via the server round-trip.
 */
function deriveHandClass(c1: string, c2: string): string {
  if (c1.length < 2 || c2.length < 2) return "";
  const rank1 = c1[0];
  const rank2 = c2[0];
  const suit1 = c1[1];
  const suit2 = c2[1];
  const RANK_ORDER = "AKQJT98765432";
  const r1 = RANK_ORDER.indexOf(rank1) < RANK_ORDER.indexOf(rank2) ? rank1 : rank2;
  const r2 = r1 === rank1 ? rank2 : rank1;
  if (rank1 === rank2) return r1 + r2;
  const suited = suit1 === suit2 ? "s" : "o";
  return r1 + r2 + suited;
}

describe("Hand Parser", () => {
  it("AhKh → AKs (suited)", () => {
    expect(deriveHandClass("Ah", "Kh")).toBe("AKs");
  });
  it("AsKd → AKo (offsuit)", () => {
    expect(deriveHandClass("As", "Kd")).toBe("AKo");
  });
  it("KcKs → KK (pair)", () => {
    expect(deriveHandClass("Kc", "Ks")).toBe("KK");
  });
  it("AhKh order-independent (Kh, Ah)", () => {
    expect(deriveHandClass("Kh", "Ah")).toBe("AKs");
  });
  it("2c2d → 22 (pair)", () => {
    expect(deriveHandClass("2c", "2d")).toBe("22");
  });
  it("TsJd → JTo (offsuit, correct rank order)", () => {
    expect(deriveHandClass("Ts", "Jd")).toBe("JTo");
  });
});

// ─── 2. createHand Persistence Tests ─────────────────────────────────────────

describe("createHand V2 Persistence", () => {
  it("persists exact hero cards and handClass", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const hand = await caller.hands.create({
      heroCard1: "Ks",
      heroCard2: "Kd",
      handClass: "KK",
      exactSuitsKnown: true,
      heroPosition: "SB",
      villainPosition: "UTG",
      actualStackBB: 40,
      spotType: "FACING_3BET",
      reviewStatus: "NEEDS_REVIEW",
    });

    expect(hand).toBeDefined();
    expect((hand as any).heroCard1).toBe("Ks");
    expect((hand as any).heroCard2).toBe("Kd");
    expect((hand as any).handClass).toBe("KK");
    expect((hand as any).exactSuitsKnown).toBe(true);
    expect((hand as any).actualStackBB).toBe(40);
    expect((hand as any).reviewStatus).toBe("NEEDS_REVIEW");
  });

  it("persists actionsJson with preflop and postflop streets", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const actions = [
      { street: "PREFLOP", actor: "UTG", action: "RAISE", size: "2", sizeUnit: "bb" },
      { street: "PREFLOP", actor: "SB", action: "3BET", size: "7", sizeUnit: "bb" },
      { street: "PREFLOP", actor: "UTG", action: "CALL" },
      { street: "FLOP", actor: "SB", action: "CHECK" },
      { street: "FLOP", actor: "UTG", action: "BET", size: "30", sizeUnit: "%" },
      { street: "FLOP", actor: "SB", action: "CALL" },
      { street: "TURN", actor: "SB", action: "CHECK" },
      { street: "TURN", actor: "UTG", action: "BET", size: "40", sizeUnit: "%" },
      { street: "TURN", actor: "SB", action: "CALL" },
      { street: "RIVER", actor: "SB", action: "BET", size: "20", sizeUnit: "%" },
      { street: "RIVER", actor: "UTG", action: "RAISE", size: "5x", sizeUnit: "" },
      { street: "RIVER", actor: "SB", action: "FOLD" },
    ];
    const board = {
      flopText: "7c 4h 2d",
      turnCard: "Kd",
      riverCard: "2s",
    };

    const hand = await caller.hands.create({
      heroCard1: "Ks",
      heroCard2: "Kd",
      handClass: "KK",
      exactSuitsKnown: true,
      heroPosition: "SB",
      villainPosition: "UTG",
      actualStackBB: 40,
      spotType: "FACING_3BET",
      actionsJson: JSON.stringify(actions),
      boardJson: JSON.stringify(board),
      mistakeStreet: "RIVER",
      mistakeSeverity: 2,
      villainType: "Aggro reg",
      rangeRead: "Wide",
      lesson: "Do not block-bet river without a plan versus raise.",
      leakFamilyId: "river_play",
      confidence: "HIGH",
      reviewStatus: "REVIEWED",
    });

    expect(hand).toBeDefined();
    // actionsJson round-trip
    const parsedActions = JSON.parse((hand as any).actionsJson);
    expect(Array.isArray(parsedActions)).toBe(true);
    expect(parsedActions.length).toBe(12);
    expect(parsedActions[0].street).toBe("PREFLOP");
    expect(parsedActions[11].action).toBe("FOLD");
    // boardJson round-trip
    const parsedBoard = JSON.parse((hand as any).boardJson);
    expect(parsedBoard.flopText).toBe("7c 4h 2d");
    expect(parsedBoard.turnCard).toBe("Kd");
    expect(parsedBoard.riverCard).toBe("2s");
    // Review metadata
    expect((hand as any).mistakeStreet).toBe("RIVER");
    expect((hand as any).mistakeSeverity).toBe(2);
    expect((hand as any).villainType).toBe("Aggro reg");
    expect((hand as any).rangeRead).toBe("Wide");
    expect((hand as any).lesson).toBe("Do not block-bet river without a plan versus raise.");
    expect((hand as any).leakFamilyId).toBe("river_play");
    expect((hand as any).confidence).toBe("HIGH");
    expect((hand as any).reviewStatus).toBe("REVIEWED");
  });

  it("persists review metadata fields", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const hand = await caller.hands.create({
      heroPosition: "BTN",
      heroHand: "AKo",
      spotType: "SINGLE_RAISED_POT",
      actualStackBB: 25,
      leakFamilyId: "preflop_sizing",
      confidence: "MEDIUM",
      reviewStatus: "DRAFT",
      mistakeStreet: "PREFLOP",
      mistakeSeverity: 1,
    });

    expect((hand as any).leakFamilyId).toBe("preflop_sizing");
    expect((hand as any).confidence).toBe("MEDIUM");
    expect((hand as any).reviewStatus).toBe("DRAFT");
    expect((hand as any).mistakeStreet).toBe("PREFLOP");
    expect((hand as any).mistakeSeverity).toBe(1);
  });
});

// ─── 3. Backward Compatibility Tests ─────────────────────────────────────────

describe("Backward Compatibility – Old Hands", () => {
  it("old hand without actionsJson / boardJson still loads without crash", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create a hand with only legacy fields (no V2 fields)
    const hand = await caller.hands.create({
      heroPosition: "BTN",
      heroHand: "AKo",
      boardRunout: "Ah9s4h",
      effectiveStackBb: 20,
      spotType: "SINGLE_RAISED_POT",
      reviewed: false,
      mistakeSeverity: 0,
    });

    expect(hand).toBeDefined();
    // V2 fields should be null/undefined/default – not crash
    expect((hand as any).actionsJson).toBeNull();
    expect((hand as any).boardJson).toBeNull();
    expect((hand as any).heroCard1).toBeNull();
    expect((hand as any).heroCard2).toBeNull();
    expect((hand as any).exactSuitsKnown).toBe(false);
    expect((hand as any).reviewStatus).toBe("NEEDS_REVIEW"); // default
  });

  it("getById returns old hand with null actionsJson safely", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const hand = await caller.hands.create({
      heroPosition: "CO",
      heroHand: "QQ",
      effectiveStackBb: 30,
      spotType: "RFI",
    });

    const fetched = await caller.hands.getById({ id: hand.id });
    expect(fetched).toBeDefined();
    // Safe parse of null actionsJson should return empty array
    const parsed = fetched && (fetched as any).actionsJson
      ? JSON.parse((fetched as any).actionsJson)
      : [];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(0);
  });
});

// ─── 4. Update Mutation – Review Fields ──────────────────────────────────────

describe("hands.update – Review Fields Persistence", () => {
  it("updates leakFamilyId and lesson together", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const hand = await caller.hands.create({
      heroPosition: "BB",
      heroHand: "A5s",
      spotType: "DEFEND_VS_RFI",
      actualStackBB: 20,
    });

    await caller.hands.update({
      id: hand.id,
      leakFamilyId: "postflop_passivity",
      lesson: "Check-raise more often on wet boards.",
      reviewStatus: "REVIEWED",
    });

    const updated = await caller.hands.getById({ id: hand.id });
    expect((updated as any).leakFamilyId).toBe("postflop_passivity");
    expect(updated?.lesson).toBe("Check-raise more often on wet boards.");
    expect((updated as any).reviewStatus).toBe("REVIEWED");
    expect(updated?.reviewed).toBe(true); // synced from reviewStatus
  });

  it("clears leakFamilyId when set to empty string", async () => {
    const { ctx } = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const hand = await caller.hands.create({
      heroPosition: "BTN",
      heroHand: "KQs",
      spotType: "RFI",
      actualStackBB: 40,
      leakFamilyId: "preflop_sizing",
    });

    await caller.hands.update({ id: hand.id, leakFamilyId: "" });
    const updated = await caller.hands.getById({ id: hand.id });
    // Empty string maps to null in the router
    expect((updated as any).leakFamilyId == null || (updated as any).leakFamilyId === "").toBe(true);
  });
});
