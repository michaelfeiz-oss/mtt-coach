import { describe, expect, it } from "vitest";
import { ALL_HANDS, type StrategyNodeRangeRow } from "../../shared/preflopStrategy";
import type { ParsedStrategySeedNode } from "./typedSeedFiles";
import {
  SEED_CHARTS,
  buildActionMapFromSeedChart,
  buildSeedCharts,
  validateSeedCharts,
} from "./seedData";

function exactRows(primaryAction: StrategyNodeRangeRow["action"]) {
  return ALL_HANDS.map<StrategyNodeRangeRow>(handCode => ({
    action: primaryAction,
    rangeNotation: handCode,
    priority: primaryAction === "FOLD" ? 100 : 500,
  }));
}

describe("typed strategy seed data", () => {
  it("loads the reviewed starter RFI, in-position open defence, late-open, blind-vs-blind, and facing-jam packs from the typed seed files", () => {
    expect(SEED_CHARTS.length).toBe(60);
    expect(() => validateSeedCharts(SEED_CHARTS)).not.toThrow();

    const utg25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "UTG_rfi"
    );
    const bbVsBtn25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "BB_vs_BTN_open"
    );
    const bbVsCo15 = SEED_CHARTS.find(
      chart => chart.stackDepth === 15 && chart.spotKey === "BB_vs_CO_open"
    );
    const sbRfi15 = SEED_CHARTS.find(
      chart => chart.stackDepth === 15 && chart.spotKey === "SB_rfi"
    );
    const sbVsBtn25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "SB_vs_BTN_open"
    );
    const bbVsSb25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "bb_vs_sb_open"
    );
    const sbVsBtn70 = SEED_CHARTS.find(
      chart => chart.stackDepth === 70 && chart.spotKey === "SB_vs_BTN_open"
    );
    const bbVsSb70 = SEED_CHARTS.find(
      chart => chart.stackDepth === 70 && chart.spotKey === "bb_vs_sb_open"
    );
    const bbVsSbJam15 = SEED_CHARTS.find(
      chart => chart.stackDepth === 15 && chart.spotKey === "BB_vs_SB_jam"
    );
    const bbVsBtnJam15 = SEED_CHARTS.find(
      chart => chart.stackDepth === 15 && chart.spotKey === "BB_vs_BTN_jam"
    );
    const bbVsSbJam25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "BB_vs_SB_jam"
    );
    const hjVsUtgJam25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "HJ_vs_UTG_jam"
    );
    const hjVsUtgJam40 = SEED_CHARTS.find(
      chart => chart.stackDepth === 40 && chart.spotKey === "HJ_vs_UTG_jam"
    );
    const bbVsSbJam70 = SEED_CHARTS.find(
      chart => chart.stackDepth === 70 && chart.spotKey === "BB_vs_SB_jam"
    );
    const hjVsUtgOpen15 = SEED_CHARTS.find(
      chart => chart.stackDepth === 15 && chart.spotKey === "HJ_vs_UTG_open"
    );
    const coVsHjOpen25 = SEED_CHARTS.find(
      chart => chart.stackDepth === 25 && chart.spotKey === "CO_vs_HJ_open"
    );
    const btnVsCoOpen40 = SEED_CHARTS.find(
      chart => chart.stackDepth === 40 && chart.spotKey === "BTN_vs_CO_open"
    );
    const btnVsCoOpen70 = SEED_CHARTS.find(
      chart => chart.stackDepth === 70 && chart.spotKey === "BTN_vs_CO_open"
    );

    expect(utg25?.reviewed).toBe(true);
    expect(utg25?.sourceStatus).toBe("source_backed");
    expect(utg25?.actions).toHaveLength(ALL_HANDS.length);
    expect(bbVsBtn25?.reviewed).toBe(true);
    expect(bbVsBtn25?.sourceStatus).toBe("source_backed");
    expect(bbVsBtn25?.actions).toHaveLength(ALL_HANDS.length);
    expect(bbVsBtn25?.actions.find(action => action.handCode === "KQs")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(bbVsBtn25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "JAM"
    );
    expect(bbVsCo15?.actions.find(action => action.handCode === "A5s")?.primaryAction).toBe(
      "JAM"
    );
    expect(bbVsCo15?.actions.find(action => action.handCode === "A4s")?.primaryAction).toBe(
      "CALL"
    );
    expect(sbRfi15?.actions.find(action => action.handCode === "T9s")?.primaryAction).toBe(
      "JAM"
    );
    expect(sbRfi15?.actions.find(action => action.handCode === "T8s")?.primaryAction).toBe(
      "JAM"
    );
    expect(sbRfi15?.actions.find(action => action.handCode === "98s")?.primaryAction).toBe(
      "JAM"
    );
    expect(sbVsBtn25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "JAM"
    );
    expect(sbVsBtn25?.actions.find(action => action.handCode === "KQs")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(bbVsSb25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "JAM"
    );
    expect(bbVsSb25?.actions.find(action => action.handCode === "A9o")?.primaryAction).toBe(
      "CALL"
    );
    expect(sbVsBtn70?.actions.find(action => action.handCode === "KTs")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(sbVsBtn70?.actions.find(action => action.handCode === "K9s")?.primaryAction).toBe(
      "CALL"
    );
    expect(bbVsSb70?.actions.find(action => action.handCode === "T9s")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(bbVsSb70?.actions.find(action => action.handCode === "T8s")?.primaryAction).toBe(
      "CALL"
    );
    expect(bbVsSbJam15?.reviewed).toBe(true);
    expect(bbVsSbJam15?.actions).toHaveLength(ALL_HANDS.length);
    expect(bbVsSbJam15?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "CALL_JAM"
    );
    expect(bbVsSbJam15?.actions.find(action => action.handCode === "A4o")?.primaryAction).toBe(
      "FOLD"
    );
    expect(bbVsBtnJam15?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "CALL_JAM"
    );
    expect(bbVsBtnJam15?.actions.find(action => action.handCode === "A7o")?.primaryAction).toBe(
      "FOLD"
    );
    expect(bbVsSbJam25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "CALL_JAM"
    );
    expect(bbVsSbJam25?.actions.find(action => action.handCode === "A9o")?.primaryAction).toBe(
      "CALL_JAM"
    );
    expect(hjVsUtgJam25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "FOLD"
    );
    expect(hjVsUtgJam25?.actions.find(action => action.handCode === "AKo")?.primaryAction).toBe(
      "CALL_JAM"
    );
    expect(hjVsUtgJam40).toBeUndefined();
    expect(bbVsSbJam70).toBeUndefined();
    expect(hjVsUtgOpen15?.reviewed).toBe(true);
    expect(hjVsUtgOpen15?.actions).toHaveLength(ALL_HANDS.length);
    expect(hjVsUtgOpen15?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "FOLD"
    );
    expect(hjVsUtgOpen15?.actions.find(action => action.handCode === "ATs")?.primaryAction).toBe(
      "CALL"
    );
    expect(hjVsUtgOpen15?.actions.find(action => action.handCode === "AQo")?.primaryAction).toBe(
      "JAM"
    );
    expect(coVsHjOpen25?.reviewed).toBe(true);
    expect(coVsHjOpen25?.actions).toHaveLength(ALL_HANDS.length);
    expect(coVsHjOpen25?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "FOLD"
    );
    expect(coVsHjOpen25?.actions.find(action => action.handCode === "KQo")?.primaryAction).toBe(
      "CALL"
    );
    expect(coVsHjOpen25?.actions.find(action => action.handCode === "A5s")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(btnVsCoOpen40?.reviewed).toBe(true);
    expect(btnVsCoOpen40?.actions).toHaveLength(ALL_HANDS.length);
    expect(btnVsCoOpen40?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "CALL"
    );
    expect(btnVsCoOpen40?.actions.find(action => action.handCode === "AQo")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(btnVsCoOpen40?.actions.find(action => action.handCode === "T9o")?.primaryAction).toBe(
      "CALL"
    );
    expect(btnVsCoOpen70?.reviewed).toBe(true);
    expect(btnVsCoOpen70?.actions).toHaveLength(ALL_HANDS.length);
    expect(btnVsCoOpen70?.actions.find(action => action.handCode === "AJo")?.primaryAction).toBe(
      "CALL"
    );
    expect(btnVsCoOpen70?.actions.find(action => action.handCode === "KTs")?.primaryAction).toBe(
      "THREE_BET"
    );
    expect(btnVsCoOpen70?.actions.find(action => action.handCode === "98o")?.primaryAction).toBe(
      "CALL"
    );
  });

  it("builds unreviewed charts from parsed typed seed nodes", () => {
    const nodes: ParsedStrategySeedNode[] = [
      {
        summary: {
          id: 1,
          version: "population-v1",
          stackBucket: 25,
          playerCount: 9,
          scenarioFamily: "facing_open_middle",
          heroPosition: "BTN",
          villainPosition: "HJ",
          villainGroup: null,
          title: "BTN vs HJ @ 25bb",
          spotKey: "BTN_vs_HJ_open",
          stackDepth: 25,
          spotGroup: "facing_open_middle",
          reviewed: false,
          sourceLabel: "Not yet reviewed",
        },
        rows: [
          {
            action: "CALL",
            rangeNotation: "AJs, KQs",
            priority: 300,
            notes: "Continue the suited top-end.",
          },
          {
            action: "FOLD",
            rangeNotation: "AJo, KQo",
            priority: 100,
            notes: "Boundary folds until reviewed.",
          },
        ],
      },
    ];

    const charts = buildSeedCharts(nodes);
    const chart = charts[0]!;

    expect(chart.sourceStatus).toBe("imported_unreviewed");
    expect(chart.cellMapSource).toBe("imported_unreviewed");
    expect(chart.dataVersion).toBe("population-v1");
    expect(chart.sourceLabel).toBe("Not yet reviewed");
    expect(chart.notes).toContain("Continue the suited top-end.");
    expect(chart.actions).toHaveLength(4);
  });

  it("fills reviewed seed nodes with implicit folds", () => {
    const reviewedNode: ParsedStrategySeedNode = {
      summary: {
        id: 2,
        version: "population-v1",
        stackBucket: 15,
        playerCount: 9,
        scenarioFamily: "rfi",
        heroPosition: "UTG",
        villainPosition: null,
        villainGroup: null,
        title: "UTG RFI @ 15bb",
        spotKey: "UTG_rfi",
        stackDepth: 15,
        spotGroup: "rfi",
        reviewed: true,
        sourceLabel: "Reviewed typed seed",
      },
      rows: [
        {
          action: "RAISE",
          rangeNotation: "AA, KK",
          priority: 500,
        },
      ],
    };

    const chart = buildSeedCharts([reviewedNode])[0]!;

    expect(chart.actions).toHaveLength(ALL_HANDS.length);
    expect(chart.actions.find(action => action.handCode === "AA")?.primaryAction).toBe("RAISE");
    expect(chart.actions.find(action => action.handCode === "AKo")?.primaryAction).toBe("FOLD");
  });

  it("maps compiled seed actions into a hand lookup object", () => {
    const chart = buildSeedCharts([
      {
        summary: {
          id: 3,
          version: "population-v1",
          stackBucket: 40,
          playerCount: 9,
          scenarioFamily: "rfi",
          heroPosition: "CO",
          villainPosition: null,
          villainGroup: null,
          title: "CO RFI @ 40bb",
          spotKey: "CO_rfi",
          stackDepth: 40,
          spotGroup: "rfi",
          reviewed: false,
          sourceLabel: "Not yet reviewed",
        },
        rows: [
          {
            action: "RAISE",
            rangeNotation: "AKs, AQs",
            priority: 500,
          },
        ],
      },
    ])[0]!;

    const actionMap = buildActionMapFromSeedChart(chart);
    expect(actionMap.AKs?.primaryAction).toBe("RAISE");
    expect(actionMap.AQs?.primaryAction).toBe("RAISE");
    expect(actionMap.AJo).toBeUndefined();
  });

  it("validates custom complete reviewed charts", () => {
    const charts = buildSeedCharts([
      {
        summary: {
          id: 4,
          version: "population-v1",
          stackBucket: 70,
          playerCount: 9,
          scenarioFamily: "sb_first_in",
          heroPosition: "SB",
          villainPosition: null,
          villainGroup: null,
          title: "SB First In @ 70bb",
          spotKey: "sb_first_in",
          stackDepth: 70,
          spotGroup: "sb_first_in",
          reviewed: true,
          sourceLabel: "Reviewed typed seed",
        },
        rows: exactRows("FOLD"),
      },
    ]);

    expect(charts[0]?.actions).toHaveLength(ALL_HANDS.length);
    expect(() => validateSeedCharts(charts)).not.toThrow();
  });
});
