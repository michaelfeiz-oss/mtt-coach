import { describe, expect, it } from "vitest";
import type { RangeChartAction } from "../../drizzle/schema";
import {
  buildTrainerAttemptInsert,
  buildTrainerActionPool,
  getHandCoordinate,
  getMarginalFoldActions,
  handDistance,
  mapStrategySourceToAttemptSourceStatus,
  normalizeHandCode,
} from "./service";
import type { RangeChart } from "../../drizzle/schema";

function makeAction(
  handCode: string,
  primaryAction: RangeChartAction["primaryAction"]
): RangeChartAction {
  return {
    id: 0,
    chartId: 1,
    handCode,
    primaryAction,
    mixJson: null,
    weightPercent: null,
    colorToken: null,
    note: null,
  };
}

function makeChart(
  overrides: Partial<RangeChart> = {}
): RangeChart {
  return {
    id: 1,
    title: "BB vs BTN @ 25bb",
    stackDepth: 25,
    spotGroup: "VS_LP_RFI",
    spotKey: "BB_vs_BTN",
    heroPosition: "BB",
    villainPosition: "BTN",
    sourceLabel: "Exact chart",
    notesJson: null,
    isActive: true,
    createdAt: new Date("2026-04-30T10:00:00Z"),
    ...overrides,
  };
}

describe("strategy service pure logic", () => {
  it("maps suited, offsuit, and pair hand codes to matrix coordinates", () => {
    expect(getHandCoordinate("AKs")).toEqual({ row: 0, col: 1 });
    expect(getHandCoordinate("KJo")).toEqual({ row: 3, col: 1 });
    expect(getHandCoordinate("77")).toEqual({ row: 7, col: 7 });
  });

  it("calculates hand-grid distance in Chebyshev space", () => {
    const aa = getHandCoordinate("AA");
    const ajo = getHandCoordinate("AJo");
    const t2o = getHandCoordinate("T2o");

    expect(aa).not.toBeNull();
    expect(ajo).not.toBeNull();
    expect(t2o).not.toBeNull();

    expect(handDistance(aa!, ajo!)).toBe(3);
    expect(handDistance(ajo!, t2o!)).toBeGreaterThan(2);
  });

  it("keeps only marginal folds near continue regions", () => {
    const actions = [
      makeAction("AA", "RAISE"),
      makeAction("AKo", "CALL"),
      makeAction("AJo", "FOLD"),
      makeAction("T2o", "FOLD"),
    ];

    const folds = getMarginalFoldActions(actions);
    const foldCodes = folds.map(action => action.handCode);

    expect(foldCodes).toContain("AJo");
    expect(foldCodes).not.toContain("T2o");
  });

  it("builds a trainer pool with continue actions plus only marginal folds", () => {
    const actions = [
      makeAction("AA", "RAISE"),
      makeAction("AKo", "CALL"),
      makeAction("AJo", "FOLD"),
      makeAction("T2o", "FOLD"),
    ];

    const poolCodes = buildTrainerActionPool(actions).map(action => action.handCode);

    expect(poolCodes).toContain("AA");
    expect(poolCodes).toContain("AKo");
    expect(poolCodes).toContain("AJo");
    expect(poolCodes).not.toContain("T2o");
  });

  it("normalizes hero hand input for chart lookup", () => {
    expect(normalizeHandCode("AsKs")).toBe("AKs");
    expect(normalizeHandCode("kh jd")).toBe("KJo");
    expect(normalizeHandCode("7h7d")).toBe("77");
    expect(normalizeHandCode("q8o")).toBe("Q8o");
    expect(normalizeHandCode("z9o")).toBeNull();
  });

  it("maps chart source status into persisted trainer attempt status", () => {
    expect(
      mapStrategySourceToAttemptSourceStatus(
        makeChart({
          stackDepth: 15,
          spotGroup: "RFI",
          spotKey: "BTN_RFI",
          heroPosition: "BTN",
          villainPosition: null,
        })
      )
    ).toBe("exact_source");

    expect(
      mapStrategySourceToAttemptSourceStatus(
        makeChart({
          stackDepth: 40,
          spotGroup: "VS_3BET",
          spotKey: "CO_vs_BB_3bet",
          heroPosition: "CO",
          villainPosition: "BB",
        })
      )
    ).toBe("simplified_population");
  });

  it("builds persisted trainer attempts with canonical spot metadata", () => {
    const attempt = buildTrainerAttemptInsert({
      userId: 1,
      chart: makeChart(),
      handCode: "K9o",
      selectedAction: "FOLD",
      correctAction: "CALL",
      isCorrect: false,
      confidence: "unsure",
      drillPackId: "bb-vs-sb-marginal-defense",
      sessionId: "session-1",
      responseTimeMs: 1425.6,
    });

    expect(attempt.canonicalSpotId).toBe("DEFEND_VS_RFI|25|BB|BTN|9P|BBA");
    expect(attempt.spotFamily).toBe("DEFEND_VS_RFI");
    expect(attempt.sourceStatus).toBe("exact_source");
    expect(attempt.stackBb).toBe(25);
    expect(attempt.heroPosition).toBe("BB");
    expect(attempt.villainPosition).toBe("BTN");
    expect(attempt.confidence).toBe("unsure");
    expect(attempt.drillPackId).toBe("bb-vs-sb-marginal-defense");
    expect(attempt.sessionId).toBe("session-1");
    expect(attempt.responseTimeMs).toBe(1426);
    expect(attempt.leakFamilyId).toBe("blind_defense_too_tight");
  });

  it("sanitizes trainer attempt response times and supports simplified nodes", () => {
    const attempt = buildTrainerAttemptInsert({
      userId: 1,
      chart: makeChart({
        title: "CO vs BB 3-Bet @ 40bb",
        stackDepth: 40,
        spotGroup: "VS_3BET",
        spotKey: "CO_vs_BB_3bet",
        heroPosition: "CO",
        villainPosition: "BB",
        sourceLabel: "Simplified population",
      }),
      handCode: "AQo",
      selectedAction: "CALL",
      correctAction: "CALL",
      isCorrect: true,
      responseTimeMs: -10,
    });

    expect(attempt.sourceStatus).toBe("simplified_population");
    expect(attempt.spotFamily).toBe("FACING_3BET");
    expect(attempt.responseTimeMs).toBe(0);
    expect(attempt.leakFamilyId).toBeNull();
  });
});
