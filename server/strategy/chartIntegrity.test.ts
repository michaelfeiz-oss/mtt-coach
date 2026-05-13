import { describe, expect, it } from "vitest";
import { ACTIONS, ALL_HANDS } from "../../shared/strategy";
import {
  getStrategyChartTrustMetadata,
  getStrategySourceStatus,
  isTrainerAllowedStrategyChart,
} from "../../shared/sourceTruth";
import {
  REVIEWED_STRATEGY_CHARTS,
  getReviewedStrategyChartGovernance,
  type ReviewedStrategyChart,
} from "../../shared/strategy-data/reviewed";
import { validateReviewedStrategyChart } from "../../shared/strategyDataValidation";
import { SEED_CHARTS } from "./seedData";
import { assertCompleteChartActions } from "./service";

describe("strategy chart integrity", () => {
  it("keeps every trainer-safe chart complete, unique, and valid", () => {
    const trainerSafeCharts = SEED_CHARTS.filter(chart =>
      isTrainerAllowedStrategyChart(chart)
    );

    expect(trainerSafeCharts.length).toBeGreaterThan(0);

    for (const chart of trainerSafeCharts) {
      const handCodes = chart.actions.map(action => action.handCode);
      const uniqueHandCodes = new Set(handCodes);

      expect(chart.sourceStatus).toBe("source_backed");
      expect(chart.cellMapSource).toBe("reviewed");
      expect(chart.dataVersion).toBeTruthy();
      expect(chart.reviewedBy).toBeTruthy();
      expect(chart.reviewedAt).toBeTruthy();
      expect(chart.actions).toHaveLength(ALL_HANDS.length);
      expect(uniqueHandCodes.size).toBe(ALL_HANDS.length);
      expect(new Set(handCodes)).toEqual(new Set(ALL_HANDS));

      for (const action of chart.actions) {
        expect(ALL_HANDS).toContain(action.handCode);
        expect(ACTIONS).toContain(action.primaryAction);
      }

      expect(() => assertCompleteChartActions(chart)).not.toThrow();
    }
  });

  it("never marks unreviewed or non-source-backed charts as trainer-safe", () => {
    const importedCandidate = {
      stackDepth: 15,
      spotGroup: "RFI" as const,
      heroPosition: "UTG",
      villainPosition: null,
      spotKey: "UTG_RFI_unreviewed_candidate",
    };

    expect(getStrategySourceStatus(importedCandidate)).toBe("imported_unreviewed");
    expect(isTrainerAllowedStrategyChart(importedCandidate)).toBe(false);

    expect(
      isTrainerAllowedStrategyChart({
        stackDepth: 25,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
        spotKey: "CO_vs_BB_3bet",
      })
    ).toBe(false);

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

  it("exposes review metadata on every trainer-safe trust descriptor", () => {
    for (const chart of SEED_CHARTS.filter(candidate => isTrainerAllowedStrategyChart(candidate))) {
      const trust = getStrategyChartTrustMetadata(chart);
      expect(trust.sourceStatus).toBe("source_backed");
      expect(trust.trainerAllowed).toBe(true);
      expect(trust.hasReviewedData).toBe(true);
      expect(trust.reviewStatus).toBe("automated_integrity_pass");
      expect(trust.dataVersion).toBeTruthy();
      expect(trust.reviewedBy).toBeTruthy();
      expect(trust.reviewedAt).toBeTruthy();
      expect(trust.has169Cells).toBe(true);
      expect(trust.structurallyComplete).toBe(true);
      expect(trust.automatedIntegrityPassed).toBe(true);
      expect(trust.ownerReviewed).toBe(false);
      expect(trust.trainerEligibleForReviewDeployment).toBe(true);
      expect(trust.trainerEligibleForFinalProduction).toBe(false);
      expect(trust.cellMapSource).toBe("reviewed");
    }
  });

  it("treats Codex-reviewed charts as automated deployment-review charts, not owner-reviewed production charts", () => {
    const machineReviewedChart = REVIEWED_STRATEGY_CHARTS[0];
    expect(machineReviewedChart).toBeDefined();
    expect(() => validateReviewedStrategyChart(machineReviewedChart!)).not.toThrow();

    const machineGovernance = getReviewedStrategyChartGovernance(
      machineReviewedChart!
    );
    expect(machineGovernance.has169Cells).toBe(true);
    expect(machineGovernance.structurallyComplete).toBe(true);
    expect(machineGovernance.automatedIntegrityPassed).toBe(true);
    expect(machineGovernance.ownerReviewed).toBe(false);
    expect(machineGovernance.trainerEligibleForReviewDeployment).toBe(true);
    expect(machineGovernance.trainerEligibleForFinalProduction).toBe(false);

    const ownerReviewedChart: ReviewedStrategyChart = {
      ...machineReviewedChart!,
      review: {
        ...machineReviewedChart!.review,
        status: "owner_reviewed",
        reviewedBy: "Michael",
        reviewedAt: "2026-05-13",
      },
    };

    expect(() => validateReviewedStrategyChart(ownerReviewedChart)).not.toThrow();
    const ownerGovernance = getReviewedStrategyChartGovernance(ownerReviewedChart);
    expect(ownerGovernance.automatedIntegrityPassed).toBe(true);
    expect(ownerGovernance.ownerReviewed).toBe(true);
    expect(ownerGovernance.trainerEligibleForReviewDeployment).toBe(true);
    expect(ownerGovernance.trainerEligibleForFinalProduction).toBe(true);
  });

  it("throws on missing, duplicate, invalid hand, and invalid action integrity failures", () => {
    expect(() =>
      assertCompleteChartActions({
        title: "Missing chart",
        actions: ALL_HANDS.slice(1).map(handCode => ({
          handCode,
          primaryAction: "FOLD",
        })),
      })
    ).toThrow(/missing/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Duplicate chart",
        actions: ALL_HANDS.slice(0, ALL_HANDS.length - 1)
          .map(handCode => ({
            handCode,
            primaryAction: "FOLD",
          }))
          .concat({
            handCode: "AA",
            primaryAction: "FOLD",
          }),
      })
    ).toThrow(/duplicate/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Invalid hand chart",
        actions: ALL_HANDS.slice(1)
          .map(handCode => ({
            handCode,
            primaryAction: "FOLD",
          }))
          .concat({
            handCode: "ZZZZ",
            primaryAction: "FOLD",
          }),
      })
    ).toThrow(/invalid hand/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Invalid action chart",
        actions: ALL_HANDS.map(handCode => ({
          handCode,
          primaryAction: (handCode === "AA" ? "BLAST_OFF" : "FOLD") as any,
        })),
      })
    ).toThrow(/invalid action/i);
  });
});
