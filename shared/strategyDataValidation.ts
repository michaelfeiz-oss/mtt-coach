import { pathToFileURL } from "node:url";
import { ACTIONS, ALL_HANDS, POSITIONS, SPOT_GROUPS, STACK_DEPTHS, type Action } from "./strategy";
import {
  REVIEWED_STRATEGY_CHARTS,
  REVIEWED_STRATEGY_DATA_VERSION,
  type ReviewedStrategyChart,
} from "./strategy-data/reviewed";

const VALID_HANDS = new Set(ALL_HANDS);
const VALID_ACTIONS = new Set<Action>(ACTIONS);
const VALID_STACKS = new Set<number>(STACK_DEPTHS);
const VALID_SPOT_GROUPS = new Set<string>(SPOT_GROUPS);
const VALID_POSITIONS = new Set<string>(POSITIONS);

function isIsoDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function validateReviewedStrategyChart(chart: ReviewedStrategyChart) {
  const chartLabel = `${chart.stackDepth}:${chart.spotKey}`;

  if (!VALID_STACKS.has(chart.stackDepth)) {
    throw new Error(`Reviewed chart ${chartLabel} has invalid stack depth ${chart.stackDepth}.`);
  }

  if (!VALID_SPOT_GROUPS.has(chart.spotGroup)) {
    throw new Error(`Reviewed chart ${chartLabel} has invalid spot group ${chart.spotGroup}.`);
  }

  if (!VALID_POSITIONS.has(chart.heroPosition)) {
    throw new Error(`Reviewed chart ${chartLabel} has invalid hero position ${chart.heroPosition}.`);
  }

  if (chart.villainPosition !== null && !VALID_POSITIONS.has(chart.villainPosition)) {
    throw new Error(
      `Reviewed chart ${chartLabel} has invalid villain position ${chart.villainPosition}.`
    );
  }

  if (chart.dataVersion.trim().length === 0) {
    throw new Error(`Reviewed chart ${chartLabel} is missing dataVersion.`);
  }

  if (chart.sourceFile.trim().length === 0) {
    throw new Error(`Reviewed chart ${chartLabel} is missing sourceFile.`);
  }

  if (chart.sourcePanelLabel.trim().length === 0) {
    throw new Error(`Reviewed chart ${chartLabel} is missing sourcePanelLabel.`);
  }

  if (chart.review.status !== "reviewed") {
    throw new Error(`Reviewed chart ${chartLabel} has invalid review status ${chart.review.status}.`);
  }

  if (chart.reviewedBy.trim().length === 0) {
    throw new Error(`Reviewed chart ${chartLabel} is missing reviewedBy.`);
  }

  if (chart.reviewedAt.trim().length === 0 || !isIsoDateLike(chart.reviewedAt)) {
    throw new Error(`Reviewed chart ${chartLabel} has invalid reviewedAt ${chart.reviewedAt}.`);
  }

  const actionEntries = Object.entries(chart.actions);
  const seenHands = new Set<string>();

  if (actionEntries.length !== ALL_HANDS.length) {
    throw new Error(
      `Reviewed chart ${chartLabel} must contain exactly ${ALL_HANDS.length} explicit hands; found ${actionEntries.length}.`
    );
  }

  for (const [handCode, action] of actionEntries) {
    if (!VALID_HANDS.has(handCode)) {
      throw new Error(`Reviewed chart ${chartLabel} has invalid hand code ${handCode}.`);
    }

    if (seenHands.has(handCode)) {
      throw new Error(`Reviewed chart ${chartLabel} duplicates hand code ${handCode}.`);
    }

    if (!VALID_ACTIONS.has(action)) {
      throw new Error(`Reviewed chart ${chartLabel} has invalid action ${action} for ${handCode}.`);
    }

    seenHands.add(handCode);
  }

  const missingHands = ALL_HANDS.filter(handCode => !seenHands.has(handCode));
  if (missingHands.length > 0) {
    throw new Error(
      `Reviewed chart ${chartLabel} is missing hands: ${missingHands.join(", ")}.`
    );
  }
}

export function validateReviewedStrategyCharts(
  charts: ReviewedStrategyChart[] = REVIEWED_STRATEGY_CHARTS
) {
  const seenCharts = new Set<string>();

  for (const chart of charts) {
    validateReviewedStrategyChart(chart);

    const chartKey = `${chart.stackDepth}:${chart.spotKey}`;
    if (seenCharts.has(chartKey)) {
      throw new Error(`Duplicate reviewed chart definition ${chartKey}.`);
    }
    seenCharts.add(chartKey);
  }

  return {
    charts: charts.length,
    dataVersion: REVIEWED_STRATEGY_DATA_VERSION,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = validateReviewedStrategyCharts();
  console.log(
    `Reviewed strategy data valid: ${result.charts} charts @ ${result.dataVersion}`
  );
}
