import { ALL_HANDS } from "../../shared/preflopStrategy";
import { getStrategyChartTrustMetadata } from "../../shared/sourceTruth";
import { SEED_CHARTS } from "./seedData";
import { loadStrategyCatalogChartsFromDb } from "./catalog";

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

    const handCodes = arg
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);
    options.handCodes.push(...handCodes);
  }

  options.handCodes = Array.from(new Set(options.handCodes));
  if (options.handCodes.length === 0) {
    throw new Error("Provide one or more hand codes, for example: AJo or AJo,KQo");
  }

  const invalid = options.handCodes.filter(handCode => !ALL_HANDS.includes(handCode));
  if (invalid.length > 0) {
    throw new Error(`Invalid hand codes: ${invalid.join(", ")}`);
  }

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

function buildRows(
  source: "seed" | "db",
  charts: typeof SEED_CHARTS,
  options: AuditOptions
) {
  return charts
    .filter(chart => matchesFilters(chart, options))
    .flatMap(chart => {
      const trust = getStrategyChartTrustMetadata(chart);
      const actionByHand = new Map(
        chart.actions.map(action => [action.handCode, action.primaryAction])
      );

      return options.handCodes.map(handCode => ({
        source,
        stackDepth: chart.stackDepth,
        spotGroup: chart.spotGroup,
        spotKey: chart.spotKey,
        title: chart.title,
        heroPosition: chart.heroPosition,
        villainPosition: chart.villainPosition ?? "",
        villainGroup: chart.villainGroup ?? "",
        handCode,
        action: actionByHand.get(handCode) ?? "<missing>",
        sourceStatus: trust.sourceStatus,
        cellMapSource: trust.cellMapSource,
        reviewStatus: trust.reviewStatus,
        reviewedAt: trust.reviewedAt ?? "",
        sourceLabel: chart.sourceLabel ?? trust.provenanceLabel ?? "",
        version: chart.version,
        reviewed: chart.reviewed,
        structurallyComplete: trust.structurallyComplete,
        trainerAllowed: trust.trainerAllowed,
      }));
    });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const charts = options.dbMode
    ? ((await loadStrategyCatalogChartsFromDb()) ?? [])
    : SEED_CHARTS;

  if (options.dbMode && charts.length === 0) {
    console.log("No typed strategy nodes found in DB.");
    return;
  }

  const rows = buildRows(options.dbMode ? "db" : "seed", charts as typeof SEED_CHARTS, options);
  if (rows.length === 0) {
    console.log("No matching typed strategy nodes found.");
    return;
  }

  console.table(rows);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
