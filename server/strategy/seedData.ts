/**
 * Structured seed data for the strategy module.
 *
 * These are MTT Coach baseline preflop ranges: compact, deterministic charts
 * intended for daily study and leak repair. Future chart work should only add
 * or adjust seed definitions here; the DB/data contract stays unchanged.
 */

import {
  ACTIONS,
  ALL_HANDS,
  POSITIONS,
  RANKS,
  SPOT_DEFINITIONS,
  STACK_DEPTHS,
  type Action,
  type Position,
  type SpotDefinition,
  type SpotGroup,
} from "../../shared/strategy";
import {
  getSimplifiedVsThreeBetFamily,
  getStrategySourceLabel,
  isSourceSupportedStrategyChart,
} from "../../shared/sourceTruth";
import { formatStrategyChartTitle } from "../../shared/strategyPresentation";
import { getSourceChart } from "./sourceChartData";

export interface SeedHandAction {
  handCode: string;
  primaryAction: Action;
  weightPercent?: number;
  mixJson?: string;
  colorToken?: string;
  note?: string;
}

export interface SeedChart {
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string;
  sourceLabel?: string;
  notes?: string[];
  actions: SeedHandAction[];
}

interface ParsedHand {
  code: string;
  high: string;
  low: string;
  isPair: boolean;
  isSuited: boolean;
  isOffsuit: boolean;
  distance: number;
}

interface ActionRule {
  action: Action;
  note?: string;
  matches: (hand: ParsedHand) => boolean;
}

const VALID_HANDS = new Set(ALL_HANDS);
const VALID_ACTIONS = new Set<Action>(ACTIONS);
const VALID_STACKS = new Set<number>(STACK_DEPTHS);
const VALID_POSITIONS = new Set<string>(POSITIONS);

const BASE_OPEN_LEVEL: Record<Position, number> = {
  UTG: 1,
  UTG1: 2,
  MP: 3,
  HJ: 4,
  CO: 5,
  BTN: 7,
  SB: 6,
  BB: 1,
};

const PAIR_MIN_BY_LEVEL = ["77", "66", "55", "44", "33", "22", "22", "22"];
const SUITED_ACE_MIN_BY_LEVEL = ["T", "9", "7", "5", "2", "2", "2", "2"];
const OFFSUIT_ACE_MIN_BY_LEVEL = ["Q", "J", "T", "T", "8", "7", "5", "2"];
const SUITED_KING_MIN_BY_LEVEL = ["Q", "J", "T", "T", "8", "6", "2", "2"];
const OFFSUIT_KING_MIN_BY_LEVEL = ["Q", "Q", "J", "T", "T", "9", "8", "5"];
const SUITED_QUEEN_MIN_BY_LEVEL = ["J", "T", "T", "9", "8", "7", "5", "2"];
const OFFSUIT_QUEEN_MIN_BY_LEVEL = ["J", "J", "J", "T", "T", "9", "8", "7"];
const SUITED_JACK_MIN_BY_LEVEL = ["T", "T", "9", "9", "8", "7", "6", "4"];
const OFFSUIT_JACK_MIN_BY_LEVEL = ["T", "T", "T", "T", "9", "9", "8", "7"];

function rankIndex(rank: string): number {
  return RANKS.findIndex(candidate => candidate === rank);
}

function rankStrength(rank: string): number {
  const index = rankIndex(rank);
  return index >= 0 ? RANKS.length - index : 0;
}

function rankAtLeast(rank: string, minimum: string): boolean {
  return rankStrength(rank) >= rankStrength(minimum);
}

function rankAtMost(rank: string, maximum: string): boolean {
  return rankStrength(rank) <= rankStrength(maximum);
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(8, level));
}

function levelIndex(level: number): number {
  return clampLevel(level) - 1;
}

function parseHand(code: string): ParsedHand {
  const high = code[0] ?? "";
  const low = code[1] ?? "";
  const suffix = code[2];

  return {
    code,
    high,
    low,
    isPair: high === low,
    isSuited: suffix === "s",
    isOffsuit: suffix === "o",
    distance: rankIndex(low) - rankIndex(high),
  };
}

function isPairAtLeast(hand: ParsedHand, minimumPair: string): boolean {
  return hand.isPair && rankAtLeast(hand.high, minimumPair[0] ?? "A");
}

