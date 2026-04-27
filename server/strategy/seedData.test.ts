import { describe, expect, it } from "vitest";
import {
  SPOT_DEFINITIONS,
  STACK_DEPTHS,
} from "../../shared/strategy";
import { isSourceSupportedStrategyChart } from "../../shared/sourceTruth";
import { SEED_CHARTS, validateSeedCharts } from "./seedData";

describe("strategy seed coverage", () => {
  it("only seeds source-supported chart selectors at the supported stacks", () => {
    const expectedCount = STACK_DEPTHS.flatMap(stackDepth =>
      SPOT_DEFINITIONS.filter(definition =>
        isSourceSupportedStrategyChart({
          stackDepth,
          spotGroup: definition.group,
          heroPosition: definition.heroPosition,
          villainPosition: definition.villainPosition,
          spotKey: definition.key,
        })
      )
    ).length;

    expect(SEED_CHARTS).toHaveLength(expectedCount);
  });

  it("keeps the backed parity spots and includes simplified 3-bet stacks", () => {
    const keys = new Set(SEED_CHARTS.map(chart => chart.spotKey));

    // Core spots that must always be present
    expect(keys).toContain("UTG1_vs_UTG");
    expect(keys).toContain("MP_vs_UTG");
    expect(keys).toContain("SB_vs_CO");
    expect(keys).toContain("HJ_vs_BTN_3bet");

    // Blind heroes in VS_3BET remain excluded at all stacks
    expect(keys).not.toContain("SB_vs_BB_3bet");

    // No 20bb stack (not a study stack)
    expect(SEED_CHARTS.some(chart => chart.stackDepth === 20)).toBe(false);

    // 25bb and 40bb VS_3BET are now seeded as simplified population nodes
    expect(
      SEED_CHARTS.some(
        chart => chart.spotGroup === "VS_3BET" && chart.stackDepth === 25
      )
    ).toBe(true);
    expect(
      SEED_CHARTS.some(
        chart => chart.spotGroup === "VS_3BET" && chart.stackDepth === 40
      )
    ).toBe(true);
  });

  it("validates all generated seed charts", () => {
    expect(() => validateSeedCharts(SEED_CHARTS)).not.toThrow();
  });
});
