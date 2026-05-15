export const RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

export const ACTION_TOKENS = [
  "FOLD",
  "RAISE",
  "JAM",
  "LIMP",
  "CALL",
  "CHECK",
  "THREE_BET",
  "FOUR_BET",
  "BET_SMALL",
  "BET_BIG",
] as const;

export const ACTION_PRIORITY: Record<ActionToken, number> = {
  JAM: 800,
  FOUR_BET: 700,
  THREE_BET: 600,
  RAISE: 500,
  LIMP: 400,
  CALL: 300,
  CHECK: 200,
  BET_BIG: 190,
  BET_SMALL: 180,
  FOLD: 100,
};

export const ACTION_LABELS: Record<ActionToken, string> = {
  FOLD: "Fold",
  RAISE: "Raise",
  JAM: "Jam",
  LIMP: "Limp",
  CALL: "Call",
  CHECK: "Check",
  THREE_BET: "3-Bet",
  FOUR_BET: "4-Bet",
  BET_SMALL: "Bet Small",
  BET_BIG: "Bet Big",
};

export const STACK_BUCKETS = [15, 25, 40, 70] as const;
export const POSITIONS = [
  "UTG",
  "UTG1",
  "UTG2",
  "LJ",
  "HJ",
  "CO",
  "BTN",
  "SB",
  "BB",
] as const;

export const SPOT_TYPES = [
  "rfi",
  "facing_open_early",
  "facing_open_middle",
  "facing_open_late",
  "facing_jam",
  "sb_first_in",
  "bb_vs_sb_open",
  "bb_vs_sb_limp",
] as const;

export const CHART_STATUSES = [
  "seed",
  "draft",
  "reviewed",
  "approved",
] as const;

export const SNAPSHOT_STATUSES = ["seed", "reviewed", "approved"] as const;

export type Rank = (typeof RANKS)[number];
export type ActionToken = (typeof ACTION_TOKENS)[number];
export type StackBucket = (typeof STACK_BUCKETS)[number];
export type Position = (typeof POSITIONS)[number];
export type SpotType = (typeof SPOT_TYPES)[number];
export type ChartStatus = (typeof CHART_STATUSES)[number];
export type SnapshotStatus = (typeof SNAPSHOT_STATUSES)[number];
export type AnteType = "BBA";
export type Format = "MTT";
export type ChartCells = Record<string, ActionToken>;

export interface StrategyChartRecord {
  id: number;
  nodeKey: string;
  spotType: SpotType;
  stackBb: StackBucket;
  position: Position;
  villainPosition: Position | null;
  anteType: AnteType;
  format: Format;
  title: string;
  description: string | null;
  allowedActions: ActionToken[];
  status: ChartStatus;
  activeSnapshotId: number | null;
  seedProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyChartSnapshot {
  id: number;
  chartId: number;
  nodeKey: string;
  version: number;
  status: SnapshotStatus;
  allowedActions: ActionToken[];
  cells: ChartCells;
  checksum: string;
  notes: string | null;
  createdAt: string;
  createdBy: string;
}

export interface StrategyChartDraft {
  id: number;
  chartId: number;
  nodeKey: string;
  allowedActions: ActionToken[];
  cells: ChartCells;
  notes: string | null;
  updatedAt: string;
  updatedBy: string;
}

export interface ResolvedStrategyChart {
  chart: StrategyChartRecord;
  source: "approved" | "reviewed" | "seed" | "missing";
  snapshot: StrategyChartSnapshot | null;
  draft: StrategyChartDraft | null;
}

export interface StrategyPackChart {
  nodeKey: string;
  spotType: SpotType;
  stackBb: StackBucket;
  position: Position;
  villainPosition: Position | null;
  anteType: AnteType;
  format: Format;
  title: string;
  description?: string | null;
  status: SnapshotStatus;
  version: number;
  allowedActions: ActionToken[];
  cells: ChartCells;
  checksum: string;
  notes?: string | null;
}

export interface StrategyPack {
  schemaVersion: 1;
  app: "mtt-study-local";
  exportedAt: string;
  chartCount: number;
  checksum: string;
  charts: StrategyPackChart[];
}

export function generateHandGrid(): string[][] {
  return RANKS.map((rowRank, rowIndex) =>
    RANKS.map((columnRank, columnIndex) => {
      if (rowIndex === columnIndex) return `${rowRank}${columnRank}`;
      if (rowIndex < columnIndex) return `${rowRank}${columnRank}s`;
      return `${columnRank}${rowRank}o`;
    })
  );
}

export const ALL_HANDS = generateHandGrid().flat();

export function normalizeNodeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function computeChartChecksum(input: {
  nodeKey: string;
  allowedActions: ActionToken[];
  cells: ChartCells;
}) {
  const payload = {
    nodeKey: input.nodeKey,
    allowedActions: [...input.allowedActions],
    cells: Object.fromEntries(ALL_HANDS.map(hand => [hand, input.cells[hand]])),
  };

  return stableChecksum(JSON.stringify(payload));
}

export function computePackChecksum(charts: StrategyPackChart[]) {
  const payload = charts.map(chart => ({
    nodeKey: chart.nodeKey,
    version: chart.version,
    status: chart.status,
    checksum: chart.checksum,
  }));

  return stableChecksum(JSON.stringify(payload));
}

export function createEmptyCells(action: ActionToken = "FOLD"): ChartCells {
  return Object.fromEntries(ALL_HANDS.map(hand => [hand, action])) as ChartCells;
}

function stableChecksum(value: string) {
  let hashA = 0x811c9dc5;
  let hashB = 0x45d9f3b;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193);
    hashB ^= code + index;
    hashB = Math.imul(hashB, 0x85ebca6b);
  }

  const left = (hashA >>> 0).toString(16).padStart(8, "0");
  const right = (hashB >>> 0).toString(16).padStart(8, "0");
  return `${left}${right}`;
}
