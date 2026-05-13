import { and, asc, eq } from "drizzle-orm";
import { rangeChartActions, rangeCharts } from "../../drizzle/schema";
import { getDb } from "../db";
import { SEED_CHARTS } from "./seedData";

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

function chartKey(chart: { stackDepth: number; spotKey: string }) {
  return `${chart.stackDepth}:${chart.spotKey}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available. Set DATABASE_URL before comparing seed to DB.");
  }

  const dbCharts = await db
    .select()
    .from(rangeCharts)
    .where(eq(rangeCharts.isActive, true))
    .orderBy(asc(rangeCharts.stackDepth), asc(rangeCharts.spotGroup), asc(rangeCharts.spotKey));

  const dbActions = await db
    .select()
    .from(rangeChartActions)
    .orderBy(asc(rangeChartActions.chartId), asc(rangeChartActions.handCode));

  const dbChartsByKey = new Map(dbCharts.map(chart => [chartKey(chart), chart]));
  const seedChartKeys = new Set(SEED_CHARTS.map(chartKey));
  const dbActionBuckets = new Map<number, typeof dbActions>();
  for (const action of dbActions) {
    const bucket = dbActionBuckets.get(action.chartId) ?? [];
    bucket.push(action);
    dbActionBuckets.set(action.chartId, bucket);
  }

  const mismatches: Array<Record<string, string | number>> = [];

  for (const seedChart of SEED_CHARTS) {
    const key = chartKey(seedChart);
    const dbChart = dbChartsByKey.get(key);

    if (!dbChart) {
      mismatches.push({
        chartKey: key,
        type: "missing_chart",
        detail: "Chart missing from DB",
      });
      continue;
    }

    const dbRows = dbActionBuckets.get(dbChart.id) ?? [];
    const dbRowsByHand = new Map<string, string[]>();
    for (const row of dbRows) {
      const bucket = dbRowsByHand.get(row.handCode) ?? [];
      bucket.push(row.primaryAction);
      dbRowsByHand.set(row.handCode, bucket);
    }

    const expectedHands = options.handCodes
      ? seedChart.actions.filter(action => options.handCodes!.includes(action.handCode))
      : seedChart.actions;

    for (const expected of expectedHands) {
      const dbActionsForHand = dbRowsByHand.get(expected.handCode) ?? [];
      if (dbActionsForHand.length === 0) {
        mismatches.push({
          chartKey: key,
          handCode: expected.handCode,
          type: "missing_hand",
          detail: "Hand missing from DB",
        });
        continue;
      }

      if (dbActionsForHand.length > 1) {
        mismatches.push({
          chartKey: key,
          handCode: expected.handCode,
          type: "duplicate_hand",
          detail: dbActionsForHand.join(", "),
        });
      }

      if (!dbActionsForHand.includes(expected.primaryAction)) {
        mismatches.push({
          chartKey: key,
          handCode: expected.handCode,
          type: "action_mismatch",
          detail: `seed=${expected.primaryAction}; db=${dbActionsForHand.join("|")}`,
        });
      }
    }

    if (!options.handCodes) {
      for (const handCode of Array.from(dbRowsByHand.keys())) {
        if (!seedChart.actions.some(action => action.handCode === handCode)) {
          mismatches.push({
            chartKey: key,
            handCode,
            type: "extra_hand",
            detail: "Extra hand exists in DB",
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
      detail: "Chart exists in DB but not in seed catalog",
    });
  }

  console.log(
    `Compared ${SEED_CHARTS.length} seed charts against ${dbCharts.length} DB charts.`
  );

  if (mismatches.length === 0) {
    console.log("No seed/DB mismatches found.");
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
