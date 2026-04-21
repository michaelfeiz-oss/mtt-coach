import { and, asc, desc, eq, type SQL } from "drizzle-orm";
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
  RANKS,
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
const VALID_HANDS = new Set<string>(ALL_HANDS);

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

function rankSortIndex(rank: string): number {
  const index = RANKS.findIndex(candidate => candidate === rank);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function canonicalHandFromRanks(
  firstRank: string,
  secondRank: string,
  suffix?: "s" | "o"
): string | null {
  const first = firstRank.toUpperCase();
  const second = secondRank.toUpperCase();

  if (first === second) {
    const pair = `${first}${second}`;
    return VALID_HANDS.has(pair) ? pair : null;
  }

  const [high, low] =
    rankSortIndex(first) <= rankSortIndex(second)
      ? [first, second]
      : [second, first];
  const handCode = suffix ? `${high}${low}${suffix}` : null;

  return handCode && VALID_HANDS.has(handCode) ? handCode : null;
}

function normalizeHandCode(value: string | null | undefined): string | null {
  if (!value) return null;

  const raw = value.trim();
  const cardMatches = Array.from(raw.matchAll(/([AKQJT98765432])([SHDC])/gi));

  if (cardMatches.length === 2) {
    const firstRank = cardMatches[0][1];
    const firstSuit = cardMatches[0][2].toLowerCase();
    const secondRank = cardMatches[1][1];
    const secondSuit = cardMatches[1][2].toLowerCase();
    const suffix = firstSuit === secondSuit ? "s" : "o";
    return canonicalHandFromRanks(firstRank, secondRank, suffix);
  }

  const compact = raw.replace(/[^AKQJT98765432SO]/gi, "").toUpperCase();

  if (compact.length === 2) {
    return canonicalHandFromRanks(compact[0], compact[1]);
  }

  if (compact.length === 3) {
    const suffix = compact[2] === "S" ? "s" : compact[2] === "O" ? "o" : null;
    return suffix ? canonicalHandFromRanks(compact[0], compact[1], suffix) : null;
  }

  return null;
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

  const inference = inferSpotFromHand(hand);
  if (!inference) return null;

  const targetStackDepth = nearestStackDepth(hand.effectiveStackBb);
  const match = await findNearestChartBySpotKey(
    inference.spotKey,
    targetStackDepth
  );

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
