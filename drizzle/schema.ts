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
    "BVB",
    "ICM_SPOT",
    "LIMPED_POT",
    "RFI",
    "DEFEND_VS_RFI",
    "THREE_BET",
    "FACING_3BET",
    "LIMP_ISO",
    "FOUR_BET_JAM",
    "OTHER_PREFLOP"
  ]),
  
  // Decision tracking
  heroDecisionPreflop: varchar("heroDecisionPreflop", { length: 50 }),
  heroDecisionFlop: varchar("heroDecisionFlop", { length: 50 }),
  heroDecisionTurn: varchar("heroDecisionTurn", { length: 50 }),
  heroDecisionRiver: varchar("heroDecisionRiver", { length: 50 }),
  
  // V2 structured hand fields
  heroCard1: varchar("heroCard1", { length: 4 }),
  heroCard2: varchar("heroCard2", { length: 4 }),
  handClass: varchar("handClass", { length: 10 }),
  exactSuitsKnown: boolean("exactSuitsKnown").default(false).notNull(),
  actualStackBB: float("actualStackBB"),
  openerPosition: varchar("openerPosition", { length: 10 }),
  villainPosition: varchar("villainPosition", { length: 10 }),
  villainType: varchar("villainType", { length: 50 }),
  rangeRead: varchar("rangeRead", { length: 100 }),
  tournamentStage: varchar("tournamentStage", { length: 20 }),
  preflopDecision: varchar("preflopDecision", { length: 30 }),
  actionsJson: text("actionsJson"),
  boardJson: text("boardJson"),
  leakFamilyId: varchar("leakFamilyId", { length: 100 }),
  confidence: mysqlEnum("confidence", ["LOW", "MEDIUM", "HIGH"]),
  reviewStatus: mysqlEnum("reviewStatus", ["DRAFT", "NEEDS_REVIEW", "REVIEWED"]).default("NEEDS_REVIEW").notNull(),

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
 * Live notes captured during play or review.
 */
export const userNotes = mysqlTable("userNotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 80 }).default("general").notNull(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("user_notes_user_created_idx").on(table.userId, table.createdAt),
}));

export type UserNote = typeof userNotes.$inferSelect;
export type InsertUserNote = typeof userNotes.$inferInsert;


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

/**
 * Strategy module: Range charts (one chart = one spot at one stack depth)
 */
export const rangeCharts = mysqlTable("rangeCharts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  stackDepth: int("stackDepth").notNull(), // 15 | 20 | 25 | 40
  spotGroup: mysqlEnum("spotGroup", [
    "RFI",
    "VS_UTG_RFI",
    "VS_MP_RFI",
    "VS_LP_RFI",
    "VS_3BET",
    "BVB",
  ]).notNull(),
  spotKey: varchar("spotKey", { length: 100 }).notNull(), // e.g. "BTN_RFI", "BB_vs_BTN"
  heroPosition: varchar("heroPosition", { length: 10 }).notNull(),
  villainPosition: varchar("villainPosition", { length: 10 }),
  sourceLabel: varchar("sourceLabel", { length: 255 }),
  sourceStatus: mysqlEnum("sourceStatus", [
    "source_backed",
    "imported_unreviewed",
    "generated_candidate",
    "proxy",
    "simplified_population",
    "unsupported",
  ]),
  cellMapSource: mysqlEnum("cellMapSource", [
    "reviewed",
    "imported_unreviewed",
    "generated",
    "manual",
    "missing",
  ]),
  sourceFile: varchar("sourceFile", { length: 255 }),
  sourcePanelLabel: varchar("sourcePanelLabel", { length: 255 }),
  dataVersion: varchar("dataVersion", { length: 64 }),
  reviewedBy: varchar("reviewedBy", { length: 255 }),
  reviewedAt: varchar("reviewedAt", { length: 32 }),
  notesJson: text("notesJson"), // JSON array of note strings
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  spotIdx: index("spot_idx").on(table.stackDepth, table.spotGroup, table.spotKey),
  userIdx: index("range_user_idx").on(table.userId),
}));

export type RangeChart = typeof rangeCharts.$inferSelect;
export type InsertRangeChart = typeof rangeCharts.$inferInsert;

/**
 * Strategy module: Individual hand actions within a range chart
 */
