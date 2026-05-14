import { describe, expect, it } from "vitest";
import { ALL_HANDS, type HandAction } from "../../shared/preflopStrategy";
import {
  getStrategyChartTrustMetadata,
  getStrategySourceHelperText,
  getStrategySourceLabel,
  getStrategySourceStatus,
  isTrainerAllowedStrategyChart,
} from "../../shared/sourceTruth";
import { MAIN_STUDY_STACK_BUCKETS } from "../../shared/preflopTaxonomy";

function buildActions(primaryAction: HandAction["primaryAction"] = "FOLD") {
  return ALL_HANDS.map(handCode => ({
    handCode,
    primaryAction,
  }));
}

describe("typed strategy trust metadata", () => {
  it("uses the new study stack buckets", () => {
    expect(MAIN_STUDY_STACK_BUCKETS).toEqual([15, 25, 40, 70]);
  });

  it("blocks structurally complete imported nodes from trainer until reviewed", () => {
    const chart = {
      stackDepth: 25,
      spotGroup: "facing_open_early" as const,
      heroPosition: "CO",
      villainPosition: "UTG",
      spotKey: "CO_vs_UTG_open",
      reviewed: false,
      dataVersion: "population-v1",
      actions: buildActions(),
    };

    const trust = getStrategyChartTrustMetadata(chart);

    expect(getStrategySourceStatus(chart)).toBe("imported_unreviewed");
    expect(getStrategySourceLabel(chart)).toBe("Not Yet Reviewed");
    expect(getStrategySourceHelperText(chart)).toContain("not yet reviewed");
    expect(trust.trainerAllowed).toBe(false);
    expect(trust.has169Cells).toBe(true);
    expect(trust.structurallyComplete).toBe(true);
    expect(trust.automatedIntegrityPassed).toBe(true);
    expect(trust.ownerReviewed).toBe(false);
    expect(trust.trainerEligibleForReviewDeployment).toBe(true);
    expect(trust.trainerEligibleForFinalProduction).toBe(false);
    expect(isTrainerAllowedStrategyChart(chart)).toBe(false);
  });

  it("allows reviewed complete typed nodes to become trainer-safe", () => {
    const chart = {
      stackDepth: 40,
      spotGroup: "rfi" as const,
      heroPosition: "HJ",
      spotKey: "HJ_rfi",
      reviewed: true,
      dataVersion: "population-v1",
      reviewedBy: "Manual review",
      reviewedAt: "2026-05-14",
      actions: buildActions("RAISE"),
    };

    const trust = getStrategyChartTrustMetadata(chart);

    expect(getStrategySourceStatus(chart)).toBe("source_backed");
    expect(getStrategySourceLabel(chart)).toBe("Reviewed Seed");
    expect(trust.trainerAllowed).toBe(true);
    expect(trust.reviewedByHuman).toBe(true);
    expect(trust.ownerReviewed).toBe(true);
    expect(trust.trainerEligibleForReviewDeployment).toBe(true);
    expect(trust.trainerEligibleForFinalProduction).toBe(true);
    expect(isTrainerAllowedStrategyChart(chart)).toBe(true);
  });

  it("passes grouped source panel metadata through when typed imports include it", () => {
    const trust = getStrategyChartTrustMetadata({
      stackDepth: 15,
      spotGroup: "facing_open_early",
      heroPosition: "UTG1",
      villainPosition: "UTG",
      spotKey: "UTG1_vs_UTG_open",
      reviewed: false,
      actions: buildActions(),
      sourcePanelLabel: "UTG+1/+2 vs UTG Open",
      sourcePanelGroup: "UTG+1/+2",
      sourceCoverageNote:
        "Displayed as UTG+1 vs UTG in the app, but manually seeded from a grouped source panel.",
      groupedSourcePanel: true,
    });

    expect(trust.sourcePanelLabel).toBe("UTG+1/+2 vs UTG Open");
    expect(trust.sourcePanelGroup).toBe("UTG+1/+2");
    expect(trust.groupedSourcePanel).toBe(true);
    expect(trust.sourceCoverageNote).toContain("grouped source panel");
  });

  it("respects explicit unsupported statuses", () => {
    const chart = {
      stackDepth: 70,
      spotGroup: "bb_vs_sb_limp" as const,
      heroPosition: "BB",
      villainPosition: "SB",
      spotKey: "bb_vs_sb_limp",
      sourceStatus: "unsupported" as const,
      actions: [],
    };

    const trust = getStrategyChartTrustMetadata(chart);

    expect(trust.sourceStatus).toBe("unsupported");
    expect(trust.trainerAllowed).toBe(false);
    expect(getStrategySourceLabel(chart)).toBe("Unsupported");
  });
});
