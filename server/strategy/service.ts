import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { hands, strategyNodeRanges, strategyNodes, strategyTrainerAttempts, type Hand, type InsertStrategyNode, type InsertStrategyNodeRange, type InsertStrategyTrainerAttempt, type StrategyTrainerAttempt } from "../../drizzle/schema";
import { type TrainerAttemptConfidence, type TrainerAttemptSourceStatus } from "../../shared/coachingLoop";
import {
  ACTIONS,
  ACTION_PRIORITY,
  ALL_HANDS,
  POSITIONS,
  RANKS,
  buildSpotKey,
  displayPositionLabel,
  displayVillainGroupLabel,
  formatStrategyNodeTitle,
  type Action,
  type HandAction,
  type Position,
  type RangeChartWithActions,
  type SpotGroup,
  type StrategyMissedHand,
  type StrategyProgressSummary,
  type StrategyRecommendation,
  type StrategySpotProgress,
  type TrainerQuestion,
  type TrainerStats,
  type VillainGroup,
} from "../../shared/preflopStrategy";
import { getStrategySourceStatus, isTrainerAllowedStrategyChart } from "../../shared/sourceTruth";
import { loadStrategyCatalogCharts, getStrategyCatalogChartById, getStrategyCatalogChartBySpot, type StrategyCatalogFilters } from "./catalog";

export interface ListSpotsFilters extends StrategyCatalogFilters {}

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
  villainGroup: string | null;
  sourceLabel: string | null;
}

export interface TrainerQuestionWithChart extends TrainerQuestion {
  chart: ChartSummary;
}

export interface TrainerAttemptResult {
  success: true;
  attemptId: number | null;
  persisted: boolean;
  isCorrect: boolean;
  correctAction: Action;
  correctNote?: string | null;
  canonicalSpotId?: string | null;
  leakFamilyId?: null;
  sourceStatus?: TrainerAttemptSourceStatus | null;
}

const HAND_ORDER = new Map(ALL_HANDS.map((hand, index) => [hand, index]));
const VALID_HAND_CODES = new Set(ALL_HANDS);
const VALID_PRIMARY_ACTIONS = new Set<Action>(ACTIONS);
const TRAINER_ACTION_ORDER: Action[] = [
  "JAM",
  "FOUR_BET",
  "THREE_BET",
  "RAISE",
  "CALL_JAM",
  "CALL",
  "CHECK",
  "LIMP",
  "FOLD",
];
const RECENT_CHART_GUARD_LIMIT = 8;
const RECENT_HAND_GUARD_LIMIT = 20;
const FOLD_SAMPLE_TARGET = 0.32;
const MARGINAL_FOLD_DISTANCE = 2;
const PRE_FLOP_SPOT_TYPES = new Set([
  "RFI",
  "DEFEND_VS_RFI",
  "THREE_BET",
  "FACING_3BET",
  "LIMP_ISO",
  "FOUR_BET_JAM",
  "OTHER_PREFLOP",
  "SINGLE_RAISED_POT",
  "3BET_POT",
  "BVB",
  "LIMPED_POT",
]);

interface HandCoordinate {
  row: number;
  col: number;
}

interface PersistedTrainerAttemptInput {
  userId: number;
  chart: RangeChartWithActions;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  confidence?: TrainerAttemptConfidence | null;
  sessionId?: string | null;
  responseTimeMs?: number | null;
}

interface StudyMeta {
  source: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  canonicalSpotId: string | null;
  chartId: number | null;
  spotKey: string | null;
  stackDepth: number | null;
  heroPosition: string | null;
  villainPosition: string | null;
  villainGroup: VillainGroup | null;
  spotGroup: SpotGroup | null;
}

function compareHandCode(a: string, b: string): number {
  const aIndex = HAND_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
  const bIndex = HAND_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;
  return aIndex - bIndex || a.localeCompare(b);
}

function mapChartSummary(chart: RangeChartWithActions): ChartSummary {
  return {
    id: chart.id,
    title: chart.title,
    stackDepth: chart.stackDepth,
    spotGroup: chart.spotGroup,
    spotKey: chart.spotKey,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition ?? null,
    villainGroup: chart.villainGroup ?? null,
    sourceLabel: chart.sourceLabel ?? null,
  };
}