export const rangeChartActions = mysqlTable("rangeChartActions", {
  id: int("id").autoincrement().primaryKey(),
  chartId: int("chartId").notNull().references(() => rangeCharts.id, { onDelete: "cascade" }),
  handCode: varchar("handCode", { length: 4 }).notNull(), // e.g. "AKs", "76o", "TT"
  primaryAction: mysqlEnum("primaryAction", [
    "FOLD",
    "RAISE",
    "CALL",
    "THREE_BET",
    "JAM",
    "LIMP",
    "CHECK",
  ]).notNull(),
  mixJson: text("mixJson"), // JSON: [{action, frequency}] for mixed strategies
  weightPercent: float("weightPercent"), // primary action frequency 0-100
  colorToken: varchar("colorToken", { length: 30 }),
  note: text("note"),
}, (table) => ({
  chartHandIdx: index("chart_hand_idx").on(table.chartId, table.handCode),
}));

export type RangeChartAction = typeof rangeChartActions.$inferSelect;
export type InsertRangeChartAction = typeof rangeChartActions.$inferInsert;

/**
 * Strategy module: Trainer attempt log
 */
export const trainerAttempts = mysqlTable("trainerAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  chartId: int("chartId").notNull().references(() => rangeCharts.id, { onDelete: "cascade" }),
  canonicalSpotId: varchar("canonicalSpotId", { length: 120 }),
  spotFamily: varchar("spotFamily", { length: 40 }).notNull(),
  sourceStatus: mysqlEnum("sourceStatus", [
    "exact_source",
    "simplified_population",
    "derived",
  ]).notNull(),
  stackBb: int("stackBb").notNull(),
  heroPosition: varchar("heroPosition", { length: 10 }).notNull(),
  villainPosition: varchar("villainPosition", { length: 10 }),
  handCode: varchar("handCode", { length: 4 }).notNull(),
  selectedAction: varchar("selectedAction", { length: 20 }).notNull(),
  correctAction: varchar("correctAction", { length: 20 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  confidence: mysqlEnum("confidence", ["knew_it", "unsure", "guessed"]),
  drillPackId: varchar("drillPackId", { length: 80 }),
  leakFamilyId: varchar("leakFamilyId", { length: 80 }),
  sessionId: varchar("sessionId", { length: 64 }),
  responseTimeMs: int("responseTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userCreatedIdx: index("trainer_user_created_idx").on(table.userId, table.createdAt),
  chartCreatedIdx: index("trainer_chart_created_idx").on(table.chartId, table.createdAt),
  spotCreatedIdx: index("trainer_spot_created_idx").on(table.userId, table.canonicalSpotId, table.createdAt),
}));

export type TrainerAttempt = typeof trainerAttempts.$inferSelect;
export type InsertTrainerAttempt = typeof trainerAttempts.$inferInsert;

/**
 * Strategy Phase 2 compatibility tables.
 *
 * These tables are no longer mounted in the live-play UI, but the strategy
 * server modules still compile against them in some deployments. Keep the
 * schema exports real so old data/code paths remain compatible while the
 * Manus app only exposes hand logs, tournaments, and notes.
 */
export const strategyNodes = mysqlTable("strategyNodes", {
  id: int("id").autoincrement().primaryKey(),
  version: varchar("version", { length: 80 }).notNull(),
  stackBucket: int("stackBucket").notNull(),
  playerCount: int("playerCount").default(9).notNull(),
  scenarioFamily: mysqlEnum("scenarioFamily", [
    "rfi",
    "facing_open_early",
    "facing_open_middle",
    "facing_open_late",
    "facing_jam",
    "sb_first_in",
    "bb_vs_sb_open",
    "bb_vs_sb_limp",
  ]).notNull(),
  heroPosition: varchar("heroPosition", { length: 10 }).notNull(),
  villainPosition: varchar("villainPosition", { length: 10 }),
  villainGroup: mysqlEnum("villainGroup", ["early", "middle", "late"]),
  spotKey: varchar("spotKey", { length: 120 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  sourceLabel: varchar("sourceLabel", { length: 255 }).notNull(),
  notes: text("notes"),
  reviewed: boolean("reviewed").default(false).notNull(),
  structurallyComplete: boolean("structurallyComplete").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nodeLookupIdx: index("strategy_node_lookup_idx").on(
    table.version,
    table.stackBucket,
    table.playerCount,
    table.scenarioFamily,
    table.heroPosition,
    table.villainPosition
  ),
  nodeSpotIdx: index("strategy_node_spot_idx").on(
    table.stackBucket,
    table.scenarioFamily,
    table.heroPosition,
    table.villainPosition,
    table.villainGroup
  ),
  activeIdx: index("strategy_node_active_idx").on(table.isActive, table.reviewed),
}));

export type StrategyNode = typeof strategyNodes.$inferSelect;
export type InsertStrategyNode = typeof strategyNodes.$inferInsert;

export const strategyNodeRanges = mysqlTable("strategyNodeRanges", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: int("nodeId").notNull().references(() => strategyNodes.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", [
    "JAM",
    "FOUR_BET",
    "THREE_BET",
    "RAISE",
    "LIMP",
    "CALL_JAM",
    "CALL",
    "CHECK",
    "FOLD",
  ]).notNull(),
  rangeNotation: text("rangeNotation").notNull(),
  priority: int("priority").notNull(),
  notes: text("notes"),
  reviewed: boolean("reviewed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nodeRangeIdx: index("strategy_node_range_idx").on(table.nodeId, table.priority, table.action),
}));

