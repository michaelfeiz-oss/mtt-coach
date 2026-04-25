import { describe, expect, it } from "vitest";
import { ACTION_CELL_STYLES } from "../../client/src/components/strategy/actionStyles";
import { buildActionMap } from "../../client/src/components/strategy/utils";
import {
  getHandCodeAtCoordinate,
  getHandCoordinate,
} from "../../shared/handMatrix";
import { buildHandClassRevealNote } from "../../shared/preflop";
import {
  buildPushFoldActions,
  expandPushFoldNotation,
  getPushFoldActionForHand,
  getPushFoldReference,
  pushFoldSourceNote,
  PUSH_FOLD_REFERENCES,
  validatePushFoldReference,
  type PushFoldModeKind,
} from "../../shared/pushFold";
import type { Action, Position } from "../../shared/strategy";

function expectPushFoldAction(
  stackDepth: number,
  mode: PushFoldModeKind,
  heroPosition: Position,
  handCode: string,
  expectedAction: Action
) {
  const reference = getPushFoldReference(stackDepth, mode, heroPosition);
  expect(reference).not.toBeNull();

  const action = getPushFoldActionForHand(reference!, handCode);
  expect(action?.primaryAction).toBe(expectedAction);
}

describe("preflop engine correctness", () => {
  it("keeps the 10bb BB call vs BTN shove fallback source consistent", () => {
    const reference = getPushFoldReference(10, "BB_CALL_VS_BTN_SHOVE", "BB");

    expect(reference?.stackSource).toBe("10-15");
    expect(pushFoldSourceNote(10)).toContain("10-15bb");

    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "AKs", "CALL");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "A8s", "CALL");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "ATo", "CALL");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "A7s", "FOLD");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "A9o", "FOLD");
  });

  it("keeps pair diagonals and suited offsuit matrix coordinates aligned", () => {
    expect(getHandCoordinate("66")).toEqual({ row: 8, col: 8 });
    expect(getHandCoordinate("77")).toEqual({ row: 7, col: 7 });
    expect(getHandCoordinate("88")).toEqual({ row: 6, col: 6 });
    expect(getHandCoordinate("Q8s")).toEqual({ row: 2, col: 6 });
    expect(getHandCoordinate("Q8o")).toEqual({ row: 6, col: 2 });

    expect(getHandCodeAtCoordinate(8, 8)).toBe("66");
    expect(getHandCodeAtCoordinate(7, 7)).toBe("77");
    expect(getHandCodeAtCoordinate(6, 6)).toBe("88");
    expect(getHandCodeAtCoordinate(2, 6)).toBe("Q8s");
    expect(getHandCodeAtCoordinate(6, 2)).toBe("Q8o");
  });

  it("keeps action lookup, tooltip label, and explanation aligned", () => {
    const reference = getPushFoldReference(10, "BB_CALL_VS_BTN_SHOVE", "BB");
    expect(reference).not.toBeNull();

    const actionMap = buildActionMap(buildPushFoldActions(reference!));
    const aks = actionMap["AKs"];
    const a7s = actionMap["A7s"];

    expect(aks.primaryAction).toBe("CALL");
    expect(a7s.primaryAction).toBe("FOLD");
    expect(ACTION_CELL_STYLES[aks.primaryAction].label).toBe("Call");
    expect(ACTION_CELL_STYLES[a7s.primaryAction].label).toBe("Fold");

    const aksNote = buildHandClassRevealNote("AKs", aks.primaryAction, aks.note);
    expect(aksNote.toLowerCase()).not.toContain("offsuit");
    expect(aksNote.toLowerCase()).toContain("call");
  });

  it("respects suited offsuit and pair boundaries in BTN shove ranges", () => {
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "K4s", "FOLD");
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "K7s", "JAM");
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "Q8s", "JAM");
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "Q8o", "FOLD");
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "A2s", "JAM");
    expectPushFoldAction(8, "OPEN_SHOVE", "BTN", "A2o", "JAM");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "55", "FOLD");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "66", "CALL");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "77", "CALL");
    expectPushFoldAction(10, "BB_CALL_VS_BTN_SHOVE", "BB", "88", "CALL");
  });

  it("does not over-expand suited connector plus notation", () => {
    const suitedConnectors = expandPushFoldNotation("65s+");
    const tenNinePlus = expandPushFoldNotation("T9s+");

    expect(suitedConnectors).toEqual([
      "KQs",
      "QJs",
      "JTs",
      "T9s",
      "98s",
      "87s",
      "76s",
      "65s",
    ]);
    expect(suitedConnectors).not.toContain("AKs");

    expect(tenNinePlus).toEqual(["KQs", "QJs", "JTs", "T9s"]);
    expect(tenNinePlus).not.toContain("AKs");
  });

  it("validates every push fold reference against the canonical 169 hand grid", () => {
    for (const reference of PUSH_FOLD_REFERENCES) {
      expect(validatePushFoldReference(reference)).toEqual([]);
    }
  });
});
