import {
  ALL_HANDS,
  type SpotGroup,
} from "../../shared/preflopStrategy";
import {
  getStrategyChartTrustMetadata,
  isStudyVisibleStrategyChart,
  type StrategyCellMapSource,
  type StrategyChartTrustMetadata,
} from "../../shared/sourceTruth";
import { SEED_CHARTS, type SeedChart } from "./seedData";

const FULL_MATRIX_CELL_COUNT = ALL_HANDS.length;

export const HIGH_RISK_HANDS = [
  "AA",
  "KK",
  "QQ",
  "JJ",
  "TT",
  "99",
  "88",
  "77",
  "66",
  "55",
  "44",
  "33",
  "22",
  "AKs",
  "AQs",
  "AJs",
  "ATs",
  "A5s",
  "A4s",
  "A3s",
  "A2s",
  "AKo",
  "AQo",
  "AJo",
  "ATo",
  "KQs",
  "KJs",
  "KTs",
  "KQo",
  "KJo",
  "QJs",
  "QTs",
  "QJo",
  "JTs",
  "T9s",
  "98s",
  "87s",
  "76s",
  "65s",
  "54s",
] as const;

export interface FullChartInventoryRow {
  chartId: string;
  stack: number;
  family: SpotGroup;
  heroPosition: string;
  villainPosition: string;
  playerCount: number;
  anteType: string;
  sourceStatus: string;
  sourceFile: string;
  sourceReference: string;
  sourceChartName: string;
  trainerAllowed: boolean;
  manuallyApprovedForTraining: boolean;
  appearsInViewer: boolean;
  appearsInTrainer: boolean;
  appearsInDrillPack: boolean;
  appearsInWeakSpotEngine: boolean;
  cellCount: number;
  nonFoldCellCount: number;
  sourceMappedCellCount: number;
  generatedCellCount: number;
  missingCellCount: number;
  notesConfidence: string;
  passFail: "PASS" | "FAIL";
  reason: string;
}

export interface ChartCellAuditRow {
  chartId: string;
  stack: number;
  family: SpotGroup;
  heroPosition: string;
  villainPosition: string;
  hand: string;
  appAction: string;
  sourceAction: string;
  sourceStatus: string;
  sourceFile: string;
  sourceReference: string;
  cellSource: StrategyCellMapSource | "n_a";
  matchYesNo: "yes" | "no" | "n_a";
  isHighRiskHand: boolean;
  changedYesNo: "yes" | "no" | "n_a";
  reason: string;
}

export interface TrainerEligibilityAuditSummary {
  totalCharts: number;
  appearsInViewerCount: number;
  trainerAllowedCount: number;
  blockedCount: number;
  sourceBackedCount: number;
  simplifiedCount: number;
  proxyCount: number;
  unsupportedCount: number;
  manuallyApprovedCount: number;
  needsHumanReviewCount: number;
  failedInventoryCount: number;
  exactSourceGapCount: number;
}

function buildChartId(chart: SeedChart) {
  return `${chart.stackDepth}:${chart.spotKey}`;
}

function countNonFoldCells(chart: SeedChart) {
  return chart.actions.filter(action => action.primaryAction !== "FOLD").length;
}

function getInventoryReason(
  chart: SeedChart,
  trust: StrategyChartTrustMetadata,
  missingCellCount: number
) {
  if (trust.trainerAllowed) {
    return "Reviewed typed node is structurally complete and trainer-safe.";
  }
  if (missingCellCount > 0) {
    return "Typed node is incomplete. Missing spots must stay unreviewed instead of guessed.";
  }
  return "Typed node exists for study only and is not yet reviewed for trainer use.";
}

