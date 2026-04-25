/**
 * shared/strategy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All types, constants, and helpers shared between server and client for the
 * MTT Strategy Module (Range Library + Range Trainer).
 *
 * CODEX TASK: This file is complete. Do not modify unless adding new spot groups.
 */

// ─── Action types ────────────────────────────────────────────────────────────

export const ACTIONS = [
  "FOLD",
  "RAISE",
  "CALL",
  "THREE_BET",
  "JAM",
  "LIMP",
  "CHECK",
] as const;
export type Action = (typeof ACTIONS)[number];

/** Colour tokens used in the range matrix UI */
export const ACTION_COLORS: Record<Action, string> = {
  RAISE: "#ef4444", // red-500
  THREE_BET: "#3b82f6", // blue-500
  JAM: "#f97316", // orange-500
  CALL: "#22c55e", // green-500
  LIMP: "#eab308", // yellow-500
  CHECK: "#71717a", // zinc-500
  FOLD: "#e4e4e7", // zinc-200
};

export const ACTION_LABELS: Record<Action, string> = {
  RAISE: "Raise",
  THREE_BET: "3-Bet",
  JAM: "Jam",
  CALL: "Call",
  LIMP: "Limp",
  CHECK: "Check",
  FOLD: "Fold",
};

// ─── Spot groups ─────────────────────────────────────────────────────────────

export const SPOT_GROUPS = [
  "RFI",
  "VS_UTG_RFI",
  "VS_MP_RFI",
  "VS_LP_RFI",
  "VS_3BET",
  "BVB",
] as const;
export type SpotGroup = (typeof SPOT_GROUPS)[number];

export const SPOT_GROUP_LABELS: Record<SpotGroup, string> = {
  RFI: "RFI (Open Raise)",
  VS_UTG_RFI: "vs UTG RFI",
  VS_MP_RFI: "vs Mid-Position RFI",
  VS_LP_RFI: "vs LP RFI",
  VS_3BET: "vs 3-Bet",
  BVB: "BvB",
};

export const SPOT_GROUP_SUBTITLES: Record<SpotGroup, string> = {
  RFI: "Open ranges by position",
  VS_UTG_RFI: "Continue versus early-position opens",
  VS_MP_RFI: "Continue versus middle-position opens",
  VS_LP_RFI: "Defend versus late-position opens",
  VS_3BET: "Continue after facing a 3-bet",
  BVB: "Blind versus blind decisions",
};

// ─── Stack depths ─────────────────────────────────────────────────────────────

export const STACK_DEPTHS = [15, 25, 40] as const;
export type StackDepth = (typeof STACK_DEPTHS)[number];

// ─── Positions ───────────────────────────────────────────────────────────────