function buildTrainerChoices(correctAction: Action, chart: RangeChartWithActions) {
  const visibleActions = Array.from(
    new Set(chart.actions.map(action => action.primaryAction))
  );
  const orderedDistractors = TRAINER_ACTION_ORDER.filter(
    action => action !== correctAction && visibleActions.includes(action)
  );
  const fallbackDistractors = TRAINER_ACTION_ORDER.filter(
    action => action !== correctAction && !orderedDistractors.includes(action)
  );

  return [correctAction, ...orderedDistractors, ...fallbackDistractors].slice(0, 4);
}

function handHistoryKey(chartId: number, handCode: string) {
  return `${chartId}:${handCode}`;
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function isAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

export function getHandCoordinate(handCode: string): HandCoordinate | null {
  const normalized = normalizeHandCode(handCode);
  if (!normalized) return null;

  for (let row = 0; row < RANKS.length; row += 1) {
    for (let col = 0; col < RANKS.length; col += 1) {
      const candidate =
        row === col
          ? `${RANKS[row]}${RANKS[col]}`
          : row < col
            ? `${RANKS[row]}${RANKS[col]}s`
            : `${RANKS[col]}${RANKS[row]}o`;
      if (candidate === normalized) {
        return { row, col };
      }
    }
  }

  return null;
}

export function handDistance(a: HandCoordinate, b: HandCoordinate): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}

export function getMarginalFoldActions(
  actions: Array<{ handCode: string; primaryAction: Action; note?: string | null }>
) {
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
      coordinate => handDistance(foldCoordinate, coordinate) <= MARGINAL_FOLD_DISTANCE
    );
  });
}

export function buildTrainerActionPool(
  actions: Array<{ handCode: string; primaryAction: Action; note?: string | null }>
) {
  const continueActions = actions.filter(action => action.primaryAction !== "FOLD");
  const marginalFolds = getMarginalFoldActions(actions);

  if (continueActions.length === 0) return marginalFolds;
  if (marginalFolds.length === 0) return continueActions;

  return [...continueActions, ...marginalFolds].sort((a, b) =>
    compareHandCode(a.handCode, b.handCode)
  );
}

function pickChartForTrainer(
  charts: RangeChartWithActions[],
  filters: TrainerSpotFilters
) {
  if (charts.length === 0) return null;
  if (filters.chartId !== undefined) {
    return charts.find(chart => chart.id === filters.chartId) ?? null;
  }

  const recentIds = new Set(
    (filters.recentChartIds ?? []).slice(0, Math.min(RECENT_CHART_GUARD_LIMIT, charts.length))
  );
  const repeatSafeCharts = charts.filter(chart => !recentIds.has(chart.id));
  const eligible = repeatSafeCharts.length > 0 ? repeatSafeCharts : charts;
  return randomItem(eligible);
}

function pickHandForTrainer(
  chart: RangeChartWithActions,
  filters: TrainerSpotFilters
) {
  const trainerPool = buildTrainerActionPool(chart.actions);
  if (trainerPool.length === 0) return null;

  const focusSet = new Set(filters.focusHandCodes ?? []);
  const focusedPool =
    focusSet.size > 0
      ? trainerPool.filter(action => focusSet.has(action.handCode))
      : [];
  const prioritizedPool = focusedPool.length > 0 ? focusedPool : trainerPool;
  const recentHands = new Set(
    (filters.recentHandKeys ?? []).slice(0, RECENT_HAND_GUARD_LIMIT)
  );
  const repeatSafePool = prioritizedPool.filter(
    action => !recentHands.has(handHistoryKey(chart.id, action.handCode))
  );
  const actionPool = repeatSafePool.length > 0 ? repeatSafePool : prioritizedPool;
  const folds = actionPool.filter(action => action.primaryAction === "FOLD");
  const continues = actionPool.filter(action => action.primaryAction !== "FOLD");

  if (folds.length > 0 && continues.length > 0 && Math.random() < FOLD_SAMPLE_TARGET) {
    return randomItem(folds);
  }

  return randomItem(continues.length > 0 ? continues : actionPool);
}

