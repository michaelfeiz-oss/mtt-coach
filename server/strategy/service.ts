import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import { getDb } from "../db";
import {
  rangeCharts,
  rangeChartActions,
  trainerAttempts,
  type InsertRangeChart,
  type InsertRangeChartAction,
  type InsertTrainerAttempt,
  type RangeChart,
  type RangeChartAction,
} from "../../drizzle/schema";
import {
  ACTIONS,
  ALL_HANDS,
  type Action,
  type HandAction,
  type RangeChartWithActions,
  type SpotGroup,
  type TrainerQuestion,
  type TrainerStats,
} from "../../shared/strategy";

export interface ListSpotsFilters {
  stackDepth?: number;
  spotGroup?: SpotGroup;
}

export interface TrainerSpotFilters extends ListSpotsFilters {
  chartId?: number;
}

export interface ChartSummary {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition: string | null;
  sourceLabel: string | null;
}

export interface TrainerQuestionWithChart extends TrainerQuestion {
  chart: ChartSummary;
}

export interface TrainerAttemptResult {
  success: true;
  isCorrect: boolean;
  correctAction: Action;
}

const HAND_ORDER = new Map(ALL_HANDS.map((hand, index) => [hand, index]));
const TRAINER_ACTION_ORDER: Action[] = [
  "RAISE",
  "CALL",
  "THREE_BET",
  "JAM",
  "LIMP",
  "CHECK",
  "FOLD",
];

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

function compareHandCode(a: string, b: string): number {
  const aIndex = HAND_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
  const bIndex = HAND_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;

  if (aIndex !== bIndex) return aIndex - bIndex;
  return a.localeCompare(b);
}

function mapAction(row: RangeChartAction): HandAction {
  return {
    handCode: row.handCode,
    primaryAction: row.primaryAction,
    weightPercent: row.weightPercent,
    mixJson: row.mixJson,
    colorToken: row.colorToken,
    note: row.note,
  };
}

function mapChartSummary(chart: RangeChart): ChartSummary {
  return {
    id: chart.id,
    title: chart.title,
    stackDepth: chart.stackDepth,
    spotGroup: chart.spotGroup,
    spotKey: chart.spotKey,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition,
    sourceLabel: chart.sourceLabel,
  };
}

function mapChartWithActions(
  chart: RangeChart,
  actions: RangeChartAction[]
): RangeChartWithActions {
  return {
    id: chart.id,
    title: chart.title,
    stackDepth: chart.stackDepth,
    spotGroup: chart.spotGroup,
    spotKey: chart.spotKey,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition,
    sourceLabel: chart.sourceLabel,
    notesJson: chart.notesJson,
    actions: [...actions]
      .sort((a, b) => compareHandCode(a.handCode, b.handCode))
      .map(mapAction),
  };
}

function buildChartConditions(filters: ListSpotsFilters): SQL[] {
  const conditions: SQL[] = [eq(rangeCharts.isActive, true)];

  if (filters.stackDepth !== undefined) {
    conditions.push(eq(rangeCharts.stackDepth, filters.stackDepth));
  }

  if (filters.spotGroup !== undefined) {
    conditions.push(eq(rangeCharts.spotGroup, filters.spotGroup));
  }

  return conditions;
}

function buildTrainerChoices(correctAction: Action): Action[] {
  const choices = [
    correctAction,
    ...TRAINER_ACTION_ORDER.filter(action => action !== correctAction),
  ];

  return choices.slice(0, 4);
}

function createEmptyActionStats(): TrainerStats["byAction"] {
  return ACTIONS.reduce<TrainerStats["byAction"]>(
    (stats, action) => {
      stats[action] = { total: 0, correct: 0 };
      return stats;
    },
    {} as TrainerStats["byAction"]
  );
}

export async function getChartsBySpot(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
) {
  const db = await requireDb();

  return db
    .select()
    .from(rangeCharts)
    .where(
      and(
        eq(rangeCharts.stackDepth, stackDepth),
        eq(rangeCharts.spotGroup, spotGroup),
        eq(rangeCharts.spotKey, spotKey),
        eq(rangeCharts.isActive, true)
      )
    )
    .orderBy(asc(rangeCharts.stackDepth), asc(rangeCharts.title));
}

export async function getChartWithActions(
  chartId: number
): Promise<RangeChartWithActions | null> {
  const db = await requireDb();
  const [chart] = await db
    .select()
    .from(rangeCharts)
    .where(and(eq(rangeCharts.id, chartId), eq(rangeCharts.isActive, true)))
    .limit(1);

  if (!chart) return null;

  const actions = await db
    .select()
    .from(rangeChartActions)
    .where(eq(rangeChartActions.chartId, chartId));

  return mapChartWithActions(chart, actions);
}

