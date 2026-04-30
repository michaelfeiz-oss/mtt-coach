/**
 * Idempotent migration: fix stale spotType values from the BvB → BVB enum rename.
 *
 * Safe to run multiple times. Updates only rows that still have the old values.
 * Run with: node scripts/migrate-spottype-bvb.mjs
 */
import { createConnection } from "mysql2/promise";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await createConnection(DATABASE_URL);

try {
  // 1. Check how many stale rows exist before migration
  const [before] = await conn.execute(
    "SELECT spotType, COUNT(*) as cnt FROM hands WHERE spotType IN ('BvB', 'BVB_SPOT') GROUP BY spotType"
  );
  console.log("Stale rows before migration:", before);

  // 2. Run the idempotent update
  const [result] = await conn.execute(
    "UPDATE hands SET spotType = 'BVB' WHERE spotType IN ('BvB', 'BVB_SPOT')"
  );
  console.log(`Rows updated: ${result.affectedRows}`);

  // 3. Verify no stale rows remain
  const [after] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM hands WHERE spotType IN ('BvB', 'BVB_SPOT')"
  );
  const remaining = after[0].cnt;
  if (remaining === 0) {
    console.log("✅ Migration complete. No stale BvB / BVB_SPOT rows remain.");
  } else {
    console.error(`❌ ${remaining} stale rows still remain after migration.`);
    process.exit(1);
  }

  // 4. Show current BVB count for confirmation
  const [bvbCount] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM hands WHERE spotType = 'BVB'"
  );
  console.log(`Current BVB hands in DB: ${bvbCount[0].cnt}`);
} finally {
  await conn.end();
}
