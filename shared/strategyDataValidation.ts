import {
  ACTIONS,
  ALL_HANDS,
  PLAYER_COUNTS,
  POSITIONS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  VILLAIN_GROUPS,
  type Action,
  type StrategyNodeIdentity,
  type StrategyNodeRangeRow,
} from "./preflopStrategy";
import { compileNotationRows } from "./strategyNotation";

const VALID_ACTIONS = new Set<Action>(ACTIONS);
const VALID_STACKS = new Set<number>(STACK_DEPTHS);
const VALID_PLAYERS = new Set<number>(PLAYER_COUNTS);
const VALID_SPOT_GROUPS = new Set<string>(SPOT_GROUPS);
const VALID_POSITIONS = new Set<string>(POSITIONS);
const VALID_VILLAIN_GROUPS = new Set<string>(VILLAIN_GROUPS);

export interface TypedStrategyNodeDefinition extends StrategyNodeIdentity {
  reviewed: boolean;
  rows: StrategyNodeRangeRow[];
}

function nodeLabel(node: TypedStrategyNodeDefinition) {
  return `${node.version}:${node.stackBucket}:${node.scenarioFamily}:${node.heroPosition}:${node.villainPosition ?? node.villainGroup ?? "none"}`;
}

function validateNodeIdentity(node: TypedStrategyNodeDefinition) {
  const label = nodeLabel(node);

  if (!node.version.trim()) {
    throw new Error(`${label}: missing version.`);
  }
  if (!VALID_STACKS.has(node.stackBucket)) {
    throw new Error(`${label}: invalid stack bucket ${node.stackBucket}.`);
  }
  if (!VALID_PLAYERS.has(node.playerCount)) {
    throw new Error(`${label}: invalid player count ${node.playerCount}.`);
  }
  if (!VALID_SPOT_GROUPS.has(node.scenarioFamily)) {
    throw new Error(`${label}: invalid scenario family ${node.scenarioFamily}.`);
  }
  if (!VALID_POSITIONS.has(node.heroPosition)) {
    throw new Error(`${label}: invalid hero position ${node.heroPosition}.`);
  }
  if (node.villainPosition && !VALID_POSITIONS.has(node.villainPosition)) {
    throw new Error(`${label}: invalid villain position ${node.villainPosition}.`);
  }
  if (node.villainGroup && !VALID_VILLAIN_GROUPS.has(node.villainGroup)) {
    throw new Error(`${label}: invalid villain group ${node.villainGroup}.`);
  }
}

function validateNodeRouting(node: TypedStrategyNodeDefinition) {
  const label = nodeLabel(node);

  switch (node.scenarioFamily) {
    case "rfi":
    case "sb_first_in":
      if (node.villainPosition || node.villainGroup) {
        throw new Error(
          `${label}: ${node.scenarioFamily} must not set villainPosition or villainGroup.`
        );
      }
      return;
    case "facing_open_early":
    case "facing_open_middle":
    case "facing_open_late":
    case "facing_jam":
      if (!node.villainPosition && !node.villainGroup) {
        throw new Error(
          `${label}: ${node.scenarioFamily} requires villainPosition or villainGroup.`
        );
      }
      return;
    case "bb_vs_sb_open":
    case "bb_vs_sb_limp":
      if (node.heroPosition !== "BB") {
        throw new Error(`${label}: ${node.scenarioFamily} must use BB as hero.`);
      }
      if (node.villainPosition !== "SB") {
        throw new Error(
          `${label}: ${node.scenarioFamily} must use SB as villainPosition.`
        );
      }
      return;
  }
}

function validateNodeRows(node: TypedStrategyNodeDefinition) {
  const label = nodeLabel(node);

  if (node.rows.length === 0) {
    throw new Error(`${label}: node must contain at least one range row.`);
  }

  for (const row of node.rows) {
    if (!VALID_ACTIONS.has(row.action)) {
      throw new Error(`${label}: invalid action ${row.action}.`);
    }
    if (!row.rangeNotation.trim()) {
      throw new Error(`${label}: row for ${row.action} is missing rangeNotation.`);
    }
    if (!Number.isFinite(row.priority)) {
      throw new Error(`${label}: row for ${row.action} has invalid priority.`);
    }
  }
}

export function validateTypedStrategyNode(node: TypedStrategyNodeDefinition) {
  validateNodeIdentity(node);
  validateNodeRouting(node);
  validateNodeRows(node);

  const compiled = compileNotationRows(node.rows, {
    requireComplete: node.reviewed,
    fillMissingWithAction: node.reviewed ? "FOLD" : undefined,
  });

  if (node.reviewed && compiled.actions.length !== ALL_HANDS.length) {
    throw new Error(
      `${nodeLabel(node)}: reviewed nodes must compile to exactly ${ALL_HANDS.length} hands.`
    );
  }

  return compiled;
}

export function typedNodeToSeedActions(node: TypedStrategyNodeDefinition) {
  const compiled = validateTypedStrategyNode(node);
  return ALL_HANDS.filter(handCode =>
    compiled.actions.some(action => action.handCode === handCode)
  ).map(handCode => {
    const action = compiled.actions.find(candidate => candidate.handCode === handCode)!;
    return {
      handCode,
      primaryAction: action.primaryAction,
      weightPercent: action.weightPercent ?? 100,
      note: action.note ?? null,
    };
  });
}
