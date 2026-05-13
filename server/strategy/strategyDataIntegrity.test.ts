import { describe, expect, it } from "vitest";
import { ACTIONS, ALL_HANDS } from "../../shared/strategy";
import {
  getStrategyChartTrustMetadata,
  getStrategySourceStatus,
  isTrainerAllowedStrategyChart,
} from "../../shared/sourceTruth";
import { SEED_CHARTS } from "./seedData";

describe("strategy data integrity", () => {
  it("keeps every trainer-safe chart complete and valid", () => {
    const trainerSafeCharts = SEED_CHARTS.filter(chart =>
      isTrainerAllowedStrategyChart(chart)
    );

    expect(trainerSafeCharts.length).toBeGreaterThan(0);

    for (const chart of trainerSafeCharts) {
      const handCodes = chart.actions.map(action => action.handCode);
      const uniqueHandCodes = new Set(handCodes);

      expect(chart.sourceStatus).toBe("source_backed");
      expect(chart.dataVersion).toBeTruthy();
      expect(chart.reviewedBy).toBeTruthy();
      expect(chart.reviewedAt).toBeTruthy();
      expect(chart.actions).toHaveLength(ALL_HANDS.length);
      expect(uniqueHandCodes.size).toBe(ALL_HANDS.length);
      expect(new Set(handCodes)).toEqual(new Set(ALL_HANDS));

      for (const action of chart.actions) {
        expect(ACTIONS).toContain(action.primaryAction);
      }
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

    expect(
      isTrainerAllowedStrategyChart({
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "HJ",
        villainPosition: "BTN",
        spotKey: "HJ_vs_BTN_3bet",
      })
    ).toBe(false);
  });

  it("exposes review metadata on every trainer-safe trust descriptor", () => {
    for (const chart of SEED_CHARTS.filter(candidate => isTrainerAllowedStrategyChart(candidate))) {
      const trust = getStrategyChartTrustMetadata(chart);
      expect(trust.sourceStatus).toBe("source_backed");
      expect(trust.trainerAllowed).toBe(true);
      expect(trust.hasReviewedData).toBe(true);
      expect(trust.dataVersion).toBeTruthy();
      expect(trust.reviewedBy).toBeTruthy();
      expect(trust.reviewedAt).toBeTruthy();
    }
  });
});
