import type { Position, SpotGroup } from "./strategy";

export const SOURCE_BACKED_MAIN_STACKS = [15, 25, 40] as const;
export type SourceBackedMainStack = (typeof SOURCE_BACKED_MAIN_STACKS)[number];

export type StrategySourceStatus = "source_backed" | "proxy" | "unsupported";

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
      return chart.stackDepth === 15 &&
        SOURCE_BACKED_3BET_HEROES.has(chart.heroPosition as Position)
        ? "source_backed"
        : "unsupported";
    case "BVB":
      return "proxy";
  }
}

export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}
