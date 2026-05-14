import { SEED_CHARTS } from "./seedData";
import { loadStrategyCatalogChartsFromDb } from "./catalog";

interface CompareOptions {
  handCodes?: string[];
  failOnMismatch: boolean;
}

function parseArgs(argv: string[]): CompareOptions {
  const options: CompareOptions = {
    failOnMismatch: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--fail-on-mismatch") {
      options.failOnMismatch = true;
      continue;
    }

    if (arg === "--hand") {
      const next = argv[index + 1];
      if (next) {
        options.handCodes = next
          .split(",")
          .map(value => value.trim())
          .filter(Boolean);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith("--hand=")) {
      options.handCodes = arg
        .slice("--hand=".length)
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
    }
  }

  return options;
}

function chartKey(chart: { version: string; stackDepth: number; spotKey: string }) {
  return `${chart.version}:${chart.stackDepth}:${chart.spotKey}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dbCharts = (await loadStrategyCatalogChartsFromDb()) ?? [];

  const mismatches: Array<Record<string, string | number>> = [];
  const dbChartsByKey = new Map(dbCharts.map(chart => [chartKey(chart), chart]));
  const seedChartKeys = new Set(SEED_CHARTS.map(chartKey));

  for (const seedChart of SEED_CHARTS) {
    const key = chartKey(seedChart);
    const dbChart = dbChartsByKey.get(key);

    if (!dbChart) {
      mismatches.push({
        chartKey: key,
        type: "missing_chart",
        detail: "Typed node missing from DB",
      });
      continue;
    }

    const dbActionsByHand = new Map(
      dbChart.actions.map(action => [action.handCode, action.primaryAction])
    );
    const expectedHands = options.handCodes
      ? seedChart.actions.filter(action => options.handCodes!.includes(action.handCode))
      : seedChart.actions;

    for (const expected of expectedHands) {
      const dbAction = dbActionsByHand.get(expected.handCode);

      if (!dbAction) {
        mismatches.push({
          chartKey: key,
          handCode: expected.handCode,
          type: "missing_hand",
          detail: "Hand missing from DB node",
        });
        continue;
      }

      if (dbAction !== expected.primaryAction) {
        mismatches.push({
          chartKey: key,
          handCode: expected.handCode,
          type: "action_mismatch",
          detail: `seed=${expected.primaryAction}; db=${dbAction}`,
        });
      }
    }

    if (!options.handCodes) {
      const seedHands = new Set(seedChart.actions.map(action => action.handCode));
      for (const action of dbChart.actions) {
        if (!seedHands.has(action.handCode)) {
          mismatches.push({
            chartKey: key,
            handCode: action.handCode,
            type: "extra_hand",
            detail: "Hand exists in DB node but not in typed seed",
          });
        }
      }
    }
  }

  for (const dbChart of dbCharts) {
    const key = chartKey(dbChart);
    if (seedChartKeys.has(key)) continue;
    mismatches.push({
      chartKey: key,
      type: "extra_chart",
      detail: "Typed DB node exists but not in seed manifest",
    });
  }

  console.log(
    `Compared ${SEED_CHARTS.length} typed seed nodes against ${dbCharts.length} DB nodes.`
  );

  if (mismatches.length === 0) {
    console.log("No typed seed/DB mismatches found.");
    return;
  }

  console.table(mismatches);

  if (options.failOnMismatch) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
