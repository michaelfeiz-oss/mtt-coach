import fs from "node:fs";
import path from "node:path";
import {
  ACTION_TOKENS,
  ALL_HANDS,
  type ActionToken,
  type Position,
  type SpotType,
  type StackBucket,
} from "../../shared/strategy-v2/model";

type ChartSpec = {
  nodeKey: string;
  title: string;
  stackBb: StackBucket;
  spotFamily: SpotType;
  heroPosition: Position;
  villainPosition: Position | null;
  allowedActions: ActionToken[];
  defaultAction: ActionToken;
  actions: Partial<Record<ActionToken, string[]>>;
};

const ROOT = path.resolve(
  process.cwd(),
  "server",
  "strategy",
  "source-pack-templates",
  "missing-v1i"
);

const SOURCE_NAME = "population_rulebook_plus_existing_seed_structure";
const SOURCE_TYPE = "population_constructed";
const SOURCE_NOTES = [
  "Population draft - review before approval.",
  "Constructed from the existing 2026-05-17 population rulebook and current typed seed structure.",
  "Facing-3bet ranges are practical placeholders, not owner-approved or copied from paid/gated chart content.",
  "No colour-as-data extraction. Preserve one action token per hand cell.",
].join(" ");

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;
const BROADWAY_PLUS = ["K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

function pairs(from: string, to: string) {
  const start = RANKS.indexOf(from as (typeof RANKS)[number]);
  const end = RANKS.indexOf(to as (typeof RANKS)[number]);
  if (start === -1 || end === -1 || start > end) throw new Error(`Invalid pair range ${from}-${to}`);
  return RANKS.slice(start, end + 1).map(rank => `${rank}${rank}`);
}

function suited(high: string, from: string, to: string) {
  const start = BROADWAY_PLUS.indexOf(from as (typeof BROADWAY_PLUS)[number]);
  const end = BROADWAY_PLUS.indexOf(to as (typeof BROADWAY_PLUS)[number]);
  if (start === -1 || end === -1 || start > end) throw new Error(`Invalid suited range ${high}${from}-${high}${to}`);
  return BROADWAY_PLUS.slice(start, end + 1).map(rank => `${high}${rank}s`);
}

function offsuit(high: string, from: string, to: string) {
  const start = BROADWAY_PLUS.indexOf(from as (typeof BROADWAY_PLUS)[number]);
  const end = BROADWAY_PLUS.indexOf(to as (typeof BROADWAY_PLUS)[number]);
  if (start === -1 || end === -1 || start > end) throw new Error(`Invalid offsuit range ${high}${from}-${high}${to}`);
  return BROADWAY_PLUS.slice(start, end + 1).map(rank => `${high}${rank}o`);
}

function unique(...groups: string[][]) {
  return Array.from(new Set(groups.flat()));
}

function buildCells(spec: ChartSpec) {
  const validActions = new Set<ActionToken>(ACTION_TOKENS);
  const allowed = new Set(spec.allowedActions);
  if (!validActions.has(spec.defaultAction) || !allowed.has(spec.defaultAction)) {
    throw new Error(`${spec.nodeKey}: invalid default action ${spec.defaultAction}`);
  }

  const cells = Object.fromEntries(ALL_HANDS.map(hand => [hand, spec.defaultAction])) as Record<string, ActionToken>;
  const assigned = new Map<string, ActionToken>();

  for (const [action, rawHands] of Object.entries(spec.actions) as [ActionToken, string[]][]) {
    if (!allowed.has(action)) throw new Error(`${spec.nodeKey}: action ${action} is outside allowedActions`);
    for (const hand of Array.from(new Set(rawHands))) {
      if (!ALL_HANDS.includes(hand)) throw new Error(`${spec.nodeKey}: invalid hand ${hand}`);
      const previous = assigned.get(hand);
      if (previous && previous !== action) {
        throw new Error(`${spec.nodeKey}: ${hand} assigned to both ${previous} and ${action}`);
      }
      assigned.set(hand, action);
      cells[hand] = action;
    }
  }

  return Object.fromEntries(ALL_HANDS.map(hand => [hand, cells[hand]]));
}

function chart(spec: ChartSpec) {
  return {
    nodeKey: spec.nodeKey,
    title: spec.title,
    stackBb: spec.stackBb,
    spotFamily: spec.spotFamily,
    heroPosition: spec.heroPosition,
    villainPosition: spec.villainPosition,
    allowedActions: spec.allowedActions,
    sourceName: SOURCE_NAME,
    sourceType: SOURCE_TYPE,
    sourceNotes: SOURCE_NOTES,
    reviewed: false,
    cells: buildCells(spec),
  };
}

const heroScore: Record<Position, number> = {
  UTG: 0,
  UTG1: 0,
  UTG2: 0,
  LJ: 1,
  HJ: 1,
  CO: 2,
  BTN: 3,
  SB: 2,
  BB: 0,
};

const villainScore: Record<Position, number> = {
  UTG: 0,
  UTG1: 0,
  UTG2: 0,
  LJ: 0,
  HJ: 0,
  CO: 1,
  BTN: 2,
  SB: 2,
  BB: 2,
};

function widthTier(hero: Position, villain: Position) {
  const score = heroScore[hero] + villainScore[villain];
  if (score >= 5) return "wide" as const;
  if (score >= 3) return "standard" as const;
  return "tight" as const;
}

function facing3BetActions(stackBb: StackBucket, hero: Position, villain: Position): ChartSpec["actions"] {
  const tier = widthTier(hero, villain);
  const isStandard = tier === "standard" || tier === "wide";
  const isWide = tier === "wide";

  if (stackBb === 15) {
    return {
      JAM: unique(
        pairs("A", isWide ? "2" : isStandard ? "5" : "8"),
        suited("A", "K", isWide ? "5" : isStandard ? "9" : "J"),
        ["AKo", "AQo", "KQs"],
        isStandard ? ["AJo", "KQo", "KJs", "QJs"] : [],
        isWide ? ["ATo", "KJo", "QTs", "JTs", "T9s"] : []
      ),
    };
  }

  if (stackBb === 25) {
    return {
      FOUR_BET: unique(["AA", "KK", "AKs", "AKo"], isWide ? ["QQ"] : []),
      JAM: unique(
        pairs("J", isWide ? "5" : isStandard ? "7" : "9"),
        suited("A", "Q", isWide ? "2" : isStandard ? "5" : "T"),
        ["AQo", "KQs"],
        isStandard ? ["AJo", "KJs", "QJs"] : [],
        isWide ? ["ATo", "KQo", "KTs", "QTs", "JTs"] : []
      ),
      CALL: unique(
        isWide ? pairs("4", "2") : isStandard ? pairs("6", "2") : [],
        isWide ? ["T9s", "98s"] : []
      ),
    };
  }

  if (stackBb === 40) {
    return {
      FOUR_BET: unique(["AA", "KK", "QQ", "AKs", "AKo"], isStandard ? ["A5s"] : [], isWide ? ["A4s", "KTs"] : []),
      CALL: unique(
        pairs("J", isWide ? "2" : isStandard ? "4" : "7"),
        suited("A", "Q", isStandard ? "6" : "T"),
        suited("K", "Q", "J"),
        ["QJs", "JTs", "T9s", "AQo"],
        isStandard ? ["AJo", "KQo", "QTs", "98s"] : [],
        isWide ? ["A3s", "A2s", "K9s", "Q9s", "J9s", "87s", "KJo"] : []
      ),
    };
  }

  return {
      FOUR_BET: unique(["AA", "KK", "QQ", "AKs", "AKo"], isStandard ? ["A5s", "A4s"] : [], isWide ? ["KTs", "QTs"] : []),
      CALL: unique(
        pairs("J", isWide ? "2" : isStandard ? "3" : "6"),
        suited("A", "Q", isStandard ? "6" : "9"),
        suited("K", "Q", isWide ? "J" : "T"),
        suited("Q", "J", isWide ? "J" : "T"),
        ["JTs", "T9s", "98s", "AQo", "KQo"],
        isStandard ? ["AJo", "KJo", "J9s", "87s"] : [],
        isWide ? ["A3s", "A2s", "K9s", "Q9s", "ATo", "QJo", "T8s", "97s", "76s"] : []
      ),
  };
}

function facing3BetAllowedActions(stackBb: StackBucket): ActionToken[] {
  if (stackBb === 15) return ["JAM", "FOLD"];
  if (stackBb === 25) return ["FOUR_BET", "JAM", "CALL", "FOLD"];
  return ["FOUR_BET", "CALL", "FOLD"];
}

const matchups: Array<[Position, Position]> = [
  ["UTG", "HJ"],
  ["UTG", "CO"],
  ["UTG", "BTN"],
  ["UTG", "SB"],
  ["UTG", "BB"],
  ["HJ", "CO"],
  ["HJ", "BTN"],
  ["HJ", "SB"],
  ["HJ", "BB"],
  ["CO", "BTN"],
  ["CO", "SB"],
  ["CO", "BB"],
  ["BTN", "SB"],
  ["BTN", "BB"],
  ["SB", "BB"],
];

const charts = ([15, 25, 40, 70] as StackBucket[]).flatMap(stackBb =>
  matchups.map(([hero, villain]) => ({
    nodeKey: `facing_3bet_${stackBb}bb_${hero.toLowerCase()}_vs_${villain.toLowerCase()}_bba`,
    title: `${hero} vs ${villain} 3-Bet @ ${stackBb}bb`,
    stackBb,
    spotFamily: "facing_3bet" as SpotType,
    heroPosition: hero,
    villainPosition: villain,
    allowedActions: facing3BetAllowedActions(stackBb),
    defaultAction: "FOLD" as ActionToken,
    actions: facing3BetActions(stackBb, hero, villain),
  }))
);

const pack = {
  schemaVersion: 1,
  kind: "mtt-study-population-draft-pack",
  batch: "Batch D - facing 3-bet population drafts",
  description: "Population-draft full-cell pack for common opener responses when facing a 3-bet at 15/25/40/70bb.",
  instructions: [
    "Population-draft seed only. Do not mark approved without owner review.",
    "Every cell is explicit and validates to 169 hands.",
    "Use as review scaffolding, not final chart-action truth.",
  ],
  charts: charts.map(chart),
};

fs.mkdirSync(ROOT, { recursive: true });
const json = `${JSON.stringify(pack, null, 2)}\n`;
fs.writeFileSync(path.join(ROOT, "batch-d-facing-3bet.population-draft.json"), json);
fs.writeFileSync(
  path.join(ROOT, "batch-d-facing-3bet.template.json"),
  json.replace('"mtt-study-population-draft-pack"', '"mtt-study-source-pack-template"')
);

console.log(`Facing 3-bet population draft pack generated: ${charts.length} charts.`);