function calcAccuracy(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function nearestStackDepth(input: number | null | undefined) {
  const target = typeof input === "number" && Number.isFinite(input) ? input : 25;
  return [15, 25, 40, 70].sort(
    (a, b) => Math.abs(a - target) - Math.abs(b - target)
  )[0];
}

function normalizeRank(rank: string) {
  const upper = rank.toUpperCase();
  return RANKS.includes(upper as (typeof RANKS)[number]) ? upper : null;
}

export function normalizeHandCode(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const compact = raw.replace(/[^AKQJT98765432shdcSoO]/gi, "").toUpperCase();
  if (/^[AKQJT98765432]{2}[SO]$/.test(compact)) {
    const first = compact[0];
    const second = compact[1];
    const suffix = compact[2] === "S" ? "s" : "o";
    if (first === second) return `${first}${second}`;
    const firstIndex = RANKS.indexOf(first as (typeof RANKS)[number]);
    const secondIndex = RANKS.indexOf(second as (typeof RANKS)[number]);
    return firstIndex < secondIndex
      ? `${first}${second}${suffix}`
      : `${second}${first}${suffix}`;
  }

  if (/^[AKQJT98765432]{2}$/.test(compact)) {
    return compact[0] === compact[1] ? compact : null;
  }

  const cardPattern = /([AKQJT98765432])([SHDC])/g;
  const cards = Array.from(compact.matchAll(cardPattern));
  if (cards.length !== 2) return null;

  const [firstRankRaw, firstSuit] = [cards[0][1], cards[0][2]];
  const [secondRankRaw, secondSuit] = [cards[1][1], cards[1][2]];
  const firstRank = normalizeRank(firstRankRaw);
  const secondRank = normalizeRank(secondRankRaw);
  if (!firstRank || !secondRank) return null;
  if (firstRank === secondRank) return `${firstRank}${secondRank}`;

  const firstIndex = RANKS.indexOf(firstRank as (typeof RANKS)[number]);
  const secondIndex = RANKS.indexOf(secondRank as (typeof RANKS)[number]);
  const suffix = firstSuit === secondSuit ? "s" : "o";
  return firstIndex < secondIndex
    ? `${firstRank}${secondRank}${suffix}`
    : `${secondRank}${firstRank}${suffix}`;
}

function toJsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getNestedString(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    const object = toJsonObject(current);
    if (!object) return null;
    current = object[key];
  }
  return typeof current === "string" && current.trim().length > 0 ? current : null;
}

function getNestedNumber(source: Record<string, unknown> | null, path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    const object = toJsonObject(current);
    if (!object) return null;
    current = object[key];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : null;
}

export function extractStudyMeta(hand: Hand): StudyMeta {
  const parsed = hand.streetDataJson
    ? (() => {
        try {
          return JSON.parse(hand.streetDataJson) as Record<string, unknown>;
        } catch {
          return null;
        }
      })()
    : null;

  const meta = toJsonObject(parsed?.meta);
  const study = toJsonObject(meta?.study);
  const spotGroup = getNestedString(parsed, ["meta", "study", "spotGroup"]);
  const villainGroup = getNestedString(parsed, ["meta", "study", "villainGroup"]);

  return {
    source: parsed,
    meta: study,
    canonicalSpotId: getNestedString(parsed, ["meta", "study", "canonicalSpotId"]),
    chartId: getNestedNumber(parsed, ["meta", "study", "chartId"]),
    spotKey: getNestedString(parsed, ["meta", "study", "spotKey"]),
    stackDepth: getNestedNumber(parsed, ["meta", "study", "stackDepth"]),
    heroPosition: getNestedString(parsed, ["meta", "study", "heroPosition"]),
    villainPosition: getNestedString(parsed, ["meta", "study", "villainPosition"]),
    villainGroup:
      villainGroup === "early" || villainGroup === "middle" || villainGroup === "late"
        ? villainGroup
        : null,
    spotGroup:
      spotGroup &&
      [
        "rfi",
        "facing_open_early",
        "facing_open_middle",
        "facing_open_late",
        "facing_jam",
        "sb_first_in",
        "bb_vs_sb_open",
        "bb_vs_sb_limp",
      ].includes(spotGroup)
        ? (spotGroup as SpotGroup)
        : null,
  };
}

export function normalizePosition(value: string | null | undefined): Position | null {
  if (!value) return null;

  const normalized = value
    .trim()
    .toUpperCase()
    .replace("UTG+1", "UTG1")
    .replace("UTG 1", "UTG1")
    .replace("UTG+2", "UTG2")
    .replace("UTG 2", "UTG2")
    .replace("LOJACK", "LJ")
    .replace("HIJACK", "HJ")
    .replace("CUTOFF", "CO")
    .replace("BUTTON", "BTN");

  if (normalized === "MP") return "UTG2";
  return POSITIONS.includes(normalized as Position)
    ? (normalized as Position)
    : null;
}