export const POSITIONS = [
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const;
export type Position = (typeof POSITIONS)[number];

export function displayPositionLabel(position?: string | null): string {
  if (!position) return "No opener";
  return position === "UTG1" ? "UTG+1" : position;
}

// ─── Hand grid ───────────────────────────────────────────────────────────────

/**
 * Standard 13×13 poker hand grid in display order (top-left = AA, bottom-right = 22).
 * Pairs on diagonal, suited above diagonal, offsuit below.
 */
export const RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;
export type Rank = (typeof RANKS)[number];

/** Generate the 169 canonical hand codes in grid order */
export function generateHandGrid(): string[][] {
  return RANKS.map((r1, i) =>
    RANKS.map((r2, j) => {
      if (i === j) return `${r1}${r2}`; // pair
      if (i < j) return `${r1}${r2}s`; // suited  (r1 > r2)
      return `${r2}${r1}o`; // offsuit (r1 < r2)
    })
  );
}

/** Flat list of all 169 hand codes */
export const ALL_HANDS: string[] = generateHandGrid().flat();

// ─── Spot definition (used for sidebar navigation) ───────────────────────────

export interface SpotDefinition {
  key: string; // e.g. "BTN_RFI"
  label: string; // e.g. "BTN RFI"
  group: SpotGroup;
  heroPosition: Position;
  villainPosition?: Position;
}

const RFI_HERO_POSITIONS = [
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
  "SB",
] as const satisfies readonly Position[];

const VS_UTG_HERO_POSITIONS = [
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const satisfies readonly Position[];

const VS_MP_HERO_POSITIONS = [
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const satisfies readonly Position[];

const VS_LP_RFI_COMBINATIONS = [
  { heroPosition: "BTN", villainPosition: "CO" },
  { heroPosition: "SB", villainPosition: "CO" },
  { heroPosition: "BB", villainPosition: "CO" },
  { heroPosition: "SB", villainPosition: "BTN" },
  { heroPosition: "BB", villainPosition: "BTN" },
] as const satisfies readonly {
  heroPosition: Position;
  villainPosition: Position;
}[];

const THREE_BET_REACTION_COMBINATIONS = [
  { heroPosition: "UTG", villainPosition: "UTG1" },
  { heroPosition: "UTG", villainPosition: "MP" },
  { heroPosition: "UTG", villainPosition: "HJ" },
  { heroPosition: "UTG", villainPosition: "CO" },
  { heroPosition: "UTG", villainPosition: "BTN" },
  { heroPosition: "UTG", villainPosition: "SB" },
  { heroPosition: "UTG", villainPosition: "BB" },
  { heroPosition: "UTG1", villainPosition: "MP" },
  { heroPosition: "UTG1", villainPosition: "HJ" },
  { heroPosition: "UTG1", villainPosition: "CO" },
  { heroPosition: "UTG1", villainPosition: "BTN" },
  { heroPosition: "UTG1", villainPosition: "SB" },
  { heroPosition: "UTG1", villainPosition: "BB" },
  { heroPosition: "MP", villainPosition: "HJ" },
  { heroPosition: "MP", villainPosition: "CO" },
  { heroPosition: "MP", villainPosition: "BTN" },
  { heroPosition: "MP", villainPosition: "SB" },
  { heroPosition: "MP", villainPosition: "BB" },
  { heroPosition: "HJ", villainPosition: "CO" },
  { heroPosition: "HJ", villainPosition: "BTN" },
  { heroPosition: "HJ", villainPosition: "SB" },
  { heroPosition: "HJ", villainPosition: "BB" },
  { heroPosition: "CO", villainPosition: "BTN" },
  { heroPosition: "CO", villainPosition: "SB" },
  { heroPosition: "CO", villainPosition: "BB" },
  { heroPosition: "BTN", villainPosition: "SB" },
  { heroPosition: "BTN", villainPosition: "BB" },
  { heroPosition: "SB", villainPosition: "BB" },
] as const satisfies readonly {
  heroPosition: Position;
  villainPosition: Position;
}[];

function createSpotDefinition(
  key: string,
  group: SpotGroup,
  heroPosition: Position,
  villainPosition?: Position,
  suffix?: string
): SpotDefinition {
  const heroLabel = displayPositionLabel(heroPosition);
  const villainLabel = villainPosition ? displayPositionLabel(villainPosition) : null;

  if (suffix) {
    return {
      key,
      label: `${heroLabel} vs ${villainLabel} ${suffix}`,
      group,
      heroPosition,
      villainPosition,
    };
  }

  return {
    key,
    label: `${heroLabel}${villainLabel ? ` vs ${villainLabel}` : ""}`,
    group,
    heroPosition,
    villainPosition,
  };
}

/**
 * All spots available in the strategy library.
 * This is the shared catalog that seed data and UI both depend on.
 */
export const SPOT_DEFINITIONS: SpotDefinition[] = [
  ...RFI_HERO_POSITIONS.map(heroPosition => ({
    key: `${heroPosition}_RFI`,
    label: `${displayPositionLabel(heroPosition)} RFI`,
    group: "RFI" as const,
    heroPosition,
  })),
  ...VS_UTG_HERO_POSITIONS.map(heroPosition =>
    createSpotDefinition(
      `${heroPosition}_vs_UTG`,
      "VS_UTG_RFI",
      heroPosition,
      "UTG"
    )
  ),
  ...VS_MP_HERO_POSITIONS.map(heroPosition =>
    createSpotDefinition(
      `${heroPosition}_vs_MP`,
      "VS_MP_RFI",
      heroPosition,
      "MP"
    )
  ),
  ...VS_LP_RFI_COMBINATIONS.map(({ heroPosition, villainPosition }) =>
    createSpotDefinition(
      `${heroPosition}_vs_${villainPosition}`,
      "VS_LP_RFI",
      heroPosition,
      villainPosition
    )
  ),
  ...THREE_BET_REACTION_COMBINATIONS.map(({ heroPosition, villainPosition }) =>
    createSpotDefinition(
      `${heroPosition}_vs_${villainPosition}_3bet`,
      "VS_3BET",
      heroPosition,
      villainPosition,
      "3-Bet"
    )
  ),
  createSpotDefinition("SB_vs_BB_limp", "BVB", "SB", "BB"),
  createSpotDefinition("BB_vs_SB_limp", "BVB", "BB", "SB"),
];

// ─── API types ────────────────────────────────────────────────────────────────

export interface RangeChartWithActions {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
  sourceLabel?: string | null;
  notesJson?: string | null;
  actions: HandAction[];
}

export interface HandAction {
  handCode: string;
  primaryAction: Action;
  weightPercent?: number | null;
  mixJson?: string | null;
  colorToken?: string | null;
  note?: string | null;
}

export interface MixEntry {
  action: Action;
  frequency: number; // 0-100
}

// ─── Trainer types ────────────────────────────────────────────────────────────

export interface TrainerQuestion {
  chartId: number;
  handCode: string;
  correctAction: Action;
  correctNote?: string | null;
  /** Subset of actions to show as answer choices (always includes correct + 2-3 distractors) */
  choices: Action[];
}

export interface TrainerStats {
  total: number;
  correct: number;
  accuracy: number; // 0-100
  byAction: Record<Action, { total: number; correct: number }>;
}

export interface StrategySpotProgress {
  chartId: number;
  chartTitle: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface StrategyMissedHand {
  chartId: number;
  chartTitle: string;
  handCode: string;
  missed: number;
  attempts: number;
  correctAction: Action;
}

export interface StrategyProgressSummary {
  bySpot: StrategySpotProgress[];
  weakSpots: StrategySpotProgress[];
  missedHands: StrategyMissedHand[];
}

export interface StrategyRecommendation {
  chart: {
    id: number;
    title: string;
    stackDepth: number;
    spotGroup: SpotGroup;
    spotKey: string;
    heroPosition: string;
    villainPosition?: string | null;
  };
  handCode?: string | null;
  recommendedAction?: Action | null;
  reason: string;
  confidence: "exact" | "nearest";
}
