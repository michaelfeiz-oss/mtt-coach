import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainerResultReveal } from "../../client/src/components/strategy/TrainerResultReveal";
import { ALL_HANDS } from "../../shared/preflopStrategy";
import { buildStrategyChartPresentation } from "../../shared/strategyPresentation";

describe("trainer reveal source detail", () => {
  it("renders grouped source detail for a typed chart without making it trainer-safe", () => {
    Object.defineProperty(globalThis, "location", {
      value: new URL("http://localhost/strategy/trainer"),
      configurable: true,
    });

    const chart = {
      id: 1,
      version: "population-v1",
      stackBucket: 40 as const,
      playerCount: 9 as const,
      scenarioFamily: "facing_open_early" as const,
      title: "HJ vs UTG @ 40bb",
      stackDepth: 40 as const,
      spotGroup: "facing_open_early" as const,
      spotKey: "HJ_vs_UTG_open",
      heroPosition: "HJ",
      villainPosition: "UTG",
      villainGroup: null,
      reviewed: false,
      sourceLabel: "Not yet reviewed",
      actions: ALL_HANDS.map(handCode => ({
        handCode,
        primaryAction: handCode === "99" ? ("CALL" as const) : ("FOLD" as const),
      })),
      sourcePanelLabel: "LJ/HJ vs UTG Open",
      sourcePanelGroup: "LJ/HJ",
      sourceCoverageNote:
        "Displayed as HJ vs UTG in the app, but seeded from a grouped LJ/HJ source panel.",
      groupedSourcePanel: true,
    };

    const markup = renderToStaticMarkup(
      React.createElement(TrainerResultReveal, {
        chart,
        contextChart: chart,
        chartId: chart.id,
        handCode: "99",
        selectedAction: "CALL",
        correctAction: "CALL",
        isCorrect: true,
        chartPresentation: buildStrategyChartPresentation(chart),
        onNext: () => {},
      })
    );

    expect(markup).toContain("Source detail");
    expect(markup).toContain("Source panel: LJ/HJ vs UTG Open");
    expect(markup).toContain("Grouped source panel: LJ/HJ");
    expect(markup).toContain("HJ vs UTG");
    expect(markup).toContain("Correct");
  });
});
