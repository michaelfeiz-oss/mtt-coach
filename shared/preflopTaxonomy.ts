import type { PreflopScenarioId } from "./preflopScenarios";
import type { Position, SpotGroup } from "./strategy";

export const PRELFOP_PLAYERS_COUNT = 9;
export const PRELFOP_ANTE_FORMAT = "BBA" as const;

export const CANONICAL_SPOT_FAMILIES = [
  "OPEN_RFI",
  "DEFEND_VS_RFI",
  "THREE_BET",
  "FACING_3BET",
  "BLIND_VS_BLIND",
  "LIMP_ISO",
  "FOUR_BET_JAM",
  "PUSH_FOLD",
] as const;
export type CanonicalSpotFamily = (typeof CANONICAL_SPOT_FAMILIES)[number];

export const CANONICAL_STACK_BUCKETS = [
  5,
  6,
  7,
  8,
  9,
  10,
  15,
  25,
  40,
] as const;
export type CanonicalStackBucket = (typeof CANONICAL_STACK_BUCKETS)[number];

export const MAIN_STUDY_STACK_BUCKETS = [15, 25, 40] as const;
export const PUSH_FOLD_STACK_BUCKETS = [5, 6, 7, 8, 9, 10] as const;

export const STUDY_STAGE_CONTEXTS = [
  "EARLY",
  "MID",
  "BUBBLE",
  "FINAL_TABLE",
] as const;
export type StudyStageContext = (typeof STUDY_STAGE_CONTEXTS)[number];

export const CANONICAL_SPOT_FAMILY_LABELS: Record<
  CanonicalSpotFamily,
  string
> = {
  OPEN_RFI: "RFI / Open",
  DEFEND_VS_RFI: "Defend vs RFI",
  THREE_BET: "3-Bet",
  FACING_3BET: "Facing 3-Bet",
  BLIND_VS_BLIND: "Blind vs Blind",
  LIMP_ISO: "Limp / Iso",
  FOUR_BET_JAM: "4-Bet / Jam",
  PUSH_FOLD: "Push / Fold",
};

export function canonicalFamilyFromSpotGroup(
  spotGroup: SpotGroup
): CanonicalSpotFamily {
  switch (spotGroup) {
    case "RFI":
      return "OPEN_RFI";
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return "DEFEND_VS_RFI";
    case "VS_3BET":
      return "FACING_3BET";
    case "BVB":
      return "BLIND_VS_BLIND";
  }
}

export function canonicalFamilyFromScenarioId(
  scenarioId: PreflopScenarioId
): CanonicalSpotFamily {
  switch (scenarioId) {
    case "OPEN_RFI":
      return "OPEN_RFI";
    case "DEFEND_VS_RFI":
      return "DEFEND_VS_RFI";
    case "THREE_BET":
      return "THREE_BET";
    case "FACING_THREE_BET":
      return "FACING_3BET";
    case "BLIND_VS_BLIND":
      return "BLIND_VS_BLIND";
    case "LIMP_ISO":
      return "LIMP_ISO";
    case "FOUR_BET_JAM":
      return "FOUR_BET_JAM";
    case "OTHER_PREFLOP":
      return "OPEN_RFI";
  }
}

export function requiresVillainPosition(family: CanonicalSpotFamily): boolean {
  return !["OPEN_RFI", "PUSH_FOLD"].includes(family);
}

export function normalizeStudyStage(
  value: string | null | undefined
): StudyStageContext | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  return (STUDY_STAGE_CONTEXTS as readonly string[]).includes(normalized)
    ? (normalized as StudyStageContext)
    : undefined;
}

function nearestBucket(
  value: number | null | undefined,
  buckets: readonly number[]
): number {
  const target =
    typeof value === "number" && Number.isFinite(value) ? value : buckets[0];

  return [...buckets].sort(
    (left, right) =>
      Math.abs(left - target) - Math.abs(right - target) || left - right
  )[0];
}

export function nearestMainStudyStackBucket(
  value: number | null | undefined
): (typeof MAIN_STUDY_STACK_BUCKETS)[number] {
  return nearestBucket(
    value,
    MAIN_STUDY_STACK_BUCKETS
  ) as (typeof MAIN_STUDY_STACK_BUCKETS)[number];
}

export function nearestPushFoldStackBucket(
  value: number | null | undefined
): (typeof PUSH_FOLD_STACK_BUCKETS)[number] {
  return nearestBucket(
    value,
    PUSH_FOLD_STACK_BUCKETS
  ) as (typeof PUSH_FOLD_STACK_BUCKETS)[number];
}

export function nearestCanonicalStackBucket(
  value: number | null | undefined
): CanonicalStackBucket {
  return nearestBucket(value, CANONICAL_STACK_BUCKETS) as CanonicalStackBucket;
}

export function isEarlyPosition(position: Position | null | undefined) {
  return position === "UTG" || position === "UTG1" || position === "MP";
}

export function isLatePosition(position: Position | null | undefined) {
  return position === "HJ" || position === "CO" || position === "BTN";
}

export function isBlind(position: Position | null | undefined) {
  return position === "SB" || position === "BB";
}
