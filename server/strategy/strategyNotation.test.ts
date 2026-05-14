import { describe, expect, it } from "vitest";
import {
  compileNotationRows,
  expandRangeToken,
  parseRangeNotation,
} from "../../shared/strategyNotation";

describe("typed strategy notation parser", () => {
  it("expands exact, plus, and interval tokens", () => {
    expect(expandRangeToken("AJo")).toEqual(["AJo"]);
    expect(expandRangeToken("77+")).toEqual([
      "77",
      "88",
      "99",
      "TT",
      "JJ",
      "QQ",
      "KK",
      "AA",
    ]);
    expect(expandRangeToken("A5s-A2s")).toEqual([
      "A5s",
      "A4s",
      "A3s",
      "A2s",
    ]);
  });

  it("parses comma-separated notation into canonical grid order", () => {
    expect(parseRangeNotation("KQs, AJo, 77")).toEqual(["KQs", "AJo", "77"]);
  });

  it("rejects overlapping actions inside a single node", () => {
    expect(() =>
      compileNotationRows([
        { action: "CALL", rangeNotation: "AJo", priority: 300 },
        { action: "FOLD", rangeNotation: "AJo", priority: 100 },
      ])
    ).toThrow(/overlapping actions/i);
  });
});
