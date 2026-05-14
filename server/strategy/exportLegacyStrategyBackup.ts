import fs from "fs/promises";
import path from "path";
import { asc } from "drizzle-orm";
import {
  rangeChartActions,
  rangeCharts,
  trainerAttempts,
} from "../../drizzle/schema";
import { getDb } from "../db";

const OUTPUT_DIR = path.resolve(import.meta.dirname, "audits");

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function main() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available. Set DATABASE_URL before exporting legacy backup.");
  }

  const [charts, actions, attempts] = await Promise.all([
    db.select().from(rangeCharts).orderBy(asc(rangeCharts.id)),
    db.select().from(rangeChartActions).orderBy(asc(rangeChartActions.chartId), asc(rangeChartActions.id)),
    db.select().from(trainerAttempts).orderBy(asc(trainerAttempts.id)),
  ]);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(
    OUTPUT_DIR,
    `legacy-strategy-backup-${timestampSlug()}.json`
  );

  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        charts,
        actions,
        attempts,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Legacy strategy backup written to ${outputPath}`);
  console.log(`Charts: ${charts.length}, actions: ${actions.length}, attempts: ${attempts.length}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
