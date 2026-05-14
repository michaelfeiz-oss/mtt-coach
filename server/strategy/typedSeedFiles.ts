import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import {
  ACTION_PRIORITY,
  buildSpotKey,
  displayVillainGroupLabel,
  formatStrategyContextLine,
  formatStrategyNodeTitle,
  type Action,
  type PlayerCount,
  type Position,
  type StackDepth,
  type StrategyNodeRangeRow,
  type StrategyNodeSummary,
  type StrategyRangeSeedRow,
  type VillainGroup,
} from "../../shared/preflopStrategy";
import { compileNotationRows } from "../../shared/strategyNotation";
import { validateSeedRows } from "../../shared/strategySeedValidation";

export const STRATEGY_SEED_ROOT = path.resolve(
  import.meta.dirname,
  "seeds",
  "v1"
);
export const STRATEGY_SEED_MANIFEST = path.join(
  STRATEGY_SEED_ROOT,
  "manifest.json"
);

interface StrategySeedManifestFile {
  path: string;
  stackBucket?: StackDepth;
  scenarioFamily?: StrategyRangeSeedRow["scenarioFamily"] | "mixed";
  reviewedRowsExpected?: number;
}

interface StrategySeedManifest {
  version: string;
  files: Array<string | StrategySeedManifestFile>;
}

export interface ParsedStrategySeedNode {
  summary: StrategyNodeSummary;
  rows: StrategyNodeRangeRow[];
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      const nextCharacter = line[index + 1];
      if (insideQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map(value => value.trim());
}

function parseBoolean(value: string) {
  return value.trim().toLowerCase() === "true";
}

function parseNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapObjectToSeedRow(candidate: Record<string, unknown>): StrategyRangeSeedRow {
  const action = String(candidate.action ?? "").trim().toUpperCase() as Action;
  const scenarioFamily = String(candidate.scenarioFamily ?? "").trim() as StrategyRangeSeedRow["scenarioFamily"];
  const villainPosition = parseNullableString(String(candidate.villainPosition ?? "")) as Position | null;
  const rawVillainGroup = parseNullableString(String(candidate.villainGroup ?? ""));
  const villainGroup =
    (scenarioFamily === "bb_vs_sb_open" || scenarioFamily === "bb_vs_sb_limp") &&
    villainPosition === "SB" &&
    rawVillainGroup === "blind"
      ? null
      : (rawVillainGroup as VillainGroup | null);
  const priority =
    typeof candidate.priority === "number"
      ? candidate.priority
      : Number(candidate.priority ?? ACTION_PRIORITY[action]);

  return {
    version: String(candidate.version ?? "").trim(),
    stackBucket: Number(candidate.stackBucket) as StackDepth,
    playerCount: Number(candidate.playerCount ?? 9) as PlayerCount,
    scenarioFamily,
    heroPosition: String(candidate.heroPosition ?? "").trim() as Position,
    villainPosition,
    villainGroup,
    action,
    rangeNotation: String(candidate.rangeNotation ?? "").trim(),
    priority,
    notes: parseNullableString(String(candidate.notes ?? "")),
    reviewed:
      typeof candidate.reviewed === "boolean"
        ? candidate.reviewed
        : parseBoolean(String(candidate.reviewed ?? "false")),
  };
}

function normalizeManifestFile(file: string | StrategySeedManifestFile) {
  if (typeof file === "string") {
    return {
      path: file,
      stackBucket: undefined,
      scenarioFamily: undefined,
      reviewedRowsExpected: undefined,
    };
  }

  return {
    ...file,
    scenarioFamily:
      file.scenarioFamily === "mixed" ? undefined : file.scenarioFamily,
  };
}

function applyManifestDefaults(
  rows: StrategyRangeSeedRow[],
  file: ReturnType<typeof normalizeManifestFile>,
  manifestVersion: string
) {
  return rows.map(row => ({
    ...row,
    version: row.version || manifestVersion,
    playerCount: row.playerCount || 9,
    stackBucket: (row.stackBucket || file.stackBucket) as StackDepth,
    scenarioFamily: (row.scenarioFamily || file.scenarioFamily) as StrategyRangeSeedRow["scenarioFamily"],
  }));
}

function validateManifestFileRows(
  rows: StrategyRangeSeedRow[],
  file: ReturnType<typeof normalizeManifestFile>
) {
  if (
    file.reviewedRowsExpected !== undefined &&
    rows.filter(row => row.reviewed).length !== file.reviewedRowsExpected
  ) {
    throw new Error(
      `Seed file ${file.path} expected ${file.reviewedRowsExpected} reviewed rows but loaded ${rows.filter(row => row.reviewed).length}.`
    );
  }

  if (file.stackBucket !== undefined) {
    const mismatches = rows.filter(row => row.stackBucket !== file.stackBucket);
    if (mismatches.length > 0) {
      throw new Error(`Seed file ${file.path} contains rows outside stack ${file.stackBucket}.`);
    }
  }

  if (file.scenarioFamily !== undefined) {
    const mismatches = rows.filter(row => row.scenarioFamily !== file.scenarioFamily);
    if (mismatches.length > 0) {
      throw new Error(
        `Seed file ${file.path} contains rows outside scenarioFamily ${file.scenarioFamily}.`
      );
    }
  }
}

function parseCsvRows(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const record: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    return mapObjectToSeedRow(record);
  });
}

