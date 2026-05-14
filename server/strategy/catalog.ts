import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  strategyNodeRanges,
  strategyNodes,
  type StrategyNode,
  type StrategyNodeRange,
} from "../../drizzle/schema";
import {
  type Position,
  type RangeChartWithActions,
  type SpotGroup,
} from "../../shared/preflopStrategy";
import { compileNotationRows } from "../../shared/strategyNotation";
import { loadStrategySeedNodes, type ParsedStrategySeedNode } from "./typedSeedFiles";

export interface StrategyCatalogFilters {
  stackDepth?: number;
  spotGroup?: SpotGroup;
  heroPosition?: Position;
  villainPosition?: Position;
}

function buildNotesJson(notes: Array<string | null | undefined>) {
  const values = notes
    .map(note => note?.trim())
    .filter((note): note is string => Boolean(note))
    .filter((note, index, array) => array.indexOf(note) === index);

  return values.length > 0 ? JSON.stringify(values) : null;
}

function mapSeedNodeToChart(node: ParsedStrategySeedNode): RangeChartWithActions {
  const compiled = compileNotationRows(node.rows, {
    requireComplete: node.summary.reviewed,
  });

  return {
    ...node.summary,
    notesJson: buildNotesJson(node.rows.map(row => row.notes)),
    actions: compiled.actions,
  };
}

function mapDbNodeToChart(
  node: StrategyNode,
  rows: StrategyNodeRange[]
): RangeChartWithActions {
  const compiled = compileNotationRows(
    rows.map(row => ({
      action: row.action,
      rangeNotation: row.rangeNotation,
      priority: row.priority,
      notes: row.notes,
    })),
    { requireComplete: node.reviewed || node.structurallyComplete }
  );

  return {
    id: node.id,
    version: node.version as RangeChartWithActions["version"],
    stackBucket: node.stackBucket as RangeChartWithActions["stackBucket"],
    playerCount: node.playerCount as RangeChartWithActions["playerCount"],
    scenarioFamily: node.scenarioFamily as RangeChartWithActions["scenarioFamily"],
    heroPosition: node.heroPosition as RangeChartWithActions["heroPosition"],
    villainPosition: (node.villainPosition as RangeChartWithActions["villainPosition"]) ?? null,
    villainGroup: (node.villainGroup as RangeChartWithActions["villainGroup"]) ?? null,
    title: node.title,
    spotKey: node.spotKey,
    stackDepth: node.stackBucket as RangeChartWithActions["stackDepth"],
    spotGroup: node.scenarioFamily as RangeChartWithActions["spotGroup"],
    reviewed: node.reviewed,
    sourceLabel: node.sourceLabel,
    notesJson: buildNotesJson([node.notes, ...rows.map(row => row.notes)]),
    actions: compiled.actions,
  };
}

function sortCharts(a: RangeChartWithActions, b: RangeChartWithActions) {
  return (
    a.stackDepth - b.stackDepth ||
    a.spotGroup.localeCompare(b.spotGroup) ||
    a.heroPosition.localeCompare(b.heroPosition) ||
    (a.villainPosition ?? a.villainGroup ?? "").localeCompare(
      b.villainPosition ?? b.villainGroup ?? ""
    ) ||
    a.title.localeCompare(b.title)
  );
}

function applyFilters(
  charts: RangeChartWithActions[],
  filters: StrategyCatalogFilters
) {
  return charts.filter(chart => {
    if (filters.stackDepth !== undefined && chart.stackDepth !== filters.stackDepth) {
      return false;
    }
    if (filters.spotGroup !== undefined && chart.spotGroup !== filters.spotGroup) {
      return false;
    }
    if (
      filters.heroPosition !== undefined &&
      chart.heroPosition !== filters.heroPosition
    ) {
      return false;
    }
    if (
      filters.villainPosition !== undefined &&
      chart.villainPosition !== filters.villainPosition
    ) {
      return false;
    }

    return true;
  });
}

export async function loadStrategyCatalogChartsFromDb(): Promise<
  RangeChartWithActions[] | null
> {
  const db = await getDb();
  if (!db) return null;

  const nodes = await db
    .select()
    .from(strategyNodes)
    .where(eq(strategyNodes.isActive, true))
    .orderBy(
      asc(strategyNodes.stackBucket),
      asc(strategyNodes.scenarioFamily),
      asc(strategyNodes.heroPosition),
      asc(strategyNodes.villainPosition),
      asc(strategyNodes.id)
    );

  if (nodes.length === 0) {
    return [];
  }

  const nodeIds = nodes.map(node => node.id);
  const ranges =
    nodeIds.length > 0
      ? await db
          .select()
          .from(strategyNodeRanges)
          .where(inArray(strategyNodeRanges.nodeId, nodeIds))
          .orderBy(
            asc(strategyNodeRanges.nodeId),
            asc(strategyNodeRanges.priority),
            asc(strategyNodeRanges.id)
          )
      : [];

  const rowsByNodeId = new Map<number, StrategyNodeRange[]>();
  for (const row of ranges) {
    const bucket = rowsByNodeId.get(row.nodeId) ?? [];
    bucket.push(row);
    rowsByNodeId.set(row.nodeId, bucket);
  }

  return nodes.map(node => mapDbNodeToChart(node, rowsByNodeId.get(node.id) ?? []));
}

export async function loadStrategyCatalogChartsFromSeeds() {
  const nodes = await loadStrategySeedNodes();
  return nodes.map(mapSeedNodeToChart);
}

export async function loadStrategyCatalogCharts(
  filters: StrategyCatalogFilters = {}
) {
  const fromDb = await loadStrategyCatalogChartsFromDb();
  const charts =
    fromDb !== null && fromDb.length > 0
      ? fromDb
      : await loadStrategyCatalogChartsFromSeeds();

  return applyFilters(charts, filters).sort(sortCharts);
}

export async function getStrategyCatalogChartById(chartId: number) {
  const charts = await loadStrategyCatalogCharts();
  return charts.find(chart => chart.id === chartId) ?? null;
}

export async function getStrategyCatalogChartBySpot(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
) {
  const charts = await loadStrategyCatalogCharts({
    stackDepth,
    spotGroup,
  });

  return charts.find(chart => chart.spotKey === spotKey) ?? null;
}
