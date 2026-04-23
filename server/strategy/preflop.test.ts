import { describe, expect, it } from "vitest";
import {
  buildHandClassRevealNote,
  parseHandClass,
} from "../../shared/preflop";

describe("preflop hand class helpers", () => {
  it("parses suited hand classes with matching display suits", () => {
    const hand = parseHandClass("AKs");

    expect(hand).toMatchObject({
      code: "AKs",
      kind: "suited",
      firstRank: "A",
      secondRank: "K",
      firstSuit: "spades",
      secondSuit: "spades",
    });
    expect(hand?.label).toContain("suited");
  });

  it("parses offsuit hand classes with different display suits", () => {
    const hand = parseHandClass("KJo");

    expect(hand).toMatchObject({
      code: "KJo",
      kind: "offsuit",
      firstSuit: "spades",
      secondSuit: "hearts",
    });
    expect(hand?.label).toContain("offsuit");
  });

  it("parses pairs with same rank and different display suits", () => {
    const hand = parseHandClass("77");

    expect(hand).toMatchObject({
      code: "77",
      kind: "pair",
      firstRank: "7",
      secondRank: "7",
      firstSuit: "spades",
      secondSuit: "hearts",
    });
    expect(hand?.label).toContain("pair");
  });

  it("does not show a contradictory offsuit explanation for suited hands", () => {
    const note = buildHandClassRevealNote(
      "AKs",
      "RAISE",
      "Fold dominated offsuit holdings in this region."
    );

    expect(note).toContain("AKs");
    expect(note).toContain("suited");
    expect(note.toLowerCase()).not.toContain("offsuit");
  });

  it("does not show a contradictory suited explanation for offsuit hands", () => {
    const note = buildHandClassRevealNote(
      "KJo",
      "FOLD",
      "Continue mainly with suited broadways."
    );

    expect(note).toContain("KJo");
    expect(note).toContain("offsuit");
    expect(note.toLowerCase()).not.toContain("suited broadways");
  });

  it("does not show suited or offsuit wording for a pair hand", () => {
    const note = buildHandClassRevealNote(
      "77",
      "CALL",
      "Mix suited and offsuit bluff-catches here."
    );

    expect(note).toContain("77");
    expect(note.toLowerCase()).toContain("pair");
    expect(note.toLowerCase()).not.toContain("suited and offsuit");
  });
});
