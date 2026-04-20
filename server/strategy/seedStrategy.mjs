/**
 * server/strategy/seedStrategy.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot seed script for the strategy module.
 * Run with: node server/strategy/seedStrategy.mjs
 *
 * CODEX TASK:
 *   This script is complete. Only modify if you change the seed data format.
 *   To add more charts, edit server/strategy/seedData.ts instead.
 *
 * What it does:
 *   1. Reads SEED_CHARTS from seedData (compiled via tsx/ts-node).
 *   2. For each chart, inserts a rangeCharts row.
 *   3. Bulk-inserts all hand actions for that chart.
 *   4. Skips charts that already exist (idempotent by title + stackDepth + spotKey).
 */

import { createRequire } from "module";
import { register } from "tsx/esm/api";

// Enable TypeScript imports
register();

const require = createRequire(import.meta.url);

async function main() {
  const { SEED_CHARTS } = await import("./seedData.ts");
  const { getDb } = await import("../db.ts");
  const { rangeCharts, rangeChartActions } = await import("../../drizzle/schema.ts");
  const { eq, and } = await import("drizzle-orm");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available. Set DATABASE_URL env var.");
    process.exit(1);
  }

  console.log(`🌱 Seeding ${SEED_CHARTS.length} strategy charts...`);

  for (const chart of SEED_CHARTS) {
    // Check if already exists
    const existing = await db
      .select({ id: rangeCharts.id })
      .from(rangeCharts)
      .where(
        and(
          eq(rangeCharts.title, chart.title),
          eq(rangeCharts.stackDepth, chart.stackDepth),
          eq(rangeCharts.spotKey, chart.spotKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`  ⏭  Skipping "${chart.title}" (already exists, id=${existing[0].id})`);
      continue;
    }

    // Insert chart
    const result = await db.insert(rangeCharts).values({
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition ?? null,
      sourceLabel: chart.sourceLabel ?? null,
      notesJson: chart.notes ? JSON.stringify(chart.notes) : null,
      isActive: true,
    });

    const chartId = result[0].insertId;
    console.log(`  ✅ Inserted chart "${chart.title}" (id=${chartId})`);

    // Bulk insert actions
    if (chart.actions.length > 0) {
      const actionRows = chart.actions.map((a) => ({
        chartId,
        handCode: a.handCode,
        primaryAction: a.primaryAction,
        weightPercent: a.weightPercent ?? null,
        mixJson: a.mixJson ?? null,
        colorToken: a.colorToken ?? null,
        note: a.note ?? null,
      }));

      // Insert in batches of 100 to avoid query size limits
      const BATCH = 100;
      for (let i = 0; i < actionRows.length; i += BATCH) {
        await db.insert(rangeChartActions).values(actionRows.slice(i, i + BATCH));
      }
      console.log(`     → Inserted ${chart.actions.length} hand actions`);
    }
  }

  console.log("✅ Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
