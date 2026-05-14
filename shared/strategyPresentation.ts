import {
  SPOT_GROUP_LABELS,
  displayPositionLabel,
  displayVillainGroupLabel,
  formatStrategyContextLine,
  formatStrategyNodeTitle,
  type SpotGroup as TypedSpotGroup,
} from "./preflopStrategy";
import {
  getSharedFamilySourceLabel,
  getStrategyChartTrustMetadata,
  getStrategySourceHelperText,
  getStrategySourceLabel,
  getStrategySourceStatus,
  type AnyStrategySpotGroup,
  type StrategyChartLike,
} from "./sourceTruth";

export interface StrategyPresentationChart extends StrategyChartLike {
  title?: string | null;
}

export interface StrategyChartPresentation {
  title: string;
  decisionLabel: string;
  contextLine: string;
  sourceStatus: ReturnType<typeof getStrategySourceStatus>;
  sourceBadge: string | null;
  sourceHelper: string | null;
  sourcePanelLabel: string | null;
  sourcePanelGroup: string | null;
  appDisplayLabel: string;
  sourceCoverageNote: string | null;
  groupedSourcePanel: boolean;
  provenanceLabel: string | null;
  provenanceNote: string | null;
  sharedFamilyLabel: string | null;
  trainerAllowed: boolean;
  manuallyApprovedForTraining: boolean;
  notesConfidence: ReturnType<
    typeof getStrategyChartTrustMetadata
  >["notesConfidence"];
  cellMapSource: ReturnType<
    typeof getStrategyChartTrustMetadata
  >["cellMapSource"];
  trainingGateMessage: string | null;
}

function normalizeSpotGroup(spotGroup: AnyStrategySpotGroup): TypedSpotGroup | null {
  switch (spotGroup) {
    case "rfi":
    case "RFI":
      return "rfi";
    case "facing_open_early":
    case "VS_UTG_RFI":
      return "facing_open_early";
    case "facing_open_middle":
    case "VS_MP_RFI":
      return "facing_open_middle";
    case "facing_open_late":
    case "VS_LP_RFI":
      return "facing_open_late";
    case "facing_jam":
    case "VS_3BET":
      return "facing_jam";
    case "sb_first_in":
      return "sb_first_in";
    case "bb_vs_sb_open":
      return "bb_vs_sb_open";
    case "bb_vs_sb_limp":
    case "BVB":
      return "bb_vs_sb_limp";
  }
}

function formatLegacyContextLine(chart: StrategyPresentationChart) {
  const hero = displayPositionLabel(chart.heroPosition);
  const villain = chart.villainPosition
    ? displayPositionLabel(chart.villainPosition)
    : chart.villainGroup
      ? `${displayVillainGroupLabel(chart.villainGroup as "early" | "middle" | "late")} open`
      : null;

  switch (chart.spotGroup) {
    case "RFI":
      return `${hero} opening range - 9 players`;
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return `${hero}${villain ? ` vs ${villain}` : ""} - 9 players`;
    case "VS_3BET":
      return `${hero}${villain ? ` vs ${villain} 3-bet` : " facing a 3-bet"} - 9 players`;
    case "BVB":
      return `Blind versus blind - 9 players`;
    default:
      return `${hero}${villain ? ` vs ${villain}` : ""} - 9 players`;
  }
}

function formatLegacyDecisionLabel(spotGroup: AnyStrategySpotGroup) {
  switch (spotGroup) {
    case "RFI":
      return "RFI";
    case "VS_UTG_RFI":
      return "Facing Early Open";
    case "VS_MP_RFI":
      return "Facing Middle Open";
    case "VS_LP_RFI":
      return "Facing Late Open";
    case "VS_3BET":
      return "Facing 3-Bet";
    case "BVB":
      return "Blind vs Blind";
    default:
      return spotGroup;
  }
}

export function formatStrategyChartTitle(
  chart: StrategyPresentationChart
): string {
  const normalizedGroup = normalizeSpotGroup(chart.spotGroup);
  if (normalizedGroup) {
    return formatStrategyNodeTitle({
      stackDepth: chart.stackDepth,
      spotGroup: normalizedGroup,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
      villainGroup: chart.villainGroup,
    });
  }

  return chart.title?.trim() || `${chart.heroPosition} ${chart.spotGroup} @ ${chart.stackDepth}bb`;
}

export function buildStrategyChartPresentation(
  chart: StrategyPresentationChart
): StrategyChartPresentation {
  const trust = getStrategyChartTrustMetadata(chart);
  const normalizedGroup = normalizeSpotGroup(chart.spotGroup);
  const decisionLabel = normalizedGroup
    ? SPOT_GROUP_LABELS[normalizedGroup]
    : formatLegacyDecisionLabel(chart.spotGroup);
  const contextLine = normalizedGroup
    ? formatStrategyContextLine({
        playerCount: 9,
        heroPosition: chart.heroPosition,
        villainPosition: chart.villainPosition,
        villainGroup: chart.villainGroup,
        spotGroup: normalizedGroup,
      })
    : formatLegacyContextLine(chart);

  return {
    title: chart.title?.trim() || formatStrategyChartTitle(chart),
    decisionLabel,
    contextLine,
    sourceStatus: trust.sourceStatus,
    sourceBadge: getStrategySourceLabel(chart),
    sourceHelper: getStrategySourceHelperText(chart),
    sourcePanelLabel: trust.sourcePanelLabel,
    sourcePanelGroup: trust.sourcePanelGroup,
    appDisplayLabel: trust.appDisplayLabel,
    sourceCoverageNote: trust.sourceCoverageNote,
    groupedSourcePanel: trust.groupedSourcePanel,
    provenanceLabel: trust.provenanceLabel,
    provenanceNote: trust.provenanceNote,
    sharedFamilyLabel: getSharedFamilySourceLabel(chart),
    trainerAllowed: trust.trainerAllowed,
    manuallyApprovedForTraining: trust.manuallyApprovedForTraining,
    notesConfidence: trust.notesConfidence,
    cellMapSource: trust.cellMapSource,
    trainingGateMessage: trust.trainerAllowed
      ? null
      : "Not yet reviewed. This spot can be inspected in the grid, but it must not be used as trainer answer truth yet.",
  };
}
