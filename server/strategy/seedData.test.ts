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

  it("keeps the backed parity spots and trims unsupported 3-bet stacks", () => {
    const keys = new Set(SEED_CHARTS.map(chart => chart.spotKey));

    expect(keys).toContain("UTG1_vs_UTG");
    expect(keys).toContain("MP_vs_UTG");
    expect(keys).toContain("SB_vs_CO");
    expect(keys).toContain("HJ_vs_BTN_3bet");
    expect(keys).not.toContain("SB_vs_BB_3bet");
    expect(SEED_CHARTS.some(chart => chart.stackDepth === 20)).toBe(false);
    expect(
      SEED_CHARTS.some(
        chart => chart.spotGroup === "VS_3BET" && chart.stackDepth !== 15
      )
    ).toBe(false);
  });

  it("validates all generated seed charts", () => {
    expect(() => validateSeedCharts(SEED_CHARTS)).not.toThrow();
  });
});
