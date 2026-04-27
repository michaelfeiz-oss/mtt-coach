import { describe, expect, it } from "vitest";
import {
  buildStrategyChartPresentation,
  formatStrategyChartTitle,
} from "../../shared/strategyPresentation";

describe("strategy chart presentation", () => {
  it("keeps versus-RFI titles aligned with the real spot family", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 40,
      spotGroup: "VS_MP_RFI",
      heroPosition: "BTN",
      villainPosition: "MP",
      spotKey: "BTN_vs_MP",
    });

    expect(presentation.title).toBe("BTN vs MP @ 40bb");
    expect(presentation.decisionLabel).toBe("vs Mid-Position RFI");
    expect(presentation.contextLine).toContain("vs Mid-Position RFI");
  });

  it("labels simplified 40bb versus-3bet charts as shared family nodes instead of exact charts", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 40,
      spotGroup: "VS_3BET",
      heroPosition: "CO",
      villainPosition: "BB",
      spotKey: "CO_vs_BB_3bet",
    });

    expect(presentation.title).toBe("CO vs BB 3-Bet @ 40bb");
    expect(presentation.sourceBadge).toBe("Simplified Population");
    expect(presentation.sharedFamilyLabel).toBe("Shared IP vs BB 3-Bet family");
    expect(presentation.sourceHelper).toBe(
      "Practical simplified model - not exact PDF chart."
    );
  });

  it("formats blind-versus-blind limp nodes explicitly", () => {
    expect(
      formatStrategyChartTitle({
        stackDepth: 25,
        spotGroup: "BVB",
        heroPosition: "SB",
        villainPosition: "BB",
        spotKey: "SB_vs_BB_limp",
      })
    ).toBe("SB vs BB (limp) @ 25bb");
  });
});