function parseJsonRows(content: string) {
  const parsed: unknown = JSON.parse(content);
  const rows = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as { rows?: unknown }).rows)
      ? (parsed as { rows: unknown[] }).rows
      : [];

  return rows.map(row => mapObjectToSeedRow(row as Record<string, unknown>));
}

async function readSeedRowsFromFile(filePath: string) {
  const content = await fs.readFile(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".csv") return parseCsvRows(content);
  if (extension === ".json") return parseJsonRows(content);

  throw new Error(`Unsupported strategy seed file type: ${filePath}`);
}

function readSeedRowsFromFileSync(filePath: string) {
  const content = fsSync.readFileSync(filePath, "utf8");
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".csv") return parseCsvRows(content);
  if (extension === ".json") return parseJsonRows(content);

  throw new Error(`Unsupported strategy seed file type: ${filePath}`);
}

function buildSourceLabel(reviewed: boolean) {
  return reviewed ? "Reviewed typed seed" : "Not yet reviewed";
}

function buildNodeIdentityKey(row: StrategyRangeSeedRow) {
  return [
    row.version,
    row.stackBucket,
    row.playerCount,
    row.scenarioFamily,
    row.heroPosition,
    row.villainPosition ?? "",
    row.villainGroup ?? "",
  ].join("|");
}

function groupSeedRows(rows: StrategyRangeSeedRow[]): ParsedStrategySeedNode[] {
  const byNode = new Map<string, StrategyRangeSeedRow[]>();

  for (const row of rows) {
    const key = buildNodeIdentityKey(row);
    const bucket = byNode.get(key) ?? [];
    bucket.push(row);
    byNode.set(key, bucket);
  }

  return Array.from(byNode.values()).map((nodeRows, index) => {
    const [first] = nodeRows;
    const spotKey = buildSpotKey({
      version: first.version,
      stackBucket: first.stackBucket,
      playerCount: first.playerCount,
      scenarioFamily: first.scenarioFamily,
      heroPosition: first.heroPosition,
      villainPosition: first.villainPosition,
      villainGroup: first.villainGroup,
    });

    const title = formatStrategyNodeTitle({
      stackDepth: first.stackBucket,
      spotGroup: first.scenarioFamily,
      heroPosition: first.heroPosition,
      villainPosition: first.villainPosition,
      villainGroup: first.villainGroup,
    });

    const summary: StrategyNodeSummary = {
      id: index + 1,
      version: first.version,
      stackBucket: first.stackBucket,
      playerCount: first.playerCount,
      scenarioFamily: first.scenarioFamily,
      heroPosition: first.heroPosition,
      villainPosition: first.villainPosition ?? null,
      villainGroup: first.villainGroup ?? null,
      title,
      spotKey,
      stackDepth: first.stackBucket,
      spotGroup: first.scenarioFamily,
      reviewed: first.reviewed,
      sourceLabel: buildSourceLabel(first.reviewed),
    };

    return {
      summary,
      rows: nodeRows.map(row => ({
        action: row.action,
        rangeNotation: row.rangeNotation,
        priority: row.priority,
        notes: row.notes,
      })),
    };
  });
}

