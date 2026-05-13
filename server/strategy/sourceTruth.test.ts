import { describe, expect, it } from "vitest";
import {
  SOURCE_BACKED_MAIN_STACKS,
  SIMPLIFIED_POPULATION_3BET_STACKS,
  getSharedFamilySourceLabel,
  getStrategyChartTrustMetadata,
  getStrategySourceHelperText,
  getStrategySourceLabel,
  getStrategySourceStatus,
  isTrainerAllowedStrategyChart,
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

  it("keeps 15bb exact facing-3bet charts visible as imported candidates and exposes 25bb/40bb as simplified population nodes", () => {
    expect(
      getStrategySourceStatus({
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe("imported_unreviewed");

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
      "Simplified study note - not an exact source chart."
    );
    expect(isTrainerAllowedStrategyChart(chart)).toBe(false);
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

    expect(
      isTrainerAllowedStrategyChart({
        stackDepth: 25,
        spotGroup: "BVB",
        heroPosition: "SB",
        villainPosition: "BB",
        spotKey: "SB_vs_BB_limp",
      })
    ).toBe(false);
  });

  it("keeps grouped source panel metadata on automated imported candidates while trainer stays blocked", () => {
    const trust = getStrategyChartTrustMetadata({
      stackDepth: 40,
      spotGroup: "VS_UTG_RFI",
      heroPosition: "HJ",
      villainPosition: "UTG",
      spotKey: "HJ_vs_UTG",
    });

    expect(trust.sourceStatus).toBe("imported_unreviewed");
    expect(trust.trainerAllowed).toBe(false);
    expect(trust.hasReviewedData).toBe(true);
    expect(trust.reviewStatus).toBe("automated_integrity_pass");
    expect(trust.dataVersion).toBeTruthy();
    expect(trust.reviewedBy).toBeTruthy();
    expect(trust.reviewedAt).toBeTruthy();
    expect(trust.has169Cells).toBe(true);
    expect(trust.structurallyComplete).toBe(true);
    expect(trust.automatedIntegrityPassed).toBe(true);
    expect(trust.ownerReviewed).toBe(false);
    expect(trust.trainerEligibleForReviewDeployment).toBe(false);
    expect(trust.trainerEligibleForFinalProduction).toBe(false);
    expect(trust.provenanceLabel).toBe("Automated integrity pass");
    expect(trust.provenanceNote).toContain("pending owner review");
    expect(trust.sourcePanelLabel).toBe("LJ/HJ vs UTG RFI");
    expect(trust.sourcePanelGroup).toBe("LJ/HJ");
    expect(trust.groupedSourcePanel).toBe(true);
    expect(trust.sourceCoverageNote).toContain("group");
  });

  it("exposes remapped source panel metadata when the app label is narrower than the PDF panel label", () => {
    const trust = getStrategyChartTrustMetadata({
      stackDepth: 40,
      spotGroup: "RFI",
      heroPosition: "HJ",
      spotKey: "HJ_RFI",
    });

    expect(trust.sourceStatus).toBe("imported_unreviewed");
    expect(trust.trainerAllowed).toBe(false);
    expect(trust.sourcePanelLabel).toBe("Lojack RFI");
    expect(trust.groupedSourcePanel).toBe(false);
    expect(trust.provenanceLabel).toBe("Automated integrity pass");
    expect(trust.sourceCoverageNote).toContain("HJ RFI");
    expect(trust.sourceCoverageNote).toContain("Lojack RFI");
  });

  it("blocks imported unreviewed exact-source candidates from trainer until a reviewed 169-cell chart exists", () => {
    const candidate = {
      stackDepth: 15,
      spotGroup: "RFI" as const,
      heroPosition: "UTG",
      spotKey: "UTG_RFI_candidate_only",
    };

    expect(getStrategySourceStatus(candidate)).toBe("imported_unreviewed");
    expect(getStrategySourceLabel(candidate)).toBe("Imported Candidate");
    expect(getStrategySourceHelperText(candidate)).toContain("Review is incomplete");
    expect(isTrainerAllowedStrategyChart(candidate)).toBe(false);
  });
});
