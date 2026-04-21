/**
 * One-shot seed script for the strategy module.
 * Run with: node server/strategy/seedStrategy.mjs
 *
 * The script is idempotent by stackDepth + spotKey. Existing charts are
 * updated, and their action rows are replaced so seed fixes reach prod data.
 */

import { register } from "tsx/esm/api";

register();

async function main() {
  const { SEED_CHARTS, validateSeedCharts } = await import("./seedData.ts");
  const { getDb } = await import("../db.ts");
  const { rangeCharts, rangeChartActions } = await import("../../drizzle/schema.ts");
  const { eq, and } = await import("drizzle-orm");

  validateSeedCharts(SEED_CHARTS);

  const db = await getDb();
  if (!db) {
    console.error("Database not available. Set DATABASE_URL env var.");
    process.exit(1);
  }

  console.log(`Seeding ${SEED_CHARTS.length} strategy charts...`);

  for (const chart of SEED_CHARTS) {
    const existing = await db
      .select({ id: rangeCharts.id })
      .from(rangeCharts)
      .where(
        and(
          eq(rangeCharts.stackDepth, chart.stackDepth),
          eq(rangeCharts.spotKey, chart.spotKey)
        )
      )
      .limit(1);

    const chartValues = {
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition ?? null,
      sourceLabel: chart.sourceLabel ?? null,
      notesJson: chart.notes ? JSON.stringify(chart.notes) : null,
      isActive: true,
    };

    let chartId;

    if (existing.length > 0) {
      chartId = existing[0].id;
      await db.update(rangeCharts).set(chartValues).where(eq(rangeCharts.id, chartId));
      await db.delete(rangeChartActions).where(eq(rangeChartActions.chartId, chartId));
      console.log(`  Updated chart "${chart.title}" (id=${chartId})`);
    } else {
      const result = await db.insert(rangeCharts).values(chartValues);
      chartId = result[0].insertId;
      console.log(`  Inserted chart "${chart.title}" (id=${chartId})`);
    }

    if (chart.actions.length > 0) {
      const actionRows = chart.actions.map((action) => ({
        chartId,
        handCode: action.handCode,
        primaryAction: action.primaryAction,
        weightPercent: action.weightPercent ?? null,
        mixJson: action.mixJson ?? null,
        colorToken: action.colorToken ?? null,
        note: action.note ?? null,
      }));

      const batchSize = 100;
      for (let i = 0; i < actionRows.length; i += batchSize) {
        await db.insert(rangeChartActions).values(actionRows.slice(i, i + batchSize));
      }

      console.log(`     Inserted ${chart.actions.length} hand actions`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