export async function getChartBySpotSelector(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
): Promise<RangeChartWithActions | null> {
  const [chart] = await getChartsBySpot(stackDepth, spotGroup, spotKey);
  if (!chart) return null;
  return getChartWithActions(chart.id);
}

export async function listAvailableSpots(filters: ListSpotsFilters = {}) {
  const db = await requireDb();
  const conditions = buildChartConditions(filters);

  return db
    .select({
      id: rangeCharts.id,
      title: rangeCharts.title,
      stackDepth: rangeCharts.stackDepth,
      spotGroup: rangeCharts.spotGroup,
      spotKey: rangeCharts.spotKey,
      heroPosition: rangeCharts.heroPosition,
      villainPosition: rangeCharts.villainPosition,
      sourceLabel: rangeCharts.sourceLabel,
    })
    .from(rangeCharts)
    .where(and(...conditions))
    .orderBy(
      asc(rangeCharts.stackDepth),
      asc(rangeCharts.spotGroup),
      asc(rangeCharts.title)
    );
}

export async function createChart(data: InsertRangeChart): Promise<number> {
  const db = await requireDb();
  const [result] = await db.insert(rangeCharts).values(data);
  return result.insertId;
}

export async function bulkInsertActions(
  rows: InsertRangeChartAction[]
): Promise<void> {
  if (rows.length === 0) return;

  const db = await requireDb();
  await db.insert(rangeChartActions).values(rows);
}

export async function getTrainerSpot(
  filters: TrainerSpotFilters = {}
): Promise<TrainerQuestionWithChart | null> {
  const db = await requireDb();
  const conditions = buildChartConditions(filters);

  if (filters.chartId !== undefined) {
    conditions.push(eq(rangeCharts.id, filters.chartId));
  }

  const rows = await db
    .select({
      chart: rangeCharts,
      action: rangeChartActions,
    })
    .from(rangeChartActions)
    .innerJoin(rangeCharts, eq(rangeChartActions.chartId, rangeCharts.id))
    .where(and(...conditions))
    .orderBy(
      asc(rangeCharts.stackDepth),
      asc(rangeCharts.spotGroup),
      asc(rangeCharts.title),
      asc(rangeChartActions.handCode)
    );

  const trainableRows = rows
    .filter(
      ({ action }) =>
        action.handCode.length > 0 && action.primaryAction !== "FOLD"
    )
    .sort((a, b) => compareHandCode(a.action.handCode, b.action.handCode));

  if (trainableRows.length === 0) return null;

  const selected =
    trainableRows[Math.floor(Math.random() * trainableRows.length)];
  const correctAction = selected.action.primaryAction;

  return {
    chartId: selected.chart.id,
    handCode: selected.action.handCode,
    correctAction,
    choices: buildTrainerChoices(correctAction),
    chart: mapChartSummary(selected.chart),
  };
}

export async function submitTrainerAttempt(
  userId: number,
  input: {
    chartId: number;
    handCode: string;
    selectedAction: Action;
  }
): Promise<TrainerAttemptResult | null> {
  const db = await requireDb();

  const [row] = await db
    .select({
      action: rangeChartActions,
    })
    .from(rangeChartActions)
    .innerJoin(rangeCharts, eq(rangeChartActions.chartId, rangeCharts.id))
    .where(
      and(
        eq(rangeCharts.id, input.chartId),
        eq(rangeCharts.isActive, true),
        eq(rangeChartActions.handCode, input.handCode)
      )
    )
    .limit(1);

  if (!row) return null;

  const correctAction = row.action.primaryAction;
  const isCorrect = input.selectedAction === correctAction;

  await logTrainerAttempt({
    userId,
    chartId: input.chartId,
    handCode: input.handCode,
    selectedAction: input.selectedAction,
    correctAction,
    isCorrect,
  });

  return {
    success: true,
    isCorrect,
    correctAction,
  };
}

export async function logTrainerAttempt(
  data: InsertTrainerAttempt
): Promise<void> {
  const db = await requireDb();
  await db.insert(trainerAttempts).values(data);
}

export async function getTrainerStats(userId: number): Promise<TrainerStats> {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(trainerAttempts)
    .where(eq(trainerAttempts.userId, userId));

  const total = rows.length;
  const correct = rows.filter(row => row.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const byAction = createEmptyActionStats();

  for (const row of rows) {
    const action = ACTIONS.find(candidate => candidate === row.correctAction);
    if (!action) continue;

    byAction[action].total += 1;
    if (row.isCorrect) {
      byAction[action].correct += 1;
    }
  }

  return { total, correct, accuracy, byAction };
}

export async function getRecentAttempts(userId: number, limit = 50) {
  const db = await requireDb();

  return db
    .select()
    .from(trainerAttempts)
    .where(eq(trainerAttempts.userId, userId))
    .orderBy(desc(trainerAttempts.createdAt))
    .limit(limit);
}
