import type { CanonicalLeakFamilyId } from "./leakFamilies";
import type { CanonicalSpotFamily } from "./preflopTaxonomy";
import type { Position } from "./preflopStrategy";

export const TRAINER_ATTEMPT_CONFIDENCES = [
  "knew_it",
  "unsure",
  "guessed",
] as const;
export type TrainerAttemptConfidence =
  (typeof TRAINER_ATTEMPT_CONFIDENCES)[number];

export const TRAINER_ATTEMPT_SOURCE_STATUSES = [
  "exact_source",
  "simplified_population",
  "derived",
] as const;
export type TrainerAttemptSourceStatus =
  (typeof TRAINER_ATTEMPT_SOURCE_STATUSES)[number];

export const HAND_REVIEW_STATUSES = [
  "all",
  "needs_review",
  "reviewed",
  "high_severity",
] as const;
export type HandReviewStatus = (typeof HAND_REVIEW_STATUSES)[number];

export interface WeakSpotSummary {
  id: string;
  label: string;
  spotFamily: CanonicalSpotFamily | null;
  canonicalSpotId: string | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  stackBb: number | null;
  heroPosition: Position | null;
  villainPosition: Position | null;
  attempts: number;
  misses: number;
  accuracy: number;
  guessedCorrectCount: number;
  recentMissCount: number;
  severityScore: number;
  lastSeenAt: string;
  suggestedDrillPackId: string | null;
  suggestedChartId: number | null;
  suggestedAction: string | null;
}

export const TODAY_TRAINING_TYPES = [
  "drill_pack",
  "exact_chart",
  "review_hands",
  "icmizer_review",  // replaces push_fold — short-stack spots route to ICMIZER
  "study_chart",
] as const;
export type TodayTrainingType = (typeof TODAY_TRAINING_TYPES)[number];

export interface TodayTrainingSuggestion {
  id: string;
  title: string;
  reason: string;
  type: TodayTrainingType;
  targetRoute: string;
  estimatedReps: number | null;
  priority: number;
}

export interface ReviewQueueSummary {
  totalNeedsReview: number;
  highSeverityCount: number;
  topLeakFamilyId: CanonicalLeakFamilyId | null;
  topLeakLabel: string | null;
}

export interface HandTrainingSuggestion {
  handId: number;
  canonicalSpotId: string | null;
  drillRoute: string | null;
  drillLabel: string | null;
  chartRoute: string | null;
  chartLabel: string | null;
  chartReferenceLabel: string | null;
  leakFamilyId: CanonicalLeakFamilyId | null;
  leakFamilyLabel: string | null;
  leakReason: string | null;
}

export function isTrainerAttemptConfidence(
  value: string | null | undefined
): value is TrainerAttemptConfidence {
  return (TRAINER_ATTEMPT_CONFIDENCES as readonly string[]).includes(
    value ?? ""
  );
}

export function isHandReviewStatus(
  value: string | null | undefined
): value is HandReviewStatus {
  return (HAND_REVIEW_STATUSES as readonly string[]).includes(value ?? "");
}

export function mapStackToStudyReferenceBucket(
  stackBb: number | null | undefined
): 15 | 25 | 40 | 70 {
  if (typeof stackBb !== "number" || !Number.isFinite(stackBb)) return 25;
  if (stackBb <= 20) return 15;
  if (stackBb <= 32) return 25;
  if (stackBb <= 55) return 40;
  return 70;
}

export function buildReviewQueueHref(filters: {
  leakFamilyId?: CanonicalLeakFamilyId | null;
  reviewStatus?: HandReviewStatus;
  spotType?: string | null;
}) {
  const params = new URLSearchParams();

  if (filters.leakFamilyId) {
    params.set("leakFamily", filters.leakFamilyId);
  }
  if (filters.reviewStatus && filters.reviewStatus !== "all") {
    params.set("reviewStatus", filters.reviewStatus);
  }
  if (filters.spotType) {
    params.set("spotType", filters.spotType);
  }

  const query = params.toString();
  return query ? `/hands?${query}` : "/hands";
}
