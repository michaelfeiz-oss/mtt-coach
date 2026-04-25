import { and, asc, desc, eq, inArray, type SQL } from "drizzle-orm";
import { getDb } from "../db";
import {
  rangeCharts,
  rangeChartActions,
  hands,
  trainerAttempts,
  type InsertRangeChart,
  type InsertRangeChartAction,
  type InsertTrainerAttempt,
  type Hand,
  type RangeChart,
  type RangeChartAction,
} from "../../drizzle/schema";
import {
  ACTIONS,
  ALL_HANDS,
  POSITIONS,
  STACK_DEPTHS,
  type Action,
  type HandAction,
  type RangeChartWithActions,
  type StrategyMissedHand,
  type StrategyProgressSummary,
  type StrategyRecommendation,
  type StrategySpotProgress,
  type Position,
  type SpotGroup,
  type TrainerQuestion,
  type TrainerStats,
} from "../../shared/strategy";
import {
  getHandCoordinate as getCanonicalHandCoordinate,
  handDistance as getCanonicalHandDistance,
  normalizeHandCode as normalizeCanonicalHandCode,
} from "../../shared/handMatrix";

export interface ListSpotsFilters {
  stackDepth?: number;
  spotGroup?: SpotGroup;
  heroPosition?: Position;
  villainPosition?: Position;
}

export interface TrainerSpotFilters extends ListSpotsFilters {
  chartId?: number;
  chartIds?: number[];
  focusHandCodes?: string[];
  recentChartIds?: number[];
  recentHandKeys?: string[];
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
  correctNote?: string | null;
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
const VALID_POSITIONS = new Set<string>(POSITIONS);
const RECENT_CHART_GUARD_LIMIT = 8;
const RECENT_HAND_GUARD_LIMIT = 20;
const FOLD_SAMPLE_TARGET = 0.32;
const MARGINAL_FOLD_DISTANCE = 2;

type JsonObject = Record<string, unknown>;

interface SpotInference {
  spotKey: string;
  reason: string;
}

interface HandStatsAccumulator {
  chartId: number;
  chartTitle: string;
  handCode: string;
  attempts: number;
  missed: number;
  correctAction: Action;
}

interface TrainerSelectionRow {
  chart: RangeChart;
  action: RangeChartAction;
}

interface HandCoordinate {
  row: number;
  col: number;
}

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

  if (filters.heroPosition !== undefined) {
    conditions.push(eq(rangeCharts.heroPosition, filters.heroPosition));
  }