function isPairBetween(
  hand: ParsedHand,
  minimumPair: string,
  maximumPair: string
): boolean {
  return (
    hand.isPair &&
    rankAtLeast(hand.high, minimumPair[0] ?? "2") &&
    rankAtMost(hand.high, maximumPair[0] ?? "A")
  );
}

function isSuitedAce(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isSuited && hand.high === "A" && rankAtLeast(hand.low, minimumLow);
}

function isOffsuitAce(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isOffsuit && hand.high === "A" && rankAtLeast(hand.low, minimumLow);
}

function isSuitedKing(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isSuited && hand.high === "K" && rankAtLeast(hand.low, minimumLow);
}

function isOffsuitKing(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isOffsuit && hand.high === "K" && rankAtLeast(hand.low, minimumLow);
}

function isSuitedQueen(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isSuited && hand.high === "Q" && rankAtLeast(hand.low, minimumLow);
}

function isOffsuitQueen(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isOffsuit && hand.high === "Q" && rankAtLeast(hand.low, minimumLow);
}

function isSuitedJack(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isSuited && hand.high === "J" && rankAtLeast(hand.low, minimumLow);
}

function isOffsuitJack(hand: ParsedHand, minimumLow: string): boolean {
  return hand.isOffsuit && hand.high === "J" && rankAtLeast(hand.low, minimumLow);
}

function isSuitedBroadway(hand: ParsedHand): boolean {
  return hand.isSuited && rankAtLeast(hand.low, "T");
}

function isOffsuitBroadway(hand: ParsedHand): boolean {
  return hand.isOffsuit && rankAtLeast(hand.low, "T");
}

function isSuitedConnector(hand: ParsedHand, minimumLow: string): boolean {
  return (
    hand.isSuited &&
    hand.distance === 1 &&
    rankAtLeast(hand.low, minimumLow) &&
    !hand.isPair
  );
}

function isSuitedOneGapper(hand: ParsedHand, minimumLow: string): boolean {
  return (
    hand.isSuited &&
    hand.distance === 2 &&
    rankAtLeast(hand.low, minimumLow) &&
    !hand.isPair
  );
}

function isOffsuitConnector(hand: ParsedHand, minimumLow: string): boolean {
  return (
    hand.isOffsuit &&
    hand.distance === 1 &&
    rankAtLeast(hand.low, minimumLow)
  );
}

function isWheelAce(hand: ParsedHand): boolean {
  return hand.high === "A" && ["5", "4", "3", "2"].includes(hand.low);
}

function isPremium(hand: ParsedHand): boolean {
  return (
    isPairAtLeast(hand, "QQ") ||
    ["AKs", "AKo", "AQs"].includes(hand.code)
  );
}

function isExactVsThreeBetJam(hand: ParsedHand, level: number): boolean {
  return (
    isPairAtLeast(hand, level >= 6 ? "44" : level >= 4 ? "55" : "66") ||
    [
      "AKs",
      "AKo",
      "AQs",
      "AQo",
      "AJs",
      "AJo",
      "ATs",
      "KQs",
    ].includes(hand.code) ||
    (level >= 6 && ["KJs", "QJs", "A5s", "A4s"].includes(hand.code))
  );
}

function isStrongBroadway(hand: ParsedHand): boolean {
  return ["AKs", "AKo", "AQs", "AQo", "AJs", "KQs"].includes(hand.code);
}

function isPopulation25JamVsThreeBet(
  hand: ParsedHand,
  family: ReturnType<typeof getSimplifiedVsThreeBetFamily>
): boolean {
  if (family === "OOP_VS_IP_3BET") {
    return (
      isPairAtLeast(hand, "88") ||
      ["AKs", "AKo", "AQs", "AQo", "A5s", "A4s"].includes(hand.code)
    );
  }

  return (
    isPairAtLeast(hand, family === "IP_VS_SB_3BET" ? "88" : "99") ||
    ["AKs", "AKo", "AQs", "AQo", "A5s", "A4s"].includes(hand.code)
  );
}

