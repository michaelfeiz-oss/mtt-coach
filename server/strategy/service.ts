/**
 * server/strategy/service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Database query helpers for the strategy module.
 * All functions return raw Drizzle rows — no business logic here.
 *
 * CODEX TASK: Implement each function body using the Drizzle ORM.
 * Import db from "../db" (already configured).
 * Import schema tables from "../../drizzle/schema".
 *
 * Pattern used elsewhere in this project (see server/db.ts for reference):
 *   import { db } from "../db";
 *   import { rangeCharts, rangeChartActions, trainerAttempts } from "../../drizzle/schema";
 *   import { eq, and, desc } from "drizzle-orm";
 */

import { getDb } from "../db";
import {
  rangeCharts,
  rangeChartActions,
  trainerAttempts,
  type InsertRangeChart,
  type InsertRangeChartAction,
  type InsertTrainerAttempt,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { SpotGroup, RangeChartWithActions, TrainerStats, Action } from "../../shared/strategy";

// ─── Range chart queries ──────────────────────────────────────────────────────

/**
 * Get all active charts for a given stack depth and spot group.
 * Returns chart rows only (no actions).
 *
 * CODEX TASK: Implement using db.select().from(rangeCharts).where(...)
 */
export async function getChartsBySpot(
  stackDepth: number,
  spotGroup: SpotGroup,
  spotKey: string
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(rangeCharts)
    .where(
      and(
        eq(rangeCharts.stackDepth, stackDepth),
        eq(rangeCharts.spotGroup, spotGroup),
        eq(rangeCharts.spotKey, spotKey),
        eq(rangeCharts.isActive, true)
      )
    );
}

/**
 * Get a single chart with all its hand actions.
 * Returns null if not found.
 *
 * CODEX TASK: Implement — fetch chart row, then fetch all actions for that chartId.
 * Combine into RangeChartWithActions shape.
 */
export async function getChartWithActions(chartId: number): Promise<RangeChartWithActions | null> {
  const db = await getDb();
  if (!db) return null;
  const [chart] = await db
    .select()
    .from(rangeCharts)
    .where(eq(rangeCharts.id, chartId))
    .limit(1);

  if (!chart) return null;

  const actions = await db
    .select()
    .from(rangeChartActions)
    .where(eq(rangeChartActions.chartId, chartId));

  return {
    ...chart,
    spotGroup: chart.spotGroup as SpotGroup,
    villainPosition: chart.villainPosition ?? undefined,
    sourceLabel: chart.sourceLabel ?? undefined,
    notesJson: chart.notesJson ?? undefined,
    actions: actions.map((a) => ({
      handCode: a.handCode,
      primaryAction: a.primaryAction as Action,
      weightPercent: a.weightPercent ?? undefined,
      mixJson: a.mixJson ?? undefined,
      colorToken: a.colorToken ?? undefined,
      note: a.note ?? undefined,
    })),
  };
}

/**
 * List all available spots (distinct stackDepth + spotGroup + spotKey combos).
 * Used to populate the sidebar navigation.
 *
 * CODEX TASK: Implement using db.selectDistinct() or a group-by query.
 */
export async function listAvailableSpots() {
  const db = await getDb();
  if (!db) return [];
  return db
    .selectDistinct({
      stackDepth: rangeCharts.stackDepth,
      spotGroup: rangeCharts.spotGroup,
      spotKey: rangeCharts.spotKey,
      heroPosition: rangeCharts.heroPosition,
      villainPosition: rangeCharts.villainPosition,
      title: rangeCharts.title,
      id: rangeCharts.id,
    })
    .from(rangeCharts)
    .where(eq(rangeCharts.isActive, true));
}

// ─── Chart mutations ──────────────────────────────────────────────────────────

/**
 * Insert a new range chart and return the inserted id.
 *
 * CODEX TASK: Implement using db.insert(rangeCharts).values(data)
 */
export async function createChart(data: InsertRangeChart): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rangeCharts).values(data);
  return (result as any).insertId as number;
}

/**
 * Bulk-insert hand actions for a chart.
 *
 * CODEX TASK: Implement using db.insert(rangeChartActions).values(rows)
 */
export async function bulkInsertActions(rows: InsertRangeChartAction[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (rows.length === 0) return;
  await db.insert(rangeChartActions).values(rows);
}

// ─── Trainer queries ──────────────────────────────────────────────────────────

/**
 * Log a single trainer attempt.
 *
 * CODEX TASK: Implement using db.insert(trainerAttempts).values(data)
 */
export async function logTrainerAttempt(data: InsertTrainerAttempt): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(trainerAttempts).values(data);
}

/**
 * Get trainer stats for a user (overall accuracy + per-action breakdown).
 *
 * CODEX TASK: Implement — query trainerAttempts for userId, aggregate counts.
 * Return TrainerStats shape from shared/strategy.ts.
 */
export async function getTrainerStats(userId: number): Promise<TrainerStats> {
  const db = await getDb();
  if (!db) return { total: 0, correct: 0, accuracy: 0, byAction: {} as TrainerStats["byAction"] };
  const rows = await db
    .select()
    .from(trainerAttempts)
    .where(eq(trainerAttempts.userId, userId));

  const total = rows.length;
  const correct = rows.filter((r: typeof rows[number]) => r.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const byAction: TrainerStats["byAction"] = {} as TrainerStats["byAction"];
  for (const row of rows) {
    const a = row.correctAction as Action;
    if (!byAction[a]) byAction[a] = { total: 0, correct: 0 };
    byAction[a].total++;
    if (row.isCorrect) byAction[a].correct++;
  }

  return { total, correct, accuracy, byAction };
}

/**
 * Get recent trainer attempts for a user (last N).
 *
 * CODEX TASK: Implement using db.select().from(trainerAttempts).where(userId).orderBy(desc).limit(n)
 */
export async function getRecentAttempts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(trainerAttempts)
    .where(eq(trainerAttempts.userId, userId))
    .orderBy(desc(trainerAttempts.createdAt))
    .limit(limit);
}
