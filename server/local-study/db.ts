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
    else imported += 1;
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
    counts,
    notReviewed: charts.filter(chart => chart.status === "seed" || chart.status === "draft"),
  };
}

export type TrainerHandPool = "all" | "playable" | "fold";

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
}) {
  const candidateCharts = filters?.nodeKey
    ? [getChart(filters.nodeKey)].filter((chart): chart is StrategyChartRecord => Boolean(chart))
    : listCharts(filters);
  const candidates = candidateCharts
    .map(chart => resolveChart(chart.nodeKey))
    .filter(
      (resolved): resolved is ResolvedStrategyChart =>
        resolved !== null && Boolean(resolved.snapshot) && resolved.source !== "missing"
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
