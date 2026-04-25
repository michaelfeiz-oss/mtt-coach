import {
  PUSH_FOLD_STACK_BUCKETS,
  PRELFOP_ANTE_FORMAT,
  PRELFOP_PLAYERS_COUNT,
} from "./preflopTaxonomy";
import {
  getCanonicalSpotId,
  type CanonicalSpotContext,
} from "./spotIds";
import { ALL_HANDS, type HandAction, type Position } from "./strategy";
import {
  getHandCoordinate,
  handDistance,
  isCanonicalHandCode,
  normalizeHandCode,
  type HandCoordinate,
} from "./handMatrix";

export const PUSH_FOLD_REFERENCE_IDS = [
  "open-shove-utg",
  "open-shove-co",
  "open-shove-btn",
  "open-shove-sb",
  "bb-call-vs-btn-shove",
  "open-shove-utg-10",
  "open-shove-co-10",
  "open-shove-btn-10",
  "open-shove-sb-10",
  "bb-call-vs-btn-shove-10",
] as const;
export type PushFoldReferenceId = (typeof PUSH_FOLD_REFERENCE_IDS)[number];

export type PushFoldModeKind = "OPEN_SHOVE" | "BB_CALL_VS_BTN_SHOVE";

export interface PushFoldReference {
  id: PushFoldReferenceId;
  mode: PushFoldModeKind;
  heroPosition: Position;
  villainPosition?: Position;
  stackSource: "5-10" | "10-15";
  supportedStacks: readonly number[];
  rangeText: string;
  tacticalNote: string;
  handCodes: string[];
}

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"] as const;

function rankIndex(rank: string) {
  return RANKS.indexOf(rank as (typeof RANKS)[number]);
}

function pairRange(startRank: string) {
  const start = rankIndex(startRank);
  return RANKS.slice(0, start + 1).map(rank => `${rank}${rank}`);
}

function highCardPlus(first: string, second: string, suited?: "s" | "o") {
  const firstIndex = rankIndex(first);
  const secondIndex = rankIndex(second);
  if (firstIndex === -1 || secondIndex === -1) return [];

  const results: string[] = [];
  for (let index = secondIndex; index >= firstIndex + 1; index -= 1) {
    const candidate = `${first}${RANKS[index]}${suited ?? ""}`;
    results.push(candidate);
  }
  return results;
}

function twoRankPlus(first: string, second: string, suited?: "s" | "o") {
  const firstIndex = rankIndex(first);
  const secondIndex = rankIndex(second);
  if (firstIndex === -1 || secondIndex === -1) return [];

  const gap = secondIndex - firstIndex;
  const results: string[] = [];
  for (let currentFirst = firstIndex; currentFirst + gap < RANKS.length; currentFirst += 1) {
    const currentSecond = currentFirst + gap;
    if (currentFirst === currentSecond) break;
    const high = RANKS[currentFirst];
    const low = RANKS[currentSecond];
    results.push(`${high}${low}${suited ?? ""}`);
  }
  return results;
}

function connectorProgression(first: string, second: string, suited?: "s" | "o") {
  const firstIndex = rankIndex(first);
  const secondIndex = rankIndex(second);
  if (firstIndex === -1 || secondIndex === -1) return [];

  const results: string[] = [];
  for (
    let currentHigh = firstIndex, currentLow = secondIndex;
    currentHigh >= 1 && currentLow >= 2 && currentLow > currentHigh;
    currentHigh -= 1, currentLow -= 1
  ) {
    const high = RANKS[currentHigh];
    const low = RANKS[currentLow];
    results.push(`${high}${low}${suited ?? ""}`);
  }
  return results;
}

function normalizeRangeToken(handCode: string) {
  return handCode.replace(/\s+/g, "");
}

export function expandPushFoldNotation(rangeText: string): string[] {
  const tokens = rangeText
    .split(",")
    .map(token => token.trim())
    .filter(Boolean);

  const codes = new Set<string>();

  for (const token of tokens) {
    const normalized = normalizeRangeToken(token);

    if (/^([AKQJT98765432])\1\+$/.test(normalized)) {
      const startRank = normalized[0];
      for (const pair of pairRange(startRank)) codes.add(pair);
      continue;
    }

    if (/^[AKQJT98765432][AKQJT98765432][so]\+$/.test(normalized)) {
      const high = normalized[0];
      const low = normalized[1];
      const suited = normalized[2];
      const useConnectorProgression =
        Math.abs(rankIndex(low) - rankIndex(high)) === 1;
      const expanded = useConnectorProgression
        ? connectorProgression(high, low, suited as "s" | "o")
        : highCardPlus(high, low, suited as "s" | "o");
      for (const hand of expanded) {
        codes.add(hand);
      }
      continue;
    }

    if (/^[AKQJT98765432][AKQJT98765432]\+$/.test(normalized)) {
      const high = normalized[0];
      const low = normalized[1];
      for (const hand of highCardPlus(high, low, "s")) codes.add(hand);
      for (const hand of highCardPlus(high, low, "o")) codes.add(hand);
      continue;
    }

    if (/^[AKQJT98765432][AKQJT98765432][so]$/.test(normalized)) {
      codes.add(normalized);
      continue;
    }

    if (/^[AKQJT98765432]{2}$/.test(normalized)) {
      if (normalized[0] === normalized[1]) {
        codes.add(normalized);
      } else {
        codes.add(`${normalized}s`);
        codes.add(`${normalized}o`);
      }
    }
  }

  return ALL_HANDS.filter(handCode => codes.has(handCode));
}

