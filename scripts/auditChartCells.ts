import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildChartCellAuditRows } from "../server/strategy/trainerEligibilityAudit";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function escapeCsvValue(value: string | number | boolean) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv<Row extends Record<string, unknown>>(rows: Row[]) {
  if (rows.length === 0) return "";

  const columns = Object.keys(rows[0]);
  const lines = [
    columns.join(","),
    ...rows.map(row =>
      columns
        .map(column =>
          escapeCsvValue(
            typeof row[column] === "string" ||
              typeof row[column] === "number" ||
              typeof row[column] === "boolean"
              ? row[column]
              : row[column] === null || row[column] === undefined
                ? ""
                : JSON.stringify(row[column])
          )
        )
        .join(",")
    ),
  ];

  return lines.join("\n");
}

const rows = buildChartCellAuditRows();
const outputDirectory = join(process.cwd(), "server", "strategy", "audits");
mkdirSync(outputDirectory, { recursive: true });

const stamp = todayStamp();
const outputPath = join(outputDirectory, `chart_cell_audit_${stamp}.csv`);
writeFileSync(outputPath, toCsv(rows));

console.log(`Wrote ${rows.length} chart cell audit rows to ${outputPath}`);
