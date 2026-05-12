import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainerResultReveal } from "../../client/src/components/strategy/TrainerResultReveal";
import { buildStrategyChartPresentation } from "../../shared/strategyPresentation";
import { SEED_CHARTS } from "./seedData";

describe("trainer grouped source detail", () => {
  it("renders grouped source detail in the reveal panel without changing trainer safety", () => {
    Object.defineProperty(globalThis, "location", {
      value: new URL("http://localhost/strategy/trainer"),
      configurable: true,
    });

    const chart = SEED_CHARTS.find(
      candidate =>
        candidate.stackDepth === 40 && candidate.spotKey === "HJ_vs_UTG"
    );

    expect(chart).toBeDefined();

    const markup = renderToStaticMarkup(
      React.createElement(TrainerResultReveal, {
        chart: chart,
        contextChart: chart,
        chartId: chart!.id,
        handCode: "99",
        selectedAction: "FOLD",
        correctAction: "FOLD",
        isCorrect: true,
        chartPresentation: buildStrategyChartPresentation(chart!),
        onNext: () => {},
      })
    );

    expect(markup).toContain("Source detail");
    expect(markup).toContain("Source panel: LJ/HJ vs UTG RFI");
    expect(markup).toContain("Grouped source panel: LJ/HJ");
    expect(markup).toContain("HJ vs UTG");
    expect(markup).toContain("Correct");
  });
});
