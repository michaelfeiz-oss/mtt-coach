import {
  ACTIONS,
  ALL_HANDS,
  type Action,
  type HandAction,
  type RangeChartWithActions,
} from "../../shared/preflopStrategy";
import {
  type StrategyCellMapSource,
  type StrategySourceStatus,
} from "../../shared/sourceTruth";
import { compileNotationRows } from "../../shared/strategyNotation";
import {
  loadStrategySeedNodesSync,
  type ParsedStrategySeedNode,
} from "./typedSeedFiles";

export interface SeedChart extends RangeChartWithActions {
  sourceStatus: StrategySourceStatus;
  cellMapSource: StrategyCellMapSource;
  dataVersion: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  sourceFile: string | null;
  sourcePanelLabel: string | null;
  notes: string[];
}

const VALID_HANDS = new Set(ALL_HANDS);
const VALID_ACTIONS = new Set<Action>(ACTIONS);

function uniqueNotes(values: Array<string | null | undefined>) {
  return values
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);
}

function mapNodeToSeedChart(node: ParsedStrategySeedNode): SeedChart {
  const compiled = compileNotationRows(node.rows, {
    requireComplete: node.summary.reviewed,
    fillMissingWithAction: node.summary.reviewed ? "FOLD" : undefined,
  });

  return {
    ...node.summary,
    notesJson:
      uniqueNotes(node.rows.map(row => row.notes)).length > 0
        ? JSON.stringify(uniqueNotes(node.rows.map(row => row.notes)))
        : null,
    actions: compiled.actions,
    sourceStatus: node.summary.reviewed ? "source_backed" : "imported_unreviewed",
    cellMapSource: node.summary.reviewed ? "reviewed" : "imported_unreviewed",
    dataVersion: node.summary.version,
    reviewedBy: null,
    reviewedAt: null,
    sourceFile: null,
    sourcePanelLabel: null,
    notes: uniqueNotes(node.rows.map(row => row.notes)),
  };
}

export function buildSeedCharts(nodes = loadStrategySeedNodesSync()): SeedChart[] {
  return nodes.map(mapNodeToSeedChart);
}

export function validateSeedCharts(charts: SeedChart[] = SEED_CHARTS) {
  const seenCharts = new Set<string>();

  for (const chart of charts) {
    const chartKey = `${chart.dataVersion}:${chart.stackDepth}:${chart.spotGroup}:${chart.spotKey}`;
    if (seenCharts.has(chartKey)) {
      throw new Error(`Duplicate typed seed node ${chartKey}.`);
    }
    seenCharts.add(chartKey);

    const seenHands = new Set<string>();
    for (const action of chart.actions) {
      if (!VALID_HANDS.has(action.handCode)) {
        throw new Error(`${chart.title}: invalid hand code ${action.handCode}.`);
      }
      if (!VALID_ACTIONS.has(action.primaryAction)) {
        throw new Error(
          `${chart.title}: invalid action ${action.primaryAction} for ${action.handCode}.`
        );
      }
      if (seenHands.has(action.handCode)) {
        throw new Error(`${chart.title}: duplicate hand ${action.handCode}.`);
      }
      seenHands.add(action.handCode);
    }

    if (chart.reviewed && seenHands.size !== ALL_HANDS.length) {
      throw new Error(
        `${chart.title}: reviewed typed nodes must contain exactly ${ALL_HANDS.length} hands.`
      );
    }
  }
}

export const SEED_CHARTS: SeedChart[] = buildSeedCharts();

validateSeedCharts(SEED_CHARTS);

export function buildActionMapFromSeedChart(chart: SeedChart) {
  return chart.actions.reduce<Record<string, HandAction>>((accumulator, action) => {
    accumulator[action.handCode] = action;
    return accumulator;
  }, {});
}
