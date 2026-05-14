export const ACTIONS = [
  "JAM",
  "FOUR_BET",
  "THREE_BET",
  "RAISE",
  "LIMP",
  "CALL",
  "CHECK",
  "FOLD",
] as const;

export type Action = (typeof ACTIONS)[number];

export const ACTION_PRIORITY: Record<Action, number> = {
  JAM: 800,
  FOUR_BET: 700,
  THREE_BET: 600,
  RAISE: 500,
  LIMP: 400,
  CALL: 300,
  CHECK: 200,
  FOLD: 100,
};

export const ACTION_LABELS: Record<Action, string> = {
  JAM: "Jam",
  FOUR_BET: "4-Bet",
  THREE_BET: "3-Bet",
  RAISE: "Raise",
  LIMP: "Limp",
  CALL: "Call",
  CHECK: "Check",
  FOLD: "Fold",
};

export const STACK_DEPTHS = [15, 25, 40, 70] as const;
export type StackDepth = (typeof STACK_DEPTHS)[number];

export const PLAYER_COUNTS = [9] as const;
export type PlayerCount = (typeof PLAYER_COUNTS)[number];

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

export type Position = (typeof POSITIONS)[number];

export const VILLAIN_GROUPS = ["early", "middle", "late"] as const;
export type VillainGroup = (typeof VILLAIN_GROUPS)[number];

export const SPOT_GROUPS = [
  "rfi",
  "facing_open_early",
  "facing_open_middle",
  "facing_open_late",
  "facing_jam",
  "sb_first_in",
  "bb_vs_sb_open",
  "bb_vs_sb_limp",
] as const;

export type SpotGroup = (typeof SPOT_GROUPS)[number];
export type ScenarioFamily = SpotGroup;

export const SPOT_GROUP_LABELS: Record<SpotGroup, string> = {
  rfi: "RFI",
  facing_open_early: "Facing Early Open",
  facing_open_middle: "Facing Middle Open",
  facing_open_late: "Facing Late Open",
  facing_jam: "Facing Jam",
  sb_first_in: "SB First In",
  bb_vs_sb_open: "BB vs SB Open",
  bb_vs_sb_limp: "BB vs SB Limp",
};

export const SPOT_GROUP_SUBTITLES: Record<SpotGroup, string> = {
  rfi: "Raise-first-in ranges by position",
  facing_open_early: "Responses versus UTG / UTG+1 / UTG+2 opens",
  facing_open_middle: "Responses versus LJ / HJ opens",
  facing_open_late: "Responses versus CO / BTN opens",
  facing_jam: "Call-off thresholds versus jams",
  sb_first_in: "Small blind first-in strategy",
  bb_vs_sb_open: "Big blind response versus small-blind open",
  bb_vs_sb_limp: "Big blind response versus small-blind limp",
};

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

export type Rank = (typeof RANKS)[number];

export function displayPositionLabel(position?: string | null): string {
  if (!position) return "No opener";

  switch (position) {
    case "UTG1":
      return "UTG+1";
    case "UTG2":
      return "UTG+2";
    default:
      return position;
  }
}

export function displayVillainGroupLabel(group?: VillainGroup | null): string {
  switch (group) {
    case "early":
      return "Early";
    case "middle":
      return "Middle";
    case "late":
      return "Late";
    default:
      return "No opener";
  }
}

export function generateHandGrid(): string[][] {
  return RANKS.map((r1, i) =>
    RANKS.map((r2, j) => {
      if (i === j) return `${r1}${r2}`;
      if (i < j) return `${r1}${r2}s`;
      return `${r2}${r1}o`;
    })
  );
}

export const ALL_HANDS: string[] = generateHandGrid().flat();

export interface HandAction {
  handCode: string;
  primaryAction: Action;
  weightPercent?: number | null;
  mixJson?: string | null;
  colorToken?: string | null;
  note?: string | null;
}

export interface StrategyRangeSeedRow {
  version: string;
  stackBucket: StackDepth;
  playerCount: PlayerCount;
  scenarioFamily: ScenarioFamily;
  heroPosition: Position;
  villainPosition?: Position | null;
  villainGroup?: VillainGroup | null;
  action: Action;
  rangeNotation: string;
  priority: number;
  notes?: string | null;
  reviewed: boolean;
}

export interface StrategyNodeIdentity {
  version: string;
  stackBucket: StackDepth;
  playerCount: PlayerCount;
  scenarioFamily: ScenarioFamily;
  heroPosition: Position;
  villainPosition?: Position | null;
  villainGroup?: VillainGroup | null;
}

export interface StrategyNodeSummary extends StrategyNodeIdentity {
  id: number;
  title: string;
  spotKey: string;
  stackDepth: StackDepth;
  spotGroup: SpotGroup;
  reviewed: boolean;
  sourceLabel: string;
}

