/**
 * client/src/components/strategy/utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side utility functions for the strategy module.
 */

/**
 * Format a hand code with suit symbols for display.
 * e.g. "AKs" → "AK" (suited), "AKo" → "AK" (offsuit)
 * For trainer display, shows the hand with suit indicators.
 *
 * CODEX TASK: Enhance this to show actual suit symbols with colours.
 * For now returns the hand code as-is with basic formatting.
 */
export function formatHandWithSuits(handCode: string): string {
  if (!handCode) return "";

  // Pairs: "AA", "KK", etc.
  if (handCode.length === 2 && handCode[0] === handCode[1]) {
    return handCode;
  }

  // Suited: "AKs" → "AK♠" style
  if (handCode.endsWith("s")) {
    return handCode.slice(0, -1) + "s";
  }

  // Offsuit: "AKo" → "AKo"
  if (handCode.endsWith("o")) {
    return handCode.slice(0, -1) + "o";
  }

  return handCode;
}

/**
 * Build a map from handCode to action for fast lookup in RangeMatrix.
 * Input: array of HandAction objects
 * Output: Record<string, HandAction>
 */
import type { HandAction, Action } from "../../../../shared/strategy";

export function buildActionMap(
  actions: Array<{ handCode: string; primaryAction: string; weightPercent?: number | null; mixJson?: string | null; colorToken?: string | null; note?: string | null }>
): Record<string, HandAction> {
  const map: Record<string, HandAction> = {};
  for (const a of actions) {
    map[a.handCode] = {
      handCode: a.handCode,
      primaryAction: a.primaryAction as Action,
      weightPercent: a.weightPercent ?? undefined,
      mixJson: a.mixJson ?? undefined,
      colorToken: a.colorToken ?? undefined,
      note: a.note ?? undefined,
    };
  }
  return map;
}

/**
 * Pick a random hand from a chart's actions for the trainer.
 * Excludes FOLD hands by default (trainers focus on decision hands).
 *
 * CODEX TASK: Optionally weight by weightPercent for mixed strategy hands.
 */
export function pickRandomHand(
  actions: Array<{ handCode: string; primaryAction: string }>,
  excludeFold = true
): { handCode: string; primaryAction: string } | null {
  let pool = actions;
  if (excludeFold) {
    pool = actions.filter((a) => a.primaryAction !== "FOLD");
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Calculate accuracy percentage from correct/total counts.
 */
export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
