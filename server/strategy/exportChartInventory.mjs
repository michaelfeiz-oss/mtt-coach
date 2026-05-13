/**
 * exportChartInventory.mjs
 *
 * Full per-chart diagnostic export tool.
 * Produces:
 *   - audits/chart_inventory.json   — one row per chart with metadata + action distribution
 *   - audits/chart_inventory.md     — human-readable markdown table
 *   - audits/chart_inventory.csv    — spreadsheet-ready CSV
 *
 * Usage:
 *   node server/strategy/exportChartInventory.mjs
 *   node server/strategy/exportChartInventory.mjs --stack 25
 *   node server/strategy/exportChartInventory.mjs --spot BTN_RFI
 */

import { createConnection } from "mysql2/promise";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDITS_DIR = join(__dirname, "audits");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const args = process.argv.slice(2);
const stackFilter = args.includes("--stack") ? parseInt(args[args.indexOf("--stack") + 1]) : null;
const spotFilter = args.includes("--spot") ? args[args.indexOf("--spot") + 1] : null;

async function main() {
  mkdirSync(AUDITS_DIR, { recursive: true });

  const conn = await createConnection(DATABASE_URL);

  try {
    // Build WHERE clause
    const conditions = [];
    const params = [];
    if (stackFilter !== null) {
      conditions.push("c.stackDepth = ?");
      params.push(stackFilter);
    }
    if (spotFilter !== null) {
      conditions.push("c.spotKey = ?");
      params.push(spotFilter);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get all charts with action distribution
    const [charts] = await conn.execute(
      `SELECT
        c.id,
        c.title,
        c.stackDepth,
        c.spotGroup,
        c.spotKey,
        c.heroPosition,
        c.villainPosition,
        c.sourceStatus,
        c.cellMapSource,
        c.sourcePanelLabel,
        c.dataVersion,
        c.reviewedBy,
        c.reviewedAt,
        COUNT(a.id) as cellCount,
        SUM(CASE WHEN a.primaryAction = 'RAISE' THEN 1 ELSE 0 END) as raiseCount,
        SUM(CASE WHEN a.primaryAction = 'CALL' THEN 1 ELSE 0 END) as callCount,
        SUM(CASE WHEN a.primaryAction = 'FOLD' THEN 1 ELSE 0 END) as foldCount,
        SUM(CASE WHEN a.primaryAction NOT IN ('RAISE','CALL','FOLD') THEN 1 ELSE 0 END) as otherCount
      FROM rangeCharts c
      LEFT JOIN rangeChartActions a ON a.chartId = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.stackDepth, c.spotGroup, c.heroPosition, c.villainPosition`,
      params
    );

    const rows = charts.map(c => ({
      id: c.id,
      title: c.title,
      stackDepth: Number(c.stackDepth),
      spotGroup: c.spotGroup,
      spotKey: c.spotKey,
      heroPosition: c.heroPosition,
      villainPosition: c.villainPosition ?? null,
      sourceStatus: c.sourceStatus ?? "NULL",
      cellMapSource: c.cellMapSource ?? "NULL",
      sourcePanelLabel: c.sourcePanelLabel ?? null,
      dataVersion: c.dataVersion ?? null,
      reviewedBy: c.reviewedBy ?? null,
      reviewedAt: c.reviewedAt ?? null,
      cellCount: Number(c.cellCount),
      raiseCount: Number(c.raiseCount),
      callCount: Number(c.callCount),
      foldCount: Number(c.foldCount),
      otherCount: Number(c.otherCount),
      complete: Number(c.cellCount) === 169,
      raisePercent: Number(c.cellCount) > 0 ? Math.round((Number(c.raiseCount) / Number(c.cellCount)) * 100) : 0,
      callPercent: Number(c.cellCount) > 0 ? Math.round((Number(c.callCount) / Number(c.cellCount)) * 100) : 0,
      foldPercent: Number(c.cellCount) > 0 ? Math.round((Number(c.foldCount) / Number(c.cellCount)) * 100) : 0,
    }));

    // Summary stats
    const summary = {
      totalCharts: rows.length,
      completeCharts: rows.filter(r => r.complete).length,
      incompleteCharts: rows.filter(r => !r.complete).length,
      bySourceStatus: {},
      byStack: {},
      bySpotGroup: {},
    };

    for (const row of rows) {
      summary.bySourceStatus[row.sourceStatus] = (summary.bySourceStatus[row.sourceStatus] ?? 0) + 1;
      summary.byStack[row.stackDepth] = (summary.byStack[row.stackDepth] ?? 0) + 1;
      summary.bySpotGroup[row.spotGroup] = (summary.bySpotGroup[row.spotGroup] ?? 0) + 1;
    }

    // Write JSON
    const jsonPath = join(AUDITS_DIR, "chart_inventory.json");
    writeFileSync(jsonPath, JSON.stringify({ summary, charts: rows }, null, 2));
    console.log(`✓ JSON written: ${jsonPath}`);

    // Write CSV
    const csvHeaders = [
      "id","title","stackDepth","spotGroup","spotKey","heroPosition","villainPosition",
      "sourceStatus","cellMapSource","cellCount","complete","raiseCount","callCount","foldCount",
      "raisePercent","callPercent","foldPercent","sourcePanelLabel","dataVersion","reviewedBy","reviewedAt"
    ];
    const csvLines = [csvHeaders.join(",")];
    for (const r of rows) {
      csvLines.push([
        r.id, `"${r.title}"`, r.stackDepth, r.spotGroup, r.spotKey,
        r.heroPosition, r.villainPosition ?? "",
        r.sourceStatus, r.cellMapSource, r.cellCount, r.complete,
        r.raiseCount, r.callCount, r.foldCount,
        r.raisePercent, r.callPercent, r.foldPercent,
        `"${r.sourcePanelLabel ?? ""}"`, `"${r.dataVersion ?? ""}"`,
        `"${r.reviewedBy ?? ""}"`, `"${r.reviewedAt ?? ""}"`
      ].join(","));
    }
    const csvPath = join(AUDITS_DIR, "chart_inventory.csv");
    writeFileSync(csvPath, csvLines.join("\n"));
    console.log(`✓ CSV written: ${csvPath}`);

    // Write Markdown
    const mdLines = [
      "# Strategy Chart Inventory",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total charts | ${summary.totalCharts} |`,
      `| Complete (169 cells) | ${summary.completeCharts} |`,
      `| Incomplete | ${summary.incompleteCharts} |`,
      "",
      "### By Source Status",
      "",
      "| Status | Count |",
      "|--------|-------|",
      ...Object.entries(summary.bySourceStatus).map(([k, v]) => `| ${k} | ${v} |`),
      "",
      "### By Stack",
      "",
      "| Stack | Count |",
      "|-------|-------|",
      ...Object.entries(summary.byStack).sort(([a],[b]) => Number(a)-Number(b)).map(([k, v]) => `| ${k}bb | ${v} |`),
      "",
      "### By Spot Group",
      "",
      "| Spot Group | Count |",
      "|------------|-------|",
      ...Object.entries(summary.bySpotGroup).map(([k, v]) => `| ${k} | ${v} |`),
      "",
      "## Chart Detail",
      "",
      "| ID | Stack | Spot Group | Spot Key | Hero | Villain | Source Status | Cells | Complete | R% | C% | F% |",
      "|----|-------|------------|----------|------|---------|---------------|-------|----------|----|----|----|",
      ...rows.map(r =>
        `| ${r.id} | ${r.stackDepth}bb | ${r.spotGroup} | ${r.spotKey} | ${r.heroPosition} | ${r.villainPosition ?? "-"} | ${r.sourceStatus} | ${r.cellCount} | ${r.complete ? "✓" : "✗"} | ${r.raisePercent}% | ${r.callPercent}% | ${r.foldPercent}% |`
      ),
    ];
    const mdPath = join(AUDITS_DIR, "chart_inventory.md");
    writeFileSync(mdPath, mdLines.join("\n"));
    console.log(`✓ Markdown written: ${mdPath}`);

    // Print summary to console
    console.log("\n=== SUMMARY ===");
    console.log(`Total charts: ${summary.totalCharts}`);
    console.log(`Complete (169 cells): ${summary.completeCharts}`);
    console.log(`Incomplete: ${summary.incompleteCharts}`);
    console.log("\nBy source status:");
    for (const [k, v] of Object.entries(summary.bySourceStatus)) {
      console.log(`  ${k}: ${v}`);
    }
    console.log("\nBy stack:");
    for (const [k, v] of Object.entries(summary.byStack).sort(([a],[b]) => Number(a)-Number(b))) {
      console.log(`  ${k}bb: ${v}`);
    }

    // Flag any issues
    const incomplete = rows.filter(r => !r.complete);
    if (incomplete.length > 0) {
      console.log(`\n⚠️  INCOMPLETE CHARTS (${incomplete.length}):`);
      for (const r of incomplete) {
        console.log(`  [${r.id}] ${r.title} — ${r.cellCount} cells (sourceStatus: ${r.sourceStatus})`);
      }
    }

    const nullStatus = rows.filter(r => r.sourceStatus === "NULL");
    if (nullStatus.length > 0) {
      console.log(`\n⚠️  NULL SOURCE STATUS (${nullStatus.length}):`);
      for (const r of nullStatus) {
        console.log(`  [${r.id}] ${r.title}`);
      }
    }

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
