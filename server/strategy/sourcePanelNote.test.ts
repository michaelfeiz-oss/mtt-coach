import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StrategySourcePanelNote } from "../../client/src/components/strategy/StrategySourcePanelNote";
import { getStrategyChartTrustMetadata } from "../../shared/sourceTruth";
import { SEED_CHARTS } from "./seedData";

describe("grouped source panel note UI", () => {
  it("renders the grouped source panel note used in the chart viewer from an actual seeded chart", () => {
    const chart = SEED_CHARTS.find(
      candidate =>
        candidate.stackDepth === 15 && candidate.spotKey === "UTG1_vs_UTG"
    );

    expect(chart).toBeDefined();
    const trust = getStrategyChartTrustMetadata(chart!);

    const markup = renderToStaticMarkup(
      React.createElement(StrategySourcePanelNote, {
        sourcePanelLabel: trust.sourcePanelLabel,
        sourcePanelGroup: trust.sourcePanelGroup,
        sourceCoverageNote: trust.sourceCoverageNote,
        groupedSourcePanel: trust.groupedSourcePanel,
        provenanceLabel: trust.provenanceLabel,
        provenanceNote: trust.provenanceNote,
      })
    );

    expect(markup).toContain("Automated integrity pass");
    expect(markup).toContain("pending owner review");
    expect(markup).toContain("Source-backed grouped panel");
    expect(markup).toContain("Source panel: UTG+1/+2 vs UTG RFI");
    expect(markup).toContain("Grouped source panel: UTG+1/+2");
    expect(markup).toContain("UTG+1 vs UTG");
  });
});
