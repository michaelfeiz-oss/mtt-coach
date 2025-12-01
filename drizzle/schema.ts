import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, boolean, index, primaryKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // User preferences
  timezone: varchar("timezone", { length: 50 }).default("Australia/Sydney").notNull(),
  goalsJson: text("goalsJson"), // JSON string: { weeklyStudyHours, weeklySessions, weeklyTournaments }
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Week table - auto-created when logging sessions/tournaments
 */
export const weeks = mysqlTable("weeks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  startDate: timestamp("startDate").notNull(), // Monday
  endDate: timestamp("endDate").notNull(), // Sunday
  targetStudyHours: int("targetStudyHours").default(7).notNull(),
  targetSessions: int("targetSessions").default(7).notNull(),
  targetTournaments: int("targetTournaments").default(1).notNull(),
  summaryNotes: text("summaryNotes"),
  score: int("score"), // 0-10 subjective rating
  weeklyFocusLeak: varchar("weeklyFocusLeak", { length: 255 }), // Current week's focus area based on top leak
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userWeekIdx: index("user_week_idx").on(table.userId, table.startDate),
}));

export type Week = typeof weeks.$inferSelect;
export type InsertWeek = typeof weeks.$inferInsert;

/**
 * StudySession table
 */
export const studySessions = mysqlTable("studySessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekId: int("weekId").notNull().references(() => weeks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", [
    "RANGE_TRAINING",
    "HAND_REVIEW",
    "ICM",
    "EXPLOIT_LAB",
    "DEEP_DIVE",
    "MENTAL_GAME",
    "LIGHT_REVIEW"
  ]).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  resourceUsed: varchar("resourceUsed", { length: 255 }),
  handsReviewedCount: int("handsReviewedCount").default(0).notNull(),
  drillsCompletedCount: int("drillsCompletedCount").default(0).notNull(),
  accuracyPercent: float("accuracyPercent"),
  keyTakeaways: text("keyTakeaways"),
  fromPlan: boolean("fromPlan").default(false).notNull(),
  planSlot: varchar("planSlot", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("user_date_idx").on(table.userId, table.date),
}));

export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;

/**
 * Tournament table
 */
export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekId: int("weekId").notNull().references(() => weeks.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  venue: varchar("venue", { length: 255 }),
  name: varchar("name", { length: 255 }),
  buyIn: float("buyIn").notNull(),
  startingStack: int("startingStack"),
  fieldSize: int("fieldSize"),
  reEntries: int("reEntries").default(0).notNull(),
  finalPosition: int("finalPosition"),
  prize: float("prize").default(0).notNull(),
  netResult: float("netResult").notNull(), // calculated: prize - (buyIn * (reEntries + 1))
  stageReached: mysqlEnum("stageReached", ["EARLY", "MID", "LATE", "FT"]),
  selfRating: int("selfRating"), // 0-10
  mentalRating: int("mentalRating"), // 0-10
  notesOverall: text("notesOverall"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("user_date_idx").on(table.userId, table.date),
}));

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;

/**
 * Hand table with structured street_data as text JSON
 */
export const hands = mysqlTable("hands", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tournamentId: int("tournamentId").references(() => tournaments.id, { onDelete: "cascade" }),
  studySessionId: int("studySessionId").references(() => studySessions.id, { onDelete: "cascade" }),
  
  // Top-level fields for quick querying
  heroPosition: varchar("heroPosition", { length: 10 }),
  heroHand: varchar("heroHand", { length: 10 }),
  boardRunout: varchar("boardRunout", { length: 50 }),
  effectiveStackBb: float("effectiveStackBb"),
  spr: float("spr"),
  
  // Structured JSON as text for full hand history
  streetDataJson: text("streetDataJson"),
  
  spotType: mysqlEnum("spotType", [
    "SINGLE_RAISED_POT",
    "3BET_POT",
    "BvB",
    "ICM_SPOT",
    "LIMPED_POT"
  ]),
  
  // Decision tracking
  heroDecisionPreflop: varchar("heroDecisionPreflop", { length: 50 }),
  heroDecisionFlop: varchar("heroDecisionFlop", { length: 50 }),
  heroDecisionTurn: varchar("heroDecisionTurn", { length: 50 }),
  heroDecisionRiver: varchar("heroDecisionRiver", { length: 50 }),
  
  // Review and evaluation
  reviewed: boolean("reviewed").default(false).notNull(),
  evalSource: mysqlEnum("evalSource", ["SOLVER", "COACH", "SELF"]),
  mistakeStreet: mysqlEnum("mistakeStreet", ["PREFLOP", "FLOP", "TURN", "RIVER"]),
  mistakeSeverity: int("mistakeSeverity").default(0).notNull(), // 0-3
  evDiffBb: float("evDiffBb"),
  tagsJson: text("tagsJson"), // JSON array as text: ["BB_DEFENCE", "OVERFOLD"]
  lesson: text("lesson"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  tournamentIdx: index("tournament_idx").on(table.tournamentId),
  reviewedIdx: index("reviewed_idx").on(table.reviewed),
}));

