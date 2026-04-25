import { ALL_HANDS, RANKS } from "./strategy";

export interface HandCoordinate {
  row: number;
  col: number;
}

const VALID_HANDS = new Set<string>(ALL_HANDS);
const RANK_INDEX = new Map<string, number>(
  RANKS.map((rank, index) => [rank, index])
);

export function isCanonicalHandCode(handCode: string): boolean {
  return VALID_HANDS.has(handCode);
}

function rankSortIndex(rank: string): number {
  return RANK_INDEX.get(rank) ?? Number.MAX_SAFE_INTEGER;
}

export function canonicalHandFromRanks(
  firstRank: string,
  secondRank: string,
  suffix?: "s" | "o"
): string | null {
  const first = firstRank.toUpperCase();
  const second = secondRank.toUpperCase();

  if (first === second) {
    const pair = `${first}${second}`;
    return VALID_HANDS.has(pair) ? pair : null;
  }

  const [high, low] =
    rankSortIndex(first) <= rankSortIndex(second)
      ? [first, second]
      : [second, first];
  const handCode = suffix ? `${high}${low}${suffix}` : null;

  return handCode && VALID_HANDS.has(handCode) ? handCode : null;
}

export function normalizeHandCode(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const raw = value.trim();
  const cardMatches = Array.from(raw.matchAll(/([AKQJT98765432])([SHDC])/gi));

  if (cardMatches.length === 2) {
    const firstRank = cardMatches[0][1];
    const firstSuit = cardMatches[0][2].toLowerCase();
    const secondRank = cardMatches[1][1];
    const secondSuit = cardMatches[1][2].toLowerCase();
    const suffix = firstSuit === secondSuit ? "s" : "o";
    return canonicalHandFromRanks(firstRank, secondRank, suffix);
  }

  const compact = raw.replace(/[^AKQJT98765432SO]/gi, "").toUpperCase();

  if (compact.length === 2) {
    return canonicalHandFromRanks(compact[0], compact[1]);
  }

  if (compact.length === 3) {
    const suffix = compact[2] === "S" ? "s" : compact[2] === "O" ? "o" : null;
    return suffix ? canonicalHandFromRanks(compact[0], compact[1], suffix) : null;
  }

  return null;
}

export function getHandCoordinate(handCode: string): HandCoordinate | null {
  if (!VALID_HANDS.has(handCode)) return null;

  const firstRank = handCode[0];
  const secondRank = handCode[1];
  const firstIndex = RANK_INDEX.get(firstRank);
  const secondIndex = RANK_INDEX.get(secondRank);

  if (firstIndex === undefined || secondIndex === undefined) return null;
  if (handCode.length === 2) return { row: firstIndex, col: firstIndex };

  const suffix = handCode[2];
  if (suffix === "s") return { row: firstIndex, col: secondIndex };
  if (suffix === "o") return { row: secondIndex, col: firstIndex };

  return null;
}

export function getHandCodeAtCoordinate(
  row: number,
  col: number
): string | null {
  if (row < 0 || row >= RANKS.length || col < 0 || col >= RANKS.length) {
    return null;
  }

  const rowRank = RANKS[row];
  const colRank = RANKS[col];

  if (row === col) return `${rowRank}${colRank}`;
  if (row < col) return `${rowRank}${colRank}s`;
  return `${colRank}${rowRank}o`;
}

export function handDistance(a: HandCoordinate, b: HandCoordinate): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
}
