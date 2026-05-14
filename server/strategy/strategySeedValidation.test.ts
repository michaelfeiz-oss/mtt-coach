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

  it("requires reviewed nodes to cover all 169 hands", () => {
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
    ).toThrow(/missing/i);
  });
});