function isPopulation25CallVsThreeBet(
  hand: ParsedHand,
  family: ReturnType<typeof getSimplifiedVsThreeBetFamily>
): boolean {
  if (family === "OOP_VS_IP_3BET") {
    return (
      isPairBetween(hand, "22", "77") ||
      isSuitedAce(hand, "2") ||
      ["KQs", "KJs", "QJs", "JTs", "T9s", "98s", "87s"].includes(hand.code)
    );
  }

  const familyWideners =
    family === "IP_VS_SB_3BET"
      ? [
          "AJo",
          "ATo",
          "ATs",
          "KQo",
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          "87s",
        ]
      : [
          "AJo",
          "ATs",
          "KQs",
          "KJs",
          "KTs",
          "QJs",
          "QTs",
          "JTs",
          "T9s",
          "98s",
          "87s",
        ];

  return (
    isPairBetween(hand, "22", family === "IP_VS_SB_3BET" ? "77" : "88") ||
    isSuitedAce(hand, "2") ||
    familyWideners.includes(hand.code)
  );
}

function isPopulation40JamVsThreeBet(hand: ParsedHand): boolean {
  return isPairAtLeast(hand, "QQ") || ["AKs", "AKo"].includes(hand.code);
}

function isPopulation40CallVsThreeBet(
  hand: ParsedHand,
  family: ReturnType<typeof getSimplifiedVsThreeBetFamily>
): boolean {
  if (family === "OOP_VS_IP_3BET") {
    return (
      isPairBetween(hand, "77", "JJ") ||
      [
        "AQs",
        "AQo",
        "AJs",
        "ATs",
        "KQs",
        "KJs",
        "QJs",
        "JTs",
        "A5s",
        "A4s",
        "A3s",
        "A2s",
        "T9s",
        "98s",
      ].includes(hand.code)
    );
  }

  if (family === "IP_VS_SB_3BET") {
    return (
      isPairBetween(hand, "55", "JJ") ||
      isSuitedAce(hand, "2") ||
      [
        "AQs",
        "AQo",
        "AJs",
        "AJo",
        "ATs",
        "KQs",
        "KJs",
        "KTs",
        "QJs",
        "QTs",
        "JTs",
        "T9s",
        "98s",
        "87s",
      ].includes(hand.code)
    );
  }

  return (
    isPairBetween(hand, "66", "JJ") ||
    isSuitedAce(hand, "2") ||
    [
      "AQs",
      "AQo",
      "AJs",
      "ATs",
      "KQs",
      "KJs",
      "QJs",
      "QTs",
      "JTs",
      "T9s",
      "98s",
      "A5s",
      "A4s",
      "A3s",
      "A2s",
    ].includes(hand.code)
  );
}

function stackLevelAdjustment(stackDepth: number): number {
  if (stackDepth <= 15) return -1;
  if (stackDepth >= 40) return 1;
  return 0;
}

function buildActions(rules: ActionRule[]): SeedHandAction[] {
  return ALL_HANDS.map(handCode => {
    const hand = parseHand(handCode);
    const rule = rules.find(candidate => candidate.matches(hand));

    return {
      handCode,
      primaryAction: rule?.action ?? "FOLD",
      weightPercent: 100,
      note: rule?.note,
    };
  });
}

function isRfiOpen(hand: ParsedHand, position: Position, stackDepth: number): boolean {
  const level = clampLevel(BASE_OPEN_LEVEL[position] + stackLevelAdjustment(stackDepth));
  const index = levelIndex(level);

  return (
    isPairAtLeast(hand, PAIR_MIN_BY_LEVEL[index] ?? "77") ||
    isSuitedAce(hand, SUITED_ACE_MIN_BY_LEVEL[index] ?? "T") ||
    isOffsuitAce(hand, OFFSUIT_ACE_MIN_BY_LEVEL[index] ?? "Q") ||
    isSuitedKing(hand, SUITED_KING_MIN_BY_LEVEL[index] ?? "Q") ||
    isOffsuitKing(hand, OFFSUIT_KING_MIN_BY_LEVEL[index] ?? "Q") ||
    isSuitedQueen(hand, SUITED_QUEEN_MIN_BY_LEVEL[index] ?? "J") ||
    isOffsuitQueen(hand, OFFSUIT_QUEEN_MIN_BY_LEVEL[index] ?? "J") ||
    isSuitedJack(hand, SUITED_JACK_MIN_BY_LEVEL[index] ?? "T") ||
    isOffsuitJack(hand, OFFSUIT_JACK_MIN_BY_LEVEL[index] ?? "T") ||
    isSuitedConnector(hand, level >= 6 ? "3" : level >= 4 ? "5" : "8") ||
    (level >= 5 && isSuitedOneGapper(hand, level >= 7 ? "4" : "6")) ||
    (level >= 7 && isOffsuitConnector(hand, "7")) ||
    (level >= 6 && hand.isSuited && hand.high === "T" && rankAtLeast(hand.low, "6")) ||
    (level >= 7 && hand.isSuited && hand.high === "9" && rankAtLeast(hand.low, "5"))
  );
}