export type StrategyNodeRange = typeof strategyNodeRanges.$inferSelect;
export type InsertStrategyNodeRange = typeof strategyNodeRanges.$inferInsert;

export const strategyTrainerAttempts = mysqlTable("strategyTrainerAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  nodeId: int("nodeId").notNull().references(() => strategyNodes.id, { onDelete: "cascade" }),
  stackBucket: int("stackBucket").notNull(),
  scenarioFamily: varchar("scenarioFamily", { length: 40 }).notNull(),
  heroPosition: varchar("heroPosition", { length: 10 }).notNull(),
  villainPosition: varchar("villainPosition", { length: 10 }),
  villainGroup: varchar("villainGroup", { length: 16 }),
  handCode: varchar("handCode", { length: 4 }).notNull(),
  selectedAction: varchar("selectedAction", { length: 20 }).notNull(),
  correctAction: varchar("correctAction", { length: 20 }).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  confidence: mysqlEnum("confidence", ["knew_it", "unsure", "guessed"]),
  sessionId: varchar("sessionId", { length: 64 }),
  responseTimeMs: int("responseTimeMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  trainerAttemptUserIdx: index("strategy_trainer_attempt_user_idx").on(table.userId, table.createdAt),
  trainerAttemptNodeIdx: index("strategy_trainer_attempt_node_idx").on(table.nodeId, table.createdAt),
}));

export type StrategyTrainerAttempt = typeof strategyTrainerAttempts.$inferSelect;
export type InsertStrategyTrainerAttempt = typeof strategyTrainerAttempts.$inferInsert;

export const strategyChartStatus = mysqlTable("strategyChartStatus", {
  id: int("id").autoincrement().primaryKey(),
  nodeKey: varchar("nodeKey", { length: 120 }).notNull().unique(),
  spotType: varchar("spotType", { length: 40 }).notNull(),
  stackBb: int("stackBb").notNull(),
  position: varchar("position", { length: 10 }).notNull(),
  villainPosition: varchar("villainPosition", { length: 10 }),
  anteType: varchar("anteType", { length: 16 }).default("BBA").notNull(),
  format: varchar("format", { length: 16 }).default("MTT").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  allowedActionsJson: text("allowedActionsJson").notNull(),
  status: mysqlEnum("status", ["seed", "draft", "reviewed", "approved", "archived"]).notNull(),
  activeSnapshotId: int("activeSnapshotId"),
  seedProtected: boolean("seedProtected").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  chartNodeKeyIdx: index("strategy_chart_status_node_key_idx").on(table.nodeKey),
  chartStatusIdx: index("strategy_chart_status_idx").on(table.status),
}));

export type StrategyChartStatus = typeof strategyChartStatus.$inferSelect;
export type InsertStrategyChartStatus = typeof strategyChartStatus.$inferInsert;

