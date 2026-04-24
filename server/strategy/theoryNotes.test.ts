import { describe, expect, it } from "vitest";
import { buildStrategyTheorySections } from "../../shared/strategyTheory";

describe("strategy theory notes", () => {
  it("builds the full structured study note set", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "RFI",
      stackDepth: 20,
      heroPosition: "CO",
    });

    expect(sections).toHaveLength(6);
    expect(sections.map(section => section.title)).toEqual([
      "Core Idea",
      "Range Shape",
      "Why This Spot Works",
      "Common Mistakes",
      "Exploit Reminder",
      "Training Cue",
    ]);
  });

  it("includes tournament overlays in exploit reminders", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_3BET",
      stackDepth: 15,
      heroPosition: "BTN",
      villainPosition: "BB",
    });

    const exploit = sections.find(section => section.key === "exploit");
    expect(exploit?.body).toContain("ICM");
    expect(exploit?.body).toContain("PKO");
  });

  it("uses human-readable position labels in training cues", () => {
    const sections = buildStrategyTheorySections({
      spotGroup: "VS_UTG_RFI",
      stackDepth: 25,
      heroPosition: "UTG1",
      villainPosition: "UTG",
    });

    const cue = sections.find(section => section.key === "trainingCue");
    expect(cue?.body).toContain("UTG");
    expect(cue?.body).toContain("UTG+1");
  });
});