function isShallowRfiJam(
  hand: ParsedHand,
  position: Position,
  stackDepth: number
): boolean {
  const level = BASE_OPEN_LEVEL[position];
  if (stackDepth > 20 || level < 5) return false;

  return (
    (stackDepth <= 15 && isPairBetween(hand, "22", "55")) ||
    (stackDepth <= 15 && hand.isSuited && isWheelAce(hand)) ||
    (position === "SB" && stackDepth <= 20 && isPairBetween(hand, "22", "66")) ||
    (position === "SB" && stackDepth <= 20 && hand.isOffsuit && isWheelAce(hand))
  );
}

function isSbLimp(hand: ParsedHand, stackDepth: number): boolean {
  if (stackDepth <= 15) return false;

  return (
    isPairBetween(hand, "22", "55") ||
    (hand.isSuited && hand.high === "A") ||
    (hand.isSuited && ["K", "Q", "J", "T", "9"].includes(hand.high)) ||
    isSuitedConnector(hand, "2") ||
    isSuitedOneGapper(hand, "4") ||
    isOffsuitAce(hand, "2") ||
    isOffsuitKing(hand, "7") ||
    isOffsuitQueen(hand, "8") ||
    isOffsuitConnector(hand, "7")
  );
}

function buildRfiActions(position: Position, stackDepth: number): SeedHandAction[] {
  return buildActions([
    {
      action: "JAM",
      note: "At shallow stacks, small pairs and wheel aces gain value as direct jams.",
      matches: hand => isShallowRfiJam(hand, position, stackDepth),
    },
    {
      action: "RAISE",
      note: "Open playable hands by position; widen as you get closer to the button.",
      matches: hand => isRfiOpen(hand, position, stackDepth),
    },
    {
      action: "LIMP",
      note: "Complete marginal small-blind hands that prefer realizing equity cheaply.",
      matches: hand => position === "SB" && isSbLimp(hand, stackDepth),
    },
  ]);
}

function defenseLevel(
  heroPosition: Position,
  villainPosition: Position | undefined,
  stackDepth: number
): number {
  const opener = villainPosition ?? "UTG";
  let level = 2;

  if (heroPosition === "BB" && opener === "BTN") level = 8;
  else if (heroPosition === "BB" && opener === "CO") level = 6;
  else if (heroPosition === "SB" && opener === "BTN") level = 4;
  else if (heroPosition === "BTN" && opener === "CO") level = 5;
  else if (opener === "MP") level = heroPosition === "BB" ? 4 : 3;
  else if (opener === "UTG") level = heroPosition === "BB" ? 3 : 2;

  return clampLevel(level + stackLevelAdjustment(stackDepth));
}

function isJamVsOpen(hand: ParsedHand, level: number, stackDepth: number): boolean {
  if (stackDepth > 20) return false;

  if (isPremium(hand)) return true;
  if (level >= 3 && (isPairAtLeast(hand, "88") || isStrongBroadway(hand))) return true;
  if (level >= 5 && (isPairAtLeast(hand, "66") || hand.code === "A5s" || hand.code === "A4s")) return true;
  if (level >= 7 && stackDepth <= 15 && (isPairAtLeast(hand, "55") || hand.code === "ATs" || hand.code === "AJo")) return true;

  return false;
}

function isThreeBetVsOpen(hand: ParsedHand, level: number, stackDepth: number): boolean {
  if (stackDepth <= 20 && isJamVsOpen(hand, level, stackDepth)) return false;

  return (
    isPremium(hand) ||
    (level >= 3 && ["JJ", "TT", "AKs", "AKo", "AQs", "AQo", "KQs"].includes(hand.code)) ||
    (level >= 5 && ["99", "AJs", "ATs", "KJs", "A5s", "A4s"].includes(hand.code)) ||
    (level >= 7 && ["88", "KTs", "QJs", "A3s"].includes(hand.code))
  );
}

