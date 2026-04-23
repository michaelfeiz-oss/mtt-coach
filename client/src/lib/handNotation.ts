import { ALL_HANDS, RANKS } from "@shared/strategy";

const VALID_HANDS = new Set(ALL_HANDS);
const VALID_RANKS = new Set<string>(RANKS);
const SUITS = new Set(["s", "h", "d", "c"]);

function normalizeSuit(suit: string) {
  const normalized = suit.toLowerCase();
  if (normalized === "♠") return "s";
  if (normalized === "♥") return "h";
  if (normalized === "♦") return "d";
  if (normalized === "♣") return "c";
  return normalized;
}

function rankOrder(rank: string) {
  return RANKS.indexOf(rank as (typeof RANKS)[number]);
}

function isRank(value: string): value is (typeof RANKS)[number] {
  return VALID_RANKS.has(value);
}

export function normalizeHandNotation(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && upper[0] === upper[1] && isRank(upper[0])) {
    return upper;
  }

  if (
    upper.length === 3 &&
    isRank(upper[0]) &&
    isRank(upper[1]) &&
    ["S", "O"].includes(upper[2])
  ) {
    return `${upper[0]}${upper[1]}${upper[2].toLowerCase()}`;
  }

  if (trimmed.length === 4) {
    const rankA = trimmed[0].toUpperCase();
    const suitA = normalizeSuit(trimmed[1]);
    const rankB = trimmed[2].toUpperCase();
    const suitB = normalizeSuit(trimmed[3]);

    if (
      !isRank(rankA) ||
      !isRank(rankB) ||
      !SUITS.has(suitA) ||
      !SUITS.has(suitB)
    ) {
      return upper;
    }

    if (rankA === rankB) return `${rankA}${rankB}`;

    const [high, low] =
      rankOrder(rankA) < rankOrder(rankB) ? [rankA, rankB] : [rankB, rankA];
    const suitedSuffix = suitA === suitB ? "s" : "o";
    return `${high}${low}${suitedSuffix}`;
  }

  return upper;
}

export function isValidHandNotation(input: string): boolean {
  if (!input) return false;
  const normalized = normalizeHandNotation(input);
  return VALID_HANDS.has(normalized);
}