function villainGroupForPosition(position: Position | null): VillainGroup | null {
  if (!position) return null;
  if (position === "UTG" || position === "UTG1" || position === "UTG2") return "early";
  if (position === "LJ" || position === "HJ") return "middle";
  if (position === "CO" || position === "BTN") return "late";
  return null;
}

function inferScenarioFamily(hero: Position | null, villain: Position | null, spotType: string | null) {
  if (spotType === "LIMPED_POT" && hero === "BB" && villain === "SB") {
    return "bb_vs_sb_limp" as const;
  }
  if (hero === "BB" && villain === "SB") {
    return "bb_vs_sb_open" as const;
  }
  if (hero === "SB" && !villain) {
    return "sb_first_in" as const;
  }
  if (!villain && hero && hero !== "BB") {
    return "rfi" as const;
  }
  const group = villainGroupForPosition(villain);
  if (spotType === "FOUR_BET_JAM") return "facing_jam" as const;
  if (group === "early") return "facing_open_early" as const;
  if (group === "middle") return "facing_open_middle" as const;
  if (group === "late") return "facing_open_late" as const;
  return null;
}

export function isPreflopMistake(hand: Hand) {
  return (
    hand.mistakeStreet === "PREFLOP" ||
    (hand.spotType !== null && PRE_FLOP_SPOT_TYPES.has(hand.spotType))
  );
}

export function inferSpotFromHand(hand: Hand): {
  spotKey: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: Position;
  villainPosition: Position | null;
  villainGroup: VillainGroup | null;
  reason: string;
} | null {
  const heroPosition = normalizePosition(hand.heroPosition);
  const villainPosition = normalizePosition(
    hand.openerPosition ?? hand.villainPosition
  );
  const stackDepth = nearestStackDepth(hand.effectiveStackBb ?? hand.actualStackBB);
  const scenarioFamily = inferScenarioFamily(heroPosition, villainPosition, hand.spotType);
  if (!heroPosition || !scenarioFamily) return null;

  const villainGroup =
    villainPosition && scenarioFamily.startsWith("facing_open")
      ? villainGroupForPosition(villainPosition)
      : null;

  const spotKey = buildSpotKey({
    version: "v1",
    stackBucket: stackDepth as 15 | 25 | 40 | 70,
    playerCount: 9,
    scenarioFamily,
    heroPosition,
    villainPosition:
      scenarioFamily === "bb_vs_sb_open" || scenarioFamily === "bb_vs_sb_limp"
        ? "SB"
        : villainPosition,
    villainGroup,
  });

  const contextTarget = villainPosition
    ? displayPositionLabel(villainPosition)
    : villainGroup
      ? `${displayVillainGroupLabel(villainGroup)} open`
      : "first-in";

  return {
    spotKey,
    stackDepth,
    spotGroup: scenarioFamily,
    heroPosition,
    villainPosition,
    villainGroup,
    reason: `${displayPositionLabel(heroPosition)} matched against ${contextTarget}.`,
  };
}

export function mapStrategySourceToAttemptSourceStatus(chart: {
  reviewed?: boolean | null;
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: string | null;
}): TrainerAttemptSourceStatus {
  const sourceStatus = getStrategySourceStatus(chart);
  return sourceStatus === "source_backed" ? "exact_source" : "derived";
}

export function buildTrainerAttemptInsert(
  input: PersistedTrainerAttemptInput
): InsertStrategyTrainerAttempt {
  return {
    userId: input.userId,
    nodeId: input.chart.id,
    stackBucket: input.chart.stackDepth,
    scenarioFamily: input.chart.spotGroup,
    heroPosition: input.chart.heroPosition,
    villainPosition: input.chart.villainPosition ?? null,
    villainGroup: input.chart.villainGroup ?? null,
    handCode: input.handCode,
    selectedAction: input.selectedAction,
    correctAction: input.correctAction,
    isCorrect: input.isCorrect,
    confidence: input.confidence ?? null,
    sessionId: input.sessionId ?? null,
    responseTimeMs:
      typeof input.responseTimeMs === "number" && Number.isFinite(input.responseTimeMs)
        ? Math.max(0, Math.round(input.responseTimeMs))
        : null,
  };
}

