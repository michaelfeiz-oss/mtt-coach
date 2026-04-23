import { describe, expect, it } from "vitest";
import type { RangeChartAction } from "../../drizzle/schema";
import {
  buildTrainerActionPool,
  getHandCoordinate,
  getMarginalFoldActions,
  handDistance,
  normalizeHandCode,
} from "./service";

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
});
