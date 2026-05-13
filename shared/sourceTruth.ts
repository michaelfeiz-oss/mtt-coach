import {
  displayPositionLabel,
  type Position,
  type SpotGroup,
} from "./strategy";
import {
  getReviewedStrategyChart,
  getReviewedStrategyChartGovernance,
  type ReviewedStrategyReviewStatus,
} from "./strategy-data/reviewed";

export const SOURCE_BACKED_MAIN_STACKS = [15, 25, 40] as const;
export type SourceBackedMainStack = (typeof SOURCE_BACKED_MAIN_STACKS)[number];

export const SIMPLIFIED_POPULATION_3BET_STACKS = [25, 40] as const;
export type SimplifiedPopulationThreeBetStack =
  (typeof SIMPLIFIED_POPULATION_3BET_STACKS)[number];

export type StrategySourceStatus =
  | "source_backed"
  | "imported_unreviewed"
  | "generated_candidate"
  | "proxy"
  | "simplified_population"
  | "unsupported";

export type StrategyNotesConfidence =
  | "exact"
  | "simplified"
  | "heuristic"
  | "needs_review";

export type StrategyCellMapSource =
  | "reviewed"
  | "imported_unreviewed"
  | "generated"
  | "manual"
  | "missing";

export type StrategyAnteType = "BBA";

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

interface ManualTrainingApproval {
  reason: string;
  approvedBy: string;
  approvedAt: string;
}

const MANUAL_TRAINING_APPROVALS: Record<string, ManualTrainingApproval> = {};

export interface StrategyChartLike {
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  spotKey?: string | null;
}

export interface StrategyChartTrustMetadata {
  chartId: number | null;
  chartKey: string;
  stack: number;
  family: SpotGroup;
  heroPosition: string;
  villainPosition: string | null;
  playerCount: 9;
  anteType: StrategyAnteType;
  sourceStatus: StrategySourceStatus;
  sourceFile: string | null;
  sourceReference: string | null;
  sourceChartName: string | null;
  trainerAllowed: boolean;
  manuallyApprovedForTraining: boolean;
  approvalReason: string | null;
  hasReviewedData: boolean;
  reviewStatus: ReviewedStrategyReviewStatus | null;
  dataVersion: string | null;
  reviewedBy: string | null;
  reviewedByHuman: boolean;
  reviewedAt: string | null;
  has169Cells: boolean;
  structurallyComplete: boolean;
  automatedIntegrityPassed: boolean;
  ownerReviewed: boolean;
  trainerEligibleForReviewDeployment: boolean;
  trainerEligibleForFinalProduction: boolean;
  notesConfidence: StrategyNotesConfidence;
  cellMapSource: StrategyCellMapSource;
  sourcePanelLabel: string | null;
  sourcePanelGroup: string | null;
  appDisplayLabel: string;
  sourceCoverageNote: string | null;
  groupedSourcePanel: boolean;
  provenanceLabel: string | null;
  provenanceNote: string | null;
}

const SOURCE_BACKED_3BET_HEROES = new Set<Position>([
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
]);