export const PUSH_FOLD_REFERENCES: PushFoldReference[] = [
  {
    id: "open-shove-utg",
    mode: "OPEN_SHOVE",
    heroPosition: "UTG",
    stackSource: "5-10",
    supportedStacks: [5, 6, 7, 8, 9],
    rangeText: "22+, A9+, KQ",
    tacticalNote: "UTG jams stay value-forward. Pairs, strong aces, and the cleanest broadway blockers do the work.",
    handCodes: expandPushFoldNotation("22+, A9+, KQ"),
  },
  {
    id: "open-shove-co",
    mode: "OPEN_SHOVE",
    heroPosition: "CO",
    stackSource: "5-10",
    supportedStacks: [5, 6, 7, 8, 9],
    rangeText: "Any pair, A5+, K9s+, QTs+",
    tacticalNote: "CO gets to widen around pairs, better aces, and suited broadways because fold equity improves sharply.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A5+, K9s+, QTs+"),
    ],
  },
  {
    id: "open-shove-btn",
    mode: "OPEN_SHOVE",
    heroPosition: "BTN",
    stackSource: "5-10",
    supportedStacks: [5, 6, 7, 8, 9],
    rangeText: "Any pair, any Ace, K7s+, Q8s+, 65s+",
    tacticalNote: "BTN perimeter hands matter most here. The ante and dead blinds reward disciplined aggression.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A2+, K7s+, Q8s+, 65s+"),
    ],
  },
  {
    id: "open-shove-sb",
    mode: "OPEN_SHOVE",
    heroPosition: "SB",
    stackSource: "5-10",
    supportedStacks: [5, 6, 7, 8, 9],
    rangeText: "Any Ace, K5s+, any pair",
    tacticalNote: "SB jams widen because only BB remains. Strong blockers and dead money do most of the heavy lifting.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A2+, K5s+"),
    ],
  },
  {
    id: "bb-call-vs-btn-shove",
    mode: "BB_CALL_VS_BTN_SHOVE",
    heroPosition: "BB",
    villainPosition: "BTN",
    stackSource: "5-10",
    supportedStacks: [5, 6, 7, 8, 9],
    rangeText: "77+, A9s+, ATo+",
    tacticalNote: "BB calling ranges compress much faster than BTN shoving ranges. Do not let the price trick you into hero calls.",
    handCodes: expandPushFoldNotation("77+, A9s+, ATo+"),
  },
  {
    id: "open-shove-utg-10",
    mode: "OPEN_SHOVE",
    heroPosition: "UTG",
    stackSource: "10-15",
    supportedStacks: [10],
    rangeText: "33+, AJo+, KQs",
    tacticalNote: "At 10bb, UTG still stays value-forward, but the better offsuit broadways now enter the shove range.",
    handCodes: expandPushFoldNotation("33+, AJo+, KQs"),
  },
  {
    id: "open-shove-co-10",
    mode: "OPEN_SHOVE",
    heroPosition: "CO",
    stackSource: "10-15",
    supportedStacks: [10],
    rangeText: "22+, A8+, KTs+, QJs",
    tacticalNote: "CO gets to push pairs and more playable high-card shapes once stack depth hits the 10-15bb bucket.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A8+, KTs+, QJs"),
    ],
  },
  {
    id: "open-shove-btn-10",
    mode: "OPEN_SHOVE",
    heroPosition: "BTN",
    stackSource: "10-15",
    supportedStacks: [10],
    rangeText: "Any pair, any Ace, K7s+, Q9s+, T9s+",
    tacticalNote: "BTN stays very wide at 10bb, but the extra calls you invite make the perimeter more tactical than at 7-8bb.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A2+, K7s+, Q9s+, T9s+"),
    ],
  },
  {
    id: "open-shove-sb-10",
    mode: "OPEN_SHOVE",
    heroPosition: "SB",
    stackSource: "10-15",
    supportedStacks: [10],
    rangeText: "22+, A2s+, K9s+, QTs+",
    tacticalNote: "SB still gets to shove aggressively, but the range sharpens once BB can call a little wider at 10bb.",
    handCodes: [
      ...pairRange("2"),
      ...expandPushFoldNotation("A2s+, K9s+, QTs+"),
    ],
  },
  {
    id: "bb-call-vs-btn-shove-10",
    mode: "BB_CALL_VS_BTN_SHOVE",
    heroPosition: "BB",
    villainPosition: "BTN",
    stackSource: "10-15",
    supportedStacks: [10],
    rangeText: "66+, A8s+, ATo+",
    tacticalNote: "BB calling widens slightly at 10bb, but it is still much tighter than BTN's jam range.",
    handCodes: expandPushFoldNotation("66+, A8s+, ATo+"),
  },
];

