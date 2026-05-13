// Full DB audit — run with: pnpm exec tsx server/strategy/fullDbAudit.mjs
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const c = await mysql.createConnection(process.env.DATABASE_URL);

// 1. All chart metadata
const [charts] = await c.query(`
  SELECT 
    id, title, spotKey, spotGroup, heroPosition, villainPosition, stackDepth,
    sourceStatus, sourceFile, sourcePanelLabel, dataVersion, reviewedBy,
    cellMapSource, isActive, sourceLabel
  FROM rangeCharts
  ORDER BY stackDepth, spotGroup, heroPosition
`);

// 2. Action distribution per chart
const [actionDist] = await c.query(`
  SELECT 
    rca.chartId,
    rc.title,
    rc.spotKey,
    rc.stackDepth,
    rca.primaryAction,
    COUNT(*) as handCount
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  GROUP BY rca.chartId, rc.title, rc.spotKey, rc.stackDepth, rca.primaryAction
  ORDER BY rca.chartId, rca.primaryAction
`);

// 3. Total cells per chart
const [cellCounts] = await c.query(`
  SELECT chartId, COUNT(*) as totalCells
  FROM rangeChartActions
  GROUP BY chartId
  ORDER BY chartId
`);

// 4. Charts with != 169 cells (should be 0 for complete charts)
const [incompleteCells] = await c.query(`
  SELECT rca.chartId, rc.title, rc.spotKey, rc.stackDepth, COUNT(*) as totalCells
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  GROUP BY rca.chartId, rc.title, rc.spotKey, rc.stackDepth
  HAVING COUNT(*) != 169
  ORDER BY rca.chartId
`);

// 5. Charts with no actions at all
const [emptyCharts] = await c.query(`
  SELECT rc.id, rc.title, rc.spotKey, rc.stackDepth
  FROM rangeCharts rc
  LEFT JOIN rangeChartActions rca ON rca.chartId = rc.id
  WHERE rca.id IS NULL
  ORDER BY rc.id
`);

// 6. Spot key uniqueness — duplicate spotKey+stackDepth combos
const [dupSpots] = await c.query(`
  SELECT spotKey, stackDepth, COUNT(*) as chartCount, GROUP_CONCAT(id) as chartIds
  FROM rangeCharts
  GROUP BY spotKey, stackDepth
  HAVING COUNT(*) > 1
  ORDER BY chartCount DESC
`);

// 7. Charts where sourceStatus is not source_backed
const [nonSourceBacked] = await c.query(`
  SELECT id, title, spotKey, stackDepth, sourceStatus, cellMapSource
  FROM rangeCharts
  WHERE sourceStatus != 'source_backed'
  ORDER BY stackDepth, spotKey
`);

// 8. Sample: AJo cells across all charts to verify consistency
const [ajoSample] = await c.query(`
  SELECT rca.chartId, rc.title, rc.spotKey, rc.stackDepth, rca.primaryAction, rca.weightPercent, rca.colorToken
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  WHERE rca.handCode = 'AJo'
  ORDER BY rc.stackDepth, rc.spotKey
`);

// 9. Sample: K2s cells across all charts (the "wheel suited" controversy)
const [k2sSample] = await c.query(`
  SELECT rca.chartId, rc.title, rc.spotKey, rc.stackDepth, rca.primaryAction, rca.weightPercent, rca.colorToken
  FROM rangeChartActions rca
  JOIN rangeCharts rc ON rc.id = rca.chartId
  WHERE rca.handCode = 'K2s'
  ORDER BY rc.stackDepth, rc.spotKey
`);

// 10. Summary stats
const [summary] = await c.query(`
  SELECT 
    COUNT(DISTINCT rc.id) as totalCharts,
    COUNT(DISTINCT CASE WHEN rc.sourceStatus = 'source_backed' THEN rc.id END) as sourceBacked,
    COUNT(DISTINCT CASE WHEN rc.sourceStatus != 'source_backed' THEN rc.id END) as notSourceBacked,
    COUNT(rca.id) as totalCells,
    COUNT(DISTINCT rca.chartId) as chartsWithCells
  FROM rangeCharts rc
  LEFT JOIN rangeChartActions rca ON rca.chartId = rc.id
`);

const report = {
  summary: summary[0],
  charts,
  actionDistribution: actionDist,
  cellCounts,
  incompleteCells,
  emptyCharts,
  duplicateSpotKeys: dupSpots,
  nonSourceBackedCharts: nonSourceBacked,
  ajoSample,
  k2sSample,
};

const outPath = join(__dirname, 'audits/full_db_audit_result.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Audit complete. Results written to ${outPath}`);
console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(summary[0], null, 2));
console.log('\n=== INCOMPLETE CELLS (should be empty) ===');
console.log(JSON.stringify(incompleteCells, null, 2));
console.log('\n=== EMPTY CHARTS (no actions) ===');
console.log(JSON.stringify(emptyCharts, null, 2));
console.log('\n=== DUPLICATE SPOT KEYS ===');
console.log(JSON.stringify(dupSpots, null, 2));
console.log('\n=== NON-SOURCE-BACKED CHARTS ===');
console.log(JSON.stringify(nonSourceBacked, null, 2));
console.log('\n=== K2s SAMPLE (UTG wheel-suited check) ===');
console.log(JSON.stringify(k2sSample, null, 2));

await c.end();
