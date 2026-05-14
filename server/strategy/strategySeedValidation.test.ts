import { describe, expect, it } from "vitest";
import { validateSeedRows } from "../../shared/strategySeedValidation";
import type { StrategyRangeSeedRow } from "../../shared/preflopStrategy";

function makeRow(overrides: Partial<StrategyRangeSeedRow> = {}): StrategyRangeSeedRow {
  return {
    version: "population-v1",
    stackBucket: 25,
    playerCount: 9,
    scenarioFamily: "facing_open_middle",
    heroPosition: "BTN",
    villainPosition: "HJ",
    villainGroup: null,
    action: "CALL",
    rangeNotation: "AJs, KQs",
    priority: 300,
    notes: null,
    reviewed: false,
    ...overrides,
  };
}

describe("typed strategy seed validation", () => {
  it("accepts the supported stack buckets", () => {
    expect(() =>
      validateSeedRows([
        makeRow({ stackBucket: 15 }),
        makeRow({ stackBucket: 25, villainPosition: "HJ", scenarioFamily: "facing_open_middle" }),
        makeRow({ stackBucket: 40, villainPosition: "CO", scenarioFamily: "facing_open_late" }),
        makeRow({ stackBucket: 70, villainPosition: "UTG", scenarioFamily: "facing_open_early" }),
      ])
    ).not.toThrow();
  });

  it("rejects unsupported stack buckets", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          stackBucket: 30 as unknown as StrategyRangeSeedRow["stackBucket"],
        }),
      ])
    ).toThrow(/unsupported stack bucket/i);
  });

  it("enforces villain routing for facing-open nodes", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "facing_open_early",
          villainPosition: null,
          villainGroup: null,
        }),
      ])
    ).toThrow(/must set villainPosition or villainGroup/i);
  });

  it("enforces blind-versus-blind routing", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "SB",
          villainPosition: "SB",
          action: "CHECK",
          priority: 200,
        }),
      ])
    ).toThrow(/must use BB as hero/i);
  });

  it("allows reviewed nodes to rely on implicit folds for uncovered hands", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "rfi",
          heroPosition: "UTG",
          villainPosition: null,
          action: "RAISE",
          priority: 500,
          reviewed: true,
        }),
      ])
    ).not.toThrow();
  });

  it("accepts v1b-style late-open and blind-versus-blind rows with call, three_bet, jam, and fold", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "CALL",
          rangeNotation: "AJs,KQs",
          priority: 300,
        }),
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "THREE_BET",
          rangeNotation: "QQ+,AKs",
          priority: 600,
        }),
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "JAM",
          rangeNotation: "55",
          priority: 800,
        }),
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "FOLD",
          rangeNotation: "72o",
          priority: 100,
        }),
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "CALL",
          rangeNotation: "KQs,QJs",
          priority: 300,
        }),
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "THREE_BET",
          rangeNotation: "AA,KK,AKs",
          priority: 600,
        }),
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "JAM",
          rangeNotation: "22",
          priority: 800,
        }),
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "FOLD",
          rangeNotation: "32o",
          priority: 100,
        }),
      ])
    ).not.toThrow();
  });

  it("rejects unsupported actions in seed rows", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          action: "MIN_CLICK" as StrategyRangeSeedRow["action"],
        }),
      ])
    ).toThrow(/unsupported action/i);
  });

  it("rejects call and fold overlap within the same node", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "CALL",
          rangeNotation: "AJo",
          priority: 300,
        }),
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "FOLD",
          rangeNotation: "AJo",
          priority: 100,
        }),
      ])
    ).toThrow(/CALL and FOLD/i);
  });

  it("rejects call and jam overlap within the same node", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "CALL",
          rangeNotation: "99",
          priority: 300,
        }),
        makeRow({
          scenarioFamily: "facing_open_late",
          heroPosition: "SB",
          villainPosition: "BTN",
          action: "JAM",
          rangeNotation: "99",
          priority: 800,
        }),
      ])
    ).toThrow(/CALL and JAM/i);
  });

  it("rejects three_bet and fold overlap within the same node", () => {
    expect(() =>
      validateSeedRows([
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "THREE_BET",
          rangeNotation: "AKs",
          priority: 600,
        }),
        makeRow({
          scenarioFamily: "bb_vs_sb_open",
          heroPosition: "BB",
          villainPosition: "SB",
          action: "FOLD",
          rangeNotation: "AKs",
          priority: 100,
        }),
      ])
    ).toThrow(/FOLD and THREE_BET/i);
  });
});