function isCallVsOpen(hand: ParsedHand, level: number, stackDepth: number): boolean {
  const minimumPair = level >= 7 ? "22" : level >= 5 ? "33" : level >= 3 ? "55" : "77";

  return (
    isPairAtLeast(hand, minimumPair) ||
    isSuitedAce(hand, level >= 5 ? "2" : level >= 3 ? "5" : "T") ||
    isOffsuitAce(hand, level >= 7 ? "8" : level >= 5 ? "T" : "Q") ||
    isSuitedKing(hand, level >= 7 ? "2" : level >= 5 ? "7" : "T") ||
    isOffsuitKing(hand, level >= 7 ? "9" : "J") ||
    isSuitedQueen(hand, level >= 7 ? "5" : level >= 5 ? "8" : "T") ||
    isOffsuitQueen(hand, level >= 7 ? "9" : "J") ||
    isSuitedJack(hand, level >= 7 ? "6" : level >= 5 ? "8" : "T") ||
    (level >= 5 && isOffsuitJack(hand, "T")) ||
    isSuitedConnector(hand, level >= 7 ? "2" : level >= 5 ? "4" : "7") ||
    (level >= 5 && isSuitedOneGapper(hand, level >= 7 ? "3" : "6")) ||
    (level >= 7 && isOffsuitConnector(hand, "8")) ||
    (stackDepth >= 40 && level >= 4 && isSuitedBroadway(hand))
  );
}

function buildVsRfiActions(
  heroPosition: Position,
  villainPosition: Position | undefined,
  stackDepth: number
): SeedHandAction[] {
  const level = defenseLevel(heroPosition, villainPosition, stackDepth);

  return buildActions([
    {
      action: "JAM",
      note: "Shallow stacks push strong pairs, broadways, and good blocker hands into jam territory.",
      matches: hand => isJamVsOpen(hand, level, stackDepth),
    },
    {
      action: "THREE_BET",
      note: "Use premiums and selected suited blockers as aggressive continues.",
      matches: hand => isThreeBetVsOpen(hand, level, stackDepth),
    },
    {
      action: "CALL",
      note:
        heroPosition === "BB"
          ? "BB defends wider because closing action and price improve realization."
          : "Continue hands with clear playability; fold dominated offsuit holdings.",
      matches: hand => isCallVsOpen(hand, level, stackDepth),
    },
  ]);
}

function threeBetDefenseLevel(
  heroPosition: Position,
  villainPosition: Position | undefined,
  stackDepth: number
): number {
  const aggressor = villainPosition ?? "BB";
  let level = 2;

  if (heroPosition === "SB" && aggressor === "BB") level = 8;
  else if (heroPosition === "BTN" && (aggressor === "SB" || aggressor === "BB")) {
    level = 7;
  } else if (
    heroPosition === "CO" &&
    (aggressor === "BTN" || aggressor === "SB" || aggressor === "BB")
  ) {
    level = 5;
  } else if (
    heroPosition === "HJ" &&
    (aggressor === "CO" || aggressor === "BTN" || aggressor === "SB" || aggressor === "BB")
  ) {
    level = aggressor === "CO" ? 4 : 3;
  } else if (heroPosition === "MP") {
    level = aggressor === "HJ" ? 3 : 2;
  } else if (heroPosition === "UTG1") {
    level = aggressor === "MP" ? 2 : 1;
  } else if (heroPosition === "UTG") {
    level = aggressor === "UTG1" || aggressor === "MP" ? 2 : 1;
  }

  return clampLevel(level + stackLevelAdjustment(stackDepth));
}

function isJamVsThreeBet(
  hand: ParsedHand,
  level: number,
  stackDepth: number
): boolean {
  if (stackDepth <= 15) {
    return isExactVsThreeBetJam(hand, level);
  }

  return false;
}

function isCallVsThreeBet(
  hand: ParsedHand,
  level: number,
  stackDepth: number
): boolean {
  if (stackDepth <= 15) return false;
  return false;
}