export function buildFullChartInventoryRows(
  charts: SeedChart[] = SEED_CHARTS
): FullChartInventoryRow[] {
  return charts.map(chart => {
    const trust = getStrategyChartTrustMetadata(chart);
    const appearsInViewer = isStudyVisibleStrategyChart(chart);
    const appearsInTrainer = trust.trainerAllowed;
    const appearsInDrillPack = false;
    const appearsInWeakSpotEngine = trust.trainerAllowed;
    const missingCellCount = Math.max(0, FULL_MATRIX_CELL_COUNT - chart.actions.length);
    const reason = getInventoryReason(chart, trust, missingCellCount);
    const passFail =
      trust.trainerAllowed && missingCellCount > 0 ? "FAIL" : "PASS";

    return {
      chartId: buildChartId(chart),
      stack: chart.stackDepth,
      family: chart.spotGroup,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition ?? chart.villainGroup ?? "NONE",
      playerCount: trust.playerCount,
      anteType: trust.anteType,
      sourceStatus: trust.sourceStatus,
      sourceFile: trust.sourceFile ?? "",
      sourceReference: "",
      sourceChartName: trust.sourceChartName ?? "",
      trainerAllowed: trust.trainerAllowed,
      manuallyApprovedForTraining: trust.manuallyApprovedForTraining,
      appearsInViewer,
      appearsInTrainer,
      appearsInDrillPack,
      appearsInWeakSpotEngine,
      cellCount: chart.actions.length,
      nonFoldCellCount: countNonFoldCells(chart),
      sourceMappedCellCount: trust.sourceStatus === "source_backed" ? chart.actions.length : 0,
      generatedCellCount: 0,
      missingCellCount,
      notesConfidence: trust.notesConfidence,
      passFail,
      reason,
    };
  });
}

function getCellReason(
  trust: StrategyChartTrustMetadata,
  hasAction: boolean
): ChartCellAuditRow["reason"] {
  if (trust.sourceStatus === "source_backed") {
    return hasAction
      ? "Reviewed typed action is the source of truth for this hand."
      : "Reviewed typed node is missing this hand and should fail validation.";
  }

  return hasAction
    ? "Typed study node exists, but it is not yet reviewed for trainer truth."
    : "Hand is not covered by this study-only typed node yet.";
}

export function buildChartCellAuditRows(
  charts: SeedChart[] = SEED_CHARTS
): ChartCellAuditRow[] {
  return charts.flatMap(chart => {
    const trust = getStrategyChartTrustMetadata(chart);
    const actionMap = new Map(
      chart.actions.map(action => [action.handCode, action.primaryAction])
    );

    return HIGH_RISK_HANDS.map(hand => {
      const appAction = actionMap.get(hand) ?? "";
      const sourceAction = trust.sourceStatus === "source_backed" ? appAction : "";
      const isReviewed = trust.sourceStatus === "source_backed";

      return {
        chartId: buildChartId(chart),
        stack: chart.stackDepth,
        family: chart.spotGroup,
        heroPosition: chart.heroPosition,
        villainPosition: chart.villainPosition ?? chart.villainGroup ?? "NONE",
        hand,
        appAction,
        sourceAction,
        sourceStatus: trust.sourceStatus,
        sourceFile: trust.sourceFile ?? "",
        sourceReference: "",
        cellSource: trust.cellMapSource ?? "n_a",
        matchYesNo: isReviewed ? "yes" : "n_a",
        isHighRiskHand: true,
        changedYesNo: isReviewed ? "no" : "n_a",
        reason: getCellReason(trust, Boolean(appAction)),
      };
    });
  });
}

export function summarizeTrainerEligibilityAudit(
  rows: FullChartInventoryRow[]
): TrainerEligibilityAuditSummary {
  return rows.reduce<TrainerEligibilityAuditSummary>(
    (summary, row) => {
      summary.totalCharts += 1;
      if (row.appearsInViewer) summary.appearsInViewerCount += 1;
      if (row.trainerAllowed) summary.trainerAllowedCount += 1;
      if (!row.trainerAllowed) summary.blockedCount += 1;
      if (row.manuallyApprovedForTraining) summary.manuallyApprovedCount += 1;
      if (row.notesConfidence === "needs_review") summary.needsHumanReviewCount += 1;
      if (row.passFail === "FAIL") summary.failedInventoryCount += 1;
      if (row.sourceStatus === "source_backed" && row.sourceMappedCellCount === 0) {
        summary.exactSourceGapCount += 1;
      }

      switch (row.sourceStatus) {
        case "source_backed":
          summary.sourceBackedCount += 1;
          break;
        case "simplified_population":
          summary.simplifiedCount += 1;
          break;
        case "proxy":
          summary.proxyCount += 1;
          break;
        case "unsupported":
          summary.unsupportedCount += 1;
          break;
      }

      return summary;
    },
    {
      totalCharts: 0,
      appearsInViewerCount: 0,
      trainerAllowedCount: 0,
      blockedCount: 0,
      sourceBackedCount: 0,
      simplifiedCount: 0,
      proxyCount: 0,
      unsupportedCount: 0,
      manuallyApprovedCount: 0,
      needsHumanReviewCount: 0,
      failedInventoryCount: 0,
      exactSourceGapCount: 0,
    }
  );
}
