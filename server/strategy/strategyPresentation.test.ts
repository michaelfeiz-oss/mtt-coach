import { describe, expect, it } from "vitest";
import {
  buildStrategyChartPresentation,
  formatStrategyChartTitle,
} from "../../shared/strategyPresentation";
import { ALL_HANDS } from "../../shared/preflopStrategy";

const COMPLETE_FOLD_ACTIONS = ALL_HANDS.map(handCode => ({
  handCode,
  primaryAction: "FOLD" as const,
}));

describe("typed strategy presentation", () => {
  it("formats typed facing-open titles and labels", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 40,
      spotGroup: "facing_open_middle",
      heroPosition: "BTN",
      villainPosition: "UTG2",
      spotKey: "BTN_vs_UTG2_open",
    });

    expect(presentation.title).toBe("BTN vs UTG+2 @ 40bb");
    expect(presentation.decisionLabel).toBe("Facing Middle Open");
    expect(presentation.contextLine).toContain("BTN vs UTG+2");
  });

  it("surfaces not-yet-reviewed training gates for typed nodes", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 25,
      spotGroup: "rfi",
      heroPosition: "HJ",
      spotKey: "HJ_rfi",
      reviewed: false,
      dataVersion: "population-v1",
      actions: COMPLETE_FOLD_ACTIONS,
    });

    expect(presentation.sourceStatus).toBe("imported_unreviewed");
    expect(presentation.sourceBadge).toBe("Not Yet Reviewed");
    expect(presentation.trainerAllowed).toBe(false);
    expect(presentation.trainingGateMessage).toContain("Not yet reviewed");
  });

  it("carries grouped source panel descriptors into the viewer presentation", () => {
    const presentation = buildStrategyChartPresentation({
      stackDepth: 15,
      spotGroup: "facing_open_early",
      heroPosition: "UTG1",
      villainPosition: "UTG",
      spotKey: "UTG1_vs_UTG_open",
      reviewed: false,
      dataVersion: "population-v1",
      actions: COMPLETE_FOLD_ACTIONS,
      sourcePanelLabel: "UTG+1/+2 vs UTG Open",
      sourcePanelGroup: "UTG+1/+2",
      sourceCoverageNote:
        "Displayed as UTG+1 vs UTG in the app, but seeded from a grouped source panel.",
      groupedSourcePanel: true,
    });

    expect(presentation.sourcePanelLabel).toBe("UTG+1/+2 vs UTG Open");
    expect(presentation.sourcePanelGroup).toBe("UTG+1/+2");
    expect(presentation.groupedSourcePanel).toBe(true);
    expect(presentation.sourceCoverageNote).toContain("grouped source panel");
  });

  it("formats blind-versus-blind limp titles with the typed naming", () => {
    expect(
      formatStrategyChartTitle({
        stackDepth: 25,
        spotGroup: "bb_vs_sb_limp",
        heroPosition: "BB",
        villainPosition: "SB",
        spotKey: "bb_vs_sb_limp",
      })
    ).toBe("BB vs SB Limp @ 25bb");
  });
});
