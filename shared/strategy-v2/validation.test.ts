import { describe, expect, it } from "vitest";
import {
  ACTION_TOKENS,
  ALL_HANDS,
  computeChartChecksum,
  createEmptyCells,
} from "./model";
import { StrategyValidationError, validateAllowedActions, validateChartCells } from "./validation";

describe("strategy v2 canonical model", () => {
  it("has exactly 169 unique canonical hands", () => {
    expect(ALL_HANDS).toHaveLength(169);
    expect(new Set(ALL_HANDS).size).toBe(169);
    expect(ALL_HANDS).toContain("AA");
    expect(ALL_HANDS).toContain("AKs");
    expect(ALL_HANDS).toContain("AJo");
    expect(ALL_HANDS).toContain("32o");
  });

  it("defines the required canonical action tokens", () => {
    expect(ACTION_TOKENS).toEqual([
      "FOLD",
      "RAISE",
      "JAM",
      "LIMP",
      "CALL",
      "CALL_JAM",
      "CHECK",
      "THREE_BET",
      "FOUR_BET",
      "BET_SMALL",
      "BET_BIG",
    ]);
  });
});

describe("strategy v2 chart validation", () => {
  it("accepts a valid full chart", () => {
    const cells = createEmptyCells("FOLD");
    cells.AA = "RAISE";
    expect(
      validateChartCells({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["RAISE", "FOLD"],
        cells,
      })
    ).toEqual(cells);
  });

  it("rejects empty allowedActions", () => {
    expect(() => validateAllowedActions([])).toThrow(StrategyValidationError);
  });

  it("rejects missing hands instead of filling Fold", () => {
    const cells = createEmptyCells("FOLD");
    delete (cells as Record<string, string>).AJo;
    expect(() =>
      validateChartCells({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["FOLD"],
        cells,
      })
    ).toThrow(/expected 169 cells|missing hand/);
  });

  it("rejects invalid hands", () => {
    const cells = { ...createEmptyCells("FOLD"), AXs: "FOLD" };
    expect(() =>
      validateChartCells({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["FOLD"],
        cells,
      })
    ).toThrow(/expected 169 cells|invalid hand/);
  });

  it("accepts CALL_JAM only when it is explicitly allowed", () => {
    const cells = { ...createEmptyCells("FOLD"), AA: "CALL_JAM" };
    expect(
      validateChartCells({
        nodeKey: "facing_jam_15bb_bb_vs_sb_bba",
        allowedActions: ["CALL_JAM", "FOLD"],
        cells,
      }).AA
    ).toBe("CALL_JAM");

    expect(() =>
      validateChartCells({
        nodeKey: "facing_jam_15bb_bb_vs_sb_bba",
        allowedActions: ["FOLD"],
        cells,
      })
    ).toThrow(/outside allowedActions/);
  });

  it("rejects invalid actions and actions outside allowedActions", () => {
    const invalid = { ...createEmptyCells("FOLD"), AA: "CALL_FOLD" };
    expect(() =>
      validateChartCells({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["FOLD"],
        cells: invalid,
      })
    ).toThrow(/invalid action/);

    const outside = { ...createEmptyCells("FOLD"), AA: "RAISE" };
    expect(() =>
      validateChartCells({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["FOLD"],
        cells: outside,
      })
    ).toThrow(/outside allowedActions/);
  });

  it("computes stable checksums from nodeKey and ordered cells", () => {
    const cells = createEmptyCells("FOLD");
    const checksum = computeChartChecksum({
      nodeKey: "rfi_15bb_utg_bba",
      allowedActions: ["FOLD"],
      cells,
    });
    expect(checksum).toBe(
      computeChartChecksum({
        nodeKey: "rfi_15bb_utg_bba",
        allowedActions: ["FOLD"],
        cells: { ...cells },
      })
    );
  });
});
