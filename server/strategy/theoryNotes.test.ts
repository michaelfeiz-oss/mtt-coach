import { describe, expect, it } from "vitest";
import { buildStrategyTheorySections } from "../../shared/strategyTheory";

describe("strategy theory notes", () => {
  it("builds the structured study note set without unsupported stage claims", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "RFI",
      stackDepth: 25,
      heroPosition: "CO",
    });

    expect(sections).toHaveLength(5);
    expect(sections.map(section => section.title)).toEqual([
      "Core Idea",
      "Default",
      "Exploit Lever",
      "Common Punt",
      "Drill Cue",
    ]);
  });

  it("keeps the notes grounded in the source-backed preflop material", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_3BET",
      stackDepth: 15,
      heroPosition: "BTN",
      villainPosition: "BB",
    });

    const exploit = sections.find(section => section.key === "exploitLever");
    const stageAdjustment = sections.find(
      section => section.key === "stageAdjustment"
    );
    expect(exploit?.body).not.toContain("Population");
    expect(exploit?.body).not.toContain("PKO");
    expect(stageAdjustment).toBeUndefined();
  });

  it("uses human-readable position labels in training cues", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_UTG_RFI",
      stackDepth: 25,
      heroPosition: "UTG1",
      villainPosition: "UTG",
    });

    const cue = sections.find(section => section.key === "drillCue");
    expect(cue?.body).toContain("UTG");
    expect(cue?.body).toContain("UTG+1");
  });

  it("rewrites late-position defend notes without generic opener-strength filler", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_MP_RFI",
      stackDepth: 40,
      heroPosition: "BTN",
      villainPosition: "MP",
    });

    const coreIdea = sections.find(section => section.key === "coreIdea");
    const defaultLine = sections.find(section => section.key === "defaultLine");

    expect(coreIdea?.body).not.toContain("respect opener strength");
    expect(coreIdea?.body).not.toContain("realization potential");
    expect(defaultLine?.body).not.toContain("source chart");
  });

  it("surfaces the simplified 25bb facing-3bet upgrade in the structured note sections", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_3BET",
      stackDepth: 25,
      heroPosition: "BTN",
      villainPosition: "BB",
    });

    const defaultLine = sections.find(section => section.key === "defaultLine");
    expect(defaultLine?.body).toContain("playable middle");
    expect(defaultLine?.body).toContain("dominated offsuit broadways");
  });
});
