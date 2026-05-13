import { desc, eq } from "drizzle-orm";
import {
  handLeaks,
  hands,
  leaks,
  rangeCharts,
  trainerAttempts,
  type Hand,
  type RangeChart,
} from "../drizzle/schema";
import { getDb } from "./db";
import {
  buildReviewQueueHref,
  mapStackToStudyReferenceBucket,
  type HandTrainingSuggestion,
  type ReviewQueueSummary,
  type TodayTrainingSuggestion,
  type TrainerAttemptConfidence,
  type WeakSpotSummary,
} from "../shared/coachingLoop";
import {
  getPriorityDrillPack,
  getRelatedPriorityDrillPacksForSpot,
  resolvePriorityDrillPack,
  type DrillPackSpotLike,
} from "../shared/drillPacks";
import {
  findLeakFamilyByLabel,
  getLeakFamily,
  suggestLeakFamilyFromHandLog,
  type CanonicalLeakFamilyId,
} from "../shared/leakFamilies";
import {
  buildCanonicalSpotLabel,
  canonicalSpotContextFromChart,
  getCanonicalSpotId,
  inferCanonicalSpotContextFromLog,
  type CanonicalSpotContext,
} from "../shared/spotIds";
import {
  CANONICAL_SPOT_FAMILY_LABELS,
  normalizeStudyStage,
  type CanonicalSpotFamily,
} from "../shared/preflopTaxonomy";
import { displayPositionLabel, type Position } from "../shared/strategy";
import {
  extractStudyMeta,
  getHandStrategyRecommendation,
  inferSpotFromHand,
  isPreflopMistake,
  listTrainerAvailableSpots,
  normalizeHandCode,
  normalizePosition,
} from "./strategy/service";
import {
  getStrategyChartTrustMetadata,
  isTrainerAllowedStrategyChart,
} from "../shared/sourceTruth";

const RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;
const STALE_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

interface AggregatedTrainerAttempt {
  id: number;
  chartId: number;
  chartTitle: string;
  canonicalSpotId: string | null;
  spotFamily: CanonicalSpotFamily | null;
  sourceStatus: string | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  handCode: string;
  selectedAction: string;
  correctAction: string;
  isCorrect: boolean;
  confidence: TrainerAttemptConfidence | null;
  drillPackId: string | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  createdAt: Date;
}

interface AggregatedHandReview {
  handId: number;
  canonicalSpotId: string | null;
  label: string | null;
  spotFamily: CanonicalSpotFamily | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  handCode: string | null;
  mistakeSeverity: number;
  reviewed: boolean;
  createdAt: Date;
  leakFamilyIds: CanonicalLeakFamilyId[];
  suggestedChartId: number | null;
  suggestedChartTitle: string | null;
}

interface WeakSpotAccumulator {
  id: string;
  label: string;
  canonicalSpotId: string | null;
  spotFamily: CanonicalSpotFamily | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  attempts: number;
  misses: number;
  guessedCorrectCount: number;
  recentMissCount: number;
  handLogSeverityBoost: number;
  knownItWrongCount: number;
  pendingReviewCount: number;
  lastSeenAt: Date;
  suggestedDrillPackId: string | null;
  suggestedChartId: number | null;
  suggestedAction: string | null;
}

function getNowTime(now: Date) {
  return now.getTime();
}

function toIsoDate(value: Date) {
  return value.toISOString();
}

function isRecent(date: Date, now: Date) {
  return getNowTime(now) - date.getTime() <= RECENT_WINDOW_MS;
}

function isStale(date: Date, now: Date) {
  return getNowTime(now) - date.getTime() > STALE_WINDOW_MS;
}

function roundAccuracy(correct: number, attempts: number) {
  return attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
}

function buildWeakSpotLabel(input: {
  chartTitle?: string | null;
  spotFamily: CanonicalSpotFamily | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  canonicalSpotId?: string | null;
}) {
  if (input.chartTitle) return input.chartTitle;

  const leakFamily = getLeakFamily(input.leakFamilyId);
  if (leakFamily) return leakFamily.label;

  if (
    input.spotFamily &&
    input.stackBb !== null &&
    input.heroPosition !== null
  ) {
    const context: CanonicalSpotContext = {
      family: input.spotFamily,
      stackDepth: input.stackBb,
      heroPosition: input.heroPosition,
      villainPosition: input.villainPosition,
    };
    return buildCanonicalSpotLabel(context)
      .replace(" · ", " @ ")
      .replace("RFI / Open @", "RFI @");
  }

  if (input.canonicalSpotId) return input.canonicalSpotId;
  return "Weak spot";
}

