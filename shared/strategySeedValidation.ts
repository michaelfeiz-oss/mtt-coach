import {
  PLAYER_COUNTS,
  POSITIONS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  VILLAIN_GROUPS,
  type StrategyNodeIdentity,
  type StrategyRangeSeedRow,
} from "./preflopStrategy";
import { compileNotationRows } from "./strategyNotation";

const VALID_STACKS = new Set<number>(STACK_DEPTHS);
const VALID_PLAYERS = new Set<number>(PLAYER_COUNTS);
const VALID_GROUPS = new Set<string>(SPOT_GROUPS);
const VALID_POSITIONS = new Set<string>(POSITIONS);
const VALID_VILLAIN_GROUPS = new Set<string>(VILLAIN_GROUPS);

function identityKey(identity: StrategyNodeIdentity) {
  return [
    identity.version,
    identity.stackBucket,
    identity.playerCount,
    identity.scenarioFamily,
    identity.heroPosition,
    identity.villainPosition ?? "",
    identity.villainGroup ?? "",
  ].join("|");
}

function validateRouting(row: StrategyRangeSeedRow) {
  if (row.scenarioFamily === "rfi" || row.scenarioFamily === "sb_first_in") {
    if (row.villainPosition || row.villainGroup) {
      throw new Error(
        `${row.scenarioFamily} rows must not set villainPosition or villainGroup.`
      );
    }
    return;
  }

  if (
    row.scenarioFamily === "facing_open_early" ||
    row.scenarioFamily === "facing_open_middle" ||
    row.scenarioFamily === "facing_open_late" ||
    row.scenarioFamily === "facing_jam"
  ) {
    if (!row.villainPosition && !row.villainGroup) {
      throw new Error(
        `${row.scenarioFamily} rows must set villainPosition or villainGroup.`
      );
    }
    return;
  }

  if (row.scenarioFamily === "bb_vs_sb_open" || row.scenarioFamily === "bb_vs_sb_limp") {
    if (row.heroPosition !== "BB") {
      throw new Error(`${row.scenarioFamily} rows must use BB as hero.`);
    }
    if (row.villainPosition !== "SB") {
      throw new Error(`${row.scenarioFamily} rows must use SB as villainPosition.`);
    }
  }
}

export function validateSeedRow(row: StrategyRangeSeedRow) {
  if (!row.version.trim()) {
    throw new Error("Strategy seed row is missing version.");
  }

  if (!VALID_STACKS.has(row.stackBucket)) {
    throw new Error(`Unsupported stack bucket ${row.stackBucket}.`);
  }

  if (!VALID_PLAYERS.has(row.playerCount)) {
    throw new Error(`Unsupported player count ${row.playerCount}.`);
  }

  if (!VALID_GROUPS.has(row.scenarioFamily)) {
    throw new Error(`Unsupported scenario family ${row.scenarioFamily}.`);
  }

  if (!VALID_POSITIONS.has(row.heroPosition)) {
    throw new Error(`Unsupported hero position ${row.heroPosition}.`);
  }

  if (row.villainPosition && !VALID_POSITIONS.has(row.villainPosition)) {
    throw new Error(`Unsupported villain position ${row.villainPosition}.`);
  }

  if (row.villainGroup && !VALID_VILLAIN_GROUPS.has(row.villainGroup)) {
    throw new Error(`Unsupported villain group ${row.villainGroup}.`);
  }

  if (!row.rangeNotation.trim()) {
    throw new Error("Strategy seed row is missing rangeNotation.");
  }

  if (row.priority <= 0) {
    throw new Error(
      `Priority for ${row.action} must be a positive number. Received ${row.priority}.`
    );
  }

  validateRouting(row);
}

export function validateSeedRows(rows: StrategyRangeSeedRow[]) {
  const byNode = new Map<string, StrategyRangeSeedRow[]>();

  for (const row of rows) {
    validateSeedRow(row);
    const key = identityKey(row);
    const bucket = byNode.get(key) ?? [];
    bucket.push(row);
    byNode.set(key, bucket);
  }

  byNode.forEach((nodeRows, key) => {
    compileNotationRows(
      nodeRows.map(row => ({
        action: row.action,
        rangeNotation: row.rangeNotation,
        priority: row.priority,
        notes: row.notes,
      })),
      {
        requireComplete: nodeRows.every(row => row.reviewed),
        fillMissingWithAction: nodeRows.every(row => row.reviewed) ? "FOLD" : undefined,
      }
    );

    const reviewedFlags = new Set(nodeRows.map(row => row.reviewed));
    if (reviewedFlags.size > 1) {
      throw new Error(`Node ${key} mixes reviewed and unreviewed rows.`);
    }
  });
}
