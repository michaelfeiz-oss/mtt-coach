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
    const keys = new Set(
      SEED_CHARTS.map(chart => `${chart.stackDepth}:${chart.spotKey}`)
    );

    expect(keys).toContain("15:UTG1_vs_UTG");
    expect(keys).toContain("25:MP_vs_UTG");
    expect(keys).toContain("40:SB_vs_CO");
    expect(keys).toContain("15:HJ_vs_BTN_3bet");
    expect(keys).toContain("25:CO_vs_BB_3bet");
    expect(keys).toContain("40:BTN_vs_SB_3bet");
    expect(keys).not.toContain("25:SB_vs_BB_3bet");
    expect(keys).not.toContain("40:SB_vs_BB_3bet");
    expect(SEED_CHARTS.some(chart => chart.stackDepth === 20)).toBe(false);
  });

  it("labels 25bb/40bb facing-3bet nodes as simplified population coverage", () => {
    const upgraded25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "CO_vs_BB_3bet"
    );
    const upgraded40 = SEED_CHARTS.find(
      chart => chart.stackDepth === 40 && chart.spotKey === "BTN_vs_SB_3bet"
    );

    expect(upgraded25?.sourceLabel).toBe("Simplified population vs 3-bet");
    expect(upgraded40?.sourceLabel).toBe("Simplified population vs 3-bet");
  });

  it("uses the new 25bb simplified-vs-3bet family rules instead of leaving nodes empty", () => {
    const oop25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "HJ_vs_BTN_3bet"
    );
    const ipBlind25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "BTN_vs_BB_3bet"
    );

    expect(
      oop25?.actions.find(action => action.handCode === "A5s")?.primaryAction
    ).toBe("JAM");
    expect(
      oop25?.actions.find(action => action.handCode === "ATo")?.primaryAction
    ).toBe("FOLD");
    expect(
      ipBlind25?.actions.find(action => action.handCode === "ATo")
        ?.primaryAction
    ).toBe("CALL");
    expect(
      ipBlind25?.actions.find(action => action.handCode === "77")?.primaryAction
    ).toBe("CALL");
  });

  it("keeps 40bb facing-3bet defaults disciplined around QQ+ and AK", () => {
    const ipBlind40 = SEED_CHARTS.find(
      chart => chart.stackDepth === 40 && chart.spotKey === "BTN_vs_BB_3bet"
    );

    expect(
      ipBlind40?.actions.find(action => action.handCode === "QQ")?.primaryAction
    ).toBe("JAM");
    expect(
      ipBlind40?.actions.find(action => action.handCode === "AQs")?.primaryAction
    ).toBe("CALL");
    expect(
      ipBlind40?.actions.find(action => action.handCode === "JJ")?.primaryAction
    ).toBe("CALL");
  });

  it("validates all generated seed charts", () => {
    expect(() => validateSeedCharts(SEED_CHARTS)).not.toThrow();
  });
});
