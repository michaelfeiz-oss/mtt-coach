import {
  displayPositionLabel,
  type Position,
  type SpotGroup,
} from "./strategy";

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

export type StrategyNotesConfidence =
  | "exact"
  | "simplified"
  | "heuristic"
  | "needs_review";

export type StrategyCellMapSource =
  | "imported"
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

const BASELINE_SOURCE_REVIEWED_AT = "2026-05-11";
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
  reviewedByHuman: boolean;
  reviewedAt: string | null;
  notesConfidence: StrategyNotesConfidence;
  cellMapSource: StrategyCellMapSource;
  sourcePanelLabel: string | null;
  sourcePanelGroup: string | null;
  appDisplayLabel: string;
  sourceCoverageNote: string | null;
  groupedSourcePanel: boolean;
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

function chartKeyFor(chart: StrategyChartLike) {
  return `${chart.stackDepth}:${chart.spotKey ?? `${chart.spotGroup}:${chart.heroPosition}:${chart.villainPosition ?? "NONE"}`}`;
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

  if (getStrategySourceStatus(chart) !== "source_backed") {
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

function defaultNotesConfidence(
  sourceStatus: StrategySourceStatus
): StrategyNotesConfidence {
  switch (sourceStatus) {
    case "source_backed":
      return "exact";
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
      return "imported";
    case "proxy":
      return chart.spotGroup === "BVB" ? "imported" : "manual";
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
        return hasImportedExactFacingThreeBetChart(chart)
          ? "source_backed"
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
  const trainerAllowed =
    sourceStatus === "source_backed" || manualApproval !== null;

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
      sourceStatus === "source_backed" || sourceStatus === "proxy"
        ? defaultSourceFile(chart.stackDepth)
        : null,
    sourceReference: defaultSourceReference(chart, sourceStatus),
    sourceChartName:
      sourceStatus === "unsupported"
        ? null
        : sourcePanelDescriptor.sourcePanelLabel ?? defaultSourceChartName(chart),
    trainerAllowed,
    manuallyApprovedForTraining: manualApproval !== null,
    approvalReason: manualApproval?.reason ?? null,
    reviewedByHuman:
      sourceStatus === "source_backed" || manualApproval !== null,
    reviewedAt:
      manualApproval?.approvedAt ??
      (sourceStatus === "source_backed" ? BASELINE_SOURCE_REVIEWED_AT : null),
    notesConfidence: defaultNotesConfidence(sourceStatus),
    cellMapSource: defaultCellMapSource(chart, sourceStatus),
    sourcePanelLabel: sourcePanelDescriptor.sourcePanelLabel,
    sourcePanelGroup: sourcePanelDescriptor.sourcePanelGroup,
    appDisplayLabel: buildAppDisplayLabel(chart),
    sourceCoverageNote: sourcePanelDescriptor.sourceCoverageNote,
    groupedSourcePanel: sourcePanelDescriptor.groupedSourcePanel,
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
  switch (getStrategySourceStatus(chart)) {
    case "source_backed":
      return "Exact source-backed chart from the reviewed tournament range set.";
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

  if (metadata.sourceStatus === "simplified_population") {
    return "This chart is study-only and blocked from training because it is a simplified population layer, not an exact source-backed chart.";
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
