import { describe, expect, it } from "vitest";
import {
  SOURCE_BACKED_MAIN_STACKS,
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

  it("marks 15bb facing-3bet spots as source_backed, 25/40bb as simplified, and blind heroes as unsupported", () => {
    // 15bb has exact all-in response charts in the PDF
    expect(
      getStrategySourceStatus({
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe("source_backed");

    // 25bb VS_3BET: simplified population (no exact PDF chart, but now supported)
    expect(
      getStrategySourceStatus({
        stackDepth: 25,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe("simplified");

    expect(
      isSourceSupportedStrategyChart({
        stackDepth: 25,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe(true);

    // 40bb VS_3BET: simplified population (no exact PDF chart, but now supported)
    expect(
      getStrategySourceStatus({
        stackDepth: 40,
        spotGroup: "VS_3BET",
        heroPosition: "HJ",
        villainPosition: "SB",
        spotKey: "HJ_vs_SB_3bet",
      })
    ).toBe("simplified");

    expect(
      isSourceSupportedStrategyChart({
        stackDepth: 40,
        spotGroup: "VS_3BET",
        heroPosition: "HJ",
        villainPosition: "SB",
        spotKey: "HJ_vs_SB_3bet",
      })
    ).toBe(true);

    // Blind heroes in VS_3BET remain unsupported at all stacks
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

  it("keeps blind-vs-blind spots visible as source-backed coverage", () => {
    // BvB is covered in all three PDFs (15/25/40bb) — it is source_backed, not proxy
    expect(
      getStrategySourceStatus({
        stackDepth: 25,
        spotGroup: "BVB",
        heroPosition: "SB",
        villainPosition: "BB",
        spotKey: "SB_vs_BB_limp",
      })
    ).toBe("source_backed");
  });
});