function createAccumulator(input: {
  id: string;
  label: string;
  canonicalSpotId: string | null;
  spotFamily: CanonicalSpotFamily | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  createdAt: Date;
  suggestedDrillPackId?: string | null;
  suggestedChartId?: number | null;
  suggestedAction?: string | null;
}): WeakSpotAccumulator {
  return {
    id: input.id,
    label: input.label,
    canonicalSpotId: input.canonicalSpotId,
    spotFamily: input.spotFamily,
    leakFamilyId: input.leakFamilyId,
    stackBb: input.stackBb,
    heroPosition: input.heroPosition,
    villainPosition: input.villainPosition,
    attempts: 0,
    misses: 0,
    guessedCorrectCount: 0,
    recentMissCount: 0,
    handLogSeverityBoost: 0,
    knownItWrongCount: 0,
    pendingReviewCount: 0,
    lastSeenAt: input.createdAt,
    suggestedDrillPackId: input.suggestedDrillPackId ?? null,
    suggestedChartId: input.suggestedChartId ?? null,
    suggestedAction: input.suggestedAction ?? null,
  };
}

function getOrCreateAccumulator(
  map: Map<string, WeakSpotAccumulator>,
  input: Parameters<typeof createAccumulator>[0]
) {
  const existing = map.get(input.id);
  if (existing) return existing;
  const created = createAccumulator(input);
  map.set(input.id, created);
  return created;
}

function chooseSuggestedPackId(
  spot: {
    chartId?: number | null;
    leakFamilyId?: CanonicalLeakFamilyId | null;
    chartLike?: DrillPackSpotLike | null;
  },
  availableSpots: DrillPackSpotLike[]
) {
  const leakPack = spot.leakFamilyId
    ? getPriorityDrillPack(getLeakFamily(spot.leakFamilyId)?.relatedPackIds?.[0])
    : null;
  if (leakPack) {
    const resolvedLeakPack = resolvePriorityDrillPack(leakPack.id, availableSpots);
    if (resolvedLeakPack?.supported) return leakPack.id;
  }

  if (!spot.chartLike) return null;
  return (
    getRelatedPriorityDrillPacksForSpot(spot.chartLike, availableSpots)[0]?.id ??
    null
  );
}

