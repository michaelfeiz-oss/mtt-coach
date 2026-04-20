/**
 * server/strategy/seedData.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed data for the strategy module.
 * Each entry maps to one rangeCharts row + N rangeChartActions rows.
 *
 * CODEX TASK:
 *   1. Expand SEED_CHARTS with real GTO ranges for each spot/stack combo.
 *   2. Keep the structure identical — only add more entries to the array.
 *   3. The seed script (seedStrategy.mjs) iterates this array and inserts rows.
 *
 * Hand code format:
 *   Pairs:   "AA", "KK", ... "22"
 *   Suited:  "AKs", "AQs", ... "32s"
 *   Offsuit: "AKo", "AQo", ... "32o"
 *
 * Actions: FOLD | RAISE | CALL | THREE_BET | JAM | LIMP | CHECK
 * weightPercent: 0-100 (primary action frequency; null = 100%)
 * mixJson: JSON string of [{action, frequency}] for mixed strategies
 */

import type { Action } from "../../shared/strategy";

export interface SeedHandAction {
  handCode: string;
  primaryAction: Action;
  weightPercent?: number;
  mixJson?: string;
  colorToken?: string;
  note?: string;
}

export interface SeedChart {
  title: string;
  stackDepth: number;
  spotGroup: "RFI" | "VS_UTG_RFI" | "VS_MP_RFI" | "VS_LP_RFI" | "VS_3BET" | "BVB";
  spotKey: string;
  heroPosition: string;
  villainPosition?: string;
  sourceLabel?: string;
  notes?: string[];
  actions: SeedHandAction[];
}

// ─── Helper: build a simple all-raise range ──────────────────────────────────
// CODEX TASK: Replace these placeholder ranges with real solver data.

function allRaise(hands: string[]): SeedHandAction[] {
  return hands.map((h) => ({ handCode: h, primaryAction: "RAISE" as Action }));
}

function allFold(hands: string[]): SeedHandAction[] {
  return hands.map((h) => ({ handCode: h, primaryAction: "FOLD" as Action }));
}

// ─── BTN RFI @ 20bb (placeholder — replace with real data) ──────────────────

const BTN_RFI_20BB_RAISE = [
  "AA","KK","QQ","JJ","TT","99","88","77","66","55","44","33","22",
  "AKs","AQs","AJs","ATs","A9s","A8s","A7s","A6s","A5s","A4s","A3s","A2s",
  "AKo","AQo","AJo","ATo","A9o","A8o","A7o",
  "KQs","KJs","KTs","K9s","K8s","K7s","K6s","K5s","K4s","K3s","K2s",
  "KQo","KJo","KTo","K9o",
  "QJs","QTs","Q9s","Q8s","Q7s","Q6s","Q5s",
  "QJo","QTo","Q9o",
  "JTs","J9s","J8s","J7s","J6s",
  "JTo","J9o",
  "T9s","T8s","T7s","T6s",
  "T9o",
  "98s","97s","96s","95s",
  "87s","86s","85s",
  "76s","75s","74s",
  "65s","64s",
  "54s","53s",
  "43s",
];

const BTN_RFI_20BB_FOLD = [
  "A6o","A5o","A4o","A3o","A2o",
  "K8o","K7o","K6o","K5o","K4o","K3o","K2o",
  "Q8o","Q7o","Q6o","Q5o","Q4o","Q3o","Q2o",
  "J8o","J7o","J6o","J5o","J4o","J3o","J2o",
  "T8o","T7o","T6o","T5o","T4o","T3o","T2o",
  "98o","97o","96o","95o","94o","93o","92o",
  "87o","86o","85o","84o","83o","82o",
  "76o","75o","74o","73o","72o",
  "65o","64o","63o","62o",
  "54o","53o","52o",
  "43o","42o",
  "32s","32o",
];

// ─── Exported seed data ───────────────────────────────────────────────────────

export const SEED_CHARTS: SeedChart[] = [
  {
    title: "BTN RFI @ 20bb",
    stackDepth: 20,
    spotGroup: "RFI",
    spotKey: "BTN_RFI",
    heroPosition: "BTN",
    sourceLabel: "GTO Wizard (placeholder)",
    notes: [
      "Wide open from BTN at 20bb — jam/raise most playable hands.",
      "Fold weak offsuit broadways and low offsuit connectors.",
    ],
    actions: [
      ...allRaise(BTN_RFI_20BB_RAISE),
      ...allFold(BTN_RFI_20BB_FOLD),
    ],
  },

  // ─── CODEX TASK: Add more spots below in the same format ────────────────
  // Example structure:
  // {
  //   title: "BB vs BTN @ 20bb",
  //   stackDepth: 20,
  //   spotGroup: "VS_LP_RFI",
  //   spotKey: "BB_vs_BTN",
  //   heroPosition: "BB",
  //   villainPosition: "BTN",
  //   sourceLabel: "GTO Wizard",
  //   notes: ["Defend wide vs BTN open."],
  //   actions: [
  //     { handCode: "AA", primaryAction: "THREE_BET" },
  //     { handCode: "KK", primaryAction: "THREE_BET" },
  //     // ... etc
  //   ],
  // },
];
