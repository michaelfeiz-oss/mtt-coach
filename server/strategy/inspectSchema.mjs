import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const c = await mysql.createConnection(process.env.DATABASE_URL);

const [cols] = await c.query('DESCRIBE rangeCharts');
console.log('=== rangeCharts columns ===');
console.log(cols.map(r => `${r.Field} (${r.Type})`).join('\n'));

const [actionCols] = await c.query('DESCRIBE rangeChartActions');
console.log('\n=== rangeChartActions columns ===');
console.log(actionCols.map(r => `${r.Field} (${r.Type})`).join('\n'));

await c.end();