export function aggregateWeakSpots(input: {
  attempts: AggregatedTrainerAttempt[];
  hands: AggregatedHandReview[];
  availableSpots?: DrillPackSpotLike[];
  now?: Date;
}): WeakSpotSummary[] {
  const now = input.now ?? new Date();
  const accumulators = new Map<string, WeakSpotAccumulator>();
  const spotLookup = new Map<number, DrillPackSpotLike>();
  for (const spot of input.availableSpots ?? []) {
    spotLookup.set(spot.id, spot);
  }

  for (const attempt of input.attempts) {
    const id = attempt.canonicalSpotId
      ? `spot:${attempt.canonicalSpotId}`
      : `chart:${attempt.chartId}`;
    const chartLike = spotLookup.get(attempt.chartId) ?? null;
    const accumulator = getOrCreateAccumulator(accumulators, {
      id,
      label: buildWeakSpotLabel({
        chartTitle: attempt.chartTitle,
        spotFamily: attempt.spotFamily,
        stackBb: attempt.stackBb,
        heroPosition: attempt.heroPosition,
        villainPosition: attempt.villainPosition,
        leakFamilyId: attempt.leakFamilyId,
        canonicalSpotId: attempt.canonicalSpotId,
      }),
      canonicalSpotId: attempt.canonicalSpotId,
      spotFamily: attempt.spotFamily,
      leakFamilyId: attempt.leakFamilyId,
      stackBb: attempt.stackBb,
      heroPosition: attempt.heroPosition,
      villainPosition: attempt.villainPosition,
      createdAt: attempt.createdAt,
      suggestedChartId: attempt.chartId,
      suggestedAction: "start_drill",
      suggestedDrillPackId: chooseSuggestedPackId(
        {
          chartId: attempt.chartId,
          leakFamilyId: attempt.leakFamilyId,
          chartLike,
        },
        input.availableSpots ?? []
      ),
    });

    accumulator.attempts += 1;
    if (!attempt.isCorrect) {
      accumulator.misses += 1;
      if (isRecent(attempt.createdAt, now)) {
        accumulator.recentMissCount += 1;
      }
      if (attempt.confidence === "knew_it") {
        accumulator.knownItWrongCount += 1;
      }
    }
    if (attempt.isCorrect && attempt.confidence === "guessed") {
      accumulator.guessedCorrectCount += 1;
    }
    if (attempt.createdAt > accumulator.lastSeenAt) {
      accumulator.lastSeenAt = attempt.createdAt;
    }
    if (!accumulator.leakFamilyId && attempt.leakFamilyId) {
      accumulator.leakFamilyId = attempt.leakFamilyId;
    }
  }

  for (const hand of input.hands) {
    const spotId = hand.canonicalSpotId
      ? `spot:${hand.canonicalSpotId}`
      : hand.suggestedChartId
        ? `chart:${hand.suggestedChartId}`
        : null;

    if (spotId) {
      const chartLike =
        hand.suggestedChartId !== null
          ? spotLookup.get(hand.suggestedChartId) ?? null
          : null;
      const spotAccumulator = getOrCreateAccumulator(accumulators, {
        id: spotId,
        label:
          hand.label ??
          buildWeakSpotLabel({
            chartTitle: hand.suggestedChartTitle,
            spotFamily: hand.spotFamily,
            stackBb: hand.stackBb,
            heroPosition: hand.heroPosition,
            villainPosition: hand.villainPosition,
            leakFamilyId: hand.leakFamilyIds[0] ?? null,
            canonicalSpotId: hand.canonicalSpotId,
          }),
        canonicalSpotId: hand.canonicalSpotId,
        spotFamily: hand.spotFamily,
        leakFamilyId: hand.leakFamilyIds[0] ?? null,
        stackBb: hand.stackBb,
        heroPosition: hand.heroPosition,
        villainPosition: hand.villainPosition,
        createdAt: hand.createdAt,
        suggestedChartId: chartLike ? hand.suggestedChartId : null,
        suggestedAction: "view_chart",
        suggestedDrillPackId: chooseSuggestedPackId(
          {
            chartId: hand.suggestedChartId,
            leakFamilyId: hand.leakFamilyIds[0] ?? null,
            chartLike,
          },
          input.availableSpots ?? []
        ),
      });
      spotAccumulator.handLogSeverityBoost += hand.mistakeSeverity;
      if (!hand.reviewed) {
        spotAccumulator.pendingReviewCount += 1;
      }
      if (hand.createdAt > spotAccumulator.lastSeenAt) {
        spotAccumulator.lastSeenAt = hand.createdAt;
      }
    }

    for (const leakFamilyId of hand.leakFamilyIds) {
      const family = getLeakFamily(leakFamilyId);
      const leakAccumulator = getOrCreateAccumulator(accumulators, {
        id: `leak:${leakFamilyId}`,
        label: family?.label ?? leakFamilyId,
        canonicalSpotId: hand.canonicalSpotId,
        spotFamily: hand.spotFamily,
        leakFamilyId,
        stackBb: hand.stackBb,
        heroPosition: hand.heroPosition,
        villainPosition: hand.villainPosition,
        createdAt: hand.createdAt,
        suggestedDrillPackId: family?.relatedPackIds?.[0] ?? null,
        suggestedChartId: hand.suggestedChartId,
        suggestedAction: "review_hands",  // push_fold_discipline_gaps now routes to ICMIZER, not internal push-fold mode
      });

      leakAccumulator.handLogSeverityBoost += hand.mistakeSeverity;
      if (!hand.reviewed) {
        leakAccumulator.pendingReviewCount += 1;
      }
      if (hand.createdAt > leakAccumulator.lastSeenAt) {
        leakAccumulator.lastSeenAt = hand.createdAt;
      }
    }
  }

  return Array.from(accumulators.values())
    .map(accumulator => {
      const correct = Math.max(0, accumulator.attempts - accumulator.misses);
      const accuracy = roundAccuracy(correct, accumulator.attempts);
      const staleDecay = isStale(accumulator.lastSeenAt, now) ? 1 : 0;
      const severityScore = Math.max(
        0,
        accumulator.misses * 2 +
          accumulator.guessedCorrectCount +
          accumulator.recentMissCount +
          accumulator.handLogSeverityBoost +
          accumulator.pendingReviewCount +
          accumulator.knownItWrongCount * 2 -
          staleDecay
      );

      return {
        id: accumulator.id,
        label: accumulator.label,
        spotFamily: accumulator.spotFamily,
        canonicalSpotId: accumulator.canonicalSpotId,
        leakFamilyId: accumulator.leakFamilyId,
        stackBb: accumulator.stackBb,
        heroPosition: accumulator.heroPosition,
        villainPosition: accumulator.villainPosition,
        attempts: accumulator.attempts,
        misses: accumulator.misses,
        accuracy,
        guessedCorrectCount: accumulator.guessedCorrectCount,
        recentMissCount: accumulator.recentMissCount,
        severityScore,
        lastSeenAt: toIsoDate(accumulator.lastSeenAt),
        suggestedDrillPackId: accumulator.suggestedDrillPackId,
        suggestedChartId: accumulator.suggestedChartId,
        suggestedAction: accumulator.suggestedAction,
      } satisfies WeakSpotSummary;
    })
    .filter(
      spot =>
        spot.severityScore > 0 ||
        spot.misses > 0 ||
        spot.attempts > 0
    )
    .sort(
      (left, right) =>
        right.severityScore - left.severityScore ||
        left.accuracy - right.accuracy ||
        right.misses - left.misses ||
        right.attempts - left.attempts ||
        left.label.localeCompare(right.label)
    );
}

