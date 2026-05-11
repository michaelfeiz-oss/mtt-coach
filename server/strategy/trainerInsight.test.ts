import { describe, expect, it } from "vitest";
import { getSpotNote } from "../../shared/spotNotes";
import { buildTrainerSpotInsight } from "../../shared/trainerInsight";

describe("trainer spot insight", () => {
  it("builds the BTN vs UTG 15bb small-pair fold example", () => {
    const chart = {
      spotGroup: "VS_UTG_RFI" as const,
      stackDepth: 15,
      heroPosition: "BTN",
      villainPosition: "UTG",
    };

    const insight = buildTrainerSpotInsight({
      chart,
      handCode: "66",
      selectedAction: "FOLD",
      correctAction: "FOLD",
      isCorrect: true,
      spotNote: getSpotNote(chart),
    });

    expect(insight?.resultLine).toBe("Correct - 66 is a fold here.");
    expect(insight?.why).toContain("BTN versus UTG at 15bb");
    expect(insight?.rule).toContain("early-position opens at shallow stacks");
    expect(insight?.commonMistake).toContain("too strong to fold");
  });

  it("builds the BB vs MP 25bb small-pair call example", () => {
    const chart = {
      spotGroup: "VS_MP_RFI" as const,
      stackDepth: 25,
      heroPosition: "BB",
      villainPosition: "MP",
    };

    const insight = buildTrainerSpotInsight({
      chart,
      handCode: "77",
      selectedAction: "CALL",
      correctAction: "CALL",
      isCorrect: true,
      spotNote: getSpotNote(chart),
    });

    expect(insight?.resultLine).toBe("Correct - 77 is a call here.");
    expect(insight?.why).toContain("BB versus MP at 25bb");
    expect(insight?.why).toContain("enough equity to call");
    expect(insight?.rule).toContain("Small pairs at 15-25bb are stack-sensitive");
  });

  it("builds the 15bb facing-3bet jam-or-fold threshold example", () => {
    const chart = {
      spotGroup: "VS_3BET" as const,
      stackDepth: 15,
      heroPosition: "UTG",
      villainPosition: "SB",
    };

    const insight = buildTrainerSpotInsight({
      chart,
      handCode: "AQo",
      selectedAction: "JAM",
      correctAction: "JAM",
      isCorrect: true,
      spotNote: getSpotNote(chart),
    });

    expect(insight?.resultLine).toBe("Correct - AQo is a jam here.");
    expect(insight?.why).toContain("15bb");
    expect(insight?.why).toContain("very little room to flat profitably");
    expect(insight?.rule).toBe("At 15bb, this spot is mostly jam-or-fold.");
  });

  it("builds the blind-vs-blind limp example", () => {
    const chart = {
      spotGroup: "BVB" as const,
      stackDepth: 25,
      heroPosition: "SB",
      villainPosition: "BB",
    };

    const insight = buildTrainerSpotInsight({
      chart,
      handCode: "T7s",
      selectedAction: "LIMP",
      correctAction: "LIMP",
      isCorrect: true,
      spotNote: getSpotNote(chart),
    });

    expect(insight?.resultLine).toBe("Correct - T7s is a limp here.");
    expect(insight?.why).toContain("SB versus BB at 25bb");
    expect(insight?.rule).toBe(
      "Cheap does not mean profitable; limp hands need a plan versus pressure."
    );
  });

  it("keeps incorrect answers compact and specific", () => {
    const chart = {
      spotGroup: "VS_LP_RFI" as const,
      stackDepth: 40,
      heroPosition: "BB",
      villainPosition: "BTN",
    };

    const insight = buildTrainerSpotInsight({
      chart,
      handCode: "KJo",
      selectedAction: "CALL",
      correctAction: "FOLD",
      isCorrect: false,
      spotNote: getSpotNote(chart),
    });

    expect(insight?.resultLine).toBe(
      "Incorrect - KJo is a fold here, not a call."
    );
    expect(insight?.why).toContain("BB versus BTN at 40bb");
    expect(insight?.rule).toContain("Late opens invite more defense");
  });
});
