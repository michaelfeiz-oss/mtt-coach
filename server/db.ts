import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, weeks, studySessions, tournaments, hands, leaks, handLeaks, InsertWeek, InsertStudySession, InsertTournament, InsertHand, InsertLeak } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "timezone", "goalsJson"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? undefined;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Week auto-assignment logic
 * Finds or creates a week for a given date and user, using their timezone
 */
export async function getOrCreateWeekForDate(userId: number, date: Date, timezone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate week boundaries (Monday to Sunday) in user's timezone
  const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const dayOfWeek = dateInTz.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days back to Monday
  
  const monday = new Date(dateInTz);
  monday.setDate(monday.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Check if week exists
  const [existingWeek] = await db
    .select()
    .from(weeks)
    .where(
      and(
        eq(weeks.userId, userId),
        gte(weeks.startDate, monday),
        lte(weeks.startDate, sunday)
      )
    )
    .limit(1);

  if (existingWeek) {
    return existingWeek;
  }

  // Create new week
  const [newWeek] = await db.insert(weeks).values({
    userId,
    startDate: monday,
    endDate: sunday,
    targetStudyHours: 7,
    targetSessions: 5,
    targetTournaments: 1
  });

  const [createdWeek] = await db.select().from(weeks).where(eq(weeks.id, newWeek.insertId)).limit(1);
  return createdWeek!;
}

// User profile helpers
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user;
}

export async function updateUserProfile(userId: number, updates: { timezone?: string; goalsJson?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(updates).where(eq(users.id, userId));
}

// Week helpers
export async function getWeekById(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [week] = await db.select().from(weeks).where(eq(weeks.id, weekId)).limit(1);
  return week;
}

export async function getUserWeeks(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(weeks).where(eq(weeks.userId, userId)).orderBy(desc(weeks.startDate)).limit(limit);
}

export async function getCurrentWeek(userId: number, timezone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return getOrCreateWeekForDate(userId, new Date(), timezone);
}

export async function updateWeek(weekId: number, updates: Partial<InsertWeek>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(weeks).set(updates).where(eq(weeks.id, weekId));
}

// Study session helpers
export async function createStudySession(session: InsertStudySession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(studySessions).values(session);
  const [created] = await db.select().from(studySessions).where(eq(studySessions.id, result.insertId)).limit(1);
  return created!;
}

export async function getStudySessionsByWeek(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(studySessions).where(eq(studySessions.weekId, weekId)).orderBy(desc(studySessions.date));
}

export async function getStudySessionById(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [session] = await db.select().from(studySessions).where(eq(studySessions.id, sessionId)).limit(1);
  return session;
}

export async function updateStudySession(sessionId: number, updates: Partial<InsertStudySession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(studySessions).set(updates).where(eq(studySessions.id, sessionId));
}

export async function deleteStudySession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(studySessions).where(eq(studySessions.id, sessionId));
}

// Tournament helpers
export async function createTournament(tournament: InsertTournament) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(tournaments).values(tournament);
  const [created] = await db.select().from(tournaments).where(eq(tournaments.id, result.insertId)).limit(1);
  return created!;
}

export async function getTournamentsByWeek(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(tournaments).where(eq(tournaments.weekId, weekId)).orderBy(desc(tournaments.date));
}

export async function getTournamentById(tournamentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return tournament;
}

export async function updateTournament(tournamentId: number, updates: Partial<InsertTournament>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tournaments).set(updates).where(eq(tournaments.id, tournamentId));
}

export async function deleteTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(tournaments).where(eq(tournaments.id, tournamentId));
}

// Hand helpers
export async function createHand(hand: InsertHand) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(hands).values(hand);
  const [created] = await db.select().from(hands).where(eq(hands.id, result.insertId)).limit(1);
  return created!;
}

export async function getHandsByTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(hands).where(eq(hands.tournamentId, tournamentId)).orderBy(desc(hands.createdAt));
}

export async function getHandsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(hands).where(eq(hands.userId, userId)).orderBy(desc(hands.createdAt)).limit(limit);
}

export async function getHandById(handId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [hand] = await db.select().from(hands).where(eq(hands.id, handId)).limit(1);
  return hand;
}

