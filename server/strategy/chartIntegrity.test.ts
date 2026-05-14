import { describe, expect, it } from "vitest";
import {
  ALL_HANDS,
  type StrategyNodeRangeRow,
} from "../../shared/preflopStrategy";
import {
  type TypedStrategyNodeDefinition,
  typedNodeToSeedActions,
  validateTypedStrategyNode,
} from "../../shared/strategyDataValidation";
import { getStrategyChartTrustMetadata, isTrainerAllowedStrategyChart } from "../../shared/sourceTruth";
import { SEED_CHARTS } from "./seedData";
import { assertCompleteChartActions } from "./service";

function fullRows(action: StrategyNodeRangeRow["action"]) {
  const priorityByAction = {
    JAM: 800,
    FOUR_BET: 700,
    THREE_BET: 600,
    RAISE: 500,
    LIMP: 400,
    CALL: 300,
    CHECK: 200,
    FOLD: 100,
  } as const;

  return ALL_HANDS.map<StrategyNodeRangeRow>(handCode => ({
    action,
    rangeNotation: handCode,
    priority: priorityByAction[action],
  }));
}

function makeNode(overrides: Partial<TypedStrategyNodeDefinition> = {}): TypedStrategyNodeDefinition {
  return {
    version: "population-v1",
    stackBucket: 25,
    playerCount: 9,
    scenarioFamily: "rfi",
    heroPosition: "CO",
    villainPosition: null,
    villainGroup: null,
    reviewed: false,
    rows: fullRows("FOLD"),
    ...overrides,
  };
}

describe("typed strategy chart integrity", () => {
  it("keeps the real seed catalog empty until trusted typed files are provided", () => {
    expect(SEED_CHARTS).toEqual([]);
  });

  it("accepts structurally complete nodes without treating them as reviewed by default", () => {
    const node = makeNode({ reviewed: false });
    const compiled = validateTypedStrategyNode(node);
    const trust = getStrategyChartTrustMetadata({
      stackDepth: node.stackBucket,
      spotGroup: node.scenarioFamily,
      heroPosition: node.heroPosition,
      villainPosition: node.villainPosition,
      villainGroup: node.villainGroup,
      reviewed: node.reviewed,
      actions: compiled.actions,
    });

    expect(compiled.actions).toHaveLength(ALL_HANDS.length);
    expect(trust.structurallyComplete).toBe(true);
    expect(trust.trainerAllowed).toBe(false);
    expect(isTrainerAllowedStrategyChart({
      stackDepth: node.stackBucket,
      spotGroup: node.scenarioFamily,
      heroPosition: node.heroPosition,
      reviewed: node.reviewed,
      actions: compiled.actions,
    })).toBe(false);
  });

  it("allows reviewed complete nodes to become trainer-safe", () => {
    const node = makeNode({
      reviewed: true,
      heroPosition: "HJ",
      stackBucket: 40,
      rows: fullRows("RAISE"),
    });
    const compiled = validateTypedStrategyNode(node);
    const chart = {
      stackDepth: node.stackBucket,
      spotGroup: node.scenarioFamily,
      heroPosition: node.heroPosition,
      villainPosition: node.villainPosition,
      villainGroup: node.villainGroup,
      reviewed: true,
      actions: compiled.actions,
    };

    expect(isTrainerAllowedStrategyChart(chart)).toBe(true);
    expect(getStrategyChartTrustMetadata(chart).trainerAllowed).toBe(true);
  });

  it("converts a validated typed node into explicit 169-cell seed actions", () => {
    const actions = typedNodeToSeedActions(makeNode({ reviewed: true }));

    expect(actions).toHaveLength(ALL_HANDS.length);
    expect(actions[0]?.handCode).toBe("AA");
    expect(actions[0]?.primaryAction).toBe("FOLD");
  });

  it("throws on missing, duplicate, invalid hand, and invalid action integrity failures", () => {
    expect(() =>
      assertCompleteChartActions({
        title: "Missing chart",
        actions: ALL_HANDS.slice(1).map(handCode => ({
          handCode,
          primaryAction: "FOLD",
        })),
      })
    ).toThrow(/missing/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Duplicate chart",
        actions: ALL_HANDS.slice(0, ALL_HANDS.length - 1)
          .map(handCode => ({
            handCode,
            primaryAction: "FOLD",
          }))
          .concat({
            handCode: "AA",
            primaryAction: "FOLD",
          }),
      })
    ).toThrow(/duplicate/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Invalid hand chart",
        actions: ALL_HANDS.slice(1)
          .map(handCode => ({
            handCode,
            primaryAction: "FOLD",
          }))
          .concat({
            handCode: "ZZZZ",
            primaryAction: "FOLD",
          }),
      })
    ).toThrow(/invalid hand/i);

    expect(() =>
      assertCompleteChartActions({
        title: "Invalid action chart",
        actions: ALL_HANDS.map(handCode => ({
          handCode,
          primaryAction: (handCode === "AA" ? "BLAST_OFF" : "FOLD") as any,
        })),
      })
    ).toThrow(/invalid action/i);
  });
});
