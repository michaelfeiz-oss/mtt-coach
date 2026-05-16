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

type PackSpec = {
  batch: string;
  description: string;
  fileBase: string;
  charts: ChartSpec[];
};

const ROOT = path.resolve(
  process.cwd(),
  "server",
  "strategy",
  "source-pack-templates",
  "missing-v1h"
);

const SOURCE_NAME = "2plus2_population_synthesis_plus_existing_seed_structure";
const SOURCE_TYPE = "population_constructed";
const SOURCE_NOTES = [
  "Population draft - review before approval.",
  "Constructed from the 2026-05-17 population rulebook, public qualitative 2+2 MTT discussion, and existing typed seed structure.",
  "Not copied from paid/gated chart content. Not owner-approved. No colour-as-data extraction.",
].join(" ");

function hands(...values: string[]) {
  return values;
}

function pairs(from: string, to: string) {
  const ranks = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const start = ranks.indexOf(from);
  const end = ranks.indexOf(to);
  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Invalid pair range ${from}-${to}`);
  }
  return ranks.slice(start, end + 1).map(rank => `${rank}${rank}`);
}

function suited(aceOrBroadway: string, from: string, to: string) {
  const ranks = ["K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const start = ranks.indexOf(from);
  const end = ranks.indexOf(to);
  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Invalid suited range ${aceOrBroadway}${from}-${aceOrBroadway}${to}`);
  }
  return ranks.slice(start, end + 1).map(rank => `${aceOrBroadway}${rank}s`);
}