function buildVsThreeBetActions(
  definition: SpotDefinition,
  stackDepth: number
): SeedHandAction[] {
  const level = threeBetDefenseLevel(
    definition.heroPosition,
    definition.villainPosition,
    stackDepth
  );
  const family = getSimplifiedVsThreeBetFamily({
    stackDepth,
    spotGroup: definition.group,
    heroPosition: definition.heroPosition,
    villainPosition: definition.villainPosition,
    spotKey: definition.key,
  });

  if (stackDepth === 25) {
    return buildActions([
      {
        action: "JAM",
        note:
          family === "OOP_VS_IP_3BET"
            ? "OOP versus an in-position 3-bet at 25bb, the simplified jam spine stays around 88+, AQo+, AK, and selected wheel aces."
            : family === "IP_VS_SB_3BET"
              ? "In position versus a small-blind 3-bet at 25bb, strong pairs, AQ+, AK, and wheel-ace blockers make up the clean jam bucket."
              : "In position versus a big-blind 3-bet at 25bb, keep the jam bucket value-heavy and let the weaker perimeter continue by calling or folding.",
        matches: hand => isPopulation25JamVsThreeBet(hand, family),
      },
      {
        action: "CALL",
        note:
          family === "OOP_VS_IP_3BET"
            ? "Use the 25bb OOP call bucket for small pairs, suited aces, and sturdy suited broadways that can realize without forcing a stack-off."
            : family === "IP_VS_SB_3BET"
              ? "Versus a small-blind 3-bet, position keeps more pairs, suited aces, and broadways alive as calls."
              : "Versus a big-blind 3-bet, keep the in-position call bucket disciplined and trim the weakest offsuit continues.",
        matches: hand => isPopulation25CallVsThreeBet(hand, family),
      },
    ]);
  }

  if (stackDepth >= 40) {
    return buildActions([
      {
        action: "JAM",
        note:
          "At 40bb, the simplified population stack-off center stays disciplined: default jams are QQ+ and AK.",
        matches: hand => isPopulation40JamVsThreeBet(hand),
      },
      {
        action: "CALL",
        note:
          family === "OOP_VS_IP_3BET"
            ? "Out of position at 40bb, keep JJ-to-medium-pair strength, AQ, suited aces, and suited broadways in the call bucket instead of auto-stacking off."
            : family === "IP_VS_SB_3BET"
              ? "In position versus a small-blind 3-bet, 40bb keeps the widest call bucket of pairs, suited aces, and strong broadways."
              : "In position versus a big-blind 3-bet, 40bb still allows clean calls, but trims the weakest perimeter hands compared with the SB branch.",
        matches: hand => isPopulation40CallVsThreeBet(hand, family),
      },
    ]);
  }

  return buildActions([
    {
      action: "JAM",
      note:
        level >= 6
          ? "Late-position opens can jam wider against blind 3-bets because blockers and fold equity matter more."
          : "Earlier opens continue tighter and lean toward direct all-ins only with stronger hands.",
      matches: hand => isJamVsThreeBet(hand, level, stackDepth),
    },
    {
      action: "CALL",
      note:
        stackDepth >= 40
          ? "Deeper stacks keep playable suited broadways and pairs in the calling range."
          : "Only the most stable continue hands should flat before stack depth forces jam-or-fold.",
      matches: hand => isCallVsThreeBet(hand, level, stackDepth),
    },
  ]);
}

function isSbBvbRaise(hand: ParsedHand, stackDepth: number): boolean {
  return (
    isPremium(hand) ||
    isPairAtLeast(hand, stackDepth <= 20 ? "77" : "88") ||
    isStrongBroadway(hand) ||
    ["AJs", "ATs", "KJs", "KTs", "QJs"].includes(hand.code)
  );
}

function isBbVsSbRaise(hand: ParsedHand, stackDepth: number): boolean {
  return (
    isPremium(hand) ||
    isPairAtLeast(hand, stackDepth <= 20 ? "66" : "88") ||
    isStrongBroadway(hand) ||
    ["AJs", "ATs", "KJs", "QJs", "JTs"].includes(hand.code)
  );
}

