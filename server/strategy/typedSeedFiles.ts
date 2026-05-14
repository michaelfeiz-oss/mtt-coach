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

interface StrategySeedManifest {
  version: string;
  files: string[];
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
  const priority =
    typeof candidate.priority === "number"
      ? candidate.priority
      : Number(candidate.priority ?? ACTION_PRIORITY[action]);

  return {
    version: String(candidate.version ?? "").trim(),
    stackBucket: Number(candidate.stackBucket) as StackDepth,
    playerCount: Number(candidate.playerCount ?? 9) as PlayerCount,
    scenarioFamily: String(candidate.scenarioFamily ?? "").trim() as StrategyRangeSeedRow["scenarioFamily"],
    heroPosition: String(candidate.heroPosition ?? "").trim() as Position,
    villainPosition: parseNullableString(String(candidate.villainPosition ?? "")) as Position | null,
    villainGroup: parseNullableString(String(candidate.villainGroup ?? "")) as VillainGroup | null,
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

function groupSeedRows(rows: StrategyRangeSeedRow[]): ParsedStrategySeedNode[] {
  const byNode = new Map<string, StrategyRangeSeedRow[]>();

  for (const row of rows) {
    const key = buildSpotKey({
      version: row.version,
      stackBucket: row.stackBucket,
      playerCount: row.playerCount,
      scenarioFamily: row.scenarioFamily,
      heroPosition: row.heroPosition,
      villainPosition: row.villainPosition,
      villainGroup: row.villainGroup,
    });
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

  for (const relativeFile of manifest.files) {
    const absoluteFile = path.resolve(path.dirname(manifestPath), relativeFile);
    rows.push(...(await readSeedRowsFromFile(absoluteFile)));
  }

  validateSeedRows(rows);
  return rows;
}

export function loadStrategySeedRowsSync(
  manifestPath = STRATEGY_SEED_MANIFEST
): StrategyRangeSeedRow[] {
  const manifest = readStrategySeedManifestSync(manifestPath);
  const rows: StrategyRangeSeedRow[] = [];

  for (const relativeFile of manifest.files) {
    const absoluteFile = path.resolve(path.dirname(manifestPath), relativeFile);
    rows.push(...readSeedRowsFromFileSync(absoluteFile));
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