export type Hand = typeof hands.$inferSelect;
export type InsertHand = typeof hands.$inferInsert;

/**
 * Leak table
 */
export const leaks = mysqlTable("leaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["PREFLOP", "POSTFLOP", "ICM", "MENTAL", "EXPLOIT"]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["ACTIVE", "IMPROVING", "FIXED"]).default("ACTIVE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt"),
  handsLinkedCount: int("handsLinkedCount").default(0).notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Leak = typeof leaks.$inferSelect;
export type InsertLeak = typeof leaks.$inferInsert;

/**
 * HandLeaks junction table for many-to-many relationship
 */
export const handLeaks = mysqlTable("handLeaks", {
  handId: int("handId").notNull().references(() => hands.id, { onDelete: "cascade" }),
  leakId: int("leakId").notNull().references(() => leaks.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.handId, table.leakId] }),
  leakIdx: index("leak_idx").on(table.leakId),
}));

export type HandLeak = typeof handLeaks.$inferSelect;
export type InsertHandLeak = typeof handLeaks.$inferInsert;


/**
 * 12-Week Study Plan Block (Weeks 1-4, 5-8, 9-12)
 */
export const studyPlanBlocks = mysqlTable("studyPlanBlocks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockNumber: int("blockNumber").notNull(), // 1, 2, or 3
  title: varchar("title", { length: 255 }).notNull(),
  goal: text("goal"),
  weekStart: int("weekStart").notNull(), // Week 1, 5, or 9
  weekEnd: int("weekEnd").notNull(), // Week 4, 8, or 12
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userBlockIdx: index("user_block_idx").on(table.userId, table.blockNumber),
}));

export type StudyPlanBlock = typeof studyPlanBlocks.$inferSelect;
export type InsertStudyPlanBlock = typeof studyPlanBlocks.$inferInsert;

/**
 * Weekly study plan with theme and focus
 */
export const studyPlanWeeks = mysqlTable("studyPlanWeeks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockId: int("blockId").notNull().references(() => studyPlanBlocks.id, { onDelete: "cascade" }),
  weekNumber: int("weekNumber").notNull(), // 1-12
  theme: varchar("theme", { length: 255 }).notNull(),
  focusAreas: text("focusAreas"), // JSON array of focus areas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userWeekIdx: index("user_week_idx").on(table.userId, table.weekNumber),
}));

export type StudyPlanWeek = typeof studyPlanWeeks.$inferSelect;
export type InsertStudyPlanWeek = typeof studyPlanWeeks.$inferInsert;

/**
 * Daily study tasks within each week
 */
export const studyPlanTasks = mysqlTable("studyPlanTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  studyPlanWeekId: int("studyPlanWeekId").notNull().references(() => studyPlanWeeks.id, { onDelete: "cascade" }),
  dayOfWeek: int("dayOfWeek").notNull(), // 1-7 (Monday-Sunday)
  studyType: mysqlEnum("studyType", [
    "RANGE_TRAINING",
    "HAND_REVIEW",
    "ICM",
    "EXPLOIT_LAB",
    "DEEP_DIVE",
    "MENTAL_GAME",
    "LIGHT_REVIEW"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tools: text("tools"), // JSON array: ["Preflop+", "PokerCruncher", ...]
  focusPoints: text("focusPoints"), // JSON array of specific focus areas
  durationMinutes: int("durationMinutes").default(45).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  weekTaskIdx: index("week_task_idx").on(table.studyPlanWeekId, table.dayOfWeek),
}));

export type StudyPlanTask = typeof studyPlanTasks.$inferSelect;
export type InsertStudyPlanTask = typeof studyPlanTasks.$inferInsert;
