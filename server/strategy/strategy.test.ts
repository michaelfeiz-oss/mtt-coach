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
import { ALL_HANDS } from "../../shared/strategy";

// ── helpers ──────────────────────────────────────────────────────────────────

async function seedTestChart() {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Clean up any leftover test data by title (unique test marker)
  // spotKey = "BTN_RFI" so getStrategySourceStatus returns source_backed
  // and trainerAllowed = true (TEST_BTN_RFI is not in the reviewed catalog)
  const TEST_TITLE = "__TEST__ BTN RFI @ 25bb";

  const existing = await db
    .select({ id: rangeCharts.id })
    .from(rangeCharts)
    .where(eq(rangeCharts.title, TEST_TITLE));

  for (const row of existing) {
    await db.delete(rangeChartActions).where(eq(rangeChartActions.chartId, row.id));
    await db.delete(rangeCharts).where(eq(rangeCharts.id, row.id));
  }

  const chartId = await createChart({
    title: TEST_TITLE,
    stackDepth: 25,
    spotGroup: "RFI",
    // BTN_RFI is in the reviewed catalog at 25bb → source_backed → trainerAllowed = true
    spotKey: "BTN_RFI",
    heroPosition: "BTN",
    villainPosition: null,
    sourceLabel: "Test",
    notesJson: null,
    isActive: true,
  });

  // Seed all 169 hands so the completeness check passes.
  // Specific hands have meaningful actions for test assertions;
  // all others default to FOLD.
  const specificActions: Record<string, string> = {
    AA: "RAISE",
    AKo: "CALL",
    AJo: "FOLD",
    T2o: "FOLD",
  };
  await bulkInsertActions(
    ALL_HANDS.map(hand => ({
      chartId,
      handCode: hand,
      primaryAction: (specificActions[hand] ?? "FOLD") as "RAISE" | "CALL" | "FOLD",
      weightPercent: 100,
      mixJson: null,
      colorToken: null,
      note: null,
    }))
  );

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
      // Find by id since spotKey BTN_RFI is shared with the production chart
      const testSpot = spots.find(s => s.id === testChartId);
      expect(testSpot).toBeDefined();
      expect(testSpot?.title).toBe("__TEST__ BTN RFI @ 25bb");
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
      expect(chart!.title).toBe("__TEST__ BTN RFI @ 25bb");
      expect(chart!.actions.length).toBe(169); // full 169-cell chart
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
      // Trainer picks from continue-range hands first (AA=RAISE, AKo=CALL)
      expect(["RAISE", "CALL", "FOLD"]).toContain(spot!.correctAction);
    });

    it("can include marginal fold reps when continue hands are in recent history", async () => {
      const spot = await getTrainerSpot({
        chartId: testChartId,
        recentHandKeys: [`${testChartId}:AA`, `${testChartId}:AKo`],
      });

      expect(spot).not.toBeNull();
      // Trainer should return a marginal fold or another continue hand
      expect(["RAISE", "CALL", "FOLD"]).toContain(spot!.correctAction);
      // Should not return the recently-seen hands
      expect(spot!.handCode).not.toBe("AA");
      expect(spot!.handCode).not.toBe("AKo");
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
      expect(spot!.chart.title).toBe("__TEST__ BTN RFI @ 25bb");
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
