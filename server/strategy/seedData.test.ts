import { describe, expect, it } from "vitest";
import {
  SPOT_DEFINITIONS,
  STACK_DEPTHS,
} from "../../shared/strategy";
import { SEED_CHARTS, validateSeedCharts } from "./seedData";

describe("strategy seed coverage", () => {
  it("seeds every shared spot definition at every supported stack", () => {
    expect(SEED_CHARTS).toHaveLength(SPOT_DEFINITIONS.length * STACK_DEPTHS.length);
  });

  it("includes the expanded parity spots for viewer and drill", () => {
    const keys = new Set(SEED_CHARTS.map(chart => chart.spotKey));

    expect(keys).toContain("UTG1_vs_UTG");
    expect(keys).toContain("MP_vs_UTG");
    expect(keys).toContain("SB_vs_CO");
    expect(keys).toContain("HJ_vs_BTN_3bet");
    expect(keys).toContain("SB_vs_BB_3bet");
  });

  it("validates all generated seed charts", () => {
    expect(() => validateSeedCharts(SEED_CHARTS)).not.toThrow();
  });
});
