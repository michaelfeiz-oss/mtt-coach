import { loadStrategyCatalogChartsFromDb } from "./catalog";
import {
  describeSeedNode,
  loadStrategySeedNodesSync,
} from "./typedSeedFiles";
import { getStrategyChartTrustMetadata } from "../../shared/sourceTruth";

interface InspectOptions {
  dbMode: boolean;
  stackDepth?: number;
  spotKey?: string;
}

function parseArgs(argv: string[]): InspectOptions {
  const options: InspectOptions = {
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
        options.spotKey = next.trim();
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--spot=")) {
      options.spotKey = arg.slice("--spot=".length).trim();
    }
  }

  return options;
}

function matchesFilters(
  entry: { stackDepth: number; spotKey: string },
  options: InspectOptions
) {
  if (options.stackDepth !== undefined && entry.stackDepth !== options.stackDepth) {
    return false;
  }
  if (options.spotKey && entry.spotKey !== options.spotKey) {
    return false;
  }
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.dbMode) {
    const charts = ((await loadStrategyCatalogChartsFromDb()) ?? []).filter(chart =>
      matchesFilters(chart, options)
    );

    if (charts.length === 0) {
      console.log("No typed DB nodes found.");
      return;
    }

    console.table(
      charts.map(chart => {
        const trust = getStrategyChartTrustMetadata(chart);
        return {
          id: chart.id,
          version: chart.version,
          stackDepth: chart.stackDepth,
          spotGroup: chart.spotGroup,
          spotKey: chart.spotKey,
          title: chart.title,
          heroPosition: chart.heroPosition,
          villainPosition: chart.villainPosition ?? "",
          villainGroup: chart.villainGroup ?? "",
          reviewed: chart.reviewed,
          mappedHands: chart.actions.length,
          sourceStatus: trust.sourceStatus,
          trainerAllowed: trust.trainerAllowed,
          sourceLabel: chart.sourceLabel,
        };
      })
    );
    return;
  }

  const nodes = loadStrategySeedNodesSync()
    .map(describeSeedNode)
    .filter(node => matchesFilters({ stackDepth: node.stackDepth, spotKey: node.spotKey }, options));

  if (nodes.length === 0) {
    console.log("No typed seed nodes found.");
    return;
  }

  console.table(nodes);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
