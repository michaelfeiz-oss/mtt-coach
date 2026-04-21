import type { SpotGroup } from "../../../shared/strategy";

export const RECENT_STRATEGY_SPOTS_KEY = "mtt.strategy.recentSpots";
export const RECENT_STRATEGY_SPOTS_LIMIT = 6;

export interface RecentStrategySpot {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
}

function isRecentStrategySpot(value: unknown): value is RecentStrategySpot {
  if (!value || typeof value !== "object") return false;

  const spot = value as Record<string, unknown>;
  return (
    typeof spot.id === "number" &&
    typeof spot.title === "string" &&
    typeof spot.stackDepth === "number" &&
    typeof spot.spotGroup === "string" &&
    typeof spot.spotKey === "string" &&
    typeof spot.heroPosition === "string"
  );
}

export function loadRecentStrategySpots(): RecentStrategySpot[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_STRATEGY_SPOTS_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isRecentStrategySpot)
      .slice(0, RECENT_STRATEGY_SPOTS_LIMIT);
  } catch {
    return [];
  }
}

export function saveRecentStrategySpots(spots: RecentStrategySpot[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      RECENT_STRATEGY_SPOTS_KEY,
      JSON.stringify(spots.slice(0, RECENT_STRATEGY_SPOTS_LIMIT))
    );
  } catch {
    // Recently viewed spots are convenience state only.
  }
}

export function addRecentStrategySpot(
  spots: RecentStrategySpot[],
  nextSpot: RecentStrategySpot
): RecentStrategySpot[] {
  return [
    nextSpot,
    ...spots.filter(spot => spot.id !== nextSpot.id),
  ].slice(0, RECENT_STRATEGY_SPOTS_LIMIT);
}
