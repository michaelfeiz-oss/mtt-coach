import type { Position, SpotGroup } from "./strategy";

export const SOURCE_BACKED_MAIN_STACKS = [15, 25, 40] as const;
export type SourceBackedMainStack = (typeof SOURCE_BACKED_MAIN_STACKS)[number];

export const SIMPLIFIED_POPULATION_3BET_STACKS = [25, 40] as const;
export type SimplifiedPopulationThreeBetStack =
  (typeof SIMPLIFIED_POPULATION_3BET_STACKS)[number];

export type StrategySourceStatus =
  | "source_backed"
  | "proxy"
  | "simplified_population"
  | "unsupported";

export interface StrategyChartLike {
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  spotKey?: string | null;
}

const SOURCE_BACKED_3BET_HEROES = new Set<Position>([
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
]);

function isSimplifiedPopulationThreeBetStack(
  stackDepth: number
): stackDepth is SimplifiedPopulationThreeBetStack {
  return (SIMPLIFIED_POPULATION_3BET_STACKS as readonly number[]).includes(
    stackDepth
  );
}

function supportsFacingThreeBetHero(heroPosition: string) {
  return SOURCE_BACKED_3BET_HEROES.has(heroPosition as Position);
}

export function isSourceBackedMainStack(
  stackDepth: number
): stackDepth is SourceBackedMainStack {
  return (SOURCE_BACKED_MAIN_STACKS as readonly number[]).includes(stackDepth);
}

export function getStrategySourceStatus(
  chart: StrategyChartLike
): StrategySourceStatus {
  if (!isSourceBackedMainStack(chart.stackDepth)) {
    return "unsupported";
  }

  switch (chart.spotGroup) {
    case "RFI":
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return "source_backed";
    case "VS_3BET":
      if (!supportsFacingThreeBetHero(chart.heroPosition)) {
        return "unsupported";
      }

      if (chart.stackDepth === 15) {
        return "source_backed";
      }

      return isSimplifiedPopulationThreeBetStack(chart.stackDepth)
        ? "simplified_population"
        : "unsupported";
    case "BVB":
      return "proxy";
  }
}

export function getStrategySourceLabel(chart: StrategyChartLike): string | null {
  switch (getStrategySourceStatus(chart)) {
    case "source_backed":
      return "Exact source-backed chart";
    case "proxy":
      return "Structured proxy coverage";
    case "simplified_population":
      return "Simplified population vs 3-bet";
    case "unsupported":
      return null;
  }
}

export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}
