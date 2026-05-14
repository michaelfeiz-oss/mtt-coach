import { describe, expect, it } from "vitest";
import { ALL_HANDS } from "../../shared/preflopStrategy";
import {
  buildChartCellAuditRows,
  buildFullChartInventoryRows,
  summarizeTrainerEligibilityAudit,
} from "./trainerEligibilityAudit";
import type { SeedChart } from "./seedData";

function makeChart(overrides: Partial<SeedChart> = {}): SeedChart {
  return {
    id: 1,
    version: "population-v1",
    stackBucket: 25,
    playerCount: 9,
    scenarioFamily: "facing_open_middle",
    heroPosition: "BTN",
    villainPosition: "HJ",
    villainGroup: null,
    title: "BTN vs HJ @ 25bb",
    spotKey: "BTN_vs_HJ_open",
    stackDepth: 25,
    spotGroup: "facing_open_middle",
    reviewed: false,
    sourceLabel: "Not yet reviewed",
    notesJson: null,
    actions: ALL_HANDS.map(handCode => ({
      handCode,
      primaryAction: "FOLD" as const,
    })),
    sourceStatus: "imported_unreviewed",
    cellMapSource: "imported_unreviewed",
    dataVersion: "population-v1",
    reviewedBy: null,
    reviewedAt: null,
    sourceFile: null,
    sourcePanelLabel: null,
    notes: [],
    ...overrides,
  };
}

describe("typed trainer eligibility audit", () => {
  it("returns no rows until typed seed charts exist", () => {
    expect(buildFullChartInventoryRows()).toEqual([]);
    expect(buildChartCellAuditRows()).toEqual([]);
    expect(summarizeTrainerEligibilityAudit([])).toEqual({
      totalCharts: 0,
      appearsInViewerCount: 0,
      trainerAllowedCount: 0,
      blockedCount: 0,
      sourceBackedCount: 0,
      simplifiedCount: 0,
      proxyCount: 0,
      unsupportedCount: 0,
      manuallyApprovedCount: 0,
      needsHumanReviewCount: 0,
      failedInventoryCount: 0,
      exactSourceGapCount: 0,
    });
  });

  it("marks imported typed charts as study-visible but blocked from trainer", () => {
    const row = buildFullChartInventoryRows([
      makeChart(),
    ])[0];

    expect(row).toMatchObject({
      sourceStatus: "imported_unreviewed",
      trainerAllowed: false,
      appearsInViewer: true,
      appearsInTrainer: false,
      appearsInDrillPack: false,
      appearsInWeakSpotEngine: false,
      passFail: "PASS",
    });
  });

  it("marks reviewed complete typed charts as trainer-safe", () => {
    const row = buildFullChartInventoryRows([
      makeChart({
        reviewed: true,
        sourceStatus: "source_backed",
        cellMapSource: "reviewed",
        sourceLabel: "Reviewed typed seed",
      }),
    ])[0];

    expect(row).toMatchObject({
      sourceStatus: "source_backed",
      trainerAllowed: true,
      appearsInTrainer: true,
      appearsInWeakSpotEngine: true,
      cellCount: 169,
      missingCellCount: 0,
    });
  });

  it("builds study-only cell audit rows for unreviewed nodes", () => {
    const row = buildChartCellAuditRows([
      makeChart({
        actions: ALL_HANDS.map(handCode => ({
          handCode,
          primaryAction: handCode === "AJo" ? ("CALL" as const) : ("FOLD" as const),
        })),
      }),
    ]).find(candidate => candidate.hand === "AJo");

    expect(row).toMatchObject({
      sourceStatus: "imported_unreviewed",
      appAction: "CALL",
      sourceAction: "",
      matchYesNo: "n_a",
      changedYesNo: "n_a",
    });
  });

  it("summarizes blocked versus trainer-safe typed nodes", () => {
    const summary = summarizeTrainerEligibilityAudit(
      buildFullChartInventoryRows([
        makeChart(),
        makeChart({
          id: 2,
          reviewed: true,
          sourceStatus: "source_backed",
          cellMapSource: "reviewed",
          sourceLabel: "Reviewed typed seed",
        }),
      ])
    );

    expect(summary.totalCharts).toBe(2);
    expect(summary.blockedCount).toBe(1);
    expect(summary.trainerAllowedCount).toBe(1);
    expect(summary.sourceBackedCount).toBe(1);
  });
});
