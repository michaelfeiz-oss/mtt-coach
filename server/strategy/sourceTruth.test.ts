import { describe, expect, it } from "vitest";
import {
  SOURCE_BACKED_MAIN_STACKS,
  SIMPLIFIED_POPULATION_3BET_STACKS,
  getSharedFamilySourceLabel,
  getStrategySourceHelperText,
  getStrategySourceLabel,
  getStrategySourceStatus,
  isSourceSupportedStrategyChart,
} from "../../shared/sourceTruth";
import { STACK_DEPTHS } from "../../shared/strategy";
import { MAIN_STUDY_STACK_BUCKETS } from "../../shared/preflopTaxonomy";

describe("source-of-truth chart coverage", () => {
  it("exposes only the source-backed main chart stacks", () => {
    expect(STACK_DEPTHS).toEqual([15, 25, 40]);
    expect(MAIN_STUDY_STACK_BUCKETS).toEqual([15, 25, 40]);
    expect(SOURCE_BACKED_MAIN_STACKS).toEqual([15, 25, 40]);
  });

  it("keeps 15bb facing-3bet exact-source and exposes 25bb/40bb as simplified population nodes", () => {
    expect(
      getStrategySourceStatus({
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe("source_backed");

    expect(
      getStrategySourceStatus({
        stackDepth: 25,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe("simplified_population");

    expect(
      getStrategySourceStatus({
        stackDepth: 40,
        spotGroup: "VS_3BET",
        heroPosition: "BTN",
        villainPosition: "SB",
        spotKey: "BTN_vs_SB_3bet",
      })
    ).toBe("simplified_population");

    expect(
      isSourceSupportedStrategyChart({
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "SB",
        villainPosition: "BB",
        spotKey: "SB_vs_BB_3bet",
      })
    ).toBe(false);
  });

  it("exposes the new simplified 3-bet stack set and labels it honestly", () => {
    expect(SIMPLIFIED_POPULATION_3BET_STACKS).toEqual([25, 40]);
    const chart = {
      stackDepth: 25,
      spotGroup: "VS_3BET" as const,
      heroPosition: "CO",
      villainPosition: "BB",
      spotKey: "CO_vs_BB_3bet",
    };

    expect(
      getStrategySourceLabel(chart)
    ).toBe("Simplified Population");
    expect(getSharedFamilySourceLabel(chart)).toBe(
      "Shared IP vs BB 3-Bet family"
    );
    expect(getStrategySourceHelperText(chart)).toBe(
      "Practical simplified model - not exact PDF chart."
    );
  });

  it("keeps blind-vs-blind spots visible as explicit proxy coverage", () => {
    expect(
      getStrategySourceStatus({
        stackDepth: 25,
        spotGroup: "BVB",
        heroPosition: "SB",
        villainPosition: "BB",
        spotKey: "SB_vs_BB_limp",
      })
    ).toBe("proxy");
  });
});
