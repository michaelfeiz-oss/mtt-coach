import { ALL_HANDS, ACTIONS, type Action, type Position, type SpotGroup } from "../../strategy";
import { REVIEWED_STRATEGY_CHARTS_RAW } from "./reviewedCharts.generated";

export const REVIEWED_STRATEGY_DATA_VERSION = "2026-05-13-reviewed-v1";

export type ReviewedStrategyReviewStatus = "reviewed";

export interface ReviewedStrategyReviewMeta {
  status: ReviewedStrategyReviewStatus;
}

export interface ReviewedStrategyChart {
  dataVersion: string;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: Position;
  villainPosition: Position | null;
  sourceFile: string;
  sourcePanelLabel: string;
  sourcePanelGroup: string | null;
  appDisplayLabel: string;
  sourceCoverageNote: string | null;
  reviewedBy: string;
  reviewedAt: string;
  review: ReviewedStrategyReviewMeta;
  actions: Record<string, Action>;
}

const VALID_ACTIONS = new Set<Action>(ACTIONS);

function normalizeRawChart(rawChart: (typeof REVIEWED_STRATEGY_CHARTS_RAW)[number]): ReviewedStrategyChart {
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
    spotGroup: rawChart.spotGroup,
    spotKey: rawChart.spotKey,
    heroPosition: rawChart.heroPosition as Position,
    villainPosition: (rawChart.villainPosition ?? null) as Position | null,
    sourceFile: rawChart.sourceFile,
    sourcePanelLabel: rawChart.sourcePanelLabel,
    sourcePanelGroup: rawChart.sourcePanelGroup ?? null,
    appDisplayLabel: rawChart.appDisplayLabel,
    sourceCoverageNote: rawChart.sourceCoverageNote ?? null,
    reviewedBy: rawChart.reviewedBy,
    reviewedAt: rawChart.reviewedAt,
    review: {
      status: rawChart.review.status,
    },
    actions,
  };
}

export const REVIEWED_STRATEGY_CHARTS: ReviewedStrategyChart[] =
  REVIEWED_STRATEGY_CHARTS_RAW.map(normalizeRawChart);

export function reviewedStrategyChartKey(chart: {
  stackDepth: number;
  spotKey: string;
}) {
  return `${chart.stackDepth}:${chart.spotKey}`;
}

export const REVIEWED_STRATEGY_CHART_MAP = new Map(
  REVIEWED_STRATEGY_CHARTS.map(chart => [reviewedStrategyChartKey(chart), chart])
);

export function getReviewedStrategyChart(chart: {
  stackDepth: number;
  spotKey: string;
}) {
  return REVIEWED_STRATEGY_CHART_MAP.get(reviewedStrategyChartKey(chart)) ?? null;
}

export function hasReviewedStrategyChart(chart: {
  stackDepth: number;
  spotKey: string;
}) {
  return REVIEWED_STRATEGY_CHART_MAP.has(reviewedStrategyChartKey(chart));
}