export function assertCompleteChartActions(chart: {
  title: string;
  actions: Array<{ handCode: string; primaryAction: Action }>;
}) {
  const seen = new Set<string>();

  for (const action of chart.actions) {
    if (seen.has(action.handCode)) {
      throw new Error(`${chart.title}: duplicate hand ${action.handCode}`);
    }
    seen.add(action.handCode);
    if (!VALID_HAND_CODES.has(action.handCode)) {
      throw new Error(`${chart.title}: invalid hand ${action.handCode}`);
    }
    if (!VALID_PRIMARY_ACTIONS.has(action.primaryAction)) {
      throw new Error(`${chart.title}: invalid action ${action.primaryAction}`);
    }
  }

  const missing = ALL_HANDS.filter(hand => !seen.has(hand));
  if (missing.length > 0) {
    throw new Error(`${chart.title}: missing ${missing.length} hands: ${missing.join(", ")}`);
  }
}

function isCompleteTrainerChart(chart: RangeChartWithActions) {
  try {
    assertCompleteChartActions({
      title: chart.title,
      actions: chart.actions.map(action => ({
        handCode: action.handCode,
        primaryAction: action.primaryAction,
      })),
    });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      throw error;
    }
    console.warn(`[typed strategy] ${chart.title}: ${(error as Error).message}`);
    return false;
  }
}

async function persistTrainerAttempt(
  attempt: InsertStrategyTrainerAttempt
): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(strategyTrainerAttempts).values(attempt);
  return result.insertId;
}

function filterChartsByIds(charts: RangeChartWithActions[], filters: TrainerSpotFilters) {
  if (filters.chartId !== undefined) {
    return charts.filter(chart => chart.id === filters.chartId);
  }
  if (filters.chartIds && filters.chartIds.length > 0) {
    const set = new Set(filters.chartIds);
    return charts.filter(chart => set.has(chart.id));
  }
  return charts;
}

export async function listAvailableSpots(filters: ListSpotsFilters = {}) {
  const charts = await loadStrategyCatalogCharts(filters);
  return charts.map(mapChartSummary);
}

export async function listTrainerAvailableSpots(filters: ListSpotsFilters = {}) {
  const charts = await loadStrategyCatalogCharts(filters);
  return charts
    .filter(chart => isTrainerAllowedStrategyChart(chart))
    .filter(isCompleteTrainerChart)
    .map(mapChartSummary);
}

export async function getChartWithActions(
  chartId: number
): Promise<RangeChartWithActions | null> {
  return getStrategyCatalogChartById(chartId);
}

export async function getChartsBySpot(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
) {
  const charts = await loadStrategyCatalogCharts({ stackDepth, spotGroup });
  return charts.filter(chart => chart.spotKey === spotKey).map(mapChartSummary);
}

export async function getChartBySpotSelector(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
) {
  return getStrategyCatalogChartBySpot(stackDepth, spotGroup, spotKey);
}

export async function getTrainerSpot(
  filters: TrainerSpotFilters = {}
): Promise<TrainerQuestionWithChart | null> {
  const charts = filterChartsByIds(
    await loadStrategyCatalogCharts(filters),
    filters
  )
    .filter(chart => isTrainerAllowedStrategyChart(chart))
    .filter(isCompleteTrainerChart);

  if (charts.length === 0) return null;

  const selectedChart = pickChartForTrainer(charts, filters);
  if (!selectedChart) return null;
  const selectedAction = pickHandForTrainer(selectedChart, filters);
  if (!selectedAction) return null;

  return {
    chartId: selectedChart.id,
    handCode: selectedAction.handCode,
    correctAction: selectedAction.primaryAction,
    correctNote: selectedAction.note ?? null,
    choices: buildTrainerChoices(selectedAction.primaryAction, selectedChart),
    chart: mapChartSummary(selectedChart),
  };
}