export interface StrategyNodeRangeRow {
  action: Action;
  rangeNotation: string;
  priority: number;
  notes?: string | null;
}

export interface RangeChartWithActions extends StrategyNodeSummary {
  playerCount: PlayerCount;
  notesJson?: string | null;
  actions: HandAction[];
}

export interface TrainerQuestion {
  chartId: number;
  handCode: string;
  correctAction: Action;
  correctNote?: string | null;
  choices: Action[];
}

export interface TrainerStats {
  total: number;
  correct: number;
  accuracy: number;
  byAction: Record<Action, { total: number; correct: number }>;
}

export interface StrategySpotProgress {
  chartId: number;
  chartTitle: string;
  stackDepth: StackDepth;
  spotGroup: SpotGroup;
  spotKey: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export interface StrategyMissedHand {
  chartId: number;
  chartTitle: string;
  handCode: string;
  missed: number;
  attempts: number;
  correctAction: Action;
}

export interface StrategyProgressSummary {
  bySpot: StrategySpotProgress[];
  weakSpots: StrategySpotProgress[];
  missedHands: StrategyMissedHand[];
}

export interface StrategyRecommendation {
  chart: {
    id: number;
    title: string;
    stackDepth: StackDepth;
    spotGroup: SpotGroup;
    spotKey: string;
    heroPosition: string;
    villainPosition?: string | null;
  };
  handCode?: string | null;
  recommendedAction?: Action | null;
  reason: string;
  confidence: "exact";
}

function normalizeVillainTarget(identity: {
  villainPosition?: Position | null;
  villainGroup?: VillainGroup | null;
}) {
  return identity.villainPosition ?? identity.villainGroup ?? null;
}

export function buildSpotKey(identity: StrategyNodeIdentity) {
  const villainTarget = normalizeVillainTarget(identity);

  switch (identity.scenarioFamily) {
    case "rfi":
      return `${identity.heroPosition}_rfi`;
    case "facing_open_early":
      return `${identity.heroPosition}_vs_${villainTarget ?? "early"}_open`;
    case "facing_open_middle":
      return `${identity.heroPosition}_vs_${villainTarget ?? "middle"}_open`;
    case "facing_open_late":
      return `${identity.heroPosition}_vs_${villainTarget ?? "late"}_open`;
    case "facing_jam":
      return `${identity.heroPosition}_vs_${villainTarget ?? "jam"}_jam`;
    case "sb_first_in":
      return "sb_first_in";
    case "bb_vs_sb_open":
      return "bb_vs_sb_open";
    case "bb_vs_sb_limp":
      return "bb_vs_sb_limp";
  }
}

export function formatStrategyNodeTitle(node: {
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: string | null;
}) {
  const stackSuffix = ` @ ${node.stackDepth}bb`;
  const hero = displayPositionLabel(node.heroPosition);
  const villain = node.villainPosition
    ? displayPositionLabel(node.villainPosition)
    : node.villainGroup
      ? `${displayVillainGroupLabel(node.villainGroup as VillainGroup)} Open`
      : null;

  switch (node.spotGroup) {
    case "rfi":
      return `${hero} RFI${stackSuffix}`;
    case "facing_open_early":
    case "facing_open_middle":
    case "facing_open_late":
      return `${hero} vs ${villain ?? "Open"}${stackSuffix}`;
    case "facing_jam":
      return `${hero} vs ${villain ?? "Jam"}${stackSuffix}`;
    case "sb_first_in":
      return `SB First In${stackSuffix}`;
    case "bb_vs_sb_open":
      return `BB vs SB Open${stackSuffix}`;
    case "bb_vs_sb_limp":
      return `BB vs SB Limp${stackSuffix}`;
  }
}

export function formatStrategyContextLine(node: {
  playerCount?: number;
  heroPosition: string;
  villainPosition?: string | null;
  villainGroup?: string | null;
  spotGroup: SpotGroup;
}) {
  const hero = displayPositionLabel(node.heroPosition);
  const target = node.villainPosition
    ? displayPositionLabel(node.villainPosition)
    : node.villainGroup
      ? `${displayVillainGroupLabel(node.villainGroup as VillainGroup)} open`
      : null;
  const players = node.playerCount ?? 9;

  if (node.spotGroup === "rfi") {
    return `${hero} opening range - ${players} players`;
  }

  if (node.spotGroup === "sb_first_in") {
    return `Small blind first-in strategy - ${players} players`;
  }

  if (node.spotGroup === "bb_vs_sb_open") {
    return `Big blind versus small-blind open - ${players} players`;
  }

  if (node.spotGroup === "bb_vs_sb_limp") {
    return `Big blind versus small-blind limp - ${players} players`;
  }

  return `${hero}${target ? ` vs ${target}` : ""} - ${players} players`;
}