export async function readStrategySeedManifest(
  manifestPath = STRATEGY_SEED_MANIFEST
): Promise<StrategySeedManifest> {
  const content = await fs.readFile(manifestPath, "utf8");
  return JSON.parse(content) as StrategySeedManifest;
}

export function readStrategySeedManifestSync(
  manifestPath = STRATEGY_SEED_MANIFEST
): StrategySeedManifest {
  const content = fsSync.readFileSync(manifestPath, "utf8");
  return JSON.parse(content) as StrategySeedManifest;
}

export async function loadStrategySeedRows(
  manifestPath = STRATEGY_SEED_MANIFEST
): Promise<StrategyRangeSeedRow[]> {
  const manifest = await readStrategySeedManifest(manifestPath);
  const rows: StrategyRangeSeedRow[] = [];

  for (const manifestFile of manifest.files.map(normalizeManifestFile)) {
    const absoluteFile = path.resolve(path.dirname(manifestPath), manifestFile.path);
    const loadedRows = applyManifestDefaults(
      await readSeedRowsFromFile(absoluteFile),
      manifestFile,
      manifest.version
    );
    validateManifestFileRows(loadedRows, manifestFile);
    rows.push(...loadedRows);
  }

  validateSeedRows(rows);
  return rows;
}

export function loadStrategySeedRowsSync(
  manifestPath = STRATEGY_SEED_MANIFEST
): StrategyRangeSeedRow[] {
  const manifest = readStrategySeedManifestSync(manifestPath);
  const rows: StrategyRangeSeedRow[] = [];

  for (const manifestFile of manifest.files.map(normalizeManifestFile)) {
    const absoluteFile = path.resolve(path.dirname(manifestPath), manifestFile.path);
    const loadedRows = applyManifestDefaults(
      readSeedRowsFromFileSync(absoluteFile),
      manifestFile,
      manifest.version
    );
    validateManifestFileRows(loadedRows, manifestFile);
    rows.push(...loadedRows);
  }

  validateSeedRows(rows);
  return rows;
}

export async function loadStrategySeedNodes(
  manifestPath = STRATEGY_SEED_MANIFEST
): Promise<ParsedStrategySeedNode[]> {
  const rows = await loadStrategySeedRows(manifestPath);
  return groupSeedRows(rows);
}

export function loadStrategySeedNodesSync(
  manifestPath = STRATEGY_SEED_MANIFEST
): ParsedStrategySeedNode[] {
  const rows = loadStrategySeedRowsSync(manifestPath);
  return groupSeedRows(rows);
}

export function describeSeedNode(node: ParsedStrategySeedNode) {
  const { summary } = node;
  const compiled = compileNotationRows(node.rows, {
    requireComplete: summary.reviewed,
    fillMissingWithAction: summary.reviewed ? "FOLD" : undefined,
  });

  return {
    ...summary,
    contextLine: formatStrategyContextLine({
      playerCount: summary.playerCount,
      heroPosition: summary.heroPosition,
      villainPosition: summary.villainPosition,
      villainGroup: summary.villainGroup,
      spotGroup: summary.spotGroup,
    }),
    rowCount: node.rows.length,
    mappedHands: compiled.actions.length,
    missingHands: compiled.missingHands.length,
    notes: node.rows
      .map(row => row.notes?.trim())
      .filter((note): note is string => Boolean(note))
      .filter((note, index, array) => array.indexOf(note) === index),
    villainTarget: summary.villainPosition
      ? summary.villainPosition
      : summary.villainGroup
        ? displayVillainGroupLabel(summary.villainGroup)
        : null,
  };
}
