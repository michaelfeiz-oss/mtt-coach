import { describe, expect, it } from "vitest";
import {
  GOLDEN_STRATEGY_CELLS,
  PENDING_GOLDEN_STRATEGY_CELLS,
  VERIFIED_GOLDEN_STRATEGY_CELLS,
} from "./goldenCells";

describe("typed strategy golden cells", () => {
  it("does not bless unverified exact actions yet", () => {
    expect(GOLDEN_STRATEGY_CELLS).toEqual([]);
    expect(VERIFIED_GOLDEN_STRATEGY_CELLS).toEqual([]);
  });

  it("tracks pending review cells with evidence notes instead", () => {
    expect(PENDING_GOLDEN_STRATEGY_CELLS.length).toBeGreaterThan(0);

    for (const cell of PENDING_GOLDEN_STRATEGY_CELLS) {
      expect(cell.status).toBe("pending_owner_review");
      expect(cell.evidence.trim().length).toBeGreaterThan(0);
      expect(cell.note.trim().length).toBeGreaterThan(0);
    }
  });
});
