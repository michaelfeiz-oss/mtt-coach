import {
  PRELFOP_ANTE_FORMAT,
  PRELFOP_PLAYERS_COUNT,
} from "./preflopTaxonomy";
import {
  displayPositionLabel,
  SPOT_GROUP_LABELS,
  type SpotGroup,
} from "./strategy";
import {
  getSharedFamilySourceLabel,
  getStrategyChartTrustMetadata,
  getStrategySourceHelperText,
  getStrategySourceLabel,
  getStrategySourceStatus,
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

function formatVersusTitle(
  heroPosition: string,
  villainPosition: string | null | undefined,
  suffix: string
) {
  const hero = displayPositionLabel(heroPosition);
  const villain = villainPosition
    ? displayPositionLabel(villainPosition)
    : "No opener";
  return `${hero} vs ${villain}${suffix}`;
}

export function formatStrategyChartTitle(
  chart: StrategyPresentationChart
): string {
  const stackSuffix = ` @ ${chart.stackDepth}bb`;

  switch (chart.spotGroup) {
    case "RFI":
      return `${displayPositionLabel(chart.heroPosition)} RFI${stackSuffix}`;
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return `${formatVersusTitle(
        chart.heroPosition,
        chart.villainPosition,
        ""
      )}${stackSuffix}`;
    case "VS_3BET":
      return `${formatVersusTitle(
        chart.heroPosition,
        chart.villainPosition,
        " 3-Bet"
      )}${stackSuffix}`;
    case "BVB":
      if (chart.spotKey === "SB_vs_BB_limp") {
        return `SB vs BB (limp)${stackSuffix}`;
      }
      if (chart.spotKey === "BB_vs_SB_limp") {
        return `BB vs SB limp${stackSuffix}`;
      }
      return `${formatVersusTitle(
        chart.heroPosition,
        chart.villainPosition,
        ""
      )}${stackSuffix}`;
  }
}

export function buildStrategyChartPresentation(
  chart: StrategyPresentationChart
): StrategyChartPresentation {
  const decisionLabel = SPOT_GROUP_LABELS[chart.spotGroup].replace(
    " (Open Raise)",
    ""
  );
  const heroLabel = displayPositionLabel(chart.heroPosition);
  const villainLabel = chart.villainPosition
    ? displayPositionLabel(chart.villainPosition)
    : "Any / no opener";
  const trust = getStrategyChartTrustMetadata(chart);
  const sourceStatus = trust.sourceStatus;

  return {
    title: formatStrategyChartTitle(chart),
    decisionLabel,
    contextLine: `${decisionLabel} - ${heroLabel}${
      chart.villainPosition ? ` vs ${villainLabel}` : ""
    } - ${PRELFOP_PLAYERS_COUNT} players - ${PRELFOP_ANTE_FORMAT}`,
    sourceStatus,
    sourceBadge: getStrategySourceLabel(chart),
    sourceHelper: getStrategySourceHelperText(chart),
    sharedFamilyLabel: getSharedFamilySourceLabel(chart),
    trainerAllowed: trust.trainerAllowed,
    manuallyApprovedForTraining: trust.manuallyApprovedForTraining,
    notesConfidence: trust.notesConfidence,
    cellMapSource: trust.cellMapSource,
    trainingGateMessage: trust.trainerAllowed
      ? null
      : sourceStatus === "simplified_population"
        ? "Study-only simplified node. Training is blocked until a human approval exists."
        : sourceStatus === "proxy"
          ? "Study-only proxy node. Training is blocked until a human approval exists."
          : "Unsupported node. Training stays blocked until source evidence exists.",
  };
}
