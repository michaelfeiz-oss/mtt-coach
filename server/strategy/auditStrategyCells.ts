import { and, asc, eq, inArray } from "drizzle-orm";
import { rangeChartActions, rangeCharts } from "../../drizzle/schema";
import { ALL_HANDS } from "../../shared/strategy";
import { getStrategyChartTrustMetadata } from "../../shared/sourceTruth";
import { getDb } from "../db";
import { SEED_CHARTS } from "./seedData";

interface AuditOptions {
  handCodes: string[];
  stackDepth?: number;
  spotKeys?: string[];
  dbMode: boolean;
}

function parseArgs(argv: string[]): AuditOptions {
  const options: AuditOptions = {
    handCodes: [],
    dbMode: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--db") {
      options.dbMode = true;
      continue;
    }

    if (arg === "--stack") {
      const next = argv[index + 1];
      const value = Number(next);
      if (Number.isFinite(value)) {
        options.stackDepth = value;
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--stack=")) {
      const value = Number(arg.slice("--stack=".length));
      if (Number.isFinite(value)) options.stackDepth = value;
      continue;
    }

    if (arg === "--spot") {
      const next = argv[index + 1];
      if (next) {
        options.spotKeys = next
          .split(",")
          .map(value => value.trim())
          .filter(Boolean);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--spot=")) {
      options.spotKeys = arg
        .slice("--spot=".length)
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
      continue;
    }

    const normalized = arg
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
    options.handCodes.push(...normalized);
  }

  const deduped = Array.from(new Set(options.handCodes));
  if (deduped.length === 0) {
    throw new Error("Provide one or more hand codes, for example: AJo or AJo,KQo");
  }

  const invalidHands = deduped.filter(handCode => !ALL_HANDS.includes(handCode));
  if (invalidHands.length > 0) {
    throw new Error(`Invalid hand codes: ${invalidHands.join(", ")}`);
  }

  options.handCodes = deduped;
  return options;
}

function matchesFilters(
  chart: { stackDepth: number; spotKey: string },
  options: AuditOptions
) {
  if (options.stackDepth !== undefined && chart.stackDepth !== options.stackDepth) {
    return false;
  }

  if (options.spotKeys && options.spotKeys.length > 0) {
    return options.spotKeys.includes(chart.spotKey);
  }

  return true;
}

function buildSeedRows(options: AuditOptions) {
  const rows = [];

  for (const chart of SEED_CHARTS.filter(candidate => matchesFilters(candidate, options))) {
    const trust = getStrategyChartTrustMetadata(chart);
    const actionByHand = new Map(
      chart.actions.map(action => [action.handCode, action.primaryAction])
    );

    for (const handCode of options.handCodes) {
      rows.push({
        source: "seed",
        stackDepth: chart.stackDepth,
        spotGroup: chart.spotGroup,
        spotKey: chart.spotKey,
        title: chart.title,
        heroPosition: chart.heroPosition,
        villainPosition: chart.villainPosition ?? "",
        handCode,
        action: actionByHand.get(handCode) ?? "<missing>",
        sourceLabel: chart.sourceLabel ?? "",
        sourceStatus: chart.sourceStatus ?? trust.sourceStatus,
        cellMapSource: chart.cellMapSource ?? trust.cellMapSource,
        reviewStatus: trust.reviewStatus ?? "candidate",
        trainerAllowed: trust.trainerAllowed,
        has169Cells: trust.has169Cells,
        structurallyComplete: trust.structurallyComplete,
        automatedIntegrityPassed: trust.automatedIntegrityPassed,
        ownerReviewed: trust.ownerReviewed,
        trainerEligibleForReviewDeployment:
          trust.trainerEligibleForReviewDeployment,
        trainerEligibleForFinalProduction:
          trust.trainerEligibleForFinalProduction,
        dataVersion: chart.dataVersion ?? trust.dataVersion ?? "",
        reviewedBy: chart.reviewedBy ?? trust.reviewedBy ?? "",
        reviewedAt: chart.reviewedAt ?? trust.reviewedAt ?? "",
        sourceFile: chart.sourceFile ?? trust.sourceFile ?? "",
        sourcePanelLabel: chart.sourcePanelLabel ?? trust.sourcePanelLabel ?? "",
      });
    }
  }

  return rows;
}

async function buildDbRows(options: AuditOptions) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available. Set DATABASE_URL and use --db.");
  }

  const chartConditions = [eq(rangeCharts.isActive, true)];
  if (options.stackDepth !== undefined) {
    chartConditions.push(eq(rangeCharts.stackDepth, options.stackDepth));
  }
  if (options.spotKeys && options.spotKeys.length > 0) {
    chartConditions.push(inArray(rangeCharts.spotKey, options.spotKeys));
  }

  const charts = await db
    .select()
    .from(rangeCharts)
    .where(and(...chartConditions))
    .orderBy(asc(rangeCharts.stackDepth), asc(rangeCharts.spotGroup), asc(rangeCharts.spotKey));

  const chartIds = charts.map(chart => chart.id);
  const actions =
    chartIds.length > 0
      ? await db
          .select()
          .from(rangeChartActions)
          .where(inArray(rangeChartActions.chartId, chartIds))
      : [];

  const actionsByChart = new Map<number, Map<string, string>>();
  for (const action of actions) {
    const byHand = actionsByChart.get(action.chartId) ?? new Map<string, string>();
    byHand.set(action.handCode, action.primaryAction);
    actionsByChart.set(action.chartId, byHand);
  }

  const rows = [];
  for (const chart of charts) {
    const trust = getStrategyChartTrustMetadata(chart);
    const actionByHand = actionsByChart.get(chart.id) ?? new Map<string, string>();

    for (const handCode of options.handCodes) {
      rows.push({
        source: "db",
        stackDepth: chart.stackDepth,
        spotGroup: chart.spotGroup,
        spotKey: chart.spotKey,
        title: chart.title,
        heroPosition: chart.heroPosition,
        villainPosition: chart.villainPosition ?? "",
        handCode,
        action: actionByHand.get(handCode) ?? "<missing>",
        sourceLabel: chart.sourceLabel ?? "",
        sourceStatus: chart.sourceStatus ?? trust.sourceStatus,
        cellMapSource: chart.cellMapSource ?? trust.cellMapSource,
        reviewStatus: trust.reviewStatus ?? "candidate",
        trainerAllowed: trust.trainerAllowed,
        has169Cells: trust.has169Cells,
        structurallyComplete: trust.structurallyComplete,
        automatedIntegrityPassed: trust.automatedIntegrityPassed,
        ownerReviewed: trust.ownerReviewed,
        trainerEligibleForReviewDeployment:
          trust.trainerEligibleForReviewDeployment,
        trainerEligibleForFinalProduction:
          trust.trainerEligibleForFinalProduction,
        dataVersion: chart.dataVersion ?? trust.dataVersion ?? "",
        reviewedBy: chart.reviewedBy ?? trust.reviewedBy ?? "",
        reviewedAt: chart.reviewedAt ?? trust.reviewedAt ?? "",
        sourceFile: chart.sourceFile ?? trust.sourceFile ?? "",
        sourcePanelLabel: chart.sourcePanelLabel ?? trust.sourcePanelLabel ?? "",
      });
    }
  }

  return rows;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const rows = options.dbMode
    ? await buildDbRows(options)
    : buildSeedRows(options);

  if (rows.length === 0) {
    console.log("No matching charts found.");
    return;
  }

  console.table(rows);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
