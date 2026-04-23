import type { Action, HandAction } from "../../../../shared/strategy";

export function formatHandWithSuits(handCode: string): string {
  if (!handCode) return "";
  return handCode.trim();
}

export function buildActionMap(
  actions: Array<{
    handCode: string;
    primaryAction: string;
    weightPercent?: number | null;
    mixJson?: string | null;
    colorToken?: string | null;
    note?: string | null;
  }>
): Record<string, HandAction> {
  const map: Record<string, HandAction> = {};

  for (const action of actions) {
    map[action.handCode] = {
      handCode: action.handCode,
      primaryAction: action.primaryAction as Action,
      weightPercent: action.weightPercent ?? undefined,
      mixJson: action.mixJson ?? undefined,
      colorToken: action.colorToken ?? undefined,
      note: action.note ?? undefined,
    };
  }

  return map;
}

export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
