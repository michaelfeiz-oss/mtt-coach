import { describe, expect, it } from "vitest";
import type { RangeChartWithActions } from "../../shared/preflopStrategy";
import {
  buildTrainerAttemptInsert,
  buildTrainerActionPool,
  getHandCoordinate,
  getMarginalFoldActions,
  handDistance,
  mapStrategySourceToAttemptSourceStatus,
  normalizeHandCode,
} from "./service";

function makeAction(
  handCode: string,
  primaryAction: RangeChartWithActions["actions"][number]["primaryAction"]
) {
  return {
    handCode,
    primaryAction,
  };
}

function makeChart(
  overrides: Partial<RangeChartWithActions> = {}
): RangeChartWithActions {
  return {
    id: 1,
    version: "population-v1",
    stackBucket: 25,
    playerCount: 9,
    scenarioFamily: "facing_open_late",
    title: "BB vs BTN @ 25bb",
    stackDepth: 25,
    spotGroup: "facing_open_late",
    spotKey: "BB_vs_BTN_open",
    heroPosition: "BB",
    villainPosition: "BTN",
    villainGroup: null,
    reviewed: false,
    sourceLabel: "Not yet reviewed",
    actions: [],
    ...overrides,
  };
}

describe("typed strategy service logic", () => {
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

  it("maps reviewed nodes to exact_source and everything else to derived", () => {
    expect(
      mapStrategySourceToAttemptSourceStatus(
        makeChart({
          reviewed: true,
          actions: [makeAction("AA", "RAISE")],
        })
      )
    ).toBe("exact_source");

    expect(
      mapStrategySourceToAttemptSourceStatus(
        makeChart({
          reviewed: false,
          actions: [makeAction("AA", "RAISE")],
        })
      )
    ).toBe("derived");
  });

  it("builds persisted trainer attempts with typed node metadata", () => {
    const attempt = buildTrainerAttemptInsert({
      userId: 1,
      chart: makeChart(),
      handCode: "K9o",
      selectedAction: "FOLD",
      correctAction: "CALL",
      isCorrect: false,
      confidence: "unsure",
      sessionId: "session-1",
      responseTimeMs: 1425.6,
    });

    expect(attempt.nodeId).toBe(1);
    expect(attempt.stackBucket).toBe(25);
    expect(attempt.scenarioFamily).toBe("facing_open_late");
    expect(attempt.heroPosition).toBe("BB");
    expect(attempt.villainPosition).toBe("BTN");
    expect(attempt.handCode).toBe("K9o");
    expect(attempt.selectedAction).toBe("FOLD");
    expect(attempt.correctAction).toBe("CALL");
    expect(attempt.confidence).toBe("unsure");
    expect(attempt.sessionId).toBe("session-1");
    expect(attempt.responseTimeMs).toBe(1426);
  });

  it("sanitizes trainer attempt response times for deep-stack charts too", () => {
    const attempt = buildTrainerAttemptInsert({
      userId: 1,
      chart: makeChart({
        stackDepth: 70,
        stackBucket: 70,
        scenarioFamily: "rfi",
        spotGroup: "rfi",
        heroPosition: "CO",
        villainPosition: null,
        spotKey: "CO_rfi",
        title: "CO RFI @ 70bb",
      }),
      handCode: "AQo",
      selectedAction: "RAISE",
      correctAction: "RAISE",
      isCorrect: true,
      responseTimeMs: -10,
    });

    expect(attempt.stackBucket).toBe(70);
    expect(attempt.scenarioFamily).toBe("rfi");
    expect(attempt.responseTimeMs).toBe(0);
  });
});
