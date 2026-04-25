import type { PreflopScenarioId } from "./preflopScenarios";
import {
  CANONICAL_SPOT_FAMILY_LABELS,
  PRELFOP_ANTE_FORMAT,
  PRELFOP_PLAYERS_COUNT,
  canonicalFamilyFromScenarioId,
  canonicalFamilyFromSpotGroup,
  nearestMainStudyStackBucket,
  type CanonicalSpotFamily,
  type StudyStageContext,
} from "./preflopTaxonomy";
import {
  POSITIONS,
  displayPositionLabel,
  type SpotGroup,
  type Position,
} from "./strategy";

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
    .replace("UTG-1", "UTG1");

  return (POSITIONS as readonly string[]).includes(normalized)
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

  return {
    family: canonicalFamilyFromSpotGroup(chart.spotGroup),
    stackDepth: nearestMainStudyStackBucket(chart.stackDepth),
    heroPosition,
    villainPosition: normalizeCanonicalPosition(chart.villainPosition),
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
  switch (context.family) {
    case "OPEN_RFI":
      return {
        spotGroup: "RFI",
        spotKey: `${context.heroPosition}_RFI`,
      };
    case "DEFEND_VS_RFI":
      if (!context.villainPosition) return null;
      if (context.villainPosition === "UTG") {
        return {
          spotGroup: "VS_UTG_RFI",
          spotKey: `${context.heroPosition}_vs_UTG`,
        };
      }
      if (context.villainPosition === "MP") {
        return {
          spotGroup: "VS_MP_RFI",
          spotKey: `${context.heroPosition}_vs_MP`,
        };
      }
      if (context.villainPosition === "CO" || context.villainPosition === "BTN") {
        return {
          spotGroup: "VS_LP_RFI",
          spotKey: `${context.heroPosition}_vs_${context.villainPosition}`,
        };
      }
      return null;
    case "FACING_3BET":
      if (!context.villainPosition) return null;
      return {
        spotGroup: "VS_3BET",
        spotKey: `${context.heroPosition}_vs_${context.villainPosition}_3bet`,
      };
    case "BLIND_VS_BLIND":
      if (context.heroPosition === "SB") {
        return { spotGroup: "BVB", spotKey: "SB_vs_BB_limp" };
      }
      if (context.heroPosition === "BB") {
        return { spotGroup: "BVB", spotKey: "BB_vs_SB_limp" };
      }
      return null;
    default:
      return null;
  }
}
