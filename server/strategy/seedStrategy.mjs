/**
 * One-shot seed script for the typed strategy module.
 * Run with: node server/strategy/seedStrategy.mjs
 *
 * This seeds the fresh typed strategy tables only:
 * - strategyNodes
 * - strategyNodeRanges
 *
 * Legacy rangeCharts / rangeChartActions are intentionally ignored.
 */

import { register } from "tsx/esm/api";

register();

async function main() {
  const { getDb } = await import("../db.ts");
  const {
    strategyNodes,
    strategyNodeRanges,
  } = await import("../../drizzle/schema.ts");
  const { and, eq } = await import("drizzle-orm");
  const {
    loadStrategySeedNodesSync,
  } = await import("./typedSeedFiles.ts");

  const nodes = loadStrategySeedNodesSync();
  const db = await getDb();
  if (!db) {
    console.error("Database not available. Set DATABASE_URL env var.");
    process.exit(1);
  }

  console.log(`Seeding ${nodes.length} typed strategy nodes...`);

  for (const node of nodes) {
    const existing = await db
      .select({ id: strategyNodes.id })
      .from(strategyNodes)
      .where(
        and(
          eq(strategyNodes.version, node.summary.version),
          eq(strategyNodes.stackBucket, node.summary.stackBucket),
          eq(strategyNodes.playerCount, node.summary.playerCount),
          eq(strategyNodes.scenarioFamily, node.summary.scenarioFamily),
          eq(strategyNodes.heroPosition, node.summary.heroPosition),
          eq(strategyNodes.spotKey, node.summary.spotKey)
        )
      )
      .limit(1);

    const nodeValues = {
      version: node.summary.version,
      stackBucket: node.summary.stackBucket,
      playerCount: node.summary.playerCount,
      scenarioFamily: node.summary.scenarioFamily,
      heroPosition: node.summary.heroPosition,
      villainPosition: node.summary.villainPosition ?? null,
      villainGroup: node.summary.villainGroup ?? null,
      spotKey: node.summary.spotKey,
      title: node.summary.title,
      sourceLabel: node.summary.sourceLabel,
      notes:
        node.rows
          .map(row => row.notes?.trim())
          .filter(Boolean)
          .filter((note, index, array) => array.indexOf(note) === index)
          .join("\n") || null,
      reviewed: node.summary.reviewed,
      structurallyComplete: node.summary.reviewed,
      isActive: true,
    };

    let nodeId;

    if (existing.length > 0) {
      nodeId = existing[0].id;
      await db.update(strategyNodes).set(nodeValues).where(eq(strategyNodes.id, nodeId));
      await db.delete(strategyNodeRanges).where(eq(strategyNodeRanges.nodeId, nodeId));
      console.log(`  Updated node "${node.summary.title}" (id=${nodeId})`);
    } else {
      const [result] = await db.insert(strategyNodes).values(nodeValues);
      nodeId = result.insertId;
      console.log(`  Inserted node "${node.summary.title}" (id=${nodeId})`);
    }

    if (node.rows.length > 0) {
      const rangeRows = node.rows.map(row => ({
        nodeId,
        action: row.action,
        rangeNotation: row.rangeNotation,
        priority: row.priority,
        notes: row.notes ?? null,
        reviewed: node.summary.reviewed,
      }));

      for (let index = 0; index < rangeRows.length; index += 100) {
        await db
          .insert(strategyNodeRanges)
          .values(rangeRows.slice(index, index + 100));
      }
      console.log(`     Inserted ${node.rows.length} notation rows`);
    }
  }

  console.log("Typed strategy seed complete.");
  process.exit(0);
}

main().catch(error => {
  console.error("Typed strategy seed failed:", error);
  process.exit(1);
});
