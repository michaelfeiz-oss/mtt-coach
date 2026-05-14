import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StrategySourcePanelNote } from "../../client/src/components/strategy/StrategySourcePanelNote";
import { getStrategyChartTrustMetadata } from "../../shared/sourceTruth";
import { ALL_HANDS } from "../../shared/preflopStrategy";

describe("typed source panel note UI", () => {
  it("renders grouped source panel metadata for a typed imported node", () => {
    const trust = getStrategyChartTrustMetadata({
      stackDepth: 15,
      spotGroup: "facing_open_early",
      heroPosition: "UTG1",
      villainPosition: "UTG",
      spotKey: "UTG1_vs_UTG_open",
      reviewed: false,
      actions: ALL_HANDS.map(handCode => ({
        handCode,
        primaryAction: "FOLD" as const,
      })),
      sourcePanelLabel: "UTG+1/+2 vs UTG Open",
      sourcePanelGroup: "UTG+1/+2",
      sourceCoverageNote:
        "Displayed as UTG+1 vs UTG in the app, but seeded from a grouped source panel.",
      groupedSourcePanel: true,
    });

    const markup = renderToStaticMarkup(
      React.createElement(StrategySourcePanelNote, {
        sourceStatus: trust.sourceStatus,
        sourcePanelLabel: trust.sourcePanelLabel,
        sourcePanelGroup: trust.sourcePanelGroup,
        sourceCoverageNote: trust.sourceCoverageNote,
        groupedSourcePanel: trust.groupedSourcePanel,
        provenanceLabel: trust.provenanceLabel,
        provenanceNote: trust.provenanceNote,
      })
    );

    expect(markup).toContain("Not yet reviewed");
    expect(markup).toContain("Grouped source panel mapping");
    expect(markup).toContain("Source panel: UTG+1/+2 vs UTG Open");
    expect(markup).toContain("Grouped source panel: UTG+1/+2");
    expect(markup).toContain("UTG+1 vs UTG");
  });
});
