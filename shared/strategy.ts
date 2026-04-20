/**
 * shared/strategy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All types, constants, and helpers shared between server and client for the
 * MTT Strategy Module (Range Library + Range Trainer).
 *
 * CODEX TASK: This file is complete. Do not modify unless adding new spot groups.
 */

// ─── Action types ────────────────────────────────────────────────────────────

export const ACTIONS = ["FOLD", "RAISE", "CALL", "THREE_BET", "JAM", "LIMP", "CHECK"] as const;
export type Action = (typeof ACTIONS)[number];

/** Colour tokens used in the range matrix UI */
export const ACTION_COLORS: Record<Action, string> = {
  RAISE:     "#22c55e",   // green-500
  THREE_BET: "#a855f7",   // purple-500
  JAM:       "#ef4444",   // red-500
  CALL:      "#3b82f6",   // blue-500
  LIMP:      "#f59e0b",   // amber-500
  CHECK:     "#6b7280",   // gray-500
  FOLD:      "#1f2937",   // gray-800 (near black)
};

export const ACTION_LABELS: Record<Action, string> = {
  RAISE:     "Raise",
  THREE_BET: "3-Bet",
  JAM:       "Jam",
  CALL:      "Call",
  LIMP:      "Limp",
  CHECK:     "Check",
  FOLD:      "Fold",
};

// ─── Spot groups ─────────────────────────────────────────────────────────────

export const SPOT_GROUPS = ["RFI", "VS_UTG_RFI", "VS_MP_RFI", "VS_LP_RFI", "VS_3BET", "BVB"] as const;
export type SpotGroup = (typeof SPOT_GROUPS)[number];

export const SPOT_GROUP_LABELS: Record<SpotGroup, string> = {
  RFI:        "RFI (Open Raise)",
  VS_UTG_RFI: "vs UTG RFI",
  VS_MP_RFI:  "vs MP RFI",
  VS_LP_RFI:  "vs LP RFI",
  VS_3BET:    "vs 3-Bet",
  BVB:        "BvB",
};

// ─── Stack depths ─────────────────────────────────────────────────────────────

export const STACK_DEPTHS = [15, 20, 25, 40] as const;
export type StackDepth = (typeof STACK_DEPTHS)[number];

// ─── Positions ───────────────────────────────────────────────────────────────

export const POSITIONS = ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB", "BB"] as const;
export type Position = (typeof POSITIONS)[number];

// ─── Hand grid ───────────────────────────────────────────────────────────────

/**
 * Standard 13×13 poker hand grid in display order (top-left = AA, bottom-right = 22).
 * Pairs on diagonal, suited above diagonal, offsuit below.
 */
export const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
export type Rank = (typeof RANKS)[number];

/** Generate the 169 canonical hand codes in grid order */
export function generateHandGrid(): string[][] {
  return RANKS.map((r1, i) =>
    RANKS.map((r2, j) => {
      if (i === j) return `${r1}${r2}`;           // pair
      if (i < j)  return `${r1}${r2}s`;           // suited  (r1 > r2)
      return `${r2}${r1}o`;                        // offsuit (r1 < r2)
    })
  );
}

/** Flat list of all 169 hand codes */
export const ALL_HANDS: string[] = generateHandGrid().flat();

// ─── Spot definition (used for sidebar navigation) ───────────────────────────

export interface SpotDefinition {
  key: string;           // e.g. "BTN_RFI"
  label: string;         // e.g. "BTN RFI"
  group: SpotGroup;
  heroPosition: Position;
  villainPosition?: Position;
}

/**
 * All spots available in the strategy library.
 * CODEX TASK: Extend this list if new spots are added.
 */
export const SPOT_DEFINITIONS: SpotDefinition[] = [
  // RFI spots
  { key: "UTG_RFI",  label: "UTG RFI",  group: "RFI", heroPosition: "UTG" },
  { key: "UTG1_RFI", label: "UTG+1 RFI",group: "RFI", heroPosition: "UTG1" },
  { key: "MP_RFI",   label: "MP RFI",   group: "RFI", heroPosition: "MP" },
  { key: "HJ_RFI",   label: "HJ RFI",   group: "RFI", heroPosition: "HJ" },
  { key: "CO_RFI",   label: "CO RFI",   group: "RFI", heroPosition: "CO" },
  { key: "BTN_RFI",  label: "BTN RFI",  group: "RFI", heroPosition: "BTN" },
  { key: "SB_RFI",   label: "SB RFI",   group: "RFI", heroPosition: "SB" },

  // vs UTG RFI
  { key: "BB_vs_UTG",  label: "BB vs UTG",  group: "VS_UTG_RFI", heroPosition: "BB", villainPosition: "UTG" },
  { key: "HJ_vs_UTG",  label: "HJ vs UTG",  group: "VS_UTG_RFI", heroPosition: "HJ", villainPosition: "UTG" },
  { key: "CO_vs_UTG",  label: "CO vs UTG",  group: "VS_UTG_RFI", heroPosition: "CO", villainPosition: "UTG" },
  { key: "BTN_vs_UTG", label: "BTN vs UTG", group: "VS_UTG_RFI", heroPosition: "BTN", villainPosition: "UTG" },

  // vs MP RFI
  { key: "BB_vs_MP",  label: "BB vs MP",  group: "VS_MP_RFI", heroPosition: "BB", villainPosition: "MP" },
  { key: "CO_vs_MP",  label: "CO vs MP",  group: "VS_MP_RFI", heroPosition: "CO", villainPosition: "MP" },
  { key: "BTN_vs_MP", label: "BTN vs MP", group: "VS_MP_RFI", heroPosition: "BTN", villainPosition: "MP" },

  // vs LP RFI
  { key: "BB_vs_CO",  label: "BB vs CO",  group: "VS_LP_RFI", heroPosition: "BB", villainPosition: "CO" },
  { key: "BB_vs_BTN", label: "BB vs BTN", group: "VS_LP_RFI", heroPosition: "BB", villainPosition: "BTN" },
  { key: "SB_vs_BTN", label: "SB vs BTN", group: "VS_LP_RFI", heroPosition: "SB", villainPosition: "BTN" },
  { key: "BTN_vs_CO", label: "BTN vs CO", group: "VS_LP_RFI", heroPosition: "BTN", villainPosition: "CO" },

  // vs 3-Bet
  { key: "BTN_vs_BB_3bet", label: "BTN vs BB 3-Bet", group: "VS_3BET", heroPosition: "BTN", villainPosition: "BB" },
  { key: "CO_vs_BB_3bet",  label: "CO vs BB 3-Bet",  group: "VS_3BET", heroPosition: "CO",  villainPosition: "BB" },
  { key: "BTN_vs_SB_3bet", label: "BTN vs SB 3-Bet", group: "VS_3BET", heroPosition: "BTN", villainPosition: "SB" },

  // BvB
  { key: "SB_vs_BB_limp", label: "SB vs BB (limp)", group: "BVB", heroPosition: "SB", villainPosition: "BB" },
  { key: "BB_vs_SB_limp", label: "BB vs SB (limp)", group: "BVB", heroPosition: "BB", villainPosition: "SB" },
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
  /** Subset of actions to show as answer choices (always includes correct + 2-3 distractors) */
  choices: Action[];
}

export interface TrainerStats {
  total: number;
  correct: number;
  accuracy: number; // 0-100
  byAction: Record<Action, { total: number; correct: number }>;
}