export async function submitTrainerAttempt(
  userId: number | null,
  input: {
    chartId: number;
    handCode: string;
    selectedAction: Action;
    confidence?: TrainerAttemptConfidence | null;
    sessionId?: string | null;
    responseTimeMs?: number | null;
  }
): Promise<TrainerAttemptResult | null> {
  const chart = await getStrategyCatalogChartById(input.chartId);
  if (!chart) return null;
  if (!isTrainerAllowedStrategyChart(chart) || !isCompleteTrainerChart(chart)) {
    return null;
  }

  const action = chart.actions.find(candidate => candidate.handCode === input.handCode);
  if (!action) return null;

  const isCorrect = action.primaryAction === input.selectedAction;
  const attemptId =
    userId !== null
      ? await persistTrainerAttempt(
          buildTrainerAttemptInsert({
            userId,
            chart,
            handCode: input.handCode,
            selectedAction: input.selectedAction,
            correctAction: action.primaryAction,
            isCorrect,
            confidence: input.confidence,
            sessionId: input.sessionId,
            responseTimeMs: input.responseTimeMs,
          })
        )
      : null;

  return {
    success: true,
    attemptId,
    persisted: attemptId !== null,
    isCorrect,
    correctAction: action.primaryAction,
    correctNote: action.note ?? null,
    canonicalSpotId: chart.spotKey,
    leakFamilyId: null,
    sourceStatus: mapStrategySourceToAttemptSourceStatus(chart),
  };
}

export async function updateTrainerAttemptConfidence(
  userId: number,
  attemptId: number,
  confidence: TrainerAttemptConfidence
) {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(strategyTrainerAttempts)
    .set({ confidence })
    .where(
      and(
        eq(strategyTrainerAttempts.id, attemptId),
        eq(strategyTrainerAttempts.userId, userId)
      )
    );

  const [row] = await db
    .select({ id: strategyTrainerAttempts.id })
    .from(strategyTrainerAttempts)
    .where(
      and(
        eq(strategyTrainerAttempts.id, attemptId),
        eq(strategyTrainerAttempts.userId, userId)
      )
    )
    .limit(1);

  return Boolean(row);
}

async function loadTrainerAttemptsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      attempt: strategyTrainerAttempts,
      node: strategyNodes,
    })
    .from(strategyTrainerAttempts)
    .innerJoin(strategyNodes, eq(strategyTrainerAttempts.nodeId, strategyNodes.id))
    .where(eq(strategyTrainerAttempts.userId, userId))
    .orderBy(desc(strategyTrainerAttempts.createdAt));

  return rows;
}

function createEmptyActionStats(): TrainerStats["byAction"] {
  return ACTIONS.reduce<TrainerStats["byAction"]>((accumulator, action) => {
    accumulator[action] = { total: 0, correct: 0 };
    return accumulator;
  }, {} as TrainerStats["byAction"]);
}

export async function getTrainerStats(userId: number): Promise<TrainerStats> {
  const rows = await loadTrainerAttemptsForUser(userId);
  const total = rows.length;
  const correct = rows.filter(row => row.attempt.isCorrect).length;
  const byAction = createEmptyActionStats();

  for (const row of rows) {
    if (!isAction(row.attempt.correctAction)) continue;
    byAction[row.attempt.correctAction].total += 1;
    if (row.attempt.isCorrect) {
      byAction[row.attempt.correctAction].correct += 1;
    }
  }

  return {
    total,
    correct,
    accuracy: calcAccuracy(correct, total),
    byAction,
  };
}

export async function getRecentAttempts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(strategyTrainerAttempts)
    .where(eq(strategyTrainerAttempts.userId, userId))
    .orderBy(desc(strategyTrainerAttempts.createdAt))
    .limit(limit);
}