  if (filters.villainPosition !== undefined) {
    conditions.push(eq(rangeCharts.villainPosition, filters.villainPosition));
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

function handHistoryKey(chartId: number, handCode: string): string {
  return `${chartId}:${handCode}`;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pickWeighted<T>(
  items: T[],
  weightForItem: (item: T) => number
): T {
  const weighted = items.map(item => ({
    item,
    weight: Math.max(0, weightForItem(item)),
  }));
  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) return randomItem(items);

  let cursor = Math.random() * totalWeight;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }

  return weighted[weighted.length - 1].item;
}

function uniqueCharts(rows: TrainerSelectionRow[]): RangeChart[] {
  const byId = new Map<number, RangeChart>();

  for (const row of rows) {
    byId.set(row.chart.id, row.chart);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      a.stackDepth - b.stackDepth ||
      a.spotGroup.localeCompare(b.spotGroup) ||
      a.title.localeCompare(b.title)
  );
}

function recentChartSet(filters: TrainerSpotFilters, chartCount: number) {
  if (chartCount <= 1) return new Set<number>();

  const guardSize = Math.min(
    RECENT_CHART_GUARD_LIMIT,
    Math.max(0, chartCount - 1)
  );

  return new Set((filters.recentChartIds ?? []).slice(0, guardSize));
}

function chartBucketKey(chart: RangeChart, filters: TrainerSpotFilters) {
  if (filters.spotGroup !== undefined && filters.stackDepth === undefined) {
    return `${chart.stackDepth}`;
  }

  if (filters.stackDepth !== undefined && filters.spotGroup === undefined) {
    return chart.spotGroup;
  }

  return `${chart.spotGroup}:${chart.stackDepth}`;
}

function pickChartForTrainer(
  rows: TrainerSelectionRow[],
  filters: TrainerSpotFilters
): RangeChart | null {
  const charts = uniqueCharts(rows);
  if (charts.length === 0) return null;

  if (filters.chartId !== undefined) {
    return charts.find(chart => chart.id === filters.chartId) ?? null;
  }

  const recentIds = recentChartSet(filters, charts.length);
  const repeatSafeCharts = charts.filter(chart => !recentIds.has(chart.id));
  const eligibleCharts = repeatSafeCharts.length > 0 ? repeatSafeCharts : charts;

  const buckets = new Map<string, RangeChart[]>();
  for (const chart of eligibleCharts) {
    const key = chartBucketKey(chart, filters);
    const bucket = buckets.get(key) ?? [];
    bucket.push(chart);
    buckets.set(key, bucket);
  }

  const selectedBucket = randomItem(Array.from(buckets.values()));
  return randomItem(selectedBucket);
}

function actionBucketWeight(action: Action): number {
  switch (action) {
    case "THREE_BET":
    case "JAM":
      return 1.15;
    case "RAISE":
    case "CALL":
      return 1;
    case "LIMP":
    case "CHECK":
      return 0.8;
    case "FOLD":
      return 0.7;
  }
}

function groupRowsByAction(rows: RangeChartAction[]) {
  const byAction = new Map<Action, RangeChartAction[]>();

  for (const row of rows) {
    if (!isAction(row.primaryAction) || row.handCode.length === 0) continue;
    const bucket = byAction.get(row.primaryAction) ?? [];
    bucket.push(row);
    byAction.set(row.primaryAction, bucket);
  }

  return byAction;
}

export function getHandCoordinate(handCode: string): HandCoordinate | null {
  return getCanonicalHandCoordinate(handCode);
}

export function handDistance(a: HandCoordinate, b: HandCoordinate): number {
  return getCanonicalHandDistance(a, b);
}

export function getMarginalFoldActions(
  actions: RangeChartAction[]
): RangeChartAction[] {
  const continueCoordinates = actions
    .filter(action => action.primaryAction !== "FOLD")
    .map(action => getHandCoordinate(action.handCode))
    .filter((coordinate): coordinate is HandCoordinate => coordinate !== null);

  if (continueCoordinates.length === 0) return [];

  return actions.filter(action => {
    if (action.primaryAction !== "FOLD") return false;

    const foldCoordinate = getHandCoordinate(action.handCode);
    if (!foldCoordinate) return false;

    return continueCoordinates.some(
      continueCoordinate =>
        handDistance(foldCoordinate, continueCoordinate) <=
        MARGINAL_FOLD_DISTANCE
    );
  });
}

export function buildTrainerActionPool(
  actions: RangeChartAction[]
): RangeChartAction[] {
  const continueActions = actions.filter(action => action.primaryAction !== "FOLD");
  const marginalFolds = getMarginalFoldActions(actions);

  if (continueActions.length === 0) return marginalFolds;
  if (marginalFolds.length === 0) return continueActions;

  return [...continueActions, ...marginalFolds].sort((a, b) =>
    compareHandCode(a.handCode, b.handCode)
  );
}

function pickActionBucket(byAction: Map<Action, RangeChartAction[]>): Action {
  const foldRows = byAction.get("FOLD") ?? [];
  const continueActions = ACTIONS.filter(
    action => action !== "FOLD" && (byAction.get(action)?.length ?? 0) > 0
  );

  if (foldRows.length > 0 && continueActions.length > 0) {
    if (Math.random() < FOLD_SAMPLE_TARGET) return "FOLD";
    return pickWeighted(continueActions, actionBucketWeight);
  }

  const availableActions = ACTIONS.filter(
    action => (byAction.get(action)?.length ?? 0) > 0
  );

  return pickWeighted(availableActions, actionBucketWeight);
}

function pickHandForTrainer(
  chart: RangeChart,
  rows: TrainerSelectionRow[],
  filters: TrainerSpotFilters
): RangeChartAction | null {
  const chartActions = rows
    .filter(row => row.chart.id === chart.id)
    .map(row => row.action)
    .filter(action => action.handCode.length > 0 && isAction(action.primaryAction))
    .sort((a, b) => compareHandCode(a.handCode, b.handCode));

  if (chartActions.length === 0) return null;

  const trainerActionPool = buildTrainerActionPool(chartActions);
  if (trainerActionPool.length === 0) return null;

  const focusedHandCodes = new Set(filters.focusHandCodes ?? []);
  const focusedActions =
    focusedHandCodes.size > 0
      ? trainerActionPool.filter(action => focusedHandCodes.has(action.handCode))
      : [];
  const prioritizedActionPool =
    focusedActions.length > 0 ? focusedActions : trainerActionPool;

  const recentHands = new Set(
    (filters.recentHandKeys ?? []).slice(0, RECENT_HAND_GUARD_LIMIT)
  );
  const repeatSafeActions = prioritizedActionPool.filter(
    action => !recentHands.has(handHistoryKey(chart.id, action.handCode))
  );
  const actionPool =
    repeatSafeActions.length > 0 ? repeatSafeActions : prioritizedActionPool;
  const byAction = groupRowsByAction(actionPool);
  const selectedAction = pickActionBucket(byAction);
  const selectedActionRows = byAction.get(selectedAction) ?? actionPool;

  return randomItem(selectedActionRows);
}

function calcAccuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

function toJsonObject(value: unknown): JsonObject | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return null;
}

