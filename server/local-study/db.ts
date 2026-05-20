import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  ACTION_PRIORITY,
  ALL_HANDS,
  computeChartChecksum,
  computePackChecksum,
  normalizeNodeKey,
  type ActionToken,
  type ChartCells,
  type ChartStatus,
  type ResolvedStrategyChart,
  type SnapshotStatus,
  type StrategyChartDraft,
  type StrategyChartRecord,
  type StrategyChartSnapshot,
  type StrategyPack,
  type StrategyPackChart,
  type SpotType,
  type StackBucket,
  type Position,
} from "../../shared/strategy-v2/model";
import {
  assertChartStatus,
  assertPosition,
  assertSnapshotStatus,
  assertSpotType,
  assertStackBucket,
  validateAllowedActions,
  validateChartCells,
} from "../../shared/strategy-v2/validation";
import {
  REVIEW_SCENARIO_OWNER_DECISIONS,
  splitReviewList,
  type ReviewScenarioOwnerDecision,
  type StrategyReviewPack,
  type StrategyReviewQaSummary,
  type StrategyReviewScenario,
  type StrategyReviewScenarioInput,
  type StrategyReviewSummary,
} from "../../shared/strategy-review-scenarios";
import { validateReviewPack } from "./reviewScenarios";

type Row = Record<string, unknown>;
type DatabaseSync = any;

export interface StudyNoteRecord {
  id: number;
  title: string;
  body: string;
  category: string | null;
  tags: string[];
  linkedNodeKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNoteInput {
  title: string;
  body: string;
  category?: string | null;
  tags?: string[];
  linkedNodeKey?: string | null;
}

export interface PopulationDraftPackChart {
  nodeKey: string;
  title?: string;
  stackBb: StackBucket;
  spotFamily: SpotType;
  heroPosition: Position;
  villainPosition: Position | null;
  allowedActions: ActionToken[];
  sourceName: string;
  sourceType: string;
  sourceNotes: string;
  reviewed: false;
  cells: Record<string, string>;
}

export interface PopulationDraftPack {
  schemaVersion: 1;
  kind: "mtt-study-population-draft-pack" | "mtt-study-source-pack-template";
  batch: string;
  description?: string;
  charts: PopulationDraftPackChart[];
}

export interface ReviewScenarioOwnerDecisionInput {
  ownerDecision: ReviewScenarioOwnerDecision;
  ownerNotes?: string | null;
}

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as { DatabaseSync: new (path: string) => DatabaseSync };

const DATA_DIR = process.env.LOCAL_DATA_DIR
  ? path.resolve(process.env.LOCAL_DATA_DIR)
  : path.resolve(process.cwd(), "local-data");
const DB_PATH = process.env.LOCAL_SQLITE_PATH
  ? path.resolve(process.env.LOCAL_SQLITE_PATH)
  : path.join(DATA_DIR, "mtt-study.sqlite");

let db: DatabaseSync | null = null;

function nowIso() {
  return new Date().toISOString();
}

function json<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  return JSON.parse(value) as T;
}

function bool(value: unknown) {
  return Number(value ?? 0) === 1;
}

