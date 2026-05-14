import type { HandAction } from "./preflopStrategy";

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

export type LegacySpotGroup =
  | "RFI"
  | "VS_UTG_RFI"
  | "VS_MP_RFI"
  | "VS_LP_RFI"
  | "VS_3BET"
  | "BVB";

export type TypedSpotGroup =
  | "rfi"
  | "facing_open_early"
  | "facing_open_middle"
  | "facing_open_late"
  | "facing_jam"
  | "sb_first_in"
  | "bb_vs_sb_open"
  | "bb_vs_sb_limp";

export type AnyStrategySpotGroup = LegacySpotGroup | TypedSpotGroup;

export interface StrategyChartLike {
  id?: number | null;
  stackDepth: number;
  spotGroup: AnyStrategySpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: string | null;
  spotKey?: string | null;
  reviewed?: boolean | null;
  sourceStatus?: StrategySourceStatus | null;
  sourceLabel?: string | null;
  cellMapSource?: StrategyCellMapSource | null;
  dataVersion?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  sourceFile?: string | null;
  sourcePanelLabel?: string | null;
  sourcePanelGroup?: string | null;
  sourceCoverageNote?: string | null;
  groupedSourcePanel?: boolean | null;
  actions?: HandAction[] | null;
}

export interface StrategyChartTrustMetadata {
  chartId: number | null;
  chartKey: string;
  stack: number;
  family: AnyStrategySpotGroup;
  heroPosition: string;
  villainPosition: string | null;
  villainGroup: string | null;
  playerCount: 9;
  anteType: "BBA";
  sourceStatus: StrategySourceStatus;
  sourceFile: string | null;
  sourceReference: string | null;
  sourceChartName: string | null;
  trainerAllowed: boolean;
  manuallyApprovedForTraining: boolean;
  approvalReason: string | null;
  hasReviewedData: boolean;
  reviewStatus: "reviewed" | "pending";
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

function chartKeyFor(chart: StrategyChartLike) {
  return [
    chart.stackDepth,
    chart.spotGroup,
    chart.heroPosition,
    chart.villainPosition ?? chart.villainGroup ?? "none",
    chart.spotKey ?? "no_spot_key",
  ].join(":");
}

function hasExplicitSourceStatus(
  value: string | null | undefined
): value is StrategySourceStatus {
  return (
    value === "source_backed" ||
    value === "imported_unreviewed" ||
    value === "generated_candidate" ||
    value === "proxy" ||
    value === "simplified_population" ||
    value === "unsupported"
  );
}

function getDefaultSourceStatus(chart: StrategyChartLike): StrategySourceStatus {
  if (chart.reviewed) return "source_backed";
  return "imported_unreviewed";
}

export function getStrategySourceStatus(
  chart: StrategyChartLike
): StrategySourceStatus {
  if (hasExplicitSourceStatus(chart.sourceStatus)) {
    return chart.sourceStatus;
  }
  return getDefaultSourceStatus(chart);
}

function getDefaultCellMapSource(
  sourceStatus: StrategySourceStatus,
  reviewed: boolean
): StrategyCellMapSource {
  if (reviewed) return "reviewed";
  if (sourceStatus === "generated_candidate") return "generated";
  if (sourceStatus === "proxy") return "manual";
  if (sourceStatus === "simplified_population") return "manual";
  return "imported_unreviewed";
}

export function getSimplifiedVsThreeBetFamily(chart: StrategyChartLike) {
  if (chart.spotGroup !== "VS_3BET") return null;

  const hero = chart.heroPosition;
  const villain = chart.villainPosition ?? "";
  const heroIsEarly = ["UTG", "UTG1", "UTG2", "MP"].includes(hero);
  const villainIsLate = ["CO", "BTN", "SB", "BB"].includes(villain);
  const heroIsLate = ["HJ", "LJ", "CO", "BTN"].includes(hero);

  if (heroIsEarly && villainIsLate) return "ep_vs_late_pressure";
  if (heroIsLate && villain === "BB") return "late_vs_blind_pressure";
  if (hero === "SB" && villain === "BB") return "sb_vs_bb_pressure";
  return "general_vs_three_bet";
}

export function getStrategyChartTrustMetadata(
  chart: StrategyChartLike
): StrategyChartTrustMetadata {
  const sourceStatus = getStrategySourceStatus(chart);
  const has169Cells = Array.isArray(chart.actions) ? chart.actions.length === 169 : false;
  const ownerReviewed =
    chart.reviewed === true && sourceStatus === "source_backed";
  const trainerAllowed = ownerReviewed && has169Cells;
  const reviewedBy =
    chart.reviewedBy?.trim() || (ownerReviewed ? "Manual typed seed" : null);
  const reviewedAt = chart.reviewedAt?.trim() || null;
  const appDisplayLabel =
    chart.sourceLabel?.trim() ||
    chart.spotKey?.trim() ||
    `${chart.heroPosition}:${chart.spotGroup}:${chart.villainPosition ?? chart.villainGroup ?? "none"}`;
  const notesConfidence: StrategyNotesConfidence =
    sourceStatus === "source_backed"
      ? "exact"
      : sourceStatus === "simplified_population" || sourceStatus === "proxy"
        ? "simplified"
        : sourceStatus === "generated_candidate"
          ? "heuristic"
          : "needs_review";
  const cellMapSource =
    chart.cellMapSource ?? getDefaultCellMapSource(sourceStatus, ownerReviewed);
  const provenanceLabel =
    sourceStatus === "source_backed"
      ? "Reviewed typed node"
      : sourceStatus === "imported_unreviewed"
        ? "Not yet reviewed"
        : sourceStatus === "generated_candidate"
          ? "Generated candidate"
          : sourceStatus === "proxy"
            ? "Proxy - study only"
            : sourceStatus === "simplified_population"
              ? "Simplified population - study only"
              : "Unsupported";

  const provenanceNote =
    sourceStatus === "source_backed"
      ? "This chart is generated from typed notation and marked reviewed."
      : sourceStatus === "imported_unreviewed"
        ? "Typed node exists, but it is not yet reviewed for training. Missing spots should stay unreviewed rather than guessed."
        : sourceStatus === "generated_candidate"
          ? "Candidate data exists for study only. It must be reviewed before trainer use."
          : sourceStatus === "proxy"
            ? "Proxy coverage is visible for study, but it must not be used as trainer answer truth."
            : sourceStatus === "simplified_population"
              ? "Simplified population coverage is visible for study, but it must not be used as trainer answer truth."
              : "Unsupported spot. Do not use for training.";

  return {
    chartId: chart.id ?? null,
    chartKey: chartKeyFor(chart),
    stack: chart.stackDepth,
    family: chart.spotGroup,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition ?? null,
    villainGroup: chart.villainGroup ?? null,
    playerCount: 9,
    anteType: "BBA",
    sourceStatus,
    sourceFile: chart.sourceFile ?? null,
    sourceReference: null,
    sourceChartName: chart.sourcePanelLabel ?? null,
    trainerAllowed,
    manuallyApprovedForTraining: false,
    approvalReason: null,
    hasReviewedData: ownerReviewed,
    reviewStatus: ownerReviewed ? "reviewed" : "pending",
    dataVersion: chart.dataVersion ?? null,
    reviewedBy,
    reviewedByHuman: ownerReviewed,
    reviewedAt,
    has169Cells,
    structurallyComplete: has169Cells,
    automatedIntegrityPassed: has169Cells,
    ownerReviewed,
    trainerEligibleForReviewDeployment: has169Cells,
    trainerEligibleForFinalProduction: trainerAllowed,
    notesConfidence,
    cellMapSource,
    sourcePanelLabel: chart.sourcePanelLabel ?? null,
    sourcePanelGroup: chart.sourcePanelGroup ?? null,
    appDisplayLabel,
    sourceCoverageNote: chart.sourceCoverageNote ?? null,
    groupedSourcePanel: Boolean(chart.groupedSourcePanel),
    provenanceLabel,
    provenanceNote,
  };
}

export function isTrainerAllowedStrategyChart(chart: StrategyChartLike) {
  return getStrategyChartTrustMetadata(chart).trainerAllowed;
}

export function isStudyVisibleStrategyChart(_chart: StrategyChartLike) {
  return true;
}

export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}

export function getStrategySourceLabel(chart: StrategyChartLike): string | null {
  switch (getStrategySourceStatus(chart)) {
    case "source_backed":
      return "Reviewed Seed";
    case "imported_unreviewed":
      return "Not Yet Reviewed";
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
  const trust = getStrategyChartTrustMetadata(chart);

  if (trust.trainerAllowed) {
    return "Typed notation node with complete reviewed coverage.";
  }

  if (trust.sourceStatus === "unsupported") {
    return "Source unavailable. Do not train this spot until reviewed.";
  }

  return "This typed node can be inspected in the grid, but it is not yet reviewed for trainer use.";
}

export function getSharedFamilySourceLabel(_chart: StrategyChartLike): string | null {
  return null;
}

export function getStrategyTrainingGateMessage(chart: StrategyChartLike) {
  const trust = getStrategyChartTrustMetadata(chart);

  if (trust.trainerAllowed) return null;
  return "Not yet reviewed. This spot is blocked from trainer until the typed range node is manually seeded and reviewed.";
}

export function getManualTrainingApproval() {
  return null;
}

export function listManualTrainingApprovals() {
  return [];
}