function parseJsonObject(raw: string | null): JsonObject | null {
  if (!raw) return null;

  try {
    return toJsonObject(JSON.parse(raw));
  } catch {
    return null;
  }
}

function getNestedString(source: JsonObject | null, path: string[]): string | null {
  let current: unknown = source;

  for (const key of path) {
    const object = toJsonObject(current);
    if (!object) return null;
    current = object[key];
  }

  return typeof current === "string" && current.trim().length > 0
    ? current
    : null;
}

function getNestedNumber(source: JsonObject | null, path: string[]): number | null {
  let current: unknown = source;

  for (const key of path) {
    const object = toJsonObject(current);
    if (!object) return null;
    current = object[key];
  }

  return typeof current === "number" && Number.isFinite(current) ? current : null;
}

function extractStudyMeta(hand: Hand) {
  const streetData = parseJsonObject(hand.streetDataJson);
  const study = toJsonObject(streetData?.meta);
  const nestedStudy = toJsonObject(study?.study);
  const chartId = getNestedNumber(streetData, ["meta", "study", "chartId"]);
  const spotKey = getNestedString(streetData, ["meta", "study", "spotKey"]);
  const stackDepth = getNestedNumber(streetData, ["meta", "study", "stackDepth"]);
  const heroPosition = getNestedString(streetData, ["meta", "study", "heroPosition"]);
  const villainPosition = getNestedString(streetData, ["meta", "study", "villainPosition"]);
  const spotGroup = getNestedString(streetData, ["meta", "study", "spotGroup"]);
  const canonicalSpotId = getNestedString(streetData, ["meta", "study", "canonicalSpotId"]);

  return {
    source: streetData,
    meta: nestedStudy,
    chartId,
    spotKey,
    stackDepth,
    heroPosition,
    villainPosition,
    spotGroup,
    canonicalSpotId,
  };
}

function normalizePosition(value: string | null | undefined): Position | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .toUpperCase()
    .replace("UTG+1", "UTG1")
    .replace("UTG 1", "UTG1")
    .replace("UTG-1", "UTG1");

  return VALID_POSITIONS.has(normalized) ? (normalized as Position) : null;
}

export function normalizeHandCode(value: string | null | undefined): string | null {
  return normalizeCanonicalHandCode(value);
}

