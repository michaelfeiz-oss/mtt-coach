import type { PreflopScenarioId } from "./preflopScenarios";
import {
  CANONICAL_SPOT_FAMILY_LABELS,
  PRELFOP_ANTE_FORMAT,
  PRELFOP_PLAYERS_COUNT,
  canonicalFamilyFromScenarioId,
  canonicalFamilyFromSpotGroup,
  nearestMainStudyStackBucket,
  type CanonicalSpotFamily,
  type SpotGroup,
  type StudyStageContext,
} from "./preflopTaxonomy";
import {
  buildSpotKey,
  displayPositionLabel,
  type Position,
  type VillainGroup,
} from "./preflopStrategy";

export interface CanonicalSpotContext {
  family: CanonicalSpotFamily;
  stackDepth: number;
  heroPosition: Position;
  villainPosition?: Position | null;
  playersCount?: number;
  anteFormat?: typeof PRELFOP_ANTE_FORMAT;
  stage?: StudyStageContext | null;
}

export interface ChartLikeSpotContext {
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: string | null;
}

export interface LoggedSpotContextInput {
  scenarioId: PreflopScenarioId;
  effectiveStackBb: number | null | undefined;
  heroPosition: string | null | undefined;
  openerPosition?: string | null | undefined;
  tournamentPhase?: string | null | undefined;
}

export interface StrategyChartSelector {
  spotGroup: SpotGroup;
  spotKey: string;
}

export function normalizeCanonicalPosition(
  value: string | null | undefined
): Position | undefined {
  if (!value) return undefined;
  const normalized = value
    .trim()
    .toUpperCase()
    .replace("UTG+1", "UTG1")
    .replace("UTG 1", "UTG1")
    .replace("UTG-1", "UTG1")
    .replace("UTG+2", "UTG2")
    .replace("UTG 2", "UTG2")
    .replace("LOJACK", "LJ")
    .replace("HIJACK", "HJ")
    .replace("CUTOFF", "CO")
    .replace("BUTTON", "BTN");

  if (normalized === "MP") return "UTG2";

  return (
    [
      "UTG",
      "UTG1",
      "UTG2",
      "LJ",
      "HJ",
      "CO",
      "BTN",
      "SB",
      "BB",
    ] as const
  ).includes(normalized as Position)
    ? (normalized as Position)
    : undefined;
}

export function getCanonicalSpotId(context: CanonicalSpotContext): string {
  const villainPosition = context.villainPosition ?? "NONE";
  const playersCount = context.playersCount ?? PRELFOP_PLAYERS_COUNT;
  const anteFormat = context.anteFormat ?? PRELFOP_ANTE_FORMAT;

  return [
    context.family,
    Math.round(context.stackDepth),
    context.heroPosition,
    villainPosition,
    `${playersCount}P`,
    anteFormat,
  ].join("|");
}

export function buildCanonicalSpotLabel(context: CanonicalSpotContext): string {
  return `${CANONICAL_SPOT_FAMILY_LABELS[context.family]} · ${Math.round(
    context.stackDepth
  )}bb · ${displayPositionLabel(context.heroPosition)}${
    context.villainPosition
      ? ` vs ${displayPositionLabel(context.villainPosition)}`
      : ""
  }`;
}

export function canonicalSpotContextFromChart(
  chart: ChartLikeSpotContext
): CanonicalSpotContext | null {
  const heroPosition = normalizeCanonicalPosition(chart.heroPosition);
  if (!heroPosition) return null;

  const villainPosition = normalizeCanonicalPosition(chart.villainPosition);
  const villainGroup =
    !villainPosition &&
    (chart.villainGroup === "early" ||
      chart.villainGroup === "middle" ||
      chart.villainGroup === "late")
      ? chart.villainGroup
      : null;

  const canonicalVillainPosition =
    villainPosition ??
    (villainGroup === "early"
      ? "UTG"
      : villainGroup === "middle"
        ? "HJ"
        : villainGroup === "late"
          ? "CO"
          : undefined);

  return {
    family: canonicalFamilyFromSpotGroup(chart.spotGroup),
    stackDepth: nearestMainStudyStackBucket(chart.stackDepth),
    heroPosition,
    villainPosition: canonicalVillainPosition,
    playersCount: PRELFOP_PLAYERS_COUNT,
    anteFormat: PRELFOP_ANTE_FORMAT,
  };
}

