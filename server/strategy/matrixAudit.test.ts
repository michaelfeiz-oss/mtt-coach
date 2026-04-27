import { describe, expect, it } from "vitest";
import { buildMatrixDuplicateGroups } from "./matrixAudit";
import { SEED_CHARTS } from "./seedData";

describe("matrix duplicate audit", () => {
  it("accepts shared simplified 25bb/40bb VS_3BET family duplicates only within the same family", () => {
    const duplicateGroups = buildMatrixDuplicateGroups(SEED_CHARTS);
    const simplifiedGroups = duplicateGroups.filter(
      group => group.classification === "accepted_simplified_family"
    );

    expect(simplifiedGroups.length).toBeGreaterThan(0);

    for (const group of simplifiedGroups) {
      const families = new Set(group.charts.map(chart => chart.simplifiedFamily));
      expect(families.size).toBe(1);
      expect(group.acceptable).toBe(true);
    }
  });

  it("keeps source-backed duplicate groups flagged for review instead of pretending they are exact-seat distinctions", () => {
    const duplicateGroups = buildMatrixDuplicateGroups(SEED_CHARTS);
    const reviewGroup = duplicateGroups.find(group =>
      group.classification === "needs_review" &&
      group.charts.some(chart => chart.sourceStatus === "source_backed")
    );

    expect(reviewGroup).toBeDefined();
    expect(reviewGroup?.acceptable).toBe(false);
  });
});