function nearestStackDepth(stackDepth: number | null | undefined): number {
  const target = typeof stackDepth === "number" && Number.isFinite(stackDepth)
    ? stackDepth
    : 20;

  return [...STACK_DEPTHS].sort(
    (a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b
  )[0];
}

function extractVillainPosition(hand: Hand): Position | null {
  const streetData = parseJsonObject(hand.streetDataJson);
  const candidates = [
    getNestedString(streetData, ["preflop", "villainPosition"]),
    getNestedString(streetData, ["preflop", "openerPosition"]),
    getNestedString(streetData, ["meta", "villainPosition"]),
    getNestedString(streetData, ["meta", "villain", "position"]),
    getNestedString(streetData, ["villainPosition"]),
    getNestedString(streetData, ["openerPosition"]),
  ];

  for (const candidate of candidates) {
    const position = normalizePosition(candidate);
    if (position) return position;
  }

  return null;
}

function isPreflopMistake(hand: Hand): boolean {
  return hand.mistakeStreet === "PREFLOP" && hand.mistakeSeverity > 0;
}

function inferSpotFromHand(hand: Hand): SpotInference | null {
  const studyMeta = extractStudyMeta(hand);
  if (studyMeta.spotKey) {
    return {
      spotKey: studyMeta.spotKey,
      reason: studyMeta.canonicalSpotId
        ? `Matched from the saved canonical study spot (${studyMeta.canonicalSpotId}).`
        : "Matched from the saved study spot metadata.",
    };
  }

  const heroPosition = normalizePosition(hand.heroPosition);
  if (!heroPosition) return null;

  const villainPosition = extractVillainPosition(hand);

  if (hand.spotType === "BvB") {
    if (heroPosition === "SB") {
      return {
        spotKey: "SB_vs_BB_limp",
        reason: "Matched as a blind-versus-blind small-blind decision.",
      };
    }

    if (heroPosition === "BB") {
      return {
        spotKey: "BB_vs_SB_limp",
        reason: "Matched as a blind-versus-blind big-blind response.",
      };
    }
  }

  if (hand.spotType === "3BET_POT") {
    if (villainPosition) {
      return {
        spotKey: `${heroPosition}_vs_${villainPosition}_3bet`,
        reason: `Matched hero ${heroPosition} facing a ${villainPosition} 3-bet.`,
      };
    }

    if (heroPosition === "CO") {
      return {
        spotKey: "CO_vs_BB_3bet",
        reason: "Matched to the closest cutoff continue-versus-3-bet chart.",
      };
    }

    if (heroPosition === "BTN" && villainPosition === "SB") {
      return {
        spotKey: "BTN_vs_SB_3bet",
        reason: "Matched button versus small-blind 3-bet.",
      };
    }

    if (heroPosition === "BTN") {
      return {
        spotKey: "BTN_vs_BB_3bet",
        reason: "Matched to the closest button continue-versus-3-bet chart.",
      };
    }

    if (heroPosition === "HJ") {
      return {
        spotKey: "HJ_vs_BTN_3bet",
        reason: "Matched to the closest hijack continue-versus-late-position 3-bet chart.",
      };
    }

    if (heroPosition === "MP") {
      return {
        spotKey: "MP_vs_BTN_3bet",
        reason: "Matched to the closest middle-position continue-versus-late-position 3-bet chart.",
      };
    }

    if (heroPosition === "UTG1") {
      return {
        spotKey: "UTG1_vs_CO_3bet",
        reason: "Matched to the closest UTG+1 continue-versus-late-position 3-bet chart.",
      };
    }

    if (heroPosition === "UTG") {
      return {
        spotKey: "UTG_vs_HJ_3bet",
        reason: "Matched to the closest UTG continue-versus-late-position 3-bet chart.",
      };
    }

    if (heroPosition === "SB") {
      return {
        spotKey: "SB_vs_BB_3bet",
        reason: "Matched small blind versus big blind 3-bet.",
      };
    }
  }

  if (hand.spotType === "SINGLE_RAISED_POT" || hand.spotType === null) {
    if (villainPosition) {
      const facingOpenKey = `${heroPosition}_vs_${villainPosition}`;
      return {
        spotKey: facingOpenKey,
        reason: `Matched hero ${heroPosition} versus ${villainPosition} open.`,
      };
    }

    if (heroPosition !== "BB") {
      return {
        spotKey: `${heroPosition}_RFI`,
        reason: `No opener position was logged, so ${heroPosition} RFI is the nearest preflop study spot.`,
      };
    }

    return {
      spotKey: "BB_vs_BTN",
      reason: "No opener position was logged, so BB versus BTN is the nearest common blind-defense spot.",
    };
  }

  if (hand.spotType === "LIMPED_POT" && heroPosition === "BB") {
    return {
      spotKey: "BB_vs_SB_limp",
      reason: "Matched to the big-blind response versus small-blind limp chart.",
    };
  }

  return null;
}

async function findNearestChartBySpotKey(
  spotKey: string,
  targetStackDepth: number
): Promise<{ chart: RangeChart; confidence: "exact" | "nearest" } | null> {
  const db = await requireDb();
  const charts = await db
    .select()
    .from(rangeCharts)
    .where(and(eq(rangeCharts.spotKey, spotKey), eq(rangeCharts.isActive, true)))
    .orderBy(asc(rangeCharts.stackDepth), asc(rangeCharts.title));

  if (charts.length === 0) return null;

  const exact = charts.find(chart => chart.stackDepth === targetStackDepth);
  if (exact) return { chart: exact, confidence: "exact" };

  const [nearest] = [...charts].sort(
    (a, b) =>
      Math.abs(a.stackDepth - targetStackDepth) -
        Math.abs(b.stackDepth - targetStackDepth) ||
      a.stackDepth - b.stackDepth
  );

  return nearest ? { chart: nearest, confidence: "nearest" } : null;
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

  if (filters.chartIds !== undefined) {
    if (filters.chartIds.length === 0) return null;
    conditions.push(inArray(rangeCharts.id, filters.chartIds));
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
        action.handCode.length > 0 && isAction(action.primaryAction)
    )
    .sort((a, b) => compareHandCode(a.action.handCode, b.action.handCode));

  if (trainableRows.length === 0) return null;

  const selectedChart = pickChartForTrainer(trainableRows, filters);
  if (!selectedChart) return null;

  const selectedAction = pickHandForTrainer(
    selectedChart,
    trainableRows,
    filters
  );
  if (!selectedAction) return null;

  const selected = { chart: selectedChart, action: selectedAction };
  const correctAction = selected.action.primaryAction;

  return {
    chartId: selected.chart.id,
    handCode: selected.action.handCode,
    correctAction,
    correctNote: selected.action.note,
    choices: buildTrainerChoices(correctAction),
    chart: mapChartSummary(selected.chart),
  };
}

export async function submitTrainerAttempt(
  userId: number | null,
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

  // Only persist the attempt when a user is authenticated
  if (userId !== null) {
    await logTrainerAttempt({
      userId,
      chartId: input.chartId,
      handCode: input.handCode,
      selectedAction: input.selectedAction,
      correctAction,
      isCorrect,
    });
  }

  return {
    success: true,
    isCorrect,
    correctAction,
    correctNote: row.action.note,
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

export async function getTrainerProgress(
  userId: number
): Promise<StrategyProgressSummary> {
  const db = await requireDb();
  const rows = await db
    .select({
      attempt: trainerAttempts,
      chart: rangeCharts,
    })
    .from(trainerAttempts)
    .innerJoin(rangeCharts, eq(trainerAttempts.chartId, rangeCharts.id))
    .where(eq(trainerAttempts.userId, userId))
    .orderBy(desc(trainerAttempts.createdAt));

  const bySpot = new Map<number, StrategySpotProgress>();
  const byHand = new Map<string, HandStatsAccumulator>();

  for (const { attempt, chart } of rows) {
    const existingSpot = bySpot.get(chart.id);
    const spotProgress: StrategySpotProgress = existingSpot ?? {
      chartId: chart.id,
      chartTitle: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      attempts: 0,
      correct: 0,
      accuracy: 0,
    };

    spotProgress.attempts += 1;
    if (attempt.isCorrect) spotProgress.correct += 1;
    spotProgress.accuracy = calcAccuracy(
      spotProgress.correct,
      spotProgress.attempts
    );
    bySpot.set(chart.id, spotProgress);

    const action = isAction(attempt.correctAction)
      ? attempt.correctAction
      : "FOLD";
    const handKey = `${chart.id}:${attempt.handCode}`;
    const existingHand = byHand.get(handKey);
    const handProgress: HandStatsAccumulator = existingHand ?? {
      chartId: chart.id,
      chartTitle: chart.title,
      handCode: attempt.handCode,
      attempts: 0,
      missed: 0,
      correctAction: action,
    };

    handProgress.attempts += 1;
    handProgress.correctAction = action;
    if (!attempt.isCorrect) handProgress.missed += 1;
    byHand.set(handKey, handProgress);
  }

  const bySpotList = Array.from(bySpot.values()).sort(
    (a, b) =>
      b.attempts - a.attempts ||
      a.stackDepth - b.stackDepth ||
      a.chartTitle.localeCompare(b.chartTitle)
  );

  const weakSpots = Array.from(bySpot.values())
    .filter(spot => spot.attempts > 0)
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.attempts - a.attempts ||
        a.chartTitle.localeCompare(b.chartTitle)
    )
    .slice(0, 6);

  const missedHands: StrategyMissedHand[] = Array.from(byHand.values())
    .filter(hand => hand.missed > 0)
    .sort(
      (a, b) =>
        b.missed - a.missed ||
        b.attempts - a.attempts ||
        compareHandCode(a.handCode, b.handCode)
    )
    .slice(0, 10)
    .map(hand => ({
      chartId: hand.chartId,
      chartTitle: hand.chartTitle,
      handCode: hand.handCode,
      missed: hand.missed,
      attempts: hand.attempts,
      correctAction: hand.correctAction,
    }));

  return { bySpot: bySpotList, weakSpots, missedHands };
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

export async function getHandStrategyRecommendation(
  handId: number
): Promise<StrategyRecommendation | null> {
  const db = await requireDb();
  const [hand] = await db
    .select()
    .from(hands)
    .where(eq(hands.id, handId))
    .limit(1);

  if (!hand || !isPreflopMistake(hand)) return null;

  const studyMeta = extractStudyMeta(hand);
  const inference = inferSpotFromHand(hand);
  if (!inference) return null;

  const targetStackDepth = nearestStackDepth(
    studyMeta.stackDepth ?? hand.effectiveStackBb
  );

  let match:
    | { chart: RangeChart; confidence: "exact" | "nearest" }
    | null = null;

  if (studyMeta.chartId) {
    const [exactChart] = await db
      .select()
      .from(rangeCharts)
      .where(and(eq(rangeCharts.id, studyMeta.chartId), eq(rangeCharts.isActive, true)))
      .limit(1);

    if (exactChart) {
      match = { chart: exactChart, confidence: "exact" };
    }
  }

  if (!match) {
    match = await findNearestChartBySpotKey(inference.spotKey, targetStackDepth);
  }

  if (!match) return null;

  const handCode = normalizeHandCode(hand.heroHand);
  let recommendedAction: Action | null = null;

  if (handCode) {
    const [action] = await db
      .select({
        primaryAction: rangeChartActions.primaryAction,
      })
      .from(rangeChartActions)
      .where(
        and(
          eq(rangeChartActions.chartId, match.chart.id),
          eq(rangeChartActions.handCode, handCode)
        )
      )
      .limit(1);

    recommendedAction = action?.primaryAction ?? null;
  }

  const stackReason =
    match.confidence === "exact"
      ? `${targetStackDepth}bb stack bucket matched.`
      : `Using nearest available ${match.chart.stackDepth}bb chart for a ${targetStackDepth}bb bucket.`;

  return {
    chart: {
      id: match.chart.id,
      title: match.chart.title,
      stackDepth: match.chart.stackDepth,
      spotGroup: match.chart.spotGroup,
      spotKey: match.chart.spotKey,
      heroPosition: match.chart.heroPosition,
      villainPosition: match.chart.villainPosition,
    },
    handCode,
    recommendedAction,
    reason: `${inference.reason} ${stackReason}`,
    confidence: match.confidence,
  };
}
