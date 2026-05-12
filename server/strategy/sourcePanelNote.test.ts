import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StrategySourcePanelNote } from "../../client/src/components/strategy/StrategySourcePanelNote";

describe("grouped source panel note UI", () => {
  it("renders the grouped source panel note used in the chart viewer", () => {
    const markup = renderToStaticMarkup(
      React.createElement(StrategySourcePanelNote, {
        sourcePanelLabel: "LJ/HJ vs UTG RFI",
        sourcePanelGroup: "LJ/HJ",
        sourceCoverageNote:
          "This chart is displayed as HJ vs UTG in the app, but the source panel groups LJ/HJ.",
        groupedSourcePanel: true,
      })
    );

    expect(markup).toContain("Source-backed grouped panel");
    expect(markup).toContain("Source panel: LJ/HJ vs UTG RFI");
    expect(markup).toContain("Grouped source panel: LJ/HJ");
    expect(markup).toContain("HJ vs UTG");
  });
});