export function getPushFoldReference(
  stackDepth: number,
  mode: PushFoldModeKind,
  heroPosition: Position
): PushFoldReference | null {
  return (
    PUSH_FOLD_REFERENCES.find(
      reference =>
        reference.mode === mode &&
        reference.heroPosition === heroPosition &&
        reference.supportedStacks.includes(stackDepth)
    ) ?? null
  );
}

export function getPushFoldActionForHand(
  reference: PushFoldReference,
  handCode: string
): HandAction | null {
  const canonicalHand = normalizeHandCode(handCode);
  if (!canonicalHand || !isCanonicalHandCode(canonicalHand)) {
    return null;
  }

  const includedHands = new Set(reference.handCodes);
  const decisionAction = reference.mode === "BB_CALL_VS_BTN_SHOVE" ? "CALL" : "JAM";
  const isIncluded = includedHands.has(canonicalHand);

  return {
    handCode: canonicalHand,
    primaryAction: isIncluded ? decisionAction : "FOLD",
    note: isIncluded
      ? `${decisionAction === "CALL" ? "Call off" : "Jam"} from the ${
          reference.stackSource
        }bb reference.`
      : "Outside the current push/fold reference range.",
  };
}

export function buildPushFoldSpotContext(
  reference: PushFoldReference,
  stackDepth: number
): CanonicalSpotContext {
  return {
    family: "PUSH_FOLD",
    stackDepth,
    heroPosition: reference.heroPosition,
    villainPosition: reference.villainPosition,
    playersCount: PRELFOP_PLAYERS_COUNT,
    anteFormat: PRELFOP_ANTE_FORMAT,
  };
}

export function buildPushFoldActions(reference: PushFoldReference): HandAction[] {
  return ALL_HANDS.map(handCode => getPushFoldActionForHand(reference, handCode)!)
    .filter((action): action is HandAction => action !== null);
}

export function getPushFoldTrainerPool(reference: PushFoldReference): HandAction[] {
  const actions = buildPushFoldActions(reference);
  const continueCoordinates = actions
    .filter(action => action.primaryAction !== "FOLD")
    .map(action => getHandCoordinate(action.handCode))
    .filter((coordinate): coordinate is HandCoordinate => coordinate !== null);

  return actions.filter(action => {
    if (action.primaryAction !== "FOLD") return true;
    const coordinate = getHandCoordinate(action.handCode);
    if (!coordinate) return false;
    return continueCoordinates.some(
      continueCoordinate => handDistance(coordinate, continueCoordinate) <= 1
    );
  });
}

export function validatePushFoldReference(reference: PushFoldReference): string[] {
  const issues: string[] = [];
  const uniqueHands = new Set(reference.handCodes);
  const supportedStacks = new Set<number>(PUSH_FOLD_STACK_BUCKETS);

  if (uniqueHands.size !== reference.handCodes.length) {
    issues.push(`${reference.id}: duplicate hand codes in reference.`);
  }

  for (const stackDepth of reference.supportedStacks) {
    if (!supportedStacks.has(stackDepth)) {
      issues.push(`${reference.id}: unsupported stack ${stackDepth}bb.`);
    }
  }

  for (const handCode of reference.handCodes) {
    if (!isCanonicalHandCode(handCode)) {
      issues.push(`${reference.id}: invalid canonical hand code ${handCode}.`);
    }
  }

  const actions = buildPushFoldActions(reference);
  if (actions.length !== ALL_HANDS.length) {
    issues.push(
      `${reference.id}: expected ${ALL_HANDS.length} action cells, found ${actions.length}.`
    );
  }

  const actionCodes = new Set(actions.map(action => action.handCode));
  if (actionCodes.size !== ALL_HANDS.length) {
    issues.push(`${reference.id}: action grid does not cover each canonical hand exactly once.`);
  }

  return issues;
}

export function pushFoldDecisionLabel(mode: PushFoldModeKind) {
  return mode === "BB_CALL_VS_BTN_SHOVE" ? "Call" : "Jam";
}

export function pushFoldSourceNote(stackDepth: number) {
  return stackDepth === 10
    ? "10bb currently uses the 10-15bb short-stack reference when the exact 10bb chart is not provided."
    : "Stacks 5-9bb use the shared 5-10bb push/fold reference from your source notes.";
}

export function getPushFoldSpotId(reference: PushFoldReference, stackDepth: number) {
  return getCanonicalSpotId(buildPushFoldSpotContext(reference, stackDepth));
}