function offsuit(high: string, from: string, to: string) {
  const ranks = ["K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
  const start = ranks.indexOf(from);
  const end = ranks.indexOf(to);
  if (start === -1 || end === -1 || start > end) {
    throw new Error(`Invalid offsuit range ${high}${from}-${high}${to}`);
  }
  return ranks.slice(start, end + 1).map(rank => `${high}${rank}o`);
}

function noDuplicates(list: string[]) {
  return Array.from(new Set(list));
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
    if (!allowed.has(action)) {
      throw new Error(`${spec.nodeKey}: action ${action} is outside allowedActions`);
    }
    for (const hand of noDuplicates(rawHands)) {
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

function writePack(spec: PackSpec) {
  const pack = {
    schemaVersion: 1,
    kind: "mtt-study-population-draft-pack",
    batch: spec.batch,
    description: spec.description,
    instructions: [
      "Population-draft seed only. Do not mark approved without owner review.",
      "Every cell is explicit and validates to 169 hands.",
      "Missing or unclear future spots must stay Not yet reviewed.",
    ],
    charts: spec.charts.map(chart),
  };

  const json = `${JSON.stringify(pack, null, 2)}\n`;
  fs.writeFileSync(path.join(ROOT, `${spec.fileBase}.population-draft.json`), json);
  fs.writeFileSync(
    path.join(ROOT, `${spec.fileBase}.template.json`),
    json.replace('"mtt-study-population-draft-pack"', '"mtt-study-source-pack-template"')
  );
}

const batchA: PackSpec = {
  batch: "Batch A - SB vs CO facing late open",
  description: "Population-draft full-cell pack for SB defence versus CO late open at 15/25/40/70bb.",
  fileBase: "batch-a-sb-vs-co-facing-late-open",
  charts: [
    {
      nodeKey: "facing_open_late_15bb_sb_vs_co_bba",
      title: "SB vs CO @ 15bb",
      stackBb: 15,
      spotFamily: "facing_open_late",
      heroPosition: "SB",
      villainPosition: "CO",
      allowedActions: ["JAM", "CALL", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        JAM: [
          ...pairs("A", "2"),
          ...suited("A", "K", "2"),
          ...suited("K", "Q", "J"),
          "QJs",
          "JTs",
          "ATo",
          "AJo",
          "AQo",
          "AKo",
          "KQo",
        ],
        CALL: ["KTs", "QTs", "T9s"],
      },
    },
    {
      nodeKey: "facing_open_late_25bb_sb_vs_co_bba",
      title: "SB vs CO @ 25bb",
      stackBb: 25,
      spotFamily: "facing_open_late",
      heroPosition: "SB",
      villainPosition: "CO",
      allowedActions: ["JAM", "THREE_BET", "CALL", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        THREE_BET: ["AA", "KK", "QQ", "AKs", "AQs", "AKo", "A5s", "A4s", "KQs"],
        JAM: [
          "JJ",
          "TT",
          "99",
          "88",
          "77",
          "AJs",
          "ATs",
          "A9s",
          "AQo",
          "AJo",
          "ATo",
          "KQo",
        ],
        CALL: [
          ...pairs("6", "2"),
          "A8s",
          "A7s",
          "A6s",
          "A3s",
          "A2s",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
        ],
      },
    },
    {
      nodeKey: "facing_open_late_40bb_sb_vs_co_bba",
      title: "SB vs CO @ 40bb",
      stackBb: 40,
      spotFamily: "facing_open_late",
      heroPosition: "SB",
      villainPosition: "CO",
      allowedActions: ["THREE_BET", "CALL", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        THREE_BET: ["AA", "KK", "QQ", "AKs", "AQs", "AKo", "A5s", "A4s", "KQs"],
        CALL: [
          ...pairs("J", "2"),
          "AJs",
          "ATs",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "A3s",
          "A2s",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          "AQo",
        ],
      },
    },
    {
      nodeKey: "facing_open_late_70bb_sb_vs_co_bba",
      title: "SB vs CO @ 70bb",
      stackBb: 70,
      spotFamily: "facing_open_late",
      heroPosition: "SB",
      villainPosition: "CO",
      allowedActions: ["THREE_BET", "CALL", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        THREE_BET: ["AA", "KK", "QQ", "AKs", "AQs", "AKo", "A5s", "A4s", "KQs", "KTs", "QTs"],
        CALL: [
          ...pairs("J", "2"),
          "AJs",
          "ATs",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "A3s",
          "A2s",
          "KJs",
          "K9s",
          "QJs",
          "Q9s",
          "JTs",
          "J9s",
          "T9s",
          "98s",
          "87s",
          "AQo",
          "AJo",
          "KQo",
        ],
      },
    },
  ],
};

const batchB: PackSpec = {
  batch: "Batch B - SB first in",
  description: "Population-draft full-cell pack for SB first-in at 15/25/40/70bb.",
  fileBase: "batch-b-sb-first-in",
  charts: [
    {
      nodeKey: "sb_first_in_15bb_bba",
      title: "SB First In @ 15bb",
      stackBb: 15,
      spotFamily: "sb_first_in",
      heroPosition: "SB",
      villainPosition: null,
      allowedActions: ["JAM", "RAISE", "LIMP", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        RAISE: ["AA", "KK", "QQ", "AKs", "AQs", "AKo"],
        JAM: [
          ...pairs("J", "2"),
          "AJs",
          "ATs",
          "A9s",
          "A8s",
          "A7s",
          "A6s",
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "AQo",
          "AJo",
          "ATo",
          "A9o",
          "A8o",
          "KQo",
          "KJo",
        ],
        LIMP: [
          "K9s",
          "K8s",
          "K7s",
          "K6s",
          "K5s",
          "K4s",
          "K3s",
          "K2s",
          "Q9s",
          "Q8s",
          "Q7s",
          "J9s",
          "J8s",
          "J7s",
          "T8s",
          "T7s",
          "98s",
          "97s",
          "87s",
          "86s",
          "76s",
          "75s",
          "65s",
          "64s",
          "54s",
          "KTo",
          "QJo",
          "QTo",
          "JTo",
        ],
      },
    },
    {
      nodeKey: "sb_first_in_25bb_bba",
      title: "SB First In @ 25bb",
      stackBb: 25,
      spotFamily: "sb_first_in",
      heroPosition: "SB",
      villainPosition: null,
      allowedActions: ["JAM", "RAISE", "LIMP", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        RAISE: [
          ...pairs("A", "6"),
          ...suited("A", "K", "8"),
          ...suited("K", "Q", "T"),
          "QJs",
          "QTs",
          "JTs",
          ...offsuit("A", "K", "T"),
          "KQo",
        ],
        JAM: [...pairs("5", "2"), "A5s", "A4s", "A3s", "A2s"],
        LIMP: [
          "A7s",
          "A6s",
          ...suited("K", "9", "2"),
          ...suited("Q", "9", "5"),
          ...suited("J", "9", "6"),
          ...suited("T", "9", "6"),
          "98s",
          "97s",
          "96s",
          "87s",
          "86s",
          "85s",
          "76s",
          "75s",
          "65s",
          "54s",
          ...offsuit("A", "9", "2"),
          "KJo",
          "KTo",
          "QJo",
          "QTo",
          "JTo",
        ],
      },
    },
    {
      nodeKey: "sb_first_in_40bb_bba",
      title: "SB First In @ 40bb",
      stackBb: 40,
      spotFamily: "sb_first_in",
      heroPosition: "SB",
      villainPosition: null,
      allowedActions: ["RAISE", "LIMP", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        RAISE: [
          ...pairs("A", "5"),
          ...suited("A", "K", "7"),
          ...suited("K", "Q", "T"),
          "QJs",
          "QTs",
          "JTs",
          ...offsuit("A", "K", "T"),
          "KQo",
        ],
        LIMP: [
          "A6s",
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          ...suited("K", "9", "2"),
          ...suited("Q", "9", "4"),
          ...suited("J", "9", "5"),
          ...suited("T", "9", "5"),
          "98s",
          "97s",
          "96s",
          "95s",
          "87s",
          "86s",
          "85s",
          "76s",
          "75s",
          "65s",
          "64s",
          "54s",
          ...offsuit("A", "9", "2"),
          ...offsuit("K", "J", "8"),
          ...offsuit("Q", "J", "9"),
          "JTo",
          "J9o",
          "T9o",
        ],
      },
    },
    {
      nodeKey: "sb_first_in_70bb_bba",
      title: "SB First In @ 70bb",
      stackBb: 70,
      spotFamily: "sb_first_in",
      heroPosition: "SB",
      villainPosition: null,
      allowedActions: ["RAISE", "LIMP", "FOLD"],
      defaultAction: "FOLD",
      actions: {
        RAISE: [
          ...pairs("A", "4"),
          ...suited("A", "K", "6"),
          ...suited("K", "Q", "9"),
          "QJs",
          "QTs",
          "JTs",
          ...offsuit("A", "K", "T"),
          "KQo",
          "KJo",
        ],
        LIMP: [
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          ...suited("K", "8", "2"),
          ...suited("Q", "9", "2"),
          ...suited("J", "9", "4"),
          ...suited("T", "9", "4"),
          "98s",
          "97s",
          "96s",
          "95s",
          "94s",
          "87s",
          "86s",
          "85s",
          "84s",
          "76s",
          "75s",
          "74s",
          "65s",
          "64s",
          "54s",
          ...offsuit("A", "9", "2"),
          ...offsuit("K", "T", "7"),
          ...offsuit("Q", "J", "8"),
          "JTo",
          "J9o",
          "J8o",
          "T9o",
          "T8o",
          "98o",
        ],
      },
    },
  ],
};

const batchC: PackSpec = {
  batch: "Batch C - BB vs SB limp",
  description: "Population-draft full-cell pack for BB versus SB limp at 15/25/40/70bb.",
  fileBase: "batch-c-bb-vs-sb-limp",
  charts: [
    {
      nodeKey: "bb_vs_sb_limp_15bb_bba",
      title: "BB vs SB Limp @ 15bb",
      stackBb: 15,
      spotFamily: "bb_vs_sb_limp",
      heroPosition: "BB",
      villainPosition: "SB",
      allowedActions: ["JAM", "RAISE", "CHECK"],
      defaultAction: "CHECK",
      actions: {
        JAM: [
          ...pairs("A", "2"),
          ...suited("A", "K", "2"),
          ...suited("K", "Q", "T"),
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          ...offsuit("A", "K", "8"),
          "KQo",
          "KJo",
        ],
        RAISE: [
          "K9s",
          "K8s",
          "K7s",
          "K6s",
          "K5s",
          "K4s",
          "K3s",
          "K2s",
          "Q9s",
          "Q8s",
          "Q7s",
          "J9s",
          "J8s",
          "T8s",
          "98s",
          "87s",
          "QJo",
          "JTo",
          "KTo",
        ],
      },
    },
    {
      nodeKey: "bb_vs_sb_limp_25bb_bba",
      title: "BB vs SB Limp @ 25bb",
      stackBb: 25,
      spotFamily: "bb_vs_sb_limp",
      heroPosition: "BB",
      villainPosition: "SB",
      allowedActions: ["JAM", "RAISE", "CHECK"],
      defaultAction: "CHECK",
      actions: {
        JAM: [...pairs("7", "2"), "A5s", "A4s", "A3s", "A2s", "AJo", "AQo", "AKo", "KQo"],
        RAISE: [
          ...pairs("A", "8"),
          ...suited("A", "K", "6"),
          ...suited("K", "Q", "9"),
          ...suited("Q", "J", "9"),
          ...suited("J", "T", "9"),
          "T9s",
          "98s",
          ...offsuit("A", "T", "9"),
          "KJo",
          "KTo",
          "QJo",
        ],
      },
    },
    {
      nodeKey: "bb_vs_sb_limp_40bb_bba",
      title: "BB vs SB Limp @ 40bb",
      stackBb: 40,
      spotFamily: "bb_vs_sb_limp",
      heroPosition: "BB",
      villainPosition: "SB",
      allowedActions: ["RAISE", "CHECK"],
      defaultAction: "CHECK",
      actions: {
        RAISE: [
          ...pairs("A", "7"),
          ...suited("A", "K", "8"),
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          ...suited("K", "Q", "T"),
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          ...offsuit("A", "K", "T"),
          "KQo",
          "KJo",
        ],
      },
    },
    {
      nodeKey: "bb_vs_sb_limp_70bb_bba",
      title: "BB vs SB Limp @ 70bb",
      stackBb: 70,
      spotFamily: "bb_vs_sb_limp",
      heroPosition: "BB",
      villainPosition: "SB",
      allowedActions: ["RAISE", "CHECK"],
      defaultAction: "CHECK",
      actions: {
        RAISE: [
          ...pairs("A", "6"),
          ...suited("A", "K", "7"),
          "A5s",
          "A4s",
          "A3s",
          "A2s",
          ...suited("K", "Q", "9"),
          ...suited("Q", "J", "9"),
          ...suited("J", "T", "9"),
          "T9s",
          "98s",
          "87s",
          ...offsuit("A", "K", "T"),
          "KQo",
          "KJo",
          "QJo",
        ],
      },
    },
  ],
};

fs.mkdirSync(ROOT, { recursive: true });
writePack(batchA);
writePack(batchB);
writePack(batchC);

console.log("Population draft packs generated.");
