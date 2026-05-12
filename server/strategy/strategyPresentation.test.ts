import { describe, expect, it } from "vitest";
import {
  buildStrategyChartPresentation,
  formatStrategyChartTitle,
} from "../../shared/strategyPresentation";
import { SEED_CHARTS } from "./seedData";

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
      "Simplified study note - not an exact source chart."
    );
    expect(presentation.trainerAllowed).toBe(false);
    expect(presentation.trainingGateMessage?.toLowerCase()).toContain("study-only");
  });

  it("surfaces grouped source panel notes for narrower app labels", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 40,
      spotGroup: "VS_MP_RFI",
      heroPosition: "CO",
      villainPosition: "MP",
      spotKey: "CO_vs_MP",
    });

    expect(presentation.sourceStatus).toBe("source_backed");
    expect(presentation.sourcePanelLabel).toBe("CO vs LJ/HJ RFI");
    expect(presentation.sourcePanelGroup).toBe("LJ/HJ");
    expect(presentation.groupedSourcePanel).toBe(true);
    expect(presentation.sourceCoverageNote).toContain("CO vs MP");
    expect(presentation.sourceCoverageNote).toContain("LJ/HJ");
    expect(presentation.trainerAllowed).toBe(true);
  });

  it("keeps grouped source metadata on actual seeded charts used by the viewer runtime", () => {
    const chart = SEED_CHARTS.find(
      candidate =>
        candidate.stackDepth === 15 && candidate.spotKey === "UTG1_vs_UTG"
    );

    expect(chart).toBeDefined();

    const presentation = buildStrategyChartPresentation(chart!);

    expect(presentation.sourceStatus).toBe("source_backed");
    expect(presentation.trainerAllowed).toBe(true);
    expect(presentation.sourcePanelLabel).toBe("UTG+1/+2 vs UTG RFI");
    expect(presentation.sourceCoverageNote).toContain("UTG+1 vs UTG");
    expect(presentation.groupedSourcePanel).toBe(true);
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
