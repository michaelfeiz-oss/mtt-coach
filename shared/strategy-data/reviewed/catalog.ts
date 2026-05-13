import {
  ALL_HANDS,
  ACTIONS,
  type Action,
  type Position,
  type SpotGroup,
} from "../../strategy";
import { REVIEWED_STRATEGY_CHARTS_RAW } from "./reviewedCharts.generated";

const VALID_ACTIONS = new Set<Action>(ACTIONS);

export const REVIEWED_STRATEGY_DATA_VERSION = "2026-05-13-reviewed-v1";

export type ReviewedStrategyReviewStatus =
  | "candidate"
  | "automated_integrity_pass"
  | "owner_reviewed";

export interface ReviewedStrategySourceMeta {
  sourceFile: string;
  sourcePanelLabel: string;
  sourcePanelGroup: string | null;
  appDisplayLabel: string;
  sourceCoverageNote: string | null;
}

export interface ReviewedStrategyReviewMeta {
  status: ReviewedStrategyReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
}

export interface ReviewedStrategyGovernance {
  has169Cells: boolean;
  structurallyComplete: boolean;
  automatedIntegrityPassed: boolean;
  ownerReviewed: boolean;
  trainerEligibleForReviewDeployment: boolean;
  trainerEligibleForFinalProduction: boolean;
}

export interface ReviewedStrategyChart {
  dataVersion: string;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: Position;
  villainPosition: Position | null;
  source: ReviewedStrategySourceMeta;
  review: ReviewedStrategyReviewMeta;
  actions: Record<string, Action>;
}

type ReviewedStrategyChartRaw = (typeof REVIEWED_STRATEGY_CHARTS_RAW)[number];

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeReviewedStrategyReviewStatus(
  rawStatus: string | undefined,
  reviewedBy: string
): ReviewedStrategyReviewStatus {
  switch (rawStatus) {
    case "candidate":
    case "automated_integrity_pass":
    case "owner_reviewed":
      return rawStatus;
    case "reviewed":
      return /codex/i.test(reviewedBy)
        ? "automated_integrity_pass"
        : "owner_reviewed";
    default:
      return "candidate";
  }
}

export function getReviewedStrategyChartGovernance(
  chart: ReviewedStrategyChart
): ReviewedStrategyGovernance {
  const has169Cells = ALL_HANDS.every(handCode => hasValue(chart.actions[handCode]));
  const structurallyComplete =
    has169Cells &&
    hasValue(chart.dataVersion) &&
    hasValue(chart.source.sourceFile) &&
    hasValue(chart.source.sourcePanelLabel) &&
    hasValue(chart.review.reviewedBy) &&
    hasValue(chart.review.reviewedAt);
  const automatedIntegrityPassed =
    structurallyComplete &&
    (chart.review.status === "automated_integrity_pass" ||
      chart.review.status === "owner_reviewed");
  const ownerReviewed =
    structurallyComplete && chart.review.status === "owner_reviewed";

  return {
    has169Cells,
    structurallyComplete,
    automatedIntegrityPassed,
    ownerReviewed,
    trainerEligibleForReviewDeployment:
      structurallyComplete && automatedIntegrityPassed,
    trainerEligibleForFinalProduction:
      structurallyComplete && automatedIntegrityPassed && ownerReviewed,
  };
}

export function normalizeReviewedRawChart(
  rawChart: ReviewedStrategyChartRaw
): ReviewedStrategyChart {
  const actions: Record<string, Action> = {};

  for (const handCode of ALL_HANDS) {
    const action = rawChart.actions[handCode as keyof typeof rawChart.actions];
    if (typeof action === "string" && VALID_ACTIONS.has(action as Action)) {
      actions[handCode] = action as Action;
    }
  }

  return {
    dataVersion: rawChart.dataVersion,
    title: rawChart.title,
    stackDepth: rawChart.stackDepth,
    spotGroup: rawChart.spotGroup as SpotGroup,
    spotKey: rawChart.spotKey,
    heroPosition: rawChart.heroPosition as Position,
    villainPosition: (rawChart.villainPosition ?? null) as Position | null,
    source: {
      sourceFile: rawChart.sourceFile,
      sourcePanelLabel: rawChart.sourcePanelLabel,
      sourcePanelGroup: rawChart.sourcePanelGroup ?? null,
      appDisplayLabel: rawChart.appDisplayLabel,
      sourceCoverageNote: rawChart.sourceCoverageNote ?? null,
    },
    review: {
      status: normalizeReviewedStrategyReviewStatus(
        rawChart.review?.status,
        rawChart.reviewedBy
      ),
      reviewedBy: rawChart.reviewedBy,
      reviewedAt: rawChart.reviewedAt,
    },
    actions,
  };
}

export function buildReviewedChartsForStack(stackDepth: number) {
  return REVIEWED_STRATEGY_CHARTS_RAW.filter(
    rawChart => rawChart.stackDepth === stackDepth
  ).map(normalizeReviewedRawChart);
}