function buildBvbActions(definition: SpotDefinition, stackDepth: number): SeedHandAction[] {
  if (definition.key === "BB_vs_SB_limp") {
    return buildActions([
      {
        action: "JAM",
        note: "Attack limp ranges directly at shallow stacks with hands that benefit from fold equity.",
        matches: hand => stackDepth <= 20 && isJamVsOpen(hand, 7, stackDepth),
      },
      {
        action: "RAISE",
        note: "Raise strong and high-realization hands over the small blind limp.",
        matches: hand => isBbVsSbRaise(hand, stackDepth),
      },
      {
        action: "CHECK",
        note: "Check playable hands that prefer realizing equity without building the pot.",
        matches: hand => isCallVsOpen(hand, 7, stackDepth) || isSbLimp(hand, Math.max(stackDepth, 20)),
      },
    ]);
  }

  return buildActions([
    {
      action: "JAM",
      note: "Small pairs become more aggressive jam candidates at shallower depths.",
      matches: hand => stackDepth <= 20 && isShallowRfiJam(hand, "SB", stackDepth),
    },
    {
      action: "RAISE",
      note: "Raise hands that are happy to play a bigger pot out of the small blind.",
      matches: hand => isSbBvbRaise(hand, stackDepth),
    },
    {
      action: "LIMP",
      note: "Limp the playable middle of range to realize equity and avoid bloating the pot.",
      matches: hand => isSbLimp(hand, stackDepth) || isRfiOpen(hand, "SB", stackDepth),
    },
  ]);
}

function chartNotes(definition: SpotDefinition, stackDepth: number): string[] {
  if (definition.group === "RFI") {
    return [
      "Open tighter from early positions and widen sharply near the button.",
      stackDepth <= 20
        ? "Short stacks make blocker hands and small pairs better direct jam candidates."
        : "Deeper stacks reward suited playability and connected hands more often.",
    ];
  }

  if (definition.group === "VS_LP_RFI") {
    return [
      "Defend wider versus late-position opens because the opener's range is wider.",
      definition.heroPosition === "BB"
        ? "BB defends wide vs BTN because closing action and price improve realization."
        : "Out of position without closing action, keep offsuit continues tighter.",
    ];
  }

  if (definition.group === "VS_UTG_RFI" || definition.group === "VS_MP_RFI") {
    return [
      "Early and middle-position opens are stronger, so dominated offsuit hands continue less often.",
      "Axo mixes less versus earlier positions; continue mainly with suited wheel aces and strong broadways.",
    ];
  }

  if (definition.group === "VS_3BET") {
    const family = getSimplifiedVsThreeBetFamily({
      stackDepth,
      spotGroup: definition.group,
      heroPosition: definition.heroPosition,
      villainPosition: definition.villainPosition,
      spotKey: definition.key,
    });

    if (stackDepth === 25) {
      return [
        family === "OOP_VS_IP_3BET"
          ? "25bb OOP versus an in-position 3-bet is the tightest simplified family: strong jams first, disciplined calls second."
          : family === "IP_VS_SB_3BET"
            ? "25bb in position versus a small-blind 3-bet is the widest simplified family because position keeps more calls alive."
            : "25bb in position versus a big-blind 3-bet stays disciplined: keep the strong calls, trim the weakest perimeter hands.",
        "This layer is intentionally labeled as simplified population guidance, not an exact-source 25bb facing-3-bet chart.",
      ];
    }

    if (stackDepth >= 40) {
      return [
        "40bb facing-3-bets is handled as a simplified population layer: default stack-offs stay centered on QQ+ and AK.",
        "JJ, some medium pairs, and AQ-class hands stay in the conditional call bucket more often than the default jam bucket unless the 3-bettor is clearly over-aggressive.",
      ];
    }

    return [
      "Shallow stacks simplify versus 3-bets: continue mostly by jamming strong equity.",
      "At 40bb, suited broadways and some pairs can continue without committing the stack.",
    ];
  }

  return [
    "Blind-versus-blind ranges are wide, but position and stack depth still decide aggression.",
    "Small pairs and ace blockers gain fold equity as stacks get shallower.",
  ];
}

function buildChartActions(
  definition: SpotDefinition,
  stackDepth: number
): SeedHandAction[] {
  if (definition.group === "RFI") {
    return buildRfiActions(definition.heroPosition, stackDepth);
  }

  if (definition.group === "VS_3BET") {
    return buildVsThreeBetActions(definition, stackDepth);
  }

  if (definition.group === "BVB") {
    return buildBvbActions(definition, stackDepth);
  }

  return buildVsRfiActions(
    definition.heroPosition,
    definition.villainPosition,
    stackDepth
  );
}