export const strategyChartSnapshots = mysqlTable("strategyChartSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  chartId: int("chartId").notNull().references(() => strategyChartStatus.id, { onDelete: "cascade" }),
  nodeKey: varchar("nodeKey", { length: 120 }).notNull(),
  version: int("version").notNull(),
  status: mysqlEnum("status", ["seed", "draft", "reviewed", "approved", "archived"]).notNull(),
  allowedActionsJson: text("allowedActionsJson").notNull(),
  cellsJson: text("cellsJson").notNull(),
  checksum: varchar("checksum", { length: 128 }).notNull(),
  notes: text("notes"),
  createdBy: varchar("createdBy", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  snapshotNodeVersionIdx: index("strategy_chart_snapshot_node_version_idx").on(table.nodeKey, table.version),
  snapshotChartIdx: index("strategy_chart_snapshot_chart_idx").on(table.chartId),
}));

export type StrategyChartSnapshot = typeof strategyChartSnapshots.$inferSelect;
export type InsertStrategyChartSnapshot = typeof strategyChartSnapshots.$inferInsert;

export const strategyChartEdits = mysqlTable("strategyChartEdits", {
  id: int("id").autoincrement().primaryKey(),
  chartId: int("chartId").references(() => strategyChartStatus.id, { onDelete: "cascade" }),
  nodeKey: varchar("nodeKey", { length: 120 }).notNull(),
  actionType: varchar("actionType", { length: 80 }),
  allowedActionsJson: text("allowedActionsJson"),
  cellsJson: text("cellsJson"),
  detailsJson: text("detailsJson"),
  notes: text("notes"),
  createdBy: varchar("createdBy", { length: 255 }),
  updatedBy: varchar("updatedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  editNodeIdx: index("strategy_chart_edit_node_idx").on(table.nodeKey),
  editChartIdx: index("strategy_chart_edit_chart_idx").on(table.chartId),
}));

export type StrategyChartEdit = typeof strategyChartEdits.$inferSelect;
export type InsertStrategyChartEdit = typeof strategyChartEdits.$inferInsert;

export const strategyChartImportExports = mysqlTable("strategyChartImportExports", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["import", "export"]).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  chartCount: int("chartCount").default(0).notNull(),
  checksum: varchar("checksum", { length: 128 }),
  notes: text("notes"),
  payloadJson: text("payloadJson"),
  createdBy: varchar("createdBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  importExportTypeIdx: index("strategy_chart_import_export_type_idx").on(table.type, table.createdAt),
}));

export type StrategyChartImportExport = typeof strategyChartImportExports.$inferSelect;
export type InsertStrategyChartImportExport = typeof strategyChartImportExports.$inferInsert;

/**
 * ICM Study Pack module: high-pressure final-table content packs.
 */
export const icmPacks = mysqlTable("icmPacks", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  activeIdx: index("icm_pack_active_idx").on(table.isActive),
}));

export type IcmPack = typeof icmPacks.$inferSelect;
export type InsertIcmPack = typeof icmPacks.$inferInsert;

/**
 * ICM Study Pack module: one curated scenario/source file inside a pack.
 */
export const icmSpots = mysqlTable("icmSpots", {
  id: int("id").autoincrement().primaryKey(),
  packId: int("packId").notNull().references(() => icmPacks.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  sourcePath: varchar("sourcePath", { length: 500 }).notNull(),
  playerCount: int("playerCount").notNull(),
  primaryCategory: varchar("primaryCategory", { length: 80 }).notNull(),
  heroPosition: varchar("heroPosition", { length: 10 }),
  villainPosition: varchar("villainPosition", { length: 10 }),
  heroStackBb: float("heroStackBb"),
  villainStackBb: float("villainStackBb"),
  stackSummaryJson: text("stackSummaryJson"),
  tagsJson: text("tagsJson"),
  actionHint: varchar("actionHint", { length: 80 }),
  rawMetadataJson: text("rawMetadataJson"),
  contentJson: text("contentJson"),
  isCurated: boolean("isCurated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  packIdx: index("icm_spot_pack_idx").on(table.packId),
  playerCountIdx: index("icm_spot_player_count_idx").on(table.playerCount),
  categoryIdx: index("icm_spot_category_idx").on(table.primaryCategory),
  curatedIdx: index("icm_spot_curated_idx").on(table.isCurated),
}));

export type IcmSpot = typeof icmSpots.$inferSelect;
export type InsertIcmSpot = typeof icmSpots.$inferInsert;