function buildWeakSpotReason(spot: WeakSpotSummary) {
  const parts: string[] = [];
  if (spot.recentMissCount > 0) {
    parts.push(
      `${spot.recentMissCount} recent miss${spot.recentMissCount === 1 ? "" : "es"}`
    );
  }
  if (spot.attempts > 0) {
    parts.push(`${spot.accuracy}% accuracy`);
  }
  if (spot.guessedCorrectCount > 0) {
    parts.push(
      `${spot.guessedCorrectCount} guessed correct${spot.guessedCorrectCount === 1 ? "" : "s"}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "Needs attention";
}

export function buildTodayTrainingSuggestions(input: {
  weakSpots: WeakSpotSummary[];
  reviewQueue: ReviewQueueSummary;
}): TodayTrainingSuggestion[] {
  const { weakSpots, reviewQueue } = input;

  if (weakSpots.length === 0 && reviewQueue.totalNeedsReview === 0) {
    return [
      {
        id: "starter-rfi",
        title: "10 reps: Open raises",
        reason: "Warm up with source-backed RFI charts before branching out.",
        type: "exact_chart",
        targetRoute: "/strategy/trainer",
        estimatedReps: 10,
        priority: 3,
      },
      {
        id: "starter-bb-defense",
        title: "10 reps: BB defense",
        reason: "Build routine reps against common late-position pressure.",
        type: "exact_chart",
        targetRoute: "/strategy/trainer",
        estimatedReps: 10,
        priority: 2,
      },
      {
        id: "starter-log-hand",
        title: "Log one hand",
        reason: "Capture one real preflop spot so review and coaching can start.",
        type: "review_hands",
        targetRoute: "/log",
        estimatedReps: null,
        priority: 1,
      },
    ];
  }

  const suggestions: TodayTrainingSuggestion[] = [];
  const usedTargets = new Set<string>();

  const topSpot = weakSpots.find(
    spot => spot.suggestedChartId !== null || spot.suggestedDrillPackId !== null
  );

  if (topSpot) {
    const pack = topSpot.suggestedDrillPackId
      ? getPriorityDrillPack(topSpot.suggestedDrillPackId)
      : null;
    const isPushFold =
      topSpot.leakFamilyId === "push_fold_discipline_gaps" ||
      (topSpot.stackBb ?? 99) <= 10;

    // Push/fold spots are flagged for ICMIZER external review, not internal trainer
    if (isPushFold) {
      suggestions.push({
        id: `top-${topSpot.id}`,
        title: "Short-stack spot — use ICMIZER",
        reason: "This spot is ≤10bb. Review the exact push/call-off range in ICMIZER for the correct Nash threshold.",
        type: "icmizer_review" as const,
        targetRoute: "/icmizer-reference",
        estimatedReps: 0,
        priority: 4 + topSpot.severityScore,
      });
      usedTargets.add("/icmizer-reference");
    } else {
      const route = pack
        ? `/strategy/trainer?packId=${pack.id}`
        : topSpot.suggestedChartId !== null
          ? `/strategy/trainer?chartId=${topSpot.suggestedChartId}`
          : null;

      if (route) {
        suggestions.push({
          id: `top-${topSpot.id}`,
          title: pack ? pack.title : `Drill ${topSpot.label}`,
          reason: buildWeakSpotReason(topSpot),
          type: pack ? "drill_pack" : "exact_chart",
          targetRoute: route,
          estimatedReps: pack ? 12 : 10,
          priority: 4 + topSpot.severityScore,
        });
        usedTargets.add(route);
      }
    }
  }

  if (reviewQueue.totalNeedsReview > 0) {
    const reviewRoute = buildReviewQueueHref({
      leakFamilyId: reviewQueue.topLeakFamilyId,
      reviewStatus: "needs_review",
    });

    suggestions.push({
      id: "review-queue",
      title: `Review ${reviewQueue.totalNeedsReview} Needs Review hand${
        reviewQueue.totalNeedsReview === 1 ? "" : "s"
      }`,
      reason: reviewQueue.topLeakLabel
        ? `Tagged ${reviewQueue.topLeakLabel}`
        : reviewQueue.highSeverityCount > 0
          ? `${reviewQueue.highSeverityCount} high-severity hand${
              reviewQueue.highSeverityCount === 1 ? "" : "s"
            } waiting`
          : "Keep logged hands moving through review.",
      type: "review_hands",
      targetRoute: reviewRoute,
      estimatedReps: null,
      priority: 3 + reviewQueue.totalNeedsReview,
    });
    usedTargets.add(reviewRoute);
  }

  const nextSpot = weakSpots.find(spot => {
    const pack = spot.suggestedDrillPackId
      ? getPriorityDrillPack(spot.suggestedDrillPackId)
      : null;
    const route = pack
      ? `/strategy/trainer?packId=${pack.id}`
      : spot.suggestedChartId !== null
        ? `/strategy/trainer?chartId=${spot.suggestedChartId}`
        : null;
    return route !== null && !usedTargets.has(route);
  });

  if (nextSpot) {
    const pack = nextSpot.suggestedDrillPackId
      ? getPriorityDrillPack(nextSpot.suggestedDrillPackId)
      : null;
    const route = pack
      ? `/strategy/trainer?packId=${pack.id}`
      : `/strategy/trainer?chartId=${nextSpot.suggestedChartId}`;

    suggestions.push({
      id: `secondary-${nextSpot.id}`,
      title: pack ? pack.title : `Study ${nextSpot.label}`,
      reason: buildWeakSpotReason(nextSpot),
      type: pack ? "drill_pack" : "study_chart",
      targetRoute: route,
      estimatedReps: pack ? 10 : 8,
      priority: 2 + nextSpot.severityScore,
    });
  }

  return suggestions.sort((left, right) => right.priority - left.priority).slice(0, 3);
}

function collectHandLeakFamilyIds(input: {
  leakNames: string[];
  inferredFamilyId: CanonicalLeakFamilyId | null;
}) {
  const resolved = input.leakNames
    .map(name => findLeakFamilyByLabel(name)?.id ?? null)
    .filter((familyId): familyId is CanonicalLeakFamilyId => Boolean(familyId));

  if (resolved.length > 0) {
    return Array.from(new Set(resolved));
  }

  return input.inferredFamilyId ? [input.inferredFamilyId] : [];
}

function buildHandReviewEntry(input: {
  hand: Hand;
  leakNames: string[];
  recommendation: Awaited<ReturnType<typeof getHandStrategyRecommendation>>;
}): AggregatedHandReview | null {
  if (!isPreflopMistake(input.hand)) return null;

  const studyMeta = extractStudyMeta(input.hand);
  const inferredContext =
    input.hand.spotType && input.hand.heroPosition
      ? inferCanonicalSpotContextFromLog({
          scenarioId:
            input.hand.spotType === "3BET_POT"
              ? "FACING_THREE_BET"
              : input.hand.spotType === "BVB"
                ? "BLIND_VS_BLIND"
                : "DEFEND_VS_RFI",
          effectiveStackBb: input.hand.effectiveStackBb,
          heroPosition: input.hand.heroPosition,
          openerPosition: studyMeta.villainPosition,
          tournamentPhase: normalizeStudyStage(
            studyMeta.meta?.stage as string | undefined
          ),
        })
      : null;

  const inferredFamilyId =
    inferredContext && input.hand.heroHand
      ? suggestLeakFamilyFromHandLog({
          context: inferredContext,
          handCode: normalizeHandCode(input.hand.heroHand) ?? input.hand.heroHand,
        })
      : null;

  const leakFamilyIds = collectHandLeakFamilyIds({
    leakNames: input.leakNames,
    inferredFamilyId,
  });

  const canonicalSpotId =
    studyMeta.canonicalSpotId ??
    (input.recommendation?.chart
      ? getCanonicalSpotId(
          canonicalSpotContextFromChart(input.recommendation.chart)!
        )
      : null);
  const chartContext = input.recommendation?.chart
    ? canonicalSpotContextFromChart(input.recommendation.chart)
    : inferredContext;

  return {
    handId: input.hand.id,
    canonicalSpotId,
    label: input.recommendation?.chart?.title ?? null,
    spotFamily: chartContext?.family ?? null,
    stackBb: chartContext?.stackDepth ?? mapStackToStudyReferenceBucket(input.hand.effectiveStackBb),
    heroPosition:
      chartContext?.heroPosition ?? normalizePosition(input.hand.heroPosition),
    villainPosition: chartContext?.villainPosition ?? null,
    handCode: normalizeHandCode(input.hand.heroHand),
    mistakeSeverity: input.hand.mistakeSeverity,
    reviewed: input.hand.reviewed,
    createdAt: input.hand.createdAt,
    leakFamilyIds,
    suggestedChartId: input.recommendation?.chart.id ?? null,
    suggestedChartTitle: input.recommendation?.chart.title ?? null,
  };
}

function buildReviewQueueSummaryFromHands(
  entries: AggregatedHandReview[]
): ReviewQueueSummary {
  const needsReview = entries.filter(entry => !entry.reviewed);
  const familyCounts = new Map<CanonicalLeakFamilyId, number>();

  for (const entry of needsReview) {
    for (const familyId of entry.leakFamilyIds) {
      familyCounts.set(familyId, (familyCounts.get(familyId) ?? 0) + 1);
    }
  }

  const topFamily = Array.from(familyCounts.entries()).sort(
    (left, right) => right[1] - left[1]
  )[0]?.[0] ?? null;

  return {
    totalNeedsReview: needsReview.length,
    highSeverityCount: needsReview.filter(entry => entry.mistakeSeverity >= 2)
      .length,
    topLeakFamilyId: topFamily,
    topLeakLabel: topFamily ? getLeakFamily(topFamily)?.label ?? null : null,
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function getWeakSpotSummary(
  userId: number,
  limit = 6
): Promise<WeakSpotSummary[]> {
  const db = await requireDb();
  const [attemptRows, handRows, availableSpots] = await Promise.all([
    db
      .select({
        attempt: trainerAttempts,
        chart: rangeCharts,
      })
      .from(trainerAttempts)
      .innerJoin(rangeCharts, eq(trainerAttempts.chartId, rangeCharts.id))
      .where(eq(trainerAttempts.userId, userId))
      .orderBy(desc(trainerAttempts.createdAt)),
    db
      .select({
        hand: hands,
        leakName: leaks.name,
      })
      .from(hands)
      .leftJoin(handLeaks, eq(handLeaks.handId, hands.id))
      .leftJoin(leaks, eq(handLeaks.leakId, leaks.id))
      .where(eq(hands.userId, userId))
      .orderBy(desc(hands.createdAt)),
    listTrainerAvailableSpots({}),
  ]);

  const attempts: AggregatedTrainerAttempt[] = attemptRows.map(row => ({
    id: row.attempt.id,
    chartId: row.attempt.chartId,
    chartTitle: row.chart.title,
    canonicalSpotId: row.attempt.canonicalSpotId,
    spotFamily: row.attempt.spotFamily as CanonicalSpotFamily,
    sourceStatus: row.attempt.sourceStatus,
    stackBb: row.attempt.stackBb,
    heroPosition: normalizePosition(row.attempt.heroPosition),
    villainPosition: normalizePosition(row.attempt.villainPosition),
    handCode: row.attempt.handCode,
    selectedAction: row.attempt.selectedAction,
    correctAction: row.attempt.correctAction,
    isCorrect: row.attempt.isCorrect,
    confidence: row.attempt.confidence as TrainerAttemptConfidence | null,
    drillPackId: row.attempt.drillPackId,
    leakFamilyId:
      (row.attempt.leakFamilyId as CanonicalLeakFamilyId | null) ?? null,
    createdAt: row.attempt.createdAt,
  }));

  const groupedHands = new Map<
    number,
    { hand: Hand; leakNames: string[] }
  >();
  for (const row of handRows) {
    const existing = groupedHands.get(row.hand.id);
    if (existing) {
      if (row.leakName) existing.leakNames.push(row.leakName);
      continue;
    }
    groupedHands.set(row.hand.id, {
      hand: row.hand,
      leakNames: row.leakName ? [row.leakName] : [],
    });
  }

  const handEntries: AggregatedHandReview[] = [];
  for (const grouped of Array.from(groupedHands.values())) {
    const recommendation = await getHandStrategyRecommendation(grouped.hand.id);
    const entry = buildHandReviewEntry({
      hand: grouped.hand,
      leakNames: grouped.leakNames,
      recommendation,
    });
    if (entry) handEntries.push(entry);
  }

  return aggregateWeakSpots({
    attempts,
    hands: handEntries,
    availableSpots,
  }).slice(0, limit);
}

export async function getReviewQueueSummary(
  userId: number
): Promise<ReviewQueueSummary> {
  const db = await requireDb();
  const rows = await db
    .select({
      hand: hands,
      leakName: leaks.name,
    })
    .from(hands)
    .leftJoin(handLeaks, eq(handLeaks.handId, hands.id))
    .leftJoin(leaks, eq(handLeaks.leakId, leaks.id))
    .where(eq(hands.userId, userId))
    .orderBy(desc(hands.createdAt));

  const grouped = new Map<number, { hand: Hand; leakNames: string[] }>();
  for (const row of rows) {
    const existing = grouped.get(row.hand.id);
    if (existing) {
      if (row.leakName) existing.leakNames.push(row.leakName);
      continue;
    }
    grouped.set(row.hand.id, {
      hand: row.hand,
      leakNames: row.leakName ? [row.leakName] : [],
    });
  }

  const handEntries: AggregatedHandReview[] = [];
  for (const item of Array.from(grouped.values())) {
    const recommendation = await getHandStrategyRecommendation(item.hand.id);
    const entry = buildHandReviewEntry({
      hand: item.hand,
      leakNames: item.leakNames,
      recommendation,
    });
    if (entry) handEntries.push(entry);
  }

  return buildReviewQueueSummaryFromHands(handEntries);
}

export async function getTodayTrainingSuggestions(
  userId: number
): Promise<TodayTrainingSuggestion[]> {
  const [weakSpots, reviewQueue] = await Promise.all([
    getWeakSpotSummary(userId, 8),
    getReviewQueueSummary(userId),
  ]);

  return buildTodayTrainingSuggestions({
    weakSpots,
    reviewQueue,
  });
}

export function buildHandTrainingSuggestionModel(input: {
  handId: number;
  canonicalSpotId: string | null;
  recommendation: Awaited<ReturnType<typeof getHandStrategyRecommendation>>;
  leakFamilyId: CanonicalLeakFamilyId | null;
}): HandTrainingSuggestion {
  const leakFamily = getLeakFamily(input.leakFamilyId);
  const trainerSafeChart =
    input.recommendation && isTrainerAllowedStrategyChart(input.recommendation.chart)
      ? input.recommendation.chart
      : null;
  const fallbackPackId = leakFamily?.relatedPackIds?.[0] ?? null;
  const drillRoute = trainerSafeChart
    ? `/strategy/trainer?chartId=${trainerSafeChart.id}`
    : fallbackPackId
      ? `/strategy/trainer?packId=${fallbackPackId}`
      : null;
  const drillLabel = trainerSafeChart
    ? "Drill this spot"
    : fallbackPackId
      ? `Start ${getPriorityDrillPack(fallbackPackId)?.title ?? "suggested drill"}`
      : null;
  const chartRoute = input.recommendation
    ? `/strategy/library?chartId=${input.recommendation.chart.id}`
    : null;
  const recommendationTrust = input.recommendation
    ? getStrategyChartTrustMetadata(input.recommendation.chart)
    : null;
  const chartReferenceLabel = input.recommendation
    ? recommendationTrust?.sourceStatus === "source_backed"
      ? input.recommendation.confidence === "exact"
        ? "Exact study reference"
        : `Nearest ${input.recommendation.chart.stackDepth}bb study reference`
      : recommendationTrust?.sourceStatus === "imported_unreviewed"
        ? "Imported study candidate"
        : `Nearest ${input.recommendation.chart.stackDepth}bb study reference`
    : null;

  return {
    handId: input.handId,
    canonicalSpotId: input.canonicalSpotId,
    drillRoute,
    drillLabel,
    chartRoute,
    chartLabel: input.recommendation?.chart.title ?? null,
    chartReferenceLabel,
    leakFamilyId: input.leakFamilyId,
    leakFamilyLabel: leakFamily?.label ?? null,
    leakReason: leakFamily
      ? `Mark this hand under ${leakFamily.label}.`
      : null,
  };
}

export async function getHandTrainingSuggestion(
  userId: number,
  handId: number
): Promise<HandTrainingSuggestion | null> {
  const db = await requireDb();
  const [hand] = await db
    .select()
    .from(hands)
    .where(eq(hands.id, handId))
    .limit(1);

  if (!hand || hand.userId !== userId) return null;

  const recommendation = await getHandStrategyRecommendation(handId);
  const handLeaksRows = await db
    .select({ name: leaks.name })
    .from(handLeaks)
    .innerJoin(leaks, eq(handLeaks.leakId, leaks.id))
    .where(eq(handLeaks.handId, handId));
  const linkedFamily =
    handLeaksRows
      .map(row => findLeakFamilyByLabel(row.name)?.id ?? null)
      .filter((familyId): familyId is CanonicalLeakFamilyId => Boolean(familyId))[0] ??
    null;

  const studyMeta = extractStudyMeta(hand);
  const inferredContext =
    hand.spotType && hand.heroPosition
      ? inferCanonicalSpotContextFromLog({
          scenarioId:
            hand.spotType === "3BET_POT"
              ? "FACING_THREE_BET"
              : hand.spotType === "BVB"
                ? "BLIND_VS_BLIND"
                : "DEFEND_VS_RFI",
          effectiveStackBb: hand.effectiveStackBb,
          heroPosition: hand.heroPosition,
          openerPosition: studyMeta.villainPosition,
          tournamentPhase: normalizeStudyStage(
            studyMeta.meta?.stage as string | undefined
          ),
        })
      : null;
  const inferredFamily =
    inferredContext && hand.heroHand
      ? suggestLeakFamilyFromHandLog({
          context: inferredContext,
          handCode: normalizeHandCode(hand.heroHand) ?? hand.heroHand,
        })
      : null;
  const leakFamilyId = linkedFamily ?? inferredFamily;
  const leakFamily = getLeakFamily(leakFamilyId);

  return buildHandTrainingSuggestionModel({
    handId,
    canonicalSpotId:
      studyMeta.canonicalSpotId ??
      (recommendation?.chart
        ? getCanonicalSpotId(canonicalSpotContextFromChart(recommendation.chart)!)
        : null),
    recommendation,
    leakFamilyId,
  });
}
