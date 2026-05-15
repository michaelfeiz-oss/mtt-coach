import {
  ACTION_PRIORITY,
  type ActionToken,
  type ChartCells,
  type Position,
  type SpotType,
  normalizeNodeKey,
} from "../../shared/strategy-v2/model";
import { compileNotationRows } from "../../shared/strategyNotation";
import {
  loadStrategySeedNodesSync,
  type ParsedStrategySeedNode,
} from "../strategy/typedSeedFiles";
import { upsertSeedChart } from "./db";

function normalizeAction(action: string): ActionToken {
  if (action === "CALL_JAM") return "CALL";
  return action as ActionToken;
}

function nodeKeyFor(node: ParsedStrategySeedNode) {
  const { summary } = node;
  const stack = `${summary.stackBucket}bb`;
  const hero = summary.heroPosition.toLowerCase();
  const villain = (summary.villainPosition ?? summary.villainGroup ?? "")
    .toString()
    .toLowerCase();

  switch (summary.scenarioFamily) {
    case "rfi":
      return normalizeNodeKey(`rfi_${stack}_${hero}_bba`);
    case "sb_first_in":
      return normalizeNodeKey(`sb_first_in_${stack}_bba`);
    case "bb_vs_sb_open":
      return normalizeNodeKey(`bb_vs_sb_open_${stack}_bba`);
    case "bb_vs_sb_limp":
      return normalizeNodeKey(`bb_vs_sb_limp_${stack}_bba`);
    case "facing_jam":
      return normalizeNodeKey(`facing_jam_${stack}_${hero}_vs_${villain}_bba`);
    case "facing_open_early":
    case "facing_open_middle":
    case "facing_open_late":
      return normalizeNodeKey(
        `${summary.scenarioFamily}_${stack}_${hero}_vs_${villain}_bba`
      );
  }
}

function chartDescription(node: ParsedStrategySeedNode) {
  const parts = [
    "Migrated from reviewed typed seed rows.",
    node.rows.some(row => row.action === "CALL_JAM")
      ? "V1 CALL_JAM rows are normalized to canonical V2 CALL for facing-jam spots."
      : null,
  ].filter(Boolean);
  return parts.join(" ");
}

function compileNode(node: ParsedStrategySeedNode) {
  const compiled = compileNotationRows(node.rows, {
    requireComplete: node.summary.reviewed,
    fillMissingWithAction: node.summary.reviewed ? "FOLD" : undefined,
  });

  const cells: ChartCells = Object.fromEntries(
    compiled.actions.map(action => [
      action.handCode,
      normalizeAction(action.primaryAction),
    ])
  ) as ChartCells;

  const allowedActions = Array.from(new Set(Object.values(cells))).sort(
    (left, right) => ACTION_PRIORITY[right] - ACTION_PRIORITY[left]
  );

  return {
    cells,
    allowedActions,
  };
}

export function importTypedSeedsIntoLocalDb() {
  const nodes = loadStrategySeedNodesSync();
  let imported = 0;
  let skipped = 0;

  for (const node of nodes) {
    if (!node.summary.reviewed) continue;

    const compiled = compileNode(node);
    const result = upsertSeedChart({
      nodeKey: nodeKeyFor(node),
      spotType: node.summary.scenarioFamily as SpotType,
      stackBb: node.summary.stackBucket,
      position: node.summary.heroPosition as Position,
      villainPosition: (node.summary.villainPosition as Position | null) ?? null,
      title: node.summary.title,
      description: chartDescription(node),
      allowedActions: compiled.allowedActions,
      cells: compiled.cells,
      notes: node.rows
        .map(row => row.notes?.trim())
        .filter((note): note is string => Boolean(note))
        .filter((note, index, all) => all.indexOf(note) === index)
        .join("\n"),
    });

    if (result.skipped) skipped += 1;
    else imported += 1;
  }

  return {
    imported,
    skipped,
    totalReviewedNodes: nodes.filter(node => node.summary.reviewed).length,
  };
}