export function inferCanonicalSpotContextFromLog(
  input: LoggedSpotContextInput
): CanonicalSpotContext | null {
  const heroPosition = normalizeCanonicalPosition(input.heroPosition);
  if (!heroPosition) return null;

  return {
    family: canonicalFamilyFromScenarioId(input.scenarioId),
    stackDepth: nearestMainStudyStackBucket(input.effectiveStackBb),
    heroPosition,
    villainPosition: normalizeCanonicalPosition(input.openerPosition),
    playersCount: PRELFOP_PLAYERS_COUNT,
    anteFormat: PRELFOP_ANTE_FORMAT,
  };
}

export function getStrategyChartSelector(
  context: CanonicalSpotContext
): StrategyChartSelector | null {
  const stackBucket = nearestMainStudyStackBucket(context.stackDepth) as
    | 15
    | 25
    | 40
    | 70;

  switch (context.family) {
    case "OPEN_RFI":
      return {
        spotGroup: "rfi",
        spotKey: buildSpotKey({
          version: "v1",
          stackBucket,
          playerCount: PRELFOP_PLAYERS_COUNT,
          scenarioFamily: context.heroPosition === "SB" ? "sb_first_in" : "rfi",
          heroPosition: context.heroPosition,
        }),
      };
    case "DEFEND_VS_RFI":
      if (!context.villainPosition) return null;
      return {
        spotGroup:
          context.villainPosition === "UTG" ||
          context.villainPosition === "UTG1" ||
          context.villainPosition === "UTG2"
            ? "facing_open_early"
            : context.villainPosition === "LJ" || context.villainPosition === "HJ"
              ? "facing_open_middle"
              : "facing_open_late",
        spotKey: buildSpotKey({
          version: "v1",
          stackBucket,
          playerCount: PRELFOP_PLAYERS_COUNT,
          scenarioFamily:
            context.villainPosition === "UTG" ||
            context.villainPosition === "UTG1" ||
            context.villainPosition === "UTG2"
              ? "facing_open_early"
              : context.villainPosition === "LJ" || context.villainPosition === "HJ"
                ? "facing_open_middle"
                : "facing_open_late",
          heroPosition: context.heroPosition,
          villainPosition: context.villainPosition,
        }),
      };
    case "FACING_3BET":
    case "THREE_BET":
      return null;
    case "FOUR_BET_JAM":
      if (!context.villainPosition) return null;
      return {
        spotGroup: "facing_jam",
        spotKey: buildSpotKey({
          version: "v1",
          stackBucket,
          playerCount: PRELFOP_PLAYERS_COUNT,
          scenarioFamily: "facing_jam",
          heroPosition: context.heroPosition,
          villainPosition: context.villainPosition,
        }),
      };
    case "BLIND_VS_BLIND":
      if (context.heroPosition === "SB") {
        return {
          spotGroup: "sb_first_in",
          spotKey: buildSpotKey({
            version: "v1",
            stackBucket,
            playerCount: PRELFOP_PLAYERS_COUNT,
            scenarioFamily: "sb_first_in",
            heroPosition: "SB",
          }),
        };
      }
      if (context.heroPosition === "BB") {
        return {
          spotGroup: "bb_vs_sb_limp",
          spotKey: buildSpotKey({
            version: "v1",
            stackBucket,
            playerCount: PRELFOP_PLAYERS_COUNT,
            scenarioFamily: "bb_vs_sb_limp",
            heroPosition: "BB",
            villainPosition: "SB",
          }),
        };
      }
      return null;
    default:
      return null;
  }
}
