import { describe, expect, it } from "vitest";
import {
  buildChartCellAuditRows,
  buildFullChartInventoryRows,
  summarizeTrainerEligibilityAudit,
} from "./trainerEligibilityAudit";

describe("trainer eligibility audit", () => {
  it("marks simplified, proxy, and unsupported charts as blocked from trainer", () => {
    const rows = buildFullChartInventoryRows();

    const simplified = rows.find(row => row.chartId === "25:CO_vs_BB_3bet");
    const proxy = rows.find(row => row.chartId === "25:SB_vs_BB_limp");
    const unsupported = rows.find(row => row.chartId === "25:SB_vs_BB_3bet");

    expect(simplified).toMatchObject({
      sourceStatus: "simplified_population",
      trainerAllowed: false,
      appearsInTrainer: false,
      appearsInWeakSpotEngine: false,
    });
    expect(proxy).toMatchObject({
      sourceStatus: "proxy",
      trainerAllowed: false,
      appearsInTrainer: false,
      appearsInWeakSpotEngine: false,
    });
    expect(unsupported).toMatchObject({
      sourceStatus: "unsupported",
      trainerAllowed: false,
      appearsInViewer: false,
      appearsInTrainer: false,
    });
  });

  it("keeps exact source-backed charts trainer-safe", () => {
    const rows = buildFullChartInventoryRows();
    const exact = rows.find(row => row.chartId === "15:UTG_RFI");

    expect(exact).toMatchObject({
      sourceStatus: "source_backed",
      trainerAllowed: true,
      appearsInViewer: true,
      appearsInTrainer: true,
      passFail: "PASS",
    });
    expect(exact?.sourceFile).toBe("15bb-gto-charts.pdf");
    expect(exact?.sourceMappedCellCount).toBe(169);
  });

  it("does not expose blocked charts through trainer-startable drill packs", () => {
    const rows = buildFullChartInventoryRows();
    const simplified = rows.find(row => row.chartId === "40:CO_vs_BB_3bet");

    expect(simplified?.appearsInDrillPack).toBe(false);
    expect(simplified?.passFail).toBe("PASS");
  });

  it("builds exact cell audit rows for source-backed charts", () => {
    const rows = buildChartCellAuditRows();
    const row = rows.find(
      candidate =>
        candidate.chartId === "15:UTG_RFI" && candidate.hand === "AKs"
    );

    expect(row).toMatchObject({
      sourceStatus: "source_backed",
      appAction: "RAISE",
      sourceAction: "RAISE",
      matchYesNo: "yes",
      changedYesNo: "no",
    });
  });

  it("marks simplified cell rows as study-only comparisons", () => {
    const rows = buildChartCellAuditRows();
    const row = rows.find(
      candidate =>
        candidate.chartId === "40:CO_vs_BB_3bet" && candidate.hand === "AQs"
    );

    expect(row).toMatchObject({
      sourceStatus: "simplified_population",
      matchYesNo: "n_a",
      changedYesNo: "n_a",
    });
    expect(row?.reason).toContain("study-only");
  });

  it("summarizes blocked and source-backed counts", () => {
    const summary = summarizeTrainerEligibilityAudit(
      buildFullChartInventoryRows()
    );

    expect(summary.totalCharts).toBeGreaterThan(0);
    expect(summary.sourceBackedCount).toBeGreaterThan(0);
    expect(summary.blockedCount).toBeGreaterThan(0);
    expect(summary.trainerAllowedCount).toBe(summary.sourceBackedCount);
  });
});