export async function updateHand(handId: number, updates: Partial<InsertHand>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(hands).set(updates).where(eq(hands.id, handId));
}

export async function deleteHand(handId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(hands).where(eq(hands.id, handId));
}

// Leak helpers
export async function createLeak(leak: InsertLeak) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(leaks).values(leak);
  const [created] = await db.select().from(leaks).where(eq(leaks.id, result.insertId)).limit(1);
  return created!;
}

export async function getUserLeaks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(leaks).where(eq(leaks.userId, userId)).orderBy(desc(leaks.lastSeenAt));
}

export async function getLeakById(leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [leak] = await db.select().from(leaks).where(eq(leaks.id, leakId)).limit(1);
  return leak;
}

export async function updateLeak(leakId: number, updates: Partial<InsertLeak>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(leaks).set(updates).where(eq(leaks.id, leakId));
}

export async function deleteLeak(leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(leaks).where(eq(leaks.id, leakId));
}

// Hand-Leak linking
export async function linkHandToLeak(handId: number, leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(handLeaks).values({ handId, leakId });
  
  // Update leak's handsLinkedCount
  await db.execute(sql`
    UPDATE ${leaks}
    SET handsLinkedCount = (SELECT COUNT(*) FROM ${handLeaks} WHERE leakId = ${leakId})
    WHERE id = ${leakId}
  `);
}

export async function unlinkHandFromLeak(handId: number, leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(handLeaks).where(and(eq(handLeaks.handId, handId), eq(handLeaks.leakId, leakId)));
  
  // Update leak's handsLinkedCount
  await db.execute(sql`
    UPDATE ${leaks}
    SET handsLinkedCount = (SELECT COUNT(*) FROM ${handLeaks} WHERE leakId = ${leakId})
    WHERE id = ${leakId}
  `);
}

export async function getLeaksForHand(handId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ leak: leaks })
    .from(handLeaks)
    .innerJoin(leaks, eq(handLeaks.leakId, leaks.id))
    .where(eq(handLeaks.handId, handId));
  
  return result.map(r => r.leak);
}

/**
 * Get top leaks for a user based on:
 * - Volume: number of hands linked
 * - Severity: average mistake severity
 * - Recency: how recently the leak was seen
 */
export async function getTopLeaks(userId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.execute(sql`
    SELECT 
      l.*,
      COALESCE(AVG(h.mistakeSeverity), 0) as avgSeverity,
      COALESCE(COUNT(hl.handId), 0) as handCount,
      DATEDIFF(NOW(), l.lastSeenAt) as daysSinceLastSeen
    FROM ${leaks} l
    LEFT JOIN ${handLeaks} hl ON l.id = hl.leakId
    LEFT JOIN ${hands} h ON hl.handId = h.id
    WHERE l.userId = ${userId} AND l.status IN ('ACTIVE', 'IMPROVING')
    GROUP BY l.id
    ORDER BY 
      (handCount * 0.4 + avgSeverity * 10 * 0.4 + (1 / (daysSinceLastSeen + 1)) * 100 * 0.2) DESC
    LIMIT ${limit}
  `);
  
  return (result as any)[0] as any[];
}

// Dashboard analytics
export async function getDashboardStats(userId: number, weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get week data
  const week = await getWeekById(weekId);
  if (!week) throw new Error("Week not found");
  
  // Study sessions stats
  const sessions = await getStudySessionsByWeek(weekId);
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalStudyHours = totalStudyMinutes / 60;
  
  // Tournament stats
  const tourneys = await getTournamentsByWeek(weekId);
  const totalNetResult = tourneys.reduce((sum, t) => sum + t.netResult, 0);
  
  // Hands reviewed
  const totalHandsReviewed = sessions.reduce((sum, s) => sum + s.handsReviewedCount, 0);
  
  return {
    week,
    studyHours: totalStudyHours,
    studyHoursTarget: week.targetStudyHours,
    sessionsCount: sessions.length,
    sessionsTarget: week.targetSessions,
    tournamentsCount: tourneys.length,
    tournamentsTarget: week.targetTournaments,
    netResult: totalNetResult,
    handsReviewed: totalHandsReviewed
  };
}
