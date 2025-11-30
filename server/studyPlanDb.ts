import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { studySessions } from "../drizzle/schema";

/**
 * Get completed study plan slots for a given date range
 * Returns a Set of "YYYY-MM-DD_PLAN_SLOT" keys
 */
export async function getCompletedPlanSlots(
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<Set<string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const sessions = await db
    .select({
      date: studySessions.date,
      planSlot: studySessions.planSlot,
    })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        eq(studySessions.fromPlan, true),
        gte(studySessions.date, startDate),
        lte(studySessions.date, endDate)
      )
    );

  const completedSlots = new Set<string>();
  
  for (const session of sessions) {
    if (session.planSlot) {
      const dateKey = session.date.toISOString().split("T")[0]; // YYYY-MM-DD
      const slotKey = `${dateKey}_${session.planSlot}`;
      completedSlots.add(slotKey);
    }
  }

  return completedSlots;
}

/**
 * Check if a specific plan slot is completed for a given date
 */
export async function isPlanSlotCompleted(
  userId: number,
  date: Date,
  planSlot: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Set date range for the entire day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sessions = await db
    .select({ id: studySessions.id })
    .from(studySessions)
    .where(
      and(
        eq(studySessions.userId, userId),
        eq(studySessions.fromPlan, true),
        eq(studySessions.planSlot, planSlot),
        gte(studySessions.date, dayStart),
        lte(studySessions.date, dayEnd)
      )
    )
    .limit(1);

  return sessions.length > 0;
}