function runTransaction<T>(database: DatabaseSync, fn: () => T): T {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function mapChart(row: Row): StrategyChartRecord {
  const spotType = String(row.spot_type);
  const stackBb = Number(row.stack_bb);
  const position = String(row.position);
  const status = String(row.status);
  assertSpotType(spotType, String(row.node_key));
  assertStackBucket(stackBb, String(row.node_key));
  assertPosition(position, String(row.node_key));
  if (row.villain_position) assertPosition(String(row.villain_position), String(row.node_key));
  assertChartStatus(status, String(row.node_key));

  return {
    id: Number(row.id),
    nodeKey: String(row.node_key),
    spotType,
    stackBb,
    position,
    villainPosition: row.villain_position ? String(row.villain_position) as Position : null,
    anteType: "BBA",
    format: "MTT",
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    allowedActions: validateAllowedActions(
      json<string[]>(String(row.allowed_actions_json), []),
      String(row.node_key)
    ),
    status,
    activeSnapshotId: row.active_snapshot_id ? Number(row.active_snapshot_id) : null,
    seedProtected: bool(row.seed_protected),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSnapshot(row: Row): StrategyChartSnapshot {
  const nodeKey = String(row.node_key);
  const status = String(row.status);
  assertSnapshotStatus(status, nodeKey);
  const allowedActions = validateAllowedActions(
    json<string[]>(String(row.allowed_actions_json), []),
    nodeKey
  );
  const cells = validateChartCells({
    nodeKey,
    allowedActions,
    cells: json<Record<string, string>>(String(row.cells_json), {}),
  });

  return {
    id: Number(row.id),
    chartId: Number(row.chart_id),
    nodeKey,
    version: Number(row.version),
    status,
    allowedActions,
    cells,
    checksum: String(row.checksum),
    notes: row.notes ? String(row.notes) : null,
    createdAt: String(row.created_at),
    createdBy: String(row.created_by),
  };
}

function mapDraft(row: Row): StrategyChartDraft {
  const nodeKey = String(row.node_key);
  const allowedActions = validateAllowedActions(
    json<string[]>(String(row.allowed_actions_json), []),
    nodeKey
  );
  const cells = validateChartCells({
    nodeKey,
    allowedActions,
    cells: json<Record<string, string>>(String(row.cells_json), {}),
  });

  return {
    id: Number(row.id),
    chartId: Number(row.chart_id),
    nodeKey,
    allowedActions,
    cells,
    notes: row.notes ? String(row.notes) : null,
    updatedAt: String(row.updated_at),
    updatedBy: String(row.updated_by),
  };
}

function mapStudyNote(row: Row): StudyNoteRecord {
  return {
    id: Number(row.id),
    title: String(row.title),
    body: String(row.body),
    category: row.category ? String(row.category) : null,
    tags: json<string[]>(row.tags_json ? String(row.tags_json) : null, []),
    linkedNodeKey: row.linked_node_key ? String(row.linked_node_key) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function assertOwnerDecision(value: string): ReviewScenarioOwnerDecision {
  if (!REVIEW_SCENARIO_OWNER_DECISIONS.includes(value as ReviewScenarioOwnerDecision)) {
    throw new Error(`Invalid owner decision ${value}.`);
  }
  return value as ReviewScenarioOwnerDecision;
}

function mapReviewScenario(row: Row): StrategyReviewScenario {
  return {
    id: Number(row.id),
    recordId: String(row.record_id),
    nodeKey: String(row.node_key),
    displayName: String(row.display_name),
    stackBb: Number(row.stack_bb),
    spotFamily: String(row.spot_family),
    heroPosition: String(row.hero_position),
    villainPosition: String(row.villain_position),
    playerCount: String(row.player_count),
    actionContext: String(row.action_context),
    allowedActions: splitReviewList(String(row.allowed_actions)),
    appStatus: String(row.app_status),
    sourceClass: String(row.source_class),
    sourceConfidence: String(row.source_confidence),
    rangeCellsStatus: String(row.range_cells_status),
    importDecision: String(row.import_decision),
    trainerDefaultVisibility: String(row.trainer_default_visibility),
    ownerReviewRequired: String(row.owner_review_required),
    approvalTarget: String(row.approval_target),
    populationStrategySummary: String(row.population_strategy_summary),
    latestResearchAlignment: String(row.latest_research_alignment),
    simplifiedLiveRule: String(row.simplified_live_rule),
    riskFlags: splitReviewList(String(row.risk_flags)),
    reviewHandFocus: splitReviewList(String(row.review_hand_focus)),
    codexAction: String(row.codex_action),
    codexNotes: String(row.codex_notes),
    fieldIntegrity: String(row.field_integrity),
    createdDate: String(row.created_date),
    ownerDecision: assertOwnerDecision(String(row.owner_decision)),
    ownerNotes: String(row.owner_notes ?? ""),
    updatedAt: String(row.updated_at),
    linkedChartExists: Boolean(row.linked_chart_exists),
  };
}

function getStrategyTruthTableCounts(database = getLocalDb()) {
  return {
    strategy_charts: Number(
      (database.prepare("SELECT COUNT(*) AS count FROM strategy_charts").get() as { count: number }).count
    ),
    strategy_chart_snapshots: Number(
      (database.prepare("SELECT COUNT(*) AS count FROM strategy_chart_snapshots").get() as { count: number }).count
    ),
    strategy_chart_drafts: Number(
      (database.prepare("SELECT COUNT(*) AS count FROM strategy_chart_drafts").get() as { count: number }).count
    ),
  };
}

function getReviewScenarioImportAudit(database = getLocalDb()) {
  const row = database
    .prepare(
      `SELECT * FROM strategy_chart_audit_log
       WHERE action_type = 'review_scenarios_imported'
       ORDER BY id DESC
       LIMIT 1`
    )
    .get() as Row | undefined;
  if (!row) return null;
  return {
    createdAt: String(row.created_at),
    details: json<Record<string, unknown>>(String(row.details_json), {}),
  };
}

function markReviewScenarioAsPopulationDraftChart(input: {
  nodeKey: string;
  allowedActions: ActionToken[];
  batch: string;
}) {
  const database = getLocalDb();
  const nodeKey = normalizeNodeKey(input.nodeKey);
  const existing = database
    .prepare("SELECT node_key FROM strategy_review_scenarios WHERE node_key = ?")
    .get(nodeKey) as Row | undefined;
  if (!existing) return;

  database
    .prepare(
      `UPDATE strategy_review_scenarios
       SET app_status = 'population_draft_seed',
           source_class = 'population_constructed_restored_draft',
           source_confidence = 'LOW_REVIEW_REQUIRED',
           range_cells_status = 'FULL_169_POPULATION_DRAFT',
           import_decision = 'KEEP_POPULATION_DRAFT_FOR_OWNER_REVIEW_NOT_APPROVAL',
           trainer_default_visibility = 'HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY',
           owner_review_required = 'TRUE',
           approval_target = 'OWNER_REVIEW_REQUIRED_FOR_APPROVAL',
           allowed_actions = ?,
           risk_flags = CASE
             WHEN instr(risk_flags, 'RESTORED_POPULATION_DRAFT_REQUIRES_OWNER_REVIEW') > 0 THEN risk_flags
             ELSE risk_flags || ';RESTORED_POPULATION_DRAFT_REQUIRES_OWNER_REVIEW'
           END,
           codex_action = 'POPULATION_DRAFT_CHART_RESTORED_FOR_OWNER_REVIEW',
           codex_notes = codex_notes || ' Restored full 169-cell population-draft chart from ' || ? || '; not approved.',
           field_integrity = 'NO_EMPTY_FIELDS_USE_NOT_APPLICABLE_OR_SOURCE_REQUIRED',
           updated_at = ?
       WHERE node_key = ?`
    )
    .run(input.allowedActions.join(","), input.batch, nowIso(), nodeKey);
}

function syncReviewScenariosWithExistingPopulationDraftCharts(batch = "existing population draft chart") {
  const database = getLocalDb();
  const rows = database
    .prepare(
      `SELECT node_key, allowed_actions_json
       FROM strategy_charts
       WHERE LOWER(COALESCE(description, '')) LIKE '%population draft%'
          OR LOWER(COALESCE(description, '')) LIKE '%population_constructed%'`
    )
    .all() as Row[];

  for (const row of rows) {
    markReviewScenarioAsPopulationDraftChart({
      nodeKey: String(row.node_key),
      allowedActions: validateAllowedActions(
        json<string[]>(String(row.allowed_actions_json), []),
        String(row.node_key)
      ),
      batch,
    });
  }
}

function normalizeStudyNoteInput(input: StudyNoteInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Study note title is required.");
  const body = input.body ?? "";
  const tags = Array.from(
    new Set((input.tags ?? []).map(tag => tag.trim()).filter(Boolean))
  );
  const linkedNodeKey = input.linkedNodeKey?.trim()
    ? normalizeNodeKey(input.linkedNodeKey)
    : null;
  return {
    title,
    body,
    category: input.category?.trim() || null,
    tags,
    linkedNodeKey,
  };
}

export function getLocalDb() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  migrateLocalDb(db);
  return db;
}

export function getLocalDbPath() {
  return DB_PATH;
}

export function migrateLocalDb(database = getLocalDb()) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS strategy_charts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_key TEXT NOT NULL UNIQUE,
      spot_type TEXT NOT NULL,
      stack_bb INTEGER NOT NULL,
      position TEXT NOT NULL,
      villain_position TEXT,
      ante_type TEXT NOT NULL DEFAULT 'BBA',
      format TEXT NOT NULL DEFAULT 'MTT',
      title TEXT NOT NULL,
      description TEXT,
      allowed_actions_json TEXT NOT NULL,
      status TEXT NOT NULL,
      active_snapshot_id INTEGER,
      seed_protected INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategy_chart_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chart_id INTEGER NOT NULL,
      node_key TEXT NOT NULL,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      allowed_actions_json TEXT NOT NULL,
      cells_json TEXT NOT NULL,
      checksum TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      UNIQUE(node_key, version),
      FOREIGN KEY(chart_id) REFERENCES strategy_charts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS strategy_chart_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chart_id INTEGER NOT NULL,
      node_key TEXT NOT NULL UNIQUE,
      allowed_actions_json TEXT NOT NULL,
      cells_json TEXT NOT NULL,
      notes TEXT,
      updated_at TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      FOREIGN KEY(chart_id) REFERENCES strategy_charts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS strategy_chart_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_key TEXT NOT NULL,
      action_type TEXT NOT NULL,
      details_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategy_import_exports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      chart_count INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS study_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT,
      tags_json TEXT,
      linked_node_key TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategy_review_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id TEXT NOT NULL UNIQUE,
      node_key TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      stack_bb INTEGER NOT NULL,
      spot_family TEXT NOT NULL,
      hero_position TEXT NOT NULL,
      villain_position TEXT NOT NULL,
      player_count TEXT NOT NULL,
      action_context TEXT NOT NULL,
      allowed_actions TEXT NOT NULL,
      app_status TEXT NOT NULL,
      source_class TEXT NOT NULL,
      source_confidence TEXT NOT NULL,
      range_cells_status TEXT NOT NULL,
      import_decision TEXT NOT NULL,
      trainer_default_visibility TEXT NOT NULL,
      owner_review_required TEXT NOT NULL,
      approval_target TEXT NOT NULL,
      population_strategy_summary TEXT NOT NULL,
      latest_research_alignment TEXT NOT NULL,
      simplified_live_rule TEXT NOT NULL,
      risk_flags TEXT NOT NULL,
      review_hand_focus TEXT NOT NULL,
      codex_action TEXT NOT NULL,
      codex_notes TEXT NOT NULL,
      field_integrity TEXT NOT NULL,
      created_date TEXT NOT NULL,
      owner_decision TEXT NOT NULL DEFAULT 'PENDING',
      owner_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);
}

export function logAudit(
  nodeKey: string,
  actionType: string,
  details: unknown,
  createdBy = "local"
) {
  getLocalDb()
    .prepare(
      `INSERT INTO strategy_chart_audit_log
       (node_key, action_type, details_json, created_at, created_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(nodeKey, actionType, JSON.stringify(details), nowIso(), createdBy);
}

export function listCharts(filters?: {
  stackBb?: number;
  spotType?: string;
  position?: string;
  status?: string;
}): StrategyChartRecord[] {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.stackBb) {
    clauses.push("stack_bb = ?");
    params.push(filters.stackBb);
  }
  if (filters?.spotType) {
    clauses.push("spot_type = ?");
    params.push(filters.spotType);
  }
  if (filters?.position) {
    clauses.push("position = ?");
    params.push(filters.position);
  }
  if (filters?.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return getLocalDb()
    .prepare(
      `SELECT * FROM strategy_charts ${where}
       ORDER BY stack_bb, spot_type, position, villain_position, node_key`
    )
    .all(...(params as any[]))
    .map((row: unknown) => mapChart(row as Row));
}

export function getChart(nodeKey: string) {
  const row = getLocalDb()
    .prepare("SELECT * FROM strategy_charts WHERE node_key = ?")
    .get(normalizeNodeKey(nodeKey));
  return row ? mapChart(row as Row) : null;
}

export function getSnapshotById(id: number) {
  const row = getLocalDb()
    .prepare("SELECT * FROM strategy_chart_snapshots WHERE id = ?")
    .get(id);
  return row ? mapSnapshot(row as Row) : null;
}

export function listSnapshots(nodeKey: string): StrategyChartSnapshot[] {
  return getLocalDb()
    .prepare(
      `SELECT * FROM strategy_chart_snapshots
       WHERE node_key = ?
       ORDER BY version DESC`
    )
    .all(normalizeNodeKey(nodeKey))
    .map((row: unknown) => mapSnapshot(row as Row));
}

export function getLatestSnapshot(nodeKey: string, status: SnapshotStatus) {
  const row = getLocalDb()
    .prepare(
      `SELECT * FROM strategy_chart_snapshots
       WHERE node_key = ? AND status = ?
       ORDER BY version DESC
       LIMIT 1`
    )
    .get(normalizeNodeKey(nodeKey), status);
  return row ? mapSnapshot(row as Row) : null;
}

export function getDraft(nodeKey: string) {
  const row = getLocalDb()
    .prepare("SELECT * FROM strategy_chart_drafts WHERE node_key = ?")
    .get(normalizeNodeKey(nodeKey));
  return row ? mapDraft(row as Row) : null;
}

export function resolveChart(nodeKey: string): ResolvedStrategyChart | null {
  const chart = getChart(nodeKey);
  if (!chart) return null;

  let source: ResolvedStrategyChart["source"] = "missing";
  let snapshot: StrategyChartSnapshot | null = null;

  if (chart.activeSnapshotId) {
    snapshot = getSnapshotById(chart.activeSnapshotId);
    if (!snapshot) {
      throw new Error(`${chart.nodeKey}: active snapshot ${chart.activeSnapshotId} is missing.`);
    }
    if (snapshot.status !== "approved") {
      throw new Error(`${chart.nodeKey}: active snapshot is not approved.`);
    }
    source = "approved";
  } else {
    snapshot = getLatestSnapshot(chart.nodeKey, "reviewed");
    if (snapshot) source = "reviewed";
    if (!snapshot) {
      snapshot = getLatestSnapshot(chart.nodeKey, "seed");
      if (snapshot) source = "seed";
    }
  }

  return {
    chart,
    source,
    snapshot,
    draft: getDraft(chart.nodeKey),
  };
}

function nextVersion(nodeKey: string) {
  const row = getLocalDb()
    .prepare("SELECT MAX(version) AS max_version FROM strategy_chart_snapshots WHERE node_key = ?")
    .get(normalizeNodeKey(nodeKey)) as { max_version?: number | null } | undefined;
  return Number(row?.max_version ?? 0) + 1;
}

export function upsertSeedChart(input: {
  nodeKey: string;
  spotType: SpotType;
  stackBb: StackBucket;
  position: Position;
  villainPosition: Position | null;
  title: string;
  description?: string | null;
  allowedActions: ActionToken[];
  cells: ChartCells;
  notes?: string | null;
}) {
  const database = getLocalDb();
  return runTransaction(database, () => {
    const nodeKey = normalizeNodeKey(input.nodeKey);
    const existing = getChart(nodeKey);

    if (existing?.seedProtected) {
      logAudit(nodeKey, "seed_import_skipped", { reason: "seedProtected" });
      return { chart: existing, skipped: true };
    }

    const allowedActions = validateAllowedActions(input.allowedActions, nodeKey);
    const cells = validateChartCells({
      nodeKey,
      allowedActions,
      cells: input.cells,
    });
    const timestamp = nowIso();

    if (!existing) {
      database
        .prepare(
          `INSERT INTO strategy_charts
           (node_key, spot_type, stack_bb, position, villain_position, ante_type, format, title,
            description, allowed_actions_json, status, seed_protected, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'BBA', 'MTT', ?, ?, ?, 'seed', 0, ?, ?)`
        )
        .run(
          nodeKey,
          input.spotType,
          input.stackBb,
          input.position,
          input.villainPosition,
          input.title,
          input.description ?? null,
          JSON.stringify(allowedActions),
          timestamp,
          timestamp
        );
    } else {
      database
        .prepare(
          `UPDATE strategy_charts
           SET spot_type = ?, stack_bb = ?, position = ?, villain_position = ?, title = ?,
               description = ?, allowed_actions_json = ?, updated_at = ?
           WHERE node_key = ?`
        )
        .run(
          input.spotType,
          input.stackBb,
          input.position,
          input.villainPosition,
          input.title,
          input.description ?? null,
          JSON.stringify(allowedActions),
          timestamp,
          nodeKey
        );
    }

    const chart = getChart(nodeKey);
    if (!chart) throw new Error(`${nodeKey}: failed to upsert seed chart.`);
    const version = nextVersion(nodeKey);
    const checksum = computeChartChecksum({ nodeKey, allowedActions, cells });

    database
      .prepare(
        `INSERT INTO strategy_chart_snapshots
         (chart_id, node_key, version, status, allowed_actions_json, cells_json, checksum,
          notes, created_at, created_by)
         VALUES (?, ?, ?, 'seed', ?, ?, ?, ?, ?, 'typed-seed-import')`
      )
      .run(
        chart.id,
        nodeKey,
        version,
        JSON.stringify(allowedActions),
        JSON.stringify(cells),
        checksum,
        input.notes ?? null,
        timestamp
      );

    logAudit(nodeKey, "seed_imported", { version, checksum }, "typed-seed-import");
    return { chart: getChart(nodeKey)!, skipped: false };
  });
}

export function saveDraft(input: {
  nodeKey: string;
  allowedActions: ActionToken[];
  cells: ChartCells;
  notes?: string | null;
  updatedBy?: string;
}) {
  const chart = getChart(input.nodeKey);
  if (!chart) throw new Error(`${input.nodeKey}: chart not found.`);
  const nodeKey = chart.nodeKey;
  const allowedActions = validateAllowedActions(input.allowedActions, nodeKey);
  const cells = validateChartCells({ nodeKey, allowedActions, cells: input.cells });
  const timestamp = nowIso();

  getLocalDb()
    .prepare(
      `INSERT INTO strategy_chart_drafts
       (chart_id, node_key, allowed_actions_json, cells_json, notes, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(node_key) DO UPDATE SET
         allowed_actions_json = excluded.allowed_actions_json,
         cells_json = excluded.cells_json,
         notes = excluded.notes,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`
    )
    .run(
      chart.id,
      nodeKey,
      JSON.stringify(allowedActions),
      JSON.stringify(cells),
      input.notes ?? null,
      timestamp,
      input.updatedBy ?? "local-admin"
    );

  getLocalDb()
    .prepare("UPDATE strategy_charts SET status = 'draft', updated_at = ? WHERE node_key = ? AND status = 'seed'")
    .run(timestamp, nodeKey);
  logAudit(nodeKey, "draft_saved", { checksum: computeChartChecksum({ nodeKey, allowedActions, cells }) });
  return getDraft(nodeKey)!;
}

export function createSnapshotFromCells(input: {
  nodeKey: string;
  status: SnapshotStatus;
  allowedActions: ActionToken[];
  cells: ChartCells;
  notes?: string | null;
  createdBy?: string;
}) {
  const database = getLocalDb();
  return runTransaction(database, () => createSnapshotInCurrentTransaction(input));
}

function createSnapshotInCurrentTransaction(input: {
  nodeKey: string;
  status: SnapshotStatus;
  allowedActions: ActionToken[];
  cells: ChartCells;
  notes?: string | null;
  createdBy?: string;
}) {
  const database = getLocalDb();
    const chart = getChart(input.nodeKey);
    if (!chart) throw new Error(`${input.nodeKey}: chart not found.`);
    const nodeKey = chart.nodeKey;
    const allowedActions = validateAllowedActions(input.allowedActions, nodeKey);
    const cells = validateChartCells({ nodeKey, allowedActions, cells: input.cells });
    const version = nextVersion(nodeKey);
    const checksum = computeChartChecksum({ nodeKey, allowedActions, cells });
    const timestamp = nowIso();

    database
      .prepare(
        `INSERT INTO strategy_chart_snapshots
         (chart_id, node_key, version, status, allowed_actions_json, cells_json, checksum,
          notes, created_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        chart.id,
        nodeKey,
        version,
        input.status,
        JSON.stringify(allowedActions),
        JSON.stringify(cells),
        checksum,
        input.notes ?? null,
        timestamp,
        input.createdBy ?? "local-admin"
      );

    const snapshot = getLatestSnapshot(nodeKey, input.status);
    if (!snapshot) throw new Error(`${nodeKey}: failed to create ${input.status} snapshot.`);

    if (input.status === "approved") {
      database
        .prepare(
          `UPDATE strategy_charts
           SET status = 'approved', active_snapshot_id = ?, seed_protected = 1,
               allowed_actions_json = ?, updated_at = ?
           WHERE node_key = ?`
        )
        .run(snapshot.id, JSON.stringify(allowedActions), timestamp, nodeKey);
    } else if (input.status === "reviewed") {
      database
        .prepare(
          `UPDATE strategy_charts
           SET status = CASE WHEN status = 'approved' THEN status ELSE 'reviewed' END,
               allowed_actions_json = ?, updated_at = ?
           WHERE node_key = ?`
        )
        .run(JSON.stringify(allowedActions), timestamp, nodeKey);
    }

    logAudit(nodeKey, `chart_${input.status}`, { version, checksum });
    return snapshot;
}

export function deleteDraft(nodeKey: string) {
  getLocalDb()
    .prepare("DELETE FROM strategy_chart_drafts WHERE node_key = ?")
    .run(normalizeNodeKey(nodeKey));
}

export function listStudyNotes(filters?: { query?: string; category?: string }) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters?.query?.trim()) {
    clauses.push("(title LIKE ? OR body LIKE ? OR tags_json LIKE ? OR linked_node_key LIKE ?)");
    const query = `%${filters.query.trim()}%`;
    params.push(query, query, query, query);
  }

  if (filters?.category?.trim() && filters.category !== "all") {
    clauses.push("category = ?");
    params.push(filters.category.trim());
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return getLocalDb()
    .prepare(`SELECT * FROM study_notes ${where} ORDER BY updated_at DESC, id DESC`)
    .all(...(params as any[]))
    .map((row: unknown) => mapStudyNote(row as Row));
}

export function getStudyNote(id: number) {
  const row = getLocalDb()
    .prepare("SELECT * FROM study_notes WHERE id = ?")
    .get(id);
  return row ? mapStudyNote(row as Row) : null;
}

export function createStudyNote(input: StudyNoteInput) {
  const note = normalizeStudyNoteInput(input);
  const timestamp = nowIso();
  const result = getLocalDb()
    .prepare(
      `INSERT INTO study_notes
       (title, body, category, tags_json, linked_node_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      note.title,
      note.body,
      note.category,
      JSON.stringify(note.tags),
      note.linkedNodeKey,
      timestamp,
      timestamp
    );
  return getStudyNote(Number(result.lastInsertRowid))!;
}

export function updateStudyNote(id: number, input: StudyNoteInput) {
  const existing = getStudyNote(id);
  if (!existing) throw new Error(`Study note ${id} not found.`);
  const note = normalizeStudyNoteInput(input);
  const timestamp = nowIso();
  getLocalDb()
    .prepare(
      `UPDATE study_notes
       SET title = ?, body = ?, category = ?, tags_json = ?, linked_node_key = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      note.title,
      note.body,
      note.category,
      JSON.stringify(note.tags),
      note.linkedNodeKey,
      timestamp,
      id
    );
  return getStudyNote(id)!;
}

export function deleteStudyNote(id: number) {
  getLocalDb().prepare("DELETE FROM study_notes WHERE id = ?").run(id);
}

export function listReviewScenarios(filters?: {
  spotFamily?: string;
  stackBb?: number;
  appStatus?: string;
  sourceClass?: string;
  rangeCellsStatus?: string;
  trainerDefaultVisibility?: string;
  ownerDecision?: string;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters?.spotFamily) {
    clauses.push("s.spot_family = ?");
    values.push(filters.spotFamily);
  }
  if (filters?.stackBb) {
    clauses.push("s.stack_bb = ?");
    values.push(filters.stackBb);
  }
  if (filters?.appStatus) {
    clauses.push("s.app_status = ?");
    values.push(filters.appStatus);
  }
  if (filters?.sourceClass) {
    clauses.push("s.source_class = ?");
    values.push(filters.sourceClass);
  }
  if (filters?.rangeCellsStatus) {
    clauses.push("s.range_cells_status = ?");
    values.push(filters.rangeCellsStatus);
  }
  if (filters?.trainerDefaultVisibility) {
    clauses.push("s.trainer_default_visibility = ?");
    values.push(filters.trainerDefaultVisibility);
  }
  if (filters?.ownerDecision) {
    clauses.push("s.owner_decision = ?");
    values.push(filters.ownerDecision);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return getLocalDb()
    .prepare(
      `SELECT s.*, CASE WHEN c.node_key IS NULL THEN 0 ELSE 1 END AS linked_chart_exists
       FROM strategy_review_scenarios s
       LEFT JOIN strategy_charts c ON c.node_key = s.node_key
       ${where}
       ORDER BY s.spot_family, s.stack_bb, s.hero_position, s.villain_position, s.node_key`
    )
    .all(...values)
    .map((row: unknown) => mapReviewScenario(row as Row));
}

export function getReviewScenario(nodeKey: string) {
  const row = getLocalDb()
    .prepare(
      `SELECT s.*, CASE WHEN c.node_key IS NULL THEN 0 ELSE 1 END AS linked_chart_exists
       FROM strategy_review_scenarios s
       LEFT JOIN strategy_charts c ON c.node_key = s.node_key
       WHERE s.node_key = ?`
    )
    .get(normalizeNodeKey(nodeKey));
  return row ? mapReviewScenario(row as Row) : null;
}

export function updateReviewScenarioOwnerDecision(
  nodeKey: string,
  input: ReviewScenarioOwnerDecisionInput
) {
  const normalizedNodeKey = normalizeNodeKey(nodeKey);
  const ownerDecision = assertOwnerDecision(input.ownerDecision);
  const ownerNotes = input.ownerNotes?.trim() ?? "";
  const updatedAt = nowIso();
  const database = getLocalDb();
  return runTransaction(database, () => {
    const previous = getReviewScenario(normalizedNodeKey);
    if (!previous) {
      throw new Error(`${normalizedNodeKey}: review scenario not found.`);
    }
    database
      .prepare(
        `UPDATE strategy_review_scenarios
         SET owner_decision = ?, owner_notes = ?, updated_at = ?
         WHERE node_key = ?`
      )
      .run(ownerDecision, ownerNotes, updatedAt, normalizedNodeKey);
    database
      .prepare(
        `INSERT INTO strategy_chart_audit_log
         (node_key, action_type, details_json, created_at, created_by)
         VALUES (?, 'review_scenario_owner_decision_changed', ?, ?, 'owner')`
      )
      .run(
        normalizedNodeKey,
        JSON.stringify({
          node_key: normalizedNodeKey,
          previous_owner_decision: previous.ownerDecision,
          next_owner_decision: ownerDecision,
          previous_owner_notes: previous.ownerNotes,
          next_owner_notes: ownerNotes,
          timestamp: updatedAt,
          actor: "owner",
          source_route: "/strategy/review-scenarios",
        }),
        updatedAt
      );
    return getReviewScenario(normalizedNodeKey)!;
  });
}

function requiredScenarioValue(record: StrategyReviewScenarioInput, field: keyof StrategyReviewScenarioInput) {
  const value = record[field];
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`${record.node_key}: missing ${field}`);
  }
  return String(value).trim();
}

export function importReviewScenarioPack(pack: StrategyReviewPack) {
  const validation = validateReviewPack(pack);
  const database = getLocalDb();
  const before = getStrategyTruthTableCounts(database);

  const imported = runTransaction(database, () => {
    const existingDecisions = new Map<string, { ownerDecision: ReviewScenarioOwnerDecision; ownerNotes: string }>(
      database
        .prepare("SELECT node_key, owner_decision, owner_notes FROM strategy_review_scenarios")
        .all()
        .map((row: any) => [
          String(row.node_key),
          {
            ownerDecision: assertOwnerDecision(String(row.owner_decision)),
            ownerNotes: String(row.owner_notes ?? ""),
          },
        ])
    );
    database.prepare("DELETE FROM strategy_review_scenarios").run();
    const insert = database.prepare(
      `INSERT INTO strategy_review_scenarios
       (record_id, node_key, display_name, stack_bb, spot_family, hero_position,
        villain_position, player_count, action_context, allowed_actions, app_status,
        source_class, source_confidence, range_cells_status, import_decision,
        trainer_default_visibility, owner_review_required, approval_target,
        population_strategy_summary, latest_research_alignment, simplified_live_rule,
        risk_flags, review_hand_focus, codex_action, codex_notes, field_integrity,
        created_date, owner_decision, owner_notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const importedAt = nowIso();
    for (const record of pack.scenario_records) {
      const normalizedNodeKey = normalizeNodeKey(requiredScenarioValue(record, "node_key"));
      const previousDecision = existingDecisions.get(normalizedNodeKey);
      insert.run(
        requiredScenarioValue(record, "record_id"),
        normalizedNodeKey,
        requiredScenarioValue(record, "display_name"),
        Number(requiredScenarioValue(record, "stack_bb")),
        requiredScenarioValue(record, "spot_family"),
        requiredScenarioValue(record, "hero_position"),
        requiredScenarioValue(record, "villain_position"),
        requiredScenarioValue(record, "player_count"),
        requiredScenarioValue(record, "action_context"),
        requiredScenarioValue(record, "allowed_actions"),
        requiredScenarioValue(record, "app_status"),
        requiredScenarioValue(record, "source_class"),
        requiredScenarioValue(record, "source_confidence"),
        requiredScenarioValue(record, "range_cells_status"),
        requiredScenarioValue(record, "import_decision"),
        requiredScenarioValue(record, "trainer_default_visibility"),
        requiredScenarioValue(record, "owner_review_required"),
        requiredScenarioValue(record, "approval_target"),
        requiredScenarioValue(record, "population_strategy_summary"),
        requiredScenarioValue(record, "latest_research_alignment"),
        requiredScenarioValue(record, "simplified_live_rule"),
        requiredScenarioValue(record, "risk_flags"),
        requiredScenarioValue(record, "review_hand_focus"),
        requiredScenarioValue(record, "codex_action"),
        requiredScenarioValue(record, "codex_notes"),
        requiredScenarioValue(record, "field_integrity"),
        requiredScenarioValue(record, "created_date"),
        previousDecision?.ownerDecision ?? "PENDING",
        previousDecision?.ownerNotes ?? "",
        importedAt
      );
    }
    return pack.scenario_records.length;
  });

  syncReviewScenariosWithExistingPopulationDraftCharts("existing population draft chart");

  const after = getStrategyTruthTableCounts(database);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error("Review scenario import changed strategy chart tables.");
  }
  logAudit(
    "__review_scenarios__",
    "review_scenarios_imported",
    {
      imported,
      scenarioRecordCount: pack.scenario_records.length,
      strategyTruthTableCountsBefore: before,
      strategyTruthTableCountsAfter: after,
      strategyTruthTablesUnchanged: true,
    },
    "review-scenario-import"
  );

  return { imported, validation, chartTableCountsBefore: before, chartTableCountsAfter: after };
}

function tally(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function getReviewScenarioSummary(): StrategyReviewSummary {
  const rows: StrategyReviewScenario[] = listReviewScenarios();
  return {
    total: rows.length,
    byFamily: tally(rows.map(row => row.spotFamily)),
    byVisibility: tally(rows.map(row => row.trainerDefaultVisibility)),
    bySourceClass: tally(rows.map(row => row.sourceClass)),
    byRangeCellsStatus: tally(rows.map(row => row.rangeCellsStatus)),
    byOwnerDecision: tally(rows.map(row => row.ownerDecision)),
    linkedChartCount: rows.filter(row => row.linkedChartExists).length,
    sourceRequiredCount: rows.filter(row => row.rangeCellsStatus === "NO_CHART_CELLS_IMPORTED").length,
    facing3betCount: rows.filter(row => row.spotFamily === "facing_3bet").length,
  };
}

export function getReviewScenarioQa(): StrategyReviewQaSummary {
  const database = getLocalDb();
  const rows: StrategyReviewScenario[] = listReviewScenarios();
  const requiredColumns = [
    "record_id",
    "node_key",
    "display_name",
    "stack_bb",
    "spot_family",
    "hero_position",
    "villain_position",
    "player_count",
    "action_context",
    "allowed_actions",
    "app_status",
    "source_class",
    "source_confidence",
    "range_cells_status",
    "import_decision",
    "trainer_default_visibility",
    "owner_review_required",
    "approval_target",
    "population_strategy_summary",
    "latest_research_alignment",
    "simplified_live_rule",
    "risk_flags",
    "review_hand_focus",
    "codex_action",
    "codex_notes",
    "field_integrity",
    "created_date",
    "owner_decision",
    "updated_at",
  ];
  const emptyFieldCount = requiredColumns.reduce((total, column) => {
    const row = database
      .prepare(
        `SELECT COUNT(*) AS count FROM strategy_review_scenarios
         WHERE ${column} IS NULL OR TRIM(CAST(${column} AS TEXT)) = ''`
      )
      .get() as { count: number };
    return total + Number(row.count);
  }, 0);
  const invalidFacing3betRows = Number(
    (
      database
        .prepare(
          `SELECT COUNT(*) AS count FROM strategy_review_scenarios
           WHERE spot_family = 'facing_3bet'
             AND NOT (
               (
                 range_cells_status = 'NO_CHART_CELLS_IMPORTED'
                 AND trainer_default_visibility = 'HIDDEN_DEFAULT_NOT_DRILLABLE'
                 AND node_key NOT IN (SELECT node_key FROM strategy_charts)
               )
               OR
               (
                 app_status = 'population_draft_seed'
                 AND range_cells_status = 'FULL_169_POPULATION_DRAFT'
                 AND trainer_default_visibility = 'HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY'
                 AND node_key IN (SELECT node_key FROM strategy_charts)
               )
             )`
        )
        .get() as { count: number }
    ).count
  );
  const sourceRequiredDrillableRows = rows.filter(
    row =>
      row.rangeCellsStatus === "NO_CHART_CELLS_IMPORTED" &&
      row.trainerDefaultVisibility !== "HIDDEN_DEFAULT_NOT_DRILLABLE"
  ).length;
  const populationDraftVisibilityErrors = rows.filter(
    row =>
      row.appStatus === "population_draft_seed" &&
      row.trainerDefaultVisibility !== "HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY"
  ).length;
  const latestImport = getReviewScenarioImportAudit(database);
  const before = (latestImport?.details.strategyTruthTableCountsBefore ??
    null) as Record<string, number> | null;
  const after = (latestImport?.details.strategyTruthTableCountsAfter ??
    null) as Record<string, number> | null;
  const strategyTruthTablesUnchanged = Boolean(
    before && after && JSON.stringify(before) === JSON.stringify(after)
  );
  const warnings: string[] = [];
  if (rows.length !== 184) warnings.push(`Expected 184 review scenarios, found ${rows.length}.`);
  if (emptyFieldCount > 0) warnings.push(`${emptyFieldCount} required review scenario fields are blank.`);
  if (invalidFacing3betRows > 0) warnings.push(`${invalidFacing3betRows} facing-3bet rows violate quarantine rules.`);
  if (sourceRequiredDrillableRows > 0) warnings.push(`${sourceRequiredDrillableRows} source-required rows are drillable.`);
  if (populationDraftVisibilityErrors > 0) warnings.push(`${populationDraftVisibilityErrors} population draft rows are not opt-in only.`);
  if (!strategyTruthTablesUnchanged) warnings.push("No matching review import audit proving strategy truth tables stayed unchanged.");

  return {
    scenarioCount: rows.length,
    familyCounts: tally(rows.map(row => row.spotFamily)),
    visibilityCounts: tally(rows.map(row => row.trainerDefaultVisibility)),
    ownerDecisionCounts: tally(rows.map(row => row.ownerDecision)),
    sourceClassCounts: tally(rows.map(row => row.sourceClass)),
    rangeCellsStatusCounts: tally(rows.map(row => row.rangeCellsStatus)),
    linkedChartExistsCounts: {
      true: rows.filter(row => row.linkedChartExists).length,
      false: rows.filter(row => !row.linkedChartExists).length,
    },
    emptyFieldCount,
    invalidFacing3betRows,
    sourceRequiredDrillableRows,
    populationDraftVisibilityErrors,
    strategyTruthTablesUnchanged,
    strategyTruthTableCountsBefore: before,
    strategyTruthTableCountsAfter: after,
    lastImportedAt: latestImport?.createdAt ?? null,
    warnings,
  };
}

export function revertToSnapshot(nodeKey: string, snapshotId: number) {
  const snapshot = getSnapshotById(snapshotId);
  if (!snapshot || snapshot.nodeKey !== normalizeNodeKey(nodeKey)) {
    throw new Error(`${nodeKey}: snapshot ${snapshotId} not found.`);
  }

  return createSnapshotFromCells({
    nodeKey: snapshot.nodeKey,
    status: "approved",
    allowedActions: snapshot.allowedActions,
    cells: snapshot.cells,
    notes: `Reverted from version ${snapshot.version}.`,
    createdBy: "local-admin",
  });
}

export function exportApprovedPack(): StrategyPack {
  const charts = listCharts()
    .map(chart => {
      if (!chart.activeSnapshotId) return null;
      const snapshot = getSnapshotById(chart.activeSnapshotId);
      if (!snapshot) return null;
      const packChart: StrategyPackChart = {
        nodeKey: chart.nodeKey,
        spotType: chart.spotType,
        stackBb: chart.stackBb,
        position: chart.position,
        villainPosition: chart.villainPosition,
        anteType: chart.anteType,
        format: chart.format,
        title: chart.title,
        description: chart.description,
        status: "approved",
        version: snapshot.version,
        allowedActions: snapshot.allowedActions,
        cells: snapshot.cells,
        checksum: snapshot.checksum,
        notes: snapshot.notes,
      };
      return packChart;
    })
    .filter((chart): chart is StrategyPackChart => Boolean(chart));

  const checksum = computePackChecksum(charts);
  return {
    schemaVersion: 1,
    app: "mtt-study-local",
    exportedAt: nowIso(),
    chartCount: charts.length,
    checksum,
    charts,
  };
}

export function exportFullBackup() {
  const database = getLocalDb();
  const backup = {
    schemaVersion: 1,
    app: "mtt-study-local-backup",
    exportedAt: nowIso(),
    dbPath: DB_PATH,
    charts: database.prepare("SELECT * FROM strategy_charts ORDER BY node_key").all(),
    snapshots: database
      .prepare("SELECT * FROM strategy_chart_snapshots ORDER BY node_key, version")
      .all(),
    drafts: database.prepare("SELECT * FROM strategy_chart_drafts ORDER BY node_key").all(),
    auditLog: database.prepare("SELECT * FROM strategy_chart_audit_log ORDER BY id").all(),
    importExports: database.prepare("SELECT * FROM strategy_import_exports ORDER BY id").all(),
    studyNotes: database.prepare("SELECT * FROM study_notes ORDER BY id").all(),
    reviewScenarios: database.prepare("SELECT * FROM strategy_review_scenarios ORDER BY id").all(),
  };

  const checksum = computePackChecksum(
    backup.snapshots.map((row: any) => ({
      nodeKey: String(row.node_key),
      version: Number(row.version),
      status: row.status,
      checksum: String(row.checksum),
      spotType: "rfi",
      stackBb: 15,
      position: "UTG",
      villainPosition: null,
      anteType: "BBA",
      format: "MTT",
      title: String(row.node_key),
      allowedActions: json<ActionToken[]>(String(row.allowed_actions_json), []),
      cells: json<ChartCells>(String(row.cells_json), {}),
    }))
  );

  return { ...backup, checksum };
}

export function restoreFullBackup(backup: any) {
  if (backup?.schemaVersion !== 1 || backup?.app !== "mtt-study-local-backup") {
    throw new Error("Unsupported local backup.");
  }

  const requiredTables = ["charts", "snapshots", "drafts", "auditLog", "importExports"];
  for (const table of requiredTables) {
    if (!Array.isArray(backup[table])) {
      throw new Error(`Backup is missing ${table}.`);
    }
  }
  const studyNotes = Array.isArray(backup.studyNotes) ? backup.studyNotes : [];
  const reviewScenarios = Array.isArray(backup.reviewScenarios) ? backup.reviewScenarios : [];

  for (const row of backup.snapshots) {
    const nodeKey = String(row.node_key);
    const allowedActions = validateAllowedActions(
      json<string[]>(String(row.allowed_actions_json), []),
      nodeKey
    );
    validateChartCells({
      nodeKey,
      allowedActions,
      cells: json<Record<string, string>>(String(row.cells_json), {}),
    });
  }

  const database = getLocalDb();
  return runTransaction(database, () => {
    database.exec(`
      DELETE FROM strategy_import_exports;
      DELETE FROM strategy_chart_audit_log;
      DELETE FROM strategy_chart_drafts;
      DELETE FROM strategy_chart_snapshots;
      DELETE FROM strategy_charts;
      DELETE FROM study_notes;
      DELETE FROM strategy_review_scenarios;
    `);

    const insertChart = database.prepare(
      `INSERT INTO strategy_charts
       (id, node_key, spot_type, stack_bb, position, villain_position, ante_type, format,
        title, description, allowed_actions_json, status, active_snapshot_id, seed_protected,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of backup.charts) {
      insertChart.run(
        row.id,
        row.node_key,
        row.spot_type,
        row.stack_bb,
        row.position,
        row.villain_position,
        row.ante_type,
        row.format,
        row.title,
        row.description,
        row.allowed_actions_json,
        row.status,
        row.active_snapshot_id,
        row.seed_protected,
        row.created_at,
        row.updated_at
      );
    }

    const insertSnapshot = database.prepare(
      `INSERT INTO strategy_chart_snapshots
       (id, chart_id, node_key, version, status, allowed_actions_json, cells_json, checksum,
        notes, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of backup.snapshots) {
      insertSnapshot.run(
        row.id,
        row.chart_id,
        row.node_key,
        row.version,
        row.status,
        row.allowed_actions_json,
        row.cells_json,
        row.checksum,
        row.notes,
        row.created_at,
        row.created_by
      );
    }

    const insertDraft = database.prepare(
      `INSERT INTO strategy_chart_drafts
       (id, chart_id, node_key, allowed_actions_json, cells_json, notes, updated_at, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of backup.drafts) {
      insertDraft.run(
        row.id,
        row.chart_id,
        row.node_key,
        row.allowed_actions_json,
        row.cells_json,
        row.notes,
        row.updated_at,
        row.updated_by
      );
    }

    const insertAudit = database.prepare(
      `INSERT INTO strategy_chart_audit_log
       (id, node_key, action_type, details_json, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const row of backup.auditLog) {
      insertAudit.run(
        row.id,
        row.node_key,
        row.action_type,
        row.details_json,
        row.created_at,
        row.created_by
      );
    }

    const insertImportExport = database.prepare(
      `INSERT INTO strategy_import_exports
       (id, type, file_name, chart_count, checksum, notes, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of backup.importExports) {
      insertImportExport.run(
        row.id,
        row.type,
        row.file_name,
        row.chart_count,
        row.checksum,
        row.notes,
        row.created_at,
        row.created_by
      );
    }

    const insertStudyNote = database.prepare(
      `INSERT INTO study_notes
       (id, title, body, category, tags_json, linked_node_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of studyNotes) {
      insertStudyNote.run(
        row.id,
        row.title,
        row.body,
        row.category,
        row.tags_json ?? "[]",
        row.linked_node_key,
        row.created_at,
        row.updated_at
      );
    }

    const insertReviewScenario = database.prepare(
      `INSERT INTO strategy_review_scenarios
       (id, record_id, node_key, display_name, stack_bb, spot_family, hero_position,
        villain_position, player_count, action_context, allowed_actions, app_status,
        source_class, source_confidence, range_cells_status, import_decision,
        trainer_default_visibility, owner_review_required, approval_target,
        population_strategy_summary, latest_research_alignment, simplified_live_rule,
        risk_flags, review_hand_focus, codex_action, codex_notes, field_integrity,
        created_date, owner_decision, owner_notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of reviewScenarios) {
      insertReviewScenario.run(
        row.id,
        row.record_id,
        row.node_key,
        row.display_name,
        row.stack_bb,
        row.spot_family,
        row.hero_position,
        row.villain_position,
        row.player_count,
        row.action_context,
        row.allowed_actions,
        row.app_status,
        row.source_class,
        row.source_confidence,
        row.range_cells_status,
        row.import_decision,
        row.trainer_default_visibility,
        row.owner_review_required,
        row.approval_target,
        row.population_strategy_summary,
        row.latest_research_alignment,
        row.simplified_live_rule,
        row.risk_flags,
        row.review_hand_focus,
        row.codex_action,
        row.codex_notes,
        row.field_integrity,
        row.created_date,
        row.owner_decision ?? "PENDING",
        row.owner_notes ?? "",
        row.updated_at ?? nowIso()
      );
    }

    database
      .prepare(
        `INSERT INTO strategy_import_exports
         (type, file_name, chart_count, checksum, notes, created_at, created_by)
         VALUES ('restore', 'full-backup.json', ?, ?, 'Full backup restore', ?, 'local-admin')`
      )
      .run(backup.charts.length, String(backup.checksum ?? ""), nowIso());

    return {
      restoredCharts: backup.charts.length,
      restoredSnapshots: backup.snapshots.length,
      restoredStudyNotes: studyNotes.length,
      restoredReviewScenarios: reviewScenarios.length,
    };
  });
}

export function importApprovedPack(pack: StrategyPack) {
  if (pack.schemaVersion !== 1 || pack.app !== "mtt-study-local") {
    throw new Error("Unsupported strategy pack.");
  }

  const normalizedCharts = pack.charts.map(chart => {
    const nodeKey = normalizeNodeKey(chart.nodeKey);
    const allowedActions = validateAllowedActions(chart.allowedActions, nodeKey);
    const cells = validateChartCells({ nodeKey, allowedActions, cells: chart.cells });
    const checksum = computeChartChecksum({ nodeKey, allowedActions, cells });
    if (checksum !== chart.checksum) {
      throw new Error(`${nodeKey}: checksum mismatch.`);
    }
    return { ...chart, nodeKey, allowedActions, cells, checksum };
  });

  const checksum = computePackChecksum(normalizedCharts);
  if (checksum !== pack.checksum) {
    throw new Error("Pack checksum mismatch.");
  }

  const database = getLocalDb();
  return runTransaction(database, () => {
    for (const chart of normalizedCharts) {
      const existing = getChart(chart.nodeKey);
      if (!existing) {
        throw new Error(`${chart.nodeKey}: unknown nodeKey. Create the chart before importing approved data.`);
      }
      createSnapshotInCurrentTransaction({
        nodeKey: chart.nodeKey,
        status: "approved",
        allowedActions: chart.allowedActions,
        cells: chart.cells,
        notes: chart.notes ?? "Approved strategy pack import.",
        createdBy: "approved-pack-import",
      });
      logAudit(chart.nodeKey, "chart_imported", { checksum: chart.checksum }, "approved-pack-import");
    }

    database
      .prepare(
        `INSERT INTO strategy_import_exports
         (type, file_name, chart_count, checksum, notes, created_at, created_by)
         VALUES ('import', 'approved-pack.json', ?, ?, ?, ?, 'local-admin')`
      )
      .run(normalizedCharts.length, checksum, "Approved pack import", nowIso());

    return { imported: normalizedCharts.length, checksum };
  });
}

export function importPopulationDraftPack(pack: PopulationDraftPack) {
  if (
    pack?.schemaVersion !== 1 ||
    (pack.kind !== "mtt-study-population-draft-pack" &&
      pack.kind !== "mtt-study-source-pack-template")
  ) {
    throw new Error("Unsupported population draft pack.");
  }

  const normalizedCharts = pack.charts.map(chart => {
    const nodeKey = normalizeNodeKey(chart.nodeKey);
    if (chart.reviewed !== false) {
      throw new Error(`${nodeKey}: population draft charts must keep reviewed=false.`);
    }
    if (chart.sourceType !== "population_constructed") {
      throw new Error(`${nodeKey}: sourceType must be population_constructed.`);
    }
    const allowedActions = validateAllowedActions(chart.allowedActions, nodeKey);
    const cells = validateChartCells({ nodeKey, allowedActions, cells: chart.cells });
    return {
      ...chart,
      nodeKey,
      allowedActions,
      cells,
      stackBb: chart.stackBb,
      spotFamily: chart.spotFamily,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
    };
  });

  let imported = 0;
  let skipped = 0;
  for (const chart of normalizedCharts) {
    const notes = [
      "Population draft - review before approval.",
      `sourceName=${chart.sourceName}`,
      `sourceType=${chart.sourceType}`,
      `batch=${pack.batch}`,
      chart.sourceNotes,
    ]
      .filter(Boolean)
      .join("\n");
    const result = upsertSeedChart({
      nodeKey: chart.nodeKey,
      spotType: chart.spotFamily,
      stackBb: chart.stackBb,
      position: chart.heroPosition,
      villainPosition: chart.villainPosition,
      title: chart.title ?? chart.nodeKey,
      description: "Population draft - review before approval. sourceType=population_constructed.",
      allowedActions: chart.allowedActions,
      cells: chart.cells,
      notes,
    });

    if (result.skipped) skipped += 1;
    else {
      imported += 1;
      markReviewScenarioAsPopulationDraftChart({
        nodeKey: chart.nodeKey,
        allowedActions: chart.allowedActions,
        batch: pack.batch,
      });
    }
  }

  getLocalDb()
    .prepare(
      `INSERT INTO strategy_import_exports
       (type, file_name, chart_count, checksum, notes, created_at, created_by)
       VALUES ('import', ?, ?, ?, ?, ?, 'population-draft-import')`
    )
    .run(
      `${normalizeNodeKey(pack.batch)}.json`,
      normalizedCharts.length,
      computePackChecksum(
        normalizedCharts.map(chart => ({
          nodeKey: chart.nodeKey,
          spotType: chart.spotFamily,
          stackBb: chart.stackBb,
          position: chart.heroPosition,
          villainPosition: chart.villainPosition,
          anteType: "BBA",
          format: "MTT",
          title: chart.title ?? chart.nodeKey,
          status: "seed",
          version: 0,
          allowedActions: chart.allowedActions,
          cells: chart.cells,
          checksum: computeChartChecksum({
            nodeKey: chart.nodeKey,
            allowedActions: chart.allowedActions,
            cells: chart.cells,
          }),
        }))
      ),
      "Population draft import. Not owner-approved.",
      nowIso()
    );

  return { imported, skipped, totalCharts: normalizedCharts.length };
}

export function buildAuditSummary() {
  const charts = listCharts();
  const populationDrafts = charts
    .map(chart => {
      const resolved = resolveChart(chart.nodeKey);
      const notes = resolved?.snapshot?.notes ?? "";
      const description = chart.description ?? "";
      const isPopulationDraft =
        description.toLowerCase().includes("population_constructed") ||
        description.toLowerCase().includes("population draft") ||
        notes.toLowerCase().includes("population_constructed") ||
        notes.toLowerCase().includes("population draft");
      if (!isPopulationDraft) return null;

      return {
        nodeKey: chart.nodeKey,
        title: chart.title,
        stackBb: chart.stackBb,
        spotType: chart.spotType,
        sourceType: "population_constructed",
        lastImported: resolved?.snapshot?.createdAt ?? chart.updatedAt,
      };
    })
    .filter((chart): chart is NonNullable<typeof chart> => Boolean(chart));
  const counts = {
    charts: charts.length,
    seed: charts.filter(chart => chart.status === "seed").length,
    draft: charts.filter(chart => chart.status === "draft").length,
    reviewed: charts.filter(chart => chart.status === "reviewed").length,
    approved: charts.filter(chart => chart.status === "approved").length,
    snapshots: Number(
      (getLocalDb()
        .prepare("SELECT COUNT(*) AS count FROM strategy_chart_snapshots")
        .get() as { count: number }).count
    ),
    drafts: Number(
      (getLocalDb()
        .prepare("SELECT COUNT(*) AS count FROM strategy_chart_drafts")
        .get() as { count: number }).count
    ),
  };

  return {
    dbPath: DB_PATH,
    checkpointBackupPath: path.join(
      DATA_DIR,
      "backups",
      "mtt-study-backup-after-review-scenario-layer-2026-05-20.json"
    ),
    counts,
    populationDrafts,
    reviewScenarios: getReviewScenarioSummary(),
    reviewScenarioQa: getReviewScenarioQa(),
    notReviewed: charts.filter(chart => chart.status === "seed" || chart.status === "draft"),
  };
}

export type TrainerHandPool = "all" | "playable" | "fold";
export type TrainerChartSource = "approved" | "reviewed_approved" | "typed_seed" | "include_population";

function isPopulationDraftResolved(resolved: ResolvedStrategyChart) {
  const text = [resolved.chart.description, resolved.snapshot?.notes]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  return text.includes("population_constructed") || text.includes("population draft");
}

function trainerSourceAllowed(resolved: ResolvedStrategyChart, chartSource: TrainerChartSource) {
  if (!resolved.snapshot || resolved.source === "missing") return false;
  if (chartSource === "include_population") return true;
  if (isPopulationDraftResolved(resolved)) return false;
  if (chartSource === "approved") return resolved.source === "approved";
  if (chartSource === "reviewed_approved") {
    return resolved.source === "approved" || resolved.source === "reviewed";
  }
  return resolved.source === "approved" || resolved.source === "reviewed" || resolved.source === "seed";
}

export function handsForTrainerPool(
  cells: Record<string, string>,
  handPool: TrainerHandPool = "playable"
) {
  if (handPool === "all") return ALL_HANDS;
  if (handPool === "fold") return ALL_HANDS.filter(hand => cells[hand] === "FOLD");
  return ALL_HANDS.filter(hand => cells[hand] && cells[hand] !== "FOLD");
}

export function chooseTrainerQuestion(filters?: {
  stackBb?: number;
  spotType?: string;
  handPool?: TrainerHandPool;
  nodeKey?: string;
  chartSource?: TrainerChartSource;
}) {
  const chartSource = filters?.chartSource ?? "typed_seed";
  const candidateCharts = filters?.nodeKey
    ? [getChart(filters.nodeKey)].filter((chart): chart is StrategyChartRecord => Boolean(chart))
    : listCharts(filters);
  const candidates = candidateCharts
    .map(chart => resolveChart(chart.nodeKey))
    .filter(
      (resolved): resolved is ResolvedStrategyChart =>
        resolved !== null && trainerSourceAllowed(resolved, chartSource)
    )
    .sort((left, right) => {
      const sourceScore = (source: ResolvedStrategyChart["source"]) =>
        source === "approved" ? 3 : source === "reviewed" ? 2 : source === "seed" ? 1 : 0;
      return sourceScore(right.source) - sourceScore(left.source);
    });

  if (candidates.length === 0) return null;
  const chart = candidates[Math.floor(Math.random() * candidates.length)]!;
  const snapshot = chart.snapshot!;
  const handPool = filters?.handPool ?? "playable";
  const candidateHands = handsForTrainerPool(snapshot.cells, handPool);
  if (candidateHands.length === 0) return null;
  const handCode = candidateHands[Math.floor(Math.random() * candidateHands.length)];
  const correctAction = snapshot.cells[handCode]!;
  const allowedActions = [...snapshot.allowedActions].sort(
    (left, right) => ACTION_PRIORITY[right] - ACTION_PRIORITY[left]
  );

  return {
    chart: chart.chart,
    snapshot,
    source: chart.source,
    handCode,
    correctAction,
    allowedActions,
    handPool,
  };
}
