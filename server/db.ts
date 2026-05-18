import { eq, desc, and, gte, sql, type SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, weeks, studySessions, tournaments, hands, leaks, handLeaks, userNotes, InsertWeek, InsertStudySession, InsertTournament, InsertHand, InsertLeak, InsertUserNote } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getLeakFamily, findLeakFamilyByLabel, type CanonicalLeakFamilyId } from "../shared/leakFamilies";
import type { HandReviewStatus } from "../shared/coachingLoop";

let _db: ReturnType<typeof drizzle> | null = null;
type AppDb = NonNullable<Awaited<ReturnType<typeof getDb>>>;

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
  const dayOfWeek = dateInTz.getDay(); // 0 = Sunday, 1 = Monday, ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday-based
  
  const startDate = new Date(dateInTz);
  startDate.setDate(startDate.getDate() - daysFromMonday);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  // Check if week exists
  const existing = await db
    .select()
    .from(weeks)
    .where(
      and(
        eq(weeks.userId, userId),
        eq(weeks.startDate, startDate),
        eq(weeks.endDate, endDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new week
  const [newWeek] = await db.insert(weeks).values({
    userId,
    startDate,
    endDate,
  });

  return (await db.select().from(weeks).where(eq(weeks.id, newWeek.insertId)).limit(1))[0];
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function getWeekById(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(weeks).where(eq(weeks.id, weekId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// Study Sessions
export async function createStudySession(session: InsertStudySession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(studySessions).values(session);
  return (await db.select().from(studySessions).where(eq(studySessions.id, result.insertId)).limit(1))[0];
}

export async function getStudySessionsByWeek(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(studySessions).where(eq(studySessions.weekId, weekId)).orderBy(desc(studySessions.date));
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

// Tournaments
export async function createTournament(tournament: InsertTournament) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(tournaments).values(tournament);
  return (await db.select().from(tournaments).where(eq(tournaments.id, result.insertId)).limit(1))[0];
}

export async function getTournamentsByWeek(weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.select().from(tournaments).where(eq(tournaments.weekId, weekId)).orderBy(desc(tournaments.date));
}

export async function getTournamentsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(tournaments)
    .where(eq(tournaments.userId, userId))
    .orderBy(desc(tournaments.date))
    .limit(limit);
}

export async function getTournamentById(tournamentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// Hands
export async function createHand(hand: InsertHand) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(hands).values(hand);
  return (await db.select().from(hands).where(eq(hands.id, result.insertId)).limit(1))[0];
}

export async function getHandById(handId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(hands).where(eq(hands.id, handId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export interface GetHandsByUserOptions {
  limit?: number;
  reviewStatus?: HandReviewStatus;
  leakFamilyId?: CanonicalLeakFamilyId | null;
  spotType?: string | null;
}

export async function getHandsByUser(
  userId: number,
  options: number | GetHandsByUserOptions = 50
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedOptions: GetHandsByUserOptions =
    typeof options === "number" ? { limit: options } : options;
  const limit = normalizedOptions.limit ?? 50;
  const reviewStatus = normalizedOptions.reviewStatus ?? "all";
  const leakFamily = normalizedOptions.leakFamilyId
    ? getLeakFamily(normalizedOptions.leakFamilyId)
    : null;

  const conditions = [eq(hands.userId, userId)];

  if (reviewStatus === "needs_review") {
    conditions.push(eq(hands.reviewed, false));
  } else if (reviewStatus === "reviewed") {
    conditions.push(eq(hands.reviewed, true));
  } else if (reviewStatus === "high_severity") {
    conditions.push(gte(hands.mistakeSeverity, 2));
  }

  if (normalizedOptions.spotType) {
    conditions.push(eq(hands.spotType, normalizedOptions.spotType as any));
  }

  const query = db
    .select({ hand: hands })
    .from(hands)
    .where(and(...conditions))
    .orderBy(desc(hands.createdAt))
    .limit(limit);

  if (!leakFamily) {
    const result = await query;
    return result.map(row => row.hand);
  }

  const result = await db
    .select({ hand: hands })
    .from(hands)
    .innerJoin(handLeaks, eq(handLeaks.handId, hands.id))
    .innerJoin(leaks, eq(handLeaks.leakId, leaks.id))
    .where(
      and(
        ...conditions,
        eq(leaks.name, leakFamily.label)
      )
    )
    .orderBy(desc(hands.createdAt))
    .limit(limit);

  return result.map(row => row.hand);
}

export async function getHandsByTournament(tournamentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(hands).where(eq(hands.tournamentId, tournamentId)).orderBy(desc(hands.createdAt));
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

// Live notes
let userNotesSchemaReady = false;
let userNotesSchemaSetup: Promise<void> | null = null;

type InformationSchemaColumn = {
  columnName?: string;
  COLUMN_NAME?: string;
};

type InformationSchemaIndex = {
  indexName?: string;
  INDEX_NAME?: string;
};

type InformationSchemaTable = {
  tableName?: string;
  TABLE_NAME?: string;
};

type UserNoteInsertRow = Required<
  Pick<InsertUserNote, "id" | "userId" | "category" | "content">
> &
  Pick<InsertUserNote, "title" | "createdAt" | "updatedAt">;

function getRawQueryRows<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) {
    return result[0] as T[];
  }

  return [];
}

function getDbErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  const maybeError = error as {
    code?: unknown;
    errno?: unknown;
    message?: unknown;
    sqlMessage?: unknown;
  };
  const sqlMessage =
    typeof maybeError.sqlMessage === "string" ? maybeError.sqlMessage : undefined;
  const message = typeof maybeError.message === "string" ? maybeError.message : undefined;
  const code = typeof maybeError.code === "string" ? maybeError.code : undefined;
  const errno =
    typeof maybeError.errno === "number" || typeof maybeError.errno === "string"
      ? String(maybeError.errno)
      : undefined;

  return [code, errno, sqlMessage || message].filter(Boolean).join(": ");
}

function isIgnorableUserNotesSchemaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|duplicate column|duplicate key name|ER_DUP_FIELDNAME|ER_DUP_KEYNAME/i.test(message);
}

async function runUserNotesSchemaChange(db: AppDb, description: string, statement: SQL) {
  try {
    await db.execute(statement);
  } catch (error) {
    if (isIgnorableUserNotesSchemaError(error)) {
      return;
    }

    console.warn(`[Notes] Could not apply schema change (${description})`, error);
    throw error;
  }
}

async function userNotesTableExists(db: AppDb) {
  const result = await db.execute<InformationSchemaTable>(sql`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'userNotes'
    LIMIT 1
  `);

  return getRawQueryRows<InformationSchemaTable>(result).length > 0;
}

async function getUserNotesColumns(db: AppDb) {
  const result = await db.execute<InformationSchemaColumn>(sql`
    SELECT COLUMN_NAME AS columnName
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'userNotes'
  `);

  return new Set(
    getRawQueryRows<InformationSchemaColumn>(result)
      .map(row => row.columnName ?? row.COLUMN_NAME ?? "")
      .filter(Boolean)
  );
}

async function getUserNotesIndexes(db: AppDb) {
  const result = await db.execute<InformationSchemaIndex>(sql`
    SELECT INDEX_NAME AS indexName
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'userNotes'
  `);

  return new Set(
    getRawQueryRows<InformationSchemaIndex>(result)
      .map(row => row.indexName ?? row.INDEX_NAME ?? "")
      .filter(Boolean)
  );
}

async function ensureUserNotesTable(db: AppDb) {
  if (userNotesSchemaReady) {
    return;
  }

  if (!userNotesSchemaSetup) {
    userNotesSchemaSetup = (async () => {
      const hasUserNotesTable = await userNotesTableExists(db);

      if (!hasUserNotesTable) {
        await db.execute(sql`
          CREATE TABLE userNotes (
            id int AUTO_INCREMENT NOT NULL,
            userId int NOT NULL,
            category varchar(80) NOT NULL DEFAULT 'general',
            title varchar(255),
            content text NOT NULL,
            createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
          )
        `);
      }

      const columns = await getUserNotesColumns(db);

      if (!columns.has("id")) {
        await runUserNotesSchemaChange(
          db,
          "add id",
          sql`ALTER TABLE userNotes ADD COLUMN id int NOT NULL DEFAULT 0 FIRST`
        );
        columns.add("id");
      }

      if (!columns.has("userId")) {
        await runUserNotesSchemaChange(
          db,
          "add userId",
          sql`ALTER TABLE userNotes ADD COLUMN userId int NOT NULL DEFAULT 1`
        );
        columns.add("userId");
      }

      if (!columns.has("category")) {
        await runUserNotesSchemaChange(
          db,
          "add category",
          sql`ALTER TABLE userNotes ADD COLUMN category varchar(80) NOT NULL DEFAULT 'general'`
        );
        columns.add("category");
      }

      if (!columns.has("title")) {
        await runUserNotesSchemaChange(
          db,
          "add title",
          sql`ALTER TABLE userNotes ADD COLUMN title varchar(255)`
        );
        columns.add("title");
      }

      if (!columns.has("content")) {
        await runUserNotesSchemaChange(
          db,
          "add content",
          sql`ALTER TABLE userNotes ADD COLUMN content text`
        );
        columns.add("content");
      }

      if (!columns.has("createdAt")) {
        await runUserNotesSchemaChange(
          db,
          "add createdAt",
          sql`ALTER TABLE userNotes ADD COLUMN createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`
        );
        columns.add("createdAt");
      }

      if (!columns.has("updatedAt")) {
        await runUserNotesSchemaChange(
          db,
          "add updatedAt",
          sql`ALTER TABLE userNotes ADD COLUMN updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
        );
        columns.add("updatedAt");
      }

      const indexes = await getUserNotesIndexes(db);
      if (!indexes.has("user_notes_user_created_idx")) {
        try {
          await runUserNotesSchemaChange(
            db,
            "add created index",
            sql`CREATE INDEX user_notes_user_created_idx ON userNotes (userId, createdAt)`
          );
        } catch (error) {
          console.warn("[Notes] Continuing without userNotes created index", error);
        }
      }

      await db.execute(
        sql`UPDATE userNotes SET category = 'general' WHERE category IS NULL OR category = ''`
      );
      await db.execute(sql`UPDATE userNotes SET content = '' WHERE content IS NULL`);
      userNotesSchemaReady = true;
    })().catch((error) => {
      userNotesSchemaSetup = null;
      throw error;
    });
  }

  await userNotesSchemaSetup;
}

async function tryEnsureUserNotesTable(db: AppDb) {
  try {
    await ensureUserNotesTable(db);
  } catch (error) {
    console.warn("[Notes] Continuing after userNotes schema check failed", error);
  }
}

async function ensureLiveNotesUser(db: AppDb, userId: number) {
  try {
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length > 0) {
      return;
    }

    await db.insert(users).values({
      id: userId,
      openId: `live-local-user-${userId}-${Date.now()}`,
      name: "Live Notes User",
      loginMethod: "local",
      role: "admin",
      timezone: "Australia/Sydney",
      lastSignedIn: new Date(),
    });
  } catch (error) {
    console.warn("[Notes] Could not ensure live notes user", error);
  }
}

async function getNextUserNoteId(db: AppDb) {
  try {
    const latest = await db
      .select({ id: userNotes.id })
      .from(userNotes)
      .orderBy(desc(userNotes.id))
      .limit(1);

    return (latest[0]?.id ?? 0) + 1;
  } catch (error) {
    console.warn("[Notes] Falling back to raw id lookup", error);
    const result = await db.execute<{ nextId: number | string | null }>(sql`
      SELECT COALESCE(MAX(id), 0) + 1 AS nextId
      FROM userNotes
    `);
    const [row] = getRawQueryRows<{ nextId: number | string | null }>(result);
    return Number(row?.nextId ?? Date.now());
  }
}

async function insertUserNoteRaw(db: AppDb, row: UserNoteInsertRow) {
  const attempts = [
    {
      description: "full userNotes insert",
      statement: sql`
        INSERT INTO userNotes (id, userId, category, title, content, createdAt, updatedAt)
        VALUES (${row.id}, ${row.userId}, ${row.category}, ${row.title ?? null}, ${row.content}, ${row.createdAt}, ${row.updatedAt})
      `,
    },
    {
      description: "without title",
      statement: sql`
        INSERT INTO userNotes (id, userId, category, content, createdAt, updatedAt)
        VALUES (${row.id}, ${row.userId}, ${row.category}, ${row.content}, ${row.createdAt}, ${row.updatedAt})
      `,
    },
    {
      description: "without timestamps",
      statement: sql`
        INSERT INTO userNotes (id, userId, category, title, content)
        VALUES (${row.id}, ${row.userId}, ${row.category}, ${row.title ?? null}, ${row.content})
      `,
    },
    {
      description: "minimum live note",
      statement: sql`
        INSERT INTO userNotes (id, userId, content)
        VALUES (${row.id}, ${row.userId}, ${row.content})
      `,
    },
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      await db.execute(attempt.statement);
      return row;
    } catch (error) {
      errors.push(`${attempt.description}: ${getDbErrorMessage(error)}`);
      console.warn(`[Notes] Raw note insert failed (${attempt.description})`, error);
    }
  }

  throw new Error(errors.join(" | "));
}

export async function createUserNote(note: InsertUserNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await tryEnsureUserNotesTable(db);
    await ensureLiveNotesUser(db, note.userId);
    const now = new Date();
    const row: UserNoteInsertRow = {
      ...note,
      id: note.id ?? await getNextUserNoteId(db),
      category: note.category || "general",
      title: note.title ?? null,
      createdAt: note.createdAt ?? now,
      updatedAt: note.updatedAt ?? now,
    };

    await db.insert(userNotes).values(row);
    return row;
  } catch (error) {
    console.warn("[Notes] ORM note insert failed; trying raw fallback", error);
    try {
      const now = new Date();
      const row: UserNoteInsertRow = {
        ...note,
        id: note.id ?? await getNextUserNoteId(db),
        category: note.category || "general",
        title: note.title ?? null,
        createdAt: note.createdAt ?? now,
        updatedAt: note.updatedAt ?? now,
      };

      await ensureLiveNotesUser(db, row.userId);
      await insertUserNoteRaw(db, row);
      return row;
    } catch (fallbackError) {
      console.error("[Notes] Failed to create user note", {
        ormError: error,
        fallbackError,
      });
      throw new Error(
        `Could not save note. ${getDbErrorMessage(fallbackError) || "The notes table rejected the save."}`
      );
    }
  }
}

export async function getUserNotes(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await tryEnsureUserNotesTable(db);

  return db
    .select()
    .from(userNotes)
    .where(eq(userNotes.userId, userId))
    .orderBy(desc(userNotes.createdAt))
    .limit(limit);
}

export async function updateUserNote(
  userId: number,
  noteId: number,
  updates: Partial<InsertUserNote>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await tryEnsureUserNotesTable(db);

  await db
    .update(userNotes)
    .set(updates)
    .where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)));

  const result = await db
    .select()
    .from(userNotes)
    .where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)))
    .limit(1);

  return result[0];
}

export async function deleteUserNote(userId: number, noteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await tryEnsureUserNotesTable(db);

  await db
    .delete(userNotes)
    .where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)));
}

// Leaks
export async function createLeak(leak: InsertLeak) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(leaks).values(leak);
  return (await db.select().from(leaks).where(eq(leaks.id, result.insertId)).limit(1))[0];
}

export async function getUserLeaks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(leaks).where(eq(leaks.userId, userId)).orderBy(desc(leaks.lastSeenAt));
}

export async function getLeakById(leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(leaks).where(eq(leaks.id, leakId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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

// Hand-Leak Junction
export async function linkHandToLeak(handId: number, leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update leak's lastSeenAt
  const hand = await getHandById(handId);
  if (hand) {
    await db.update(leaks).set({ lastSeenAt: hand.createdAt }).where(eq(leaks.id, leakId));
  }
  
  await db.insert(handLeaks).values({ handId, leakId });
}

export async function attachLeakFamilyToHand(
  userId: number,
  handId: number,
  leakFamilyId: CanonicalLeakFamilyId
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const family = getLeakFamily(leakFamilyId);
  if (!family) {
    throw new Error("Leak family not found");
  }

  const hand = await getHandById(handId);
  if (!hand || hand.userId !== userId) {
    throw new Error("Hand not found");
  }

  const existingLeaks = await getUserLeaks(userId);
  const existingLeak =
    existingLeaks.find(
      leak =>
        leak.name.trim().toLowerCase() === family.label.trim().toLowerCase()
    ) ??
    existingLeaks.find(
      leak => findLeakFamilyByLabel(leak.name)?.id === leakFamilyId
    ) ??
    null;

  const leakRecord =
    existingLeak ??
    (await createLeak({
      userId,
      name: family.label,
      category: "PREFLOP",
      description: family.description,
      status: "ACTIVE",
    }));

  const linkedLeaks = await getLeaksForHand(handId);
  const alreadyLinked = linkedLeaks.some(linked => linked.id === leakRecord.id);
  if (!alreadyLinked) {
    await linkHandToLeak(handId, leakRecord.id);
  }

  return leakRecord;
}

export async function unlinkHandFromLeak(handId: number, leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(handLeaks).where(
    and(
      eq(handLeaks.handId, handId),
      eq(handLeaks.leakId, leakId)
    )
  );
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

export async function getHandsForLeak(leakId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({ hand: hands })
    .from(handLeaks)
    .innerJoin(hands, eq(handLeaks.handId, hands.id))
    .where(eq(handLeaks.leakId, leakId))
    .orderBy(desc(hands.createdAt));
  
  return result.map(r => r.hand);
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
  
  return result as any[];
}

/**
 * Dashboard stats for a given week
 */
export async function getDashboardStats(userId: number, weekId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user goals
  const user = await getUserProfile(userId);
  const goals = user?.goalsJson ? JSON.parse(user.goalsJson) : {};
  const studyHoursTarget = goals.weeklyStudyHours || 7;
  const tournamentsTarget = goals.weeklyTournaments || 2;
  
  // Get study sessions for the week
  const sessions = await getStudySessionsByWeek(weekId);
  const studyHours = sessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0);
  
  // Get tournaments for the week
  const tournamentsList = await getTournamentsByWeek(weekId);
  const tournamentsCount = tournamentsList.length;
  const netResult = tournamentsList.reduce((sum, t) => sum + t.netResult, 0);
  
  const week = await getWeekById(weekId);
  
  return {
    week,
    studyHours,
    studyHoursTarget,
    tournamentsCount,
    tournamentsTarget,
    netResult,
  };
}