function buildSeedChart(definition: SpotDefinition, stackDepth: number): SeedChart {
  // Prefer source-verified PDF chart data over heuristic generation
  const sourceChart = getSourceChart(stackDepth, definition.key);
  if (sourceChart) {
    return {
      title: formatStrategyChartTitle({
        stackDepth,
        spotGroup: definition.group,
        heroPosition: definition.heroPosition,
        villainPosition: definition.villainPosition,
        spotKey: definition.key,
      }) ?? sourceChart.sourceLabel,
      stackDepth,
      spotGroup: definition.group,
      spotKey: definition.key,
      heroPosition: definition.heroPosition,
      villainPosition: definition.villainPosition,
      sourceLabel: sourceChart.sourceLabel,
      notes: chartNotes(definition, stackDepth),
      actions: sourceChart.actions.map(a => ({
        handCode: a.handCode,
        primaryAction: a.primaryAction,
        weightPercent: a.weightPercent,
      })),
    };
  }
  return {
    title: formatStrategyChartTitle({
      stackDepth,
      spotGroup: definition.group,
      heroPosition: definition.heroPosition,
      villainPosition: definition.villainPosition,
      spotKey: definition.key,
    }),
    stackDepth,
    spotGroup: definition.group,
    spotKey: definition.key,
    heroPosition: definition.heroPosition,
    villainPosition: definition.villainPosition,
    sourceLabel:
      getStrategySourceLabel({
        stackDepth,
        spotGroup: definition.group,
        heroPosition: definition.heroPosition,
        villainPosition: definition.villainPosition,
        spotKey: definition.key,
      }) ?? "MTT Coach structured baseline",
    notes: chartNotes(definition, stackDepth),
    actions: buildChartActions(definition, stackDepth),
  };
}

function getSeedSpotDefinitions(stackDepth: number): SpotDefinition[] {
  return SPOT_DEFINITIONS.filter(definition =>
    isSourceSupportedStrategyChart({
      stackDepth,
      spotGroup: definition.group,
      heroPosition: definition.heroPosition,
      villainPosition: definition.villainPosition,
      spotKey: definition.key,
    })
  );
}

export function validateSeedCharts(charts: SeedChart[] = SEED_CHARTS): void {
  const chartKeys = new Set<string>();

  for (const chart of charts) {
    const chartKey = `${chart.stackDepth}:${chart.spotGroup}:${chart.spotKey}`;
    if (chartKeys.has(chartKey)) {
      throw new Error(`Duplicate seed chart selector: ${chartKey}`);
    }
    chartKeys.add(chartKey);

    if (!VALID_STACKS.has(chart.stackDepth)) {
      throw new Error(`Invalid stack depth in ${chart.title}: ${chart.stackDepth}`);
    }

    if (!VALID_POSITIONS.has(chart.heroPosition)) {
      throw new Error(`Invalid hero position in ${chart.title}: ${chart.heroPosition}`);
    }

    if (chart.villainPosition && !VALID_POSITIONS.has(chart.villainPosition)) {
      throw new Error(`Invalid villain position in ${chart.title}: ${chart.villainPosition}`);
    }

    const actionHands = new Set<string>();

    for (const action of chart.actions) {
      if (!VALID_HANDS.has(action.handCode)) {
        throw new Error(`Invalid hand code in ${chart.title}: ${action.handCode}`);
      }

      if (!VALID_ACTIONS.has(action.primaryAction)) {
        throw new Error(`Invalid action in ${chart.title}: ${action.primaryAction}`);
      }

      if (actionHands.has(action.handCode)) {
        throw new Error(`Duplicate hand action in ${chart.title}: ${action.handCode}`);
      }

      actionHands.add(action.handCode);
    }

    if (actionHands.size !== ALL_HANDS.length) {
      throw new Error(
        `Seed chart ${chart.title} must contain ${ALL_HANDS.length} hand actions; found ${actionHands.size}`
      );
    }
  }
}

export const SEED_CHARTS: SeedChart[] = STACK_DEPTHS.flatMap(stackDepth =>
  getSeedSpotDefinitions(stackDepth).map(definition =>
    buildSeedChart(definition, stackDepth)
  )
);

validateSeedCharts(SEED_CHARTS);
