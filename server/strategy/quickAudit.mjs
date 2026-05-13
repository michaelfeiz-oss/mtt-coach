import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const c = await mysql.createConnection(process.env.DATABASE_URL);

// 1. Chart metadata only
const [charts] = await c.query(`
  SELECT id, title, spotKey, spotGroup, heroPosition, villainPosition, stackDepth,
    sourceStatus, sourceFile, sourcePanelLabel, dataVersion, reviewedBy,
    cellMapSource, isActive, sourceLabel
  FROM rangeCharts
  ORDER BY stackDepth, spotGroup, heroPosition
`);

// 2. Cell counts per chart
const [cellCounts] = await c.query(`
  SELECT chartId, COUNT(*) as totalCells
  FROM rangeChartActions
  GROUP BY chartId
`);
const cellMap = {};
for (const r of cellCounts) cellMap[r.chartId] = r.totalCells;

// 3. Charts with != 169 cells
const incomplete = cellCounts.filter(r => r.totalCells !== 169);

// 4. Charts with no cells
const [emptyCharts] = await c.query(`
  SELECT rc.id, rc.title, rc.spotKey, rc.stackDepth
  FROM rangeCharts rc
  LEFT JOIN rangeChartActions rca ON rca.chartId = rc.id
  WHERE rca.id IS NULL
`);

// 5. Duplicate spotKey+stackDepth
const [dupSpots] = await c.query(`
  SELECT spotKey, stackDepth, COUNT(*) as cnt, GROUP_CONCAT(id ORDER BY id) as ids
  FROM rangeCharts
  GROUP BY spotKey, stackDepth
  HAVING COUNT(*) > 1
`);

// 6. Non-source-backed
const nonSourceBacked = charts.filter(r => r.sourceStatus !== 'source_backed');

// 7. K2s sample
const [k2s] = await c.query(`
  SELECT rca.chartId, rc.title, rc.spotKey, rc.stackDepth, rca.primaryAction, rca.weightPercent
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  WHERE rca.handCode = 'K2s'
  ORDER BY rc.stackDepth, rc.spotKey
  LIMIT 50
`);

// 8. AJo sample
const [ajo] = await c.query(`
  SELECT rca.chartId, rc.title, rc.spotKey, rc.stackDepth, rca.primaryAction, rca.weightPercent
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  WHERE rca.handCode = 'AJo'
  ORDER BY rc.stackDepth, rc.spotKey
  LIMIT 50
`);

// 9. Summary
const [sumRows] = await c.query(`SELECT COUNT(*) as n FROM rangeCharts`);
const [sumCells] = await c.query(`SELECT COUNT(*) as n FROM rangeChartActions`);

const report = {
  summary: {
    totalCharts: sumRows[0].n,
    totalCells: sumCells[0].n,
    chartsWithCells: Object.keys(cellMap).length,
    incompleteCharts: incomplete.length,
    emptyCharts: emptyCharts.length,
    duplicateSpotKeys: dupSpots.length,
    nonSourceBacked: nonSourceBacked.length,
  },
  charts: charts.map(ch => ({
    ...ch,
    cellCount: cellMap[ch.id] ?? 0,
  })),
  incompleteCharts: incomplete,
  emptyCharts,
  duplicateSpotKeys: dupSpots,
  nonSourceBackedCharts: nonSourceBacked,
  k2sSample: k2s,
  ajoSample: ajo,
};

const outPath = join(__dirname, 'audits/quick_audit_result.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log('=== AUDIT SUMMARY ===');
console.log(JSON.stringify(report.summary, null, 2));
console.log('\n=== INCOMPLETE CHARTS (not 169 cells) ===');
console.log(JSON.stringify(incomplete, null, 2));
console.log('\n=== EMPTY CHARTS ===');
console.log(JSON.stringify(emptyCharts, null, 2));
console.log('\n=== DUPLICATE SPOT KEYS ===');
console.log(JSON.stringify(dupSpots, null, 2));
console.log('\n=== NON-SOURCE-BACKED ===');
console.log(JSON.stringify(nonSourceBacked.map(r => `${r.spotKey}@${r.stackDepth}bb (${r.sourceStatus})`), null, 2));
console.log('\n=== K2s SAMPLE ===');
console.log(k2s.map(r => `${r.spotKey}@${r.stackDepth}bb: ${r.primaryAction}`).join('\n'));
console.log('\n=== AJo SAMPLE ===');
console.log(ajo.map(r => `${r.spotKey}@${r.stackDepth}bb: ${r.primaryAction}`).join('\n'));
console.log(`\nFull report: ${outPath}`);

await c.end();