export async function getTrainerProgress(
  userId: number
): Promise<StrategyProgressSummary> {
  const rows = await loadTrainerAttemptsForUser(userId);
  const bySpot = new Map<number, StrategySpotProgress>();
  const byHand = new Map<string, StrategyMissedHand>();

  for (const row of rows) {
    const existingSpot = bySpot.get(row.node.id) ?? {
      chartId: row.node.id,
      chartTitle: row.node.title,
      stackDepth: row.node.stackBucket as 15 | 25 | 40 | 70,
      spotGroup: row.node.scenarioFamily as SpotGroup,
      spotKey: row.node.spotKey,
      attempts: 0,
      correct: 0,
      accuracy: 0,
    };
    existingSpot.attempts += 1;
    if (row.attempt.isCorrect) existingSpot.correct += 1;
    existingSpot.accuracy = calcAccuracy(existingSpot.correct, existingSpot.attempts);
    bySpot.set(row.node.id, existingSpot);

    const handKey = `${row.node.id}:${row.attempt.handCode}`;
    const existingHand = byHand.get(handKey) ?? {
      chartId: row.node.id,
      chartTitle: row.node.title,
      handCode: row.attempt.handCode,
      missed: 0,
      attempts: 0,
      correctAction: isAction(row.attempt.correctAction)
        ? row.attempt.correctAction
        : "FOLD",
    };
    existingHand.attempts += 1;
    if (!row.attempt.isCorrect) existingHand.missed += 1;
    byHand.set(handKey, existingHand);
  }

  const bySpotList = Array.from(bySpot.values()).sort(
    (a, b) =>
      b.attempts - a.attempts ||
      a.stackDepth - b.stackDepth ||
      a.chartTitle.localeCompare(b.chartTitle)
  );
  const weakSpots = [...bySpotList]
    .sort(
      (a, b) =>
        a.accuracy - b.accuracy ||
        b.attempts - a.attempts ||
        a.chartTitle.localeCompare(b.chartTitle)
    )
    .slice(0, 6);
  const missedHands = Array.from(byHand.values())
    .filter(hand => hand.missed > 0)
    .sort(
      (a, b) =>
        b.missed - a.missed ||
        b.attempts - a.attempts ||
        compareHandCode(a.handCode, b.handCode)
    )
    .slice(0, 10);

  return { bySpot: bySpotList, weakSpots, missedHands };
}

export async function createChart(data: {
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: VillainGroup | null;
  sourceLabel?: string | null;
  notesJson?: string | null;
  isActive?: boolean;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(strategyNodes).values({
    version: "test",
    stackBucket: data.stackDepth,
    playerCount: 9,
    scenarioFamily: data.spotGroup,
    heroPosition: data.heroPosition,
    villainPosition: data.villainPosition ?? null,
    villainGroup: data.villainGroup ?? null,
    spotKey: data.spotKey,
    title: data.title,
    sourceLabel: data.sourceLabel ?? (data.isActive === false ? "Inactive" : "Not yet reviewed"),
    notes: data.notesJson ?? null,
    reviewed: false,
    structurallyComplete: false,
    isActive: data.isActive ?? true,
  } satisfies InsertStrategyNode);

  return result.insertId;
}

export async function bulkInsertActions(rows: Array<{
  chartId: number;
  handCode: string;
  primaryAction: Action;
  weightPercent?: number | null;
  note?: string | null;
}>) {
  if (rows.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(strategyNodeRanges).values(
    rows.map(row => ({
      nodeId: row.chartId,
      action: row.primaryAction,
      rangeNotation: row.handCode,
      priority: ACTION_PRIORITY[row.primaryAction],
      notes: row.note ?? null,
      reviewed: false,
    } satisfies InsertStrategyNodeRange))
  );
}

export async function getHandStrategyRecommendation(
  handId: number
): Promise<StrategyRecommendation | null> {
  const db = await getDb();
  if (!db) return null;

  const [hand] = await db.select().from(hands).where(eq(hands.id, handId)).limit(1);
  if (!hand || !isPreflopMistake(hand)) return null;

  const inferred = inferSpotFromHand(hand);
  if (!inferred) return null;

  const chart =
    (await getStrategyCatalogChartBySpot(
      inferred.stackDepth,
      inferred.spotGroup,
      inferred.spotKey
    )) ??
    (await loadStrategyCatalogCharts({
      stackDepth: inferred.stackDepth,
      spotGroup: inferred.spotGroup,
      heroPosition: inferred.heroPosition,
      villainPosition: inferred.villainPosition ?? undefined,
    })).find(candidate => candidate.villainGroup === inferred.villainGroup) ??
    null;

  if (!chart) {
    return null;
  }

  const handCode = normalizeHandCode(hand.heroHand);
  const recommendedAction =
    handCode && chart.reviewed
      ? chart.actions.find(action => action.handCode === handCode)?.primaryAction ?? null
      : null;

  return {
    chart: {
      id: chart.id,
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition ?? null,
    },
    handCode,
    recommendedAction,
    reason: chart.reviewed
      ? inferred.reason
      : `${inferred.reason} This node exists but is not yet reviewed, so no action is shown as truth.`,
    confidence: "exact",
  };
}
