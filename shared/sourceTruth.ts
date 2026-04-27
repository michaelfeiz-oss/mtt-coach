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

export const SIMPLIFIED_VS_3BET_FAMILIES = [
  "OOP_VS_IP_3BET",
  "IP_VS_SB_3BET",
  "IP_VS_BB_3BET",
] as const;
export type SimplifiedVsThreeBetFamily =
  (typeof SIMPLIFIED_VS_3BET_FAMILIES)[number];

const SIMPLIFIED_VS_3BET_FAMILY_LABELS: Record<
  SimplifiedVsThreeBetFamily,
  string
> = {
  OOP_VS_IP_3BET: "OOP vs IP 3-Bet",
  IP_VS_SB_3BET: "IP vs SB 3-Bet",
  IP_VS_BB_3BET: "IP vs BB 3-Bet",
};

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

export function getSimplifiedVsThreeBetFamily(
  chart: StrategyChartLike
): SimplifiedVsThreeBetFamily | null {
  if (chart.spotGroup !== "VS_3BET") return null;

  if (chart.villainPosition === "SB") {
    return "IP_VS_SB_3BET";
  }

  if (chart.villainPosition === "BB") {
    return "IP_VS_BB_3BET";
  }

  return "OOP_VS_IP_3BET";
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
      return "Exact PDF Chart";
    case "proxy":
      return "Structured Proxy";
    case "simplified_population":
      return "Simplified Population";
    case "unsupported":
      return null;
  }
}

export function getStrategySourceHelperText(
  chart: StrategyChartLike
): string | null {
  switch (getStrategySourceStatus(chart)) {
    case "source_backed":
      return null;
    case "proxy":
      return "Structured branch view for blind-versus-blind decisions.";
    case "simplified_population":
      return "Practical simplified model - not exact PDF chart.";
    case "unsupported":
      return null;
  }
}

export function getSimplifiedVsThreeBetFamilyLabel(
  familyOrChart: SimplifiedVsThreeBetFamily | StrategyChartLike
): string | null {
  const family =
    typeof familyOrChart === "string"
      ? familyOrChart
      : getSimplifiedVsThreeBetFamily(familyOrChart);

  return family ? SIMPLIFIED_VS_3BET_FAMILY_LABELS[family] : null;
}

export function getSharedFamilySourceLabel(
  chart: StrategyChartLike
): string | null {
  if (getStrategySourceStatus(chart) !== "simplified_population") {
    return null;
  }

  const familyLabel = getSimplifiedVsThreeBetFamilyLabel(chart);
  return familyLabel ? `Shared ${familyLabel} family` : null;
}

export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}
