import {
  REVIEWED_STRATEGY_DATA_VERSION,
  type ReviewedStrategyChart,
} from "./catalog";
import { REVIEWED_15BB_STRATEGY_CHARTS } from "./15bb";
import { REVIEWED_25BB_STRATEGY_CHARTS } from "./25bb";
import { REVIEWED_40BB_STRATEGY_CHARTS } from "./40bb";

export { REVIEWED_STRATEGY_DATA_VERSION };
export type {
  ReviewedStrategyChart,
  ReviewedStrategyGovernance,
  ReviewedStrategyReviewMeta,
  ReviewedStrategyReviewStatus,
  ReviewedStrategySourceMeta,
} from "./catalog";
export { getReviewedStrategyChartGovernance } from "./catalog";

export const REVIEWED_STRATEGY_CHARTS: ReviewedStrategyChart[] = [
  ...REVIEWED_15BB_STRATEGY_CHARTS,
  ...REVIEWED_25BB_STRATEGY_CHARTS,
  ...REVIEWED_40BB_STRATEGY_CHARTS,
];

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