const IMPORTED_15BB_VS_3BET_KEYS = new Set([
  "UTG_vs_UTG1_3bet",
  "UTG_vs_BTN_3bet",
  "UTG_vs_SB_3bet",
  "UTG_vs_BB_3bet",
  "UTG1_vs_MP_3bet",
  "UTG1_vs_BTN_3bet",
  "UTG1_vs_SB_3bet",
  "UTG1_vs_BB_3bet",
  "MP_vs_BB_3bet",
  "HJ_vs_BB_3bet",
  "CO_vs_SB_3bet",
  "CO_vs_BB_3bet",
  "BTN_vs_BB_3bet",
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

function normalizePositionForSpotKey(position: string | null | undefined) {
  return position?.replace("+", "") ?? "";
}

function getFacingThreeBetSpotKey(chart: StrategyChartLike) {
  if (chart.spotKey) return chart.spotKey;
  if (chart.spotGroup !== "VS_3BET") return null;

  const hero = normalizePositionForSpotKey(chart.heroPosition);
  const villain = normalizePositionForSpotKey(chart.villainPosition ?? null);

  if (!hero || !villain) return null;
  return `${hero}_vs_${villain}_3bet`;
}

function hasImportedExactFacingThreeBetChart(chart: StrategyChartLike) {
  const spotKey = getFacingThreeBetSpotKey(chart);
  return spotKey ? IMPORTED_15BB_VS_3BET_KEYS.has(spotKey) : false;
}

function resolveStrategySpotKey(chart: StrategyChartLike) {
  if (chart.spotKey) return chart.spotKey;

  switch (chart.spotGroup) {
    case "RFI":
      return `${chart.heroPosition}_RFI`;
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return chart.villainPosition
        ? `${chart.heroPosition}_vs_${chart.villainPosition}`
        : null;
    case "VS_3BET":
      return getFacingThreeBetSpotKey(chart);
    case "BVB":
      if (chart.heroPosition === "SB" && chart.villainPosition === "BB") {
        return "SB_vs_BB_limp";
      }
      if (chart.heroPosition === "BB" && chart.villainPosition === "SB") {
        return "BB_vs_SB_limp";
      }
      return null;
  }
}

function chartKeyFor(chart: StrategyChartLike) {
  const resolvedSpotKey = resolveStrategySpotKey(chart);
  return `${chart.stackDepth}:${resolvedSpotKey ?? `${chart.spotGroup}:${chart.heroPosition}:${chart.villainPosition ?? "NONE"}`}`;
}

function defaultSourceFile(stackDepth: number): string | null {
  if (!(SOURCE_BACKED_MAIN_STACKS as readonly number[]).includes(stackDepth)) {
    return null;
  }

  return `${stackDepth}bb-gto-charts.pdf`;
}

function defaultSourceChartName(chart: StrategyChartLike): string {
  return chart.spotKey ?? `${chart.heroPosition}_${chart.spotGroup}`;
}

function buildAppDisplayLabel(chart: StrategyChartLike) {
  const heroLabel = displayPositionLabel(chart.heroPosition);
  const villainLabel = chart.villainPosition
    ? displayPositionLabel(chart.villainPosition)
    : null;

  switch (chart.spotGroup) {
    case "RFI":
      return `${heroLabel} RFI`;
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return villainLabel ? `${heroLabel} vs ${villainLabel}` : heroLabel;
    case "VS_3BET":
      return villainLabel ? `${heroLabel} vs ${villainLabel} 3-Bet` : heroLabel;
    case "BVB":
      if (chart.spotKey === "SB_vs_BB_limp") {
        return "SB vs BB (limp)";
      }
      if (chart.spotKey === "BB_vs_SB_limp") {
        return "BB vs SB limp";
      }
      return villainLabel ? `${heroLabel} vs ${villainLabel}` : heroLabel;
  }
}

interface StrategySourcePanelDescriptor {
  sourcePanelLabel: string | null;
  sourcePanelGroup: string | null;
  sourceCoverageNote: string | null;
  groupedSourcePanel: boolean;
}

interface StrategyReviewProvenanceDescriptor {
  provenanceLabel: string | null;
  provenanceNote: string | null;
}

function buildSourcePanelNote(
  appDisplayLabel: string,
  sourcePanelLabel: string,
  options?: {
    groupedSourcePanel?: boolean;
    sourcePanelGroup?: string | null;
  }
): StrategySourcePanelDescriptor {
  if (options?.groupedSourcePanel) {
    const groupLabel = options.sourcePanelGroup ?? sourcePanelLabel;
    return {
      sourcePanelLabel,
      sourcePanelGroup: options.sourcePanelGroup ?? null,
      sourceCoverageNote: `This chart is displayed as ${appDisplayLabel} in the app, but the source panel groups ${groupLabel}.`,
      groupedSourcePanel: true,
    };
  }

  return {
    sourcePanelLabel,
    sourcePanelGroup: null,
    sourceCoverageNote: `This chart is displayed as ${appDisplayLabel} in the app, but the source panel is labeled ${sourcePanelLabel}.`,
    groupedSourcePanel: false,
  };
}

function getStrategySourcePanelDescriptor(
  chart: StrategyChartLike
): StrategySourcePanelDescriptor {
  const appDisplayLabel = buildAppDisplayLabel(chart);
  const sourceStatus = getStrategySourceStatus(chart);

  if (
    sourceStatus !== "source_backed" &&
    sourceStatus !== "imported_unreviewed"
  ) {
    return {
      sourcePanelLabel: null,
      sourcePanelGroup: null,
      sourceCoverageNote: null,
      groupedSourcePanel: false,
    };
  }

  switch (chart.spotGroup) {
    case "RFI":
      switch (chart.heroPosition) {
        case "UTG":
          return {
            sourcePanelLabel: "UTG RFI",
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
        case "UTG1":
          return {
            sourcePanelLabel: "UTG+1 RFI",
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
        case "MP":
          return buildSourcePanelNote(appDisplayLabel, "UTG+2 RFI");
        case "HJ":
          return buildSourcePanelNote(appDisplayLabel, "Lojack RFI");
        case "CO":
          return {
            sourcePanelLabel: "Cutoff RFI",
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
        case "BTN":
          return {
            sourcePanelLabel: "Button RFI",
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
        case "SB":
          return {
            sourcePanelLabel: "Small Blind RFI",
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
        default:
          return {
            sourcePanelLabel: null,
            sourcePanelGroup: null,
            sourceCoverageNote: null,
            groupedSourcePanel: false,
          };
      }
    case "VS_UTG_RFI":
      if (chart.heroPosition === "UTG1" || chart.heroPosition === "MP") {
        return buildSourcePanelNote(appDisplayLabel, "UTG+1/+2 vs UTG RFI", {
          groupedSourcePanel: true,
          sourcePanelGroup: "UTG+1/+2",
        });
      }
      if (chart.heroPosition === "HJ") {
        return buildSourcePanelNote(appDisplayLabel, "LJ/HJ vs UTG RFI", {
          groupedSourcePanel: true,
          sourcePanelGroup: "LJ/HJ",
        });
      }
      return {
        sourcePanelLabel: `${displayPositionLabel(chart.heroPosition)} vs UTG RFI`,
        sourcePanelGroup: null,
        sourceCoverageNote: null,
        groupedSourcePanel: false,
      };
    case "VS_MP_RFI":
      if (chart.heroPosition === "HJ") {
        return buildSourcePanelNote(appDisplayLabel, "HJ vs LJ RFI");
      }
      if (
        chart.heroPosition === "CO" ||
        chart.heroPosition === "BTN" ||
        chart.heroPosition === "SB" ||
        chart.heroPosition === "BB"
      ) {
        return buildSourcePanelNote(
          appDisplayLabel,
          `${displayPositionLabel(chart.heroPosition)} vs LJ/HJ RFI`,
          {
            groupedSourcePanel: true,
            sourcePanelGroup: "LJ/HJ",
          }
        );
      }
      return {
        sourcePanelLabel: null,
        sourcePanelGroup: null,
        sourceCoverageNote: null,
        groupedSourcePanel: false,
      };
    case "VS_LP_RFI":
      return {
        sourcePanelLabel: chart.villainPosition
          ? `${displayPositionLabel(chart.heroPosition)} vs ${displayPositionLabel(chart.villainPosition)} RFI`
          : null,
        sourcePanelGroup: null,
        sourceCoverageNote: null,
        groupedSourcePanel: false,
      };
    case "VS_3BET":
    case "BVB":
      return {
        sourcePanelLabel: null,
        sourcePanelGroup: null,
        sourceCoverageNote: null,
        groupedSourcePanel: false,
      };
  }
}

function getStrategyReviewProvenanceDescriptor(
  reviewStatus: ReviewedStrategyReviewStatus | null,
  options: {
    structurallyComplete: boolean;
    automatedIntegrityPassed: boolean;
    ownerReviewed: boolean;
  }
): StrategyReviewProvenanceDescriptor {
  if (!reviewStatus) {
    return {
      provenanceLabel: null,
      provenanceNote: null,
    };
  }

  if (options.ownerReviewed) {
    return {
      provenanceLabel: "Owner-reviewed",
      provenanceNote:
        "Owner review is complete for this 169-cell chart.",
    };
  }

  if (options.automatedIntegrityPassed) {
    return {
      provenanceLabel: "Automated integrity pass",
      provenanceNote:
        "Complete 169-cell imported chart candidate - pending owner review before trainer use.",
    };
  }

  if (reviewStatus === "candidate") {
    return {
      provenanceLabel: "Pending owner review",
      provenanceNote:
        "Chart data exists, but the automated integrity pass is not complete yet.",
    };
  }

  if (options.structurallyComplete) {
    return {
      provenanceLabel: "Review metadata pending",
      provenanceNote:
        "Chart structure is complete, but review provenance is not finalized yet.",
    };
  }

  return {
    provenanceLabel: "Incomplete chart data",
    provenanceNote:
      "This chart is missing required integrity metadata and should stay blocked from training.",
  };
}

function defaultNotesConfidence(
  sourceStatus: StrategySourceStatus,
  ownerReviewed: boolean
): StrategyNotesConfidence {
  switch (sourceStatus) {
    case "source_backed":
      return ownerReviewed ? "exact" : "needs_review";
    case "imported_unreviewed":
      return "needs_review";
    case "generated_candidate":
      return "heuristic";
    case "simplified_population":
      return "simplified";
    case "proxy":
      return "heuristic";
    case "unsupported":
      return "needs_review";
  }
}

function defaultCellMapSource(
  chart: StrategyChartLike,
  sourceStatus: StrategySourceStatus
): StrategyCellMapSource {
  switch (sourceStatus) {
    case "source_backed":
      return "reviewed";
    case "imported_unreviewed":
      return "imported_unreviewed";
    case "generated_candidate":
      return "generated";
    case "proxy":
      return "manual";
    case "simplified_population":
      return "generated";
    case "unsupported":
      return "missing";
  }
}

function defaultSourceReference(
  chart: StrategyChartLike,
  sourceStatus: StrategySourceStatus
): string | null {
  const sourceFile = defaultSourceFile(chart.stackDepth);
  const panelDescriptor = getStrategySourcePanelDescriptor(chart);

  switch (sourceStatus) {
    case "source_backed":
      return sourceFile
        ? `Imported from ${sourceFile} using source panel ${panelDescriptor.sourcePanelLabel ?? defaultSourceChartName(chart)}.`
        : null;
    case "imported_unreviewed":
      return sourceFile
        ? `Imported candidate from ${sourceFile} using source panel ${panelDescriptor.sourcePanelLabel ?? defaultSourceChartName(chart)}. Not reviewed for trainer use yet.`
        : "Imported candidate chart. Not reviewed for trainer use yet.";
    case "generated_candidate":
      return "Generated candidate chart. Human review is required before trainer use.";
    case "simplified_population": {
      const familyLabel = getSimplifiedVsThreeBetFamilyLabel(chart);
      return familyLabel
        ? `Shared ${familyLabel} family. Practical simplified population layer only; not an exact PDF chart.`
        : "Shared simplified population layer. Not an exact PDF chart.";
    }
    case "proxy":
      return sourceFile
        ? `Study-only proxy branch derived from ${sourceFile} for blind-versus-blind coverage.`
        : "Study-only proxy branch. Exact source mapping is not established.";
    case "unsupported":
      return null;
  }
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
  const resolvedSpotKey = resolveStrategySpotKey(chart);
  const reviewedChart = resolvedSpotKey
    ? getReviewedStrategyChart({
        stackDepth: chart.stackDepth,
        spotKey: resolvedSpotKey,
      })
    : null;
  const reviewedGovernance = reviewedChart
    ? getReviewedStrategyChartGovernance(reviewedChart)
    : null;

  if (!isSourceBackedMainStack(chart.stackDepth)) {
    return "unsupported";
  }

  switch (chart.spotGroup) {
    case "RFI":
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return reviewedGovernance?.ownerReviewed
        ? "source_backed"
        : "imported_unreviewed";
    case "VS_3BET":
      if (!supportsFacingThreeBetHero(chart.heroPosition)) {
        return "unsupported";
      }

      if (chart.stackDepth === 15) {
        return hasImportedExactFacingThreeBetChart(chart)
          ? reviewedGovernance?.ownerReviewed
            ? "source_backed"
            : "imported_unreviewed"
          : "unsupported";
      }

      return isSimplifiedPopulationThreeBetStack(chart.stackDepth)
        ? "simplified_population"
        : "unsupported";
    case "BVB":
      return "proxy";
  }
}

export function getStrategyChartTrustMetadata(
  chart: StrategyChartLike & { id?: number | null }
): StrategyChartTrustMetadata {
  const chartKey = chartKeyFor(chart);
  const sourceStatus = getStrategySourceStatus(chart);
  const sourcePanelDescriptor = getStrategySourcePanelDescriptor(chart);
  const manualApproval = MANUAL_TRAINING_APPROVALS[chartKey] ?? null;
  const resolvedSpotKey = resolveStrategySpotKey(chart);
  const reviewedChart = resolvedSpotKey
    ? getReviewedStrategyChart({
        stackDepth: chart.stackDepth,
        spotKey: resolvedSpotKey,
      })
    : null;
  const reviewedGovernance = reviewedChart
    ? getReviewedStrategyChartGovernance(reviewedChart)
    : {
        has169Cells: false,
        structurallyComplete: false,
        automatedIntegrityPassed: false,
        ownerReviewed: false,
        trainerEligibleForReviewDeployment: false,
        trainerEligibleForFinalProduction: false,
      };
  const hasReviewedData = reviewedChart !== null;
  const reviewStatus = reviewedChart?.review.status ?? null;
  const trainerEligibleForReviewDeployment =
    sourceStatus === "source_backed" &&
    reviewedGovernance.trainerEligibleForReviewDeployment;
  const trainerEligibleForFinalProduction =
    manualApproval !== null ||
    (sourceStatus === "source_backed" &&
      reviewedGovernance.trainerEligibleForFinalProduction);
  const trainerAllowed =
    manualApproval !== null || trainerEligibleForReviewDeployment;
  const resolvedSourcePanelLabel =
    reviewedChart?.source.sourcePanelLabel ?? sourcePanelDescriptor.sourcePanelLabel;
  const resolvedSourcePanelGroup =
    reviewedChart?.source.sourcePanelGroup ?? sourcePanelDescriptor.sourcePanelGroup;
  const resolvedSourceCoverageNote =
    reviewedChart?.source.sourceCoverageNote ?? sourcePanelDescriptor.sourceCoverageNote;
  const resolvedAppDisplayLabel =
    reviewedChart?.source.appDisplayLabel ?? buildAppDisplayLabel(chart);
  const groupedSourcePanel =
    reviewedChart?.source.sourcePanelGroup !== null &&
    reviewedChart?.source.sourcePanelGroup !== undefined
      ? true
      : sourcePanelDescriptor.groupedSourcePanel;
  const provenanceDescriptor = getStrategyReviewProvenanceDescriptor(
    reviewStatus,
    reviewedGovernance
  );

  return {
    chartId: chart.id ?? null,
    chartKey,
    stack: chart.stackDepth,
    family: chart.spotGroup,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition ?? null,
    playerCount: 9,
    anteType: "BBA",
    sourceStatus,
    sourceFile:
      reviewedChart?.source.sourceFile ??
      (sourceStatus === "source_backed" ||
      sourceStatus === "imported_unreviewed" ||
      sourceStatus === "proxy"
        ? defaultSourceFile(chart.stackDepth)
        : null),
    sourceReference: defaultSourceReference(chart, sourceStatus),
    sourceChartName:
      sourceStatus === "unsupported"
        ? null
        : resolvedSourcePanelLabel ?? defaultSourceChartName(chart),
    trainerAllowed,
    manuallyApprovedForTraining: manualApproval !== null,
    approvalReason: manualApproval?.reason ?? null,
    hasReviewedData,
    reviewStatus,
    dataVersion: reviewedChart?.dataVersion ?? null,
    reviewedBy: reviewedChart?.review.reviewedBy ?? null,
    reviewedByHuman: reviewedGovernance.ownerReviewed,
    reviewedAt: reviewedChart?.review.reviewedAt ?? null,
    has169Cells: reviewedGovernance.has169Cells,
    structurallyComplete: reviewedGovernance.structurallyComplete,
    automatedIntegrityPassed: reviewedGovernance.automatedIntegrityPassed,
    ownerReviewed: reviewedGovernance.ownerReviewed,
    trainerEligibleForReviewDeployment,
    trainerEligibleForFinalProduction,
    notesConfidence: defaultNotesConfidence(
      sourceStatus,
      reviewedGovernance.ownerReviewed
    ),
    cellMapSource: defaultCellMapSource(chart, sourceStatus),
    sourcePanelLabel: resolvedSourcePanelLabel,
    sourcePanelGroup: resolvedSourcePanelGroup,
    appDisplayLabel: resolvedAppDisplayLabel,
    sourceCoverageNote: resolvedSourceCoverageNote,
    groupedSourcePanel,
    provenanceLabel: provenanceDescriptor.provenanceLabel,
    provenanceNote: provenanceDescriptor.provenanceNote,
  };
}

export function isTrainerAllowedStrategyChart(chart: StrategyChartLike) {
  return getStrategyChartTrustMetadata(chart).trainerAllowed;
}

export function isStudyVisibleStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}

// Backward-compatible alias for older consumers. In the hardened app this means
// "study-visible", not "trainer-safe".
export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return isStudyVisibleStrategyChart(chart);
}

export function getStrategySourceLabel(chart: StrategyChartLike): string | null {
  switch (getStrategySourceStatus(chart)) {
    case "source_backed":
      return "Source-backed";
    case "imported_unreviewed":
      return "Imported Candidate";
    case "generated_candidate":
      return "Generated Candidate";
    case "proxy":
      return "Proxy";
    case "simplified_population":
      return "Simplified Population";
    case "unsupported":
      return "Unsupported";
  }
}

export function getStrategySourceHelperText(
  chart: StrategyChartLike
): string | null {
  const sourceStatus = getStrategySourceStatus(chart);
  const metadata = getStrategyChartTrustMetadata(chart);

  switch (sourceStatus) {
    case "source_backed":
      if (metadata.ownerReviewed) {
        return "Owner-reviewed source-backed chart from the tournament range set.";
      }

      return "Source-backed chart metadata exists, but owner review provenance is incomplete.";
    case "imported_unreviewed":
      if (metadata.automatedIntegrityPassed) {
        return "Complete 169-cell imported chart candidate from the PDF extraction pipeline. Training stays blocked until owner review confirms the actions.";
      }

      return "Imported source candidate. Review is incomplete, so training stays blocked.";
    case "generated_candidate":
      return "Generated candidate chart. Training stays blocked until a reviewed 169-cell source exists.";
    case "proxy":
      return "Study-only proxy branch. Use it as a reference, not as a quiz answer key.";
    case "simplified_population":
      return "Simplified study note - not an exact source chart.";
    case "unsupported":
      return "Source unavailable. Do not train this spot until reviewed.";
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

export function getStrategyTrainingGateMessage(chart: StrategyChartLike) {
  const metadata = getStrategyChartTrustMetadata(chart);

  if (metadata.trainerAllowed) {
    return null;
  }

  if (metadata.sourceStatus === "source_backed") {
    return "This chart is blocked from training because owner review provenance is incomplete.";
  }

  if (metadata.sourceStatus === "simplified_population") {
    return "This chart is study-only and blocked from training because it is a simplified population layer, not an exact source-backed chart.";
  }

  if (metadata.sourceStatus === "imported_unreviewed") {
    if (metadata.automatedIntegrityPassed) {
      return "This chart is blocked from training because it is only an automated 169-cell import candidate. Owner review is still required before it can be used as answer truth.";
    }

    return "This chart is blocked from training because the imported source candidate has not completed the reviewed 169-cell audit yet.";
  }

  if (metadata.sourceStatus === "generated_candidate") {
    return "This chart is blocked from training because it is a generated candidate without reviewed source truth.";
  }

  if (metadata.sourceStatus === "proxy") {
    return "This chart is study-only and blocked from training because it is a proxy branch, not an exact source-backed chart.";
  }

  return "This chart is blocked from training because source evidence is missing.";
}

export function getManualTrainingApproval(
  chart: StrategyChartLike
): ManualTrainingApproval | null {
  return MANUAL_TRAINING_APPROVALS[chartKeyFor(chart)] ?? null;
}

export function listManualTrainingApprovals() {
  return Object.entries(MANUAL_TRAINING_APPROVALS).map(([chartKey, approval]) => ({
    chartKey,
    ...approval,
  }));
}
