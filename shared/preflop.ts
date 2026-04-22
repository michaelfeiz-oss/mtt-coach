import {
  ACTION_LABELS,
  ALL_HANDS,
  RANKS,
  type Action,
} from "./strategy";

export type HandClassKind = "pair" | "suited" | "offsuit";
export type DisplaySuit = "spades" | "hearts" | "diamonds" | "clubs";

export interface ParsedHandClass {
  code: string;
  firstRank: string;
  secondRank: string;
  kind: HandClassKind;
  firstSuit: DisplaySuit;
  secondSuit: DisplaySuit;
  label: string;
}

const VALID_HANDS = new Set(ALL_HANDS);
const VALID_RANKS = new Set<string>(RANKS);
const RANK_NAMES: Record<string, string> = {
  A: "ace",
  K: "king",
  Q: "queen",
  J: "jack",
  T: "ten",
  "9": "nine",
  "8": "eight",
  "7": "seven",
  "6": "six",
  "5": "five",
  "4": "four",
  "3": "three",
  "2": "two",
};

function normalizeHandCode(handCode: string): string {
  const trimmed = handCode.trim();
  if (trimmed.length < 2) return trimmed.toUpperCase();

  const ranks = trimmed.slice(0, 2).toUpperCase();
  const suffix = trimmed.slice(2).toLowerCase();
  return `${ranks}${suffix}`;
}

function rankName(rank: string): string {
  return RANK_NAMES[rank] ?? rank;
}

function pairLabel(rank: string): string {
  const plural =
    rank === "6"
      ? "sixes"
      : rank === "A"
        ? "aces"
        : `${rankName(rank)}s`;
  return `pair of ${plural}`;
}

export function parseHandClass(handCode: string): ParsedHandClass | null {
  const code = normalizeHandCode(handCode);
  const firstRank = code[0];
  const secondRank = code[1];

  if (!VALID_RANKS.has(firstRank) || !VALID_RANKS.has(secondRank)) return null;
  if (!VALID_HANDS.has(code)) return null;

  if (code.length === 2 && firstRank === secondRank) {
    return {
      code,
      firstRank,
      secondRank,
      kind: "pair",
      firstSuit: "spades",
      secondSuit: "hearts",
      label: pairLabel(firstRank),
    };
  }

  const suffix = code[2];
  if (suffix === "s") {
    return {
      code,
      firstRank,
      secondRank,
      kind: "suited",
      firstSuit: "spades",
      secondSuit: "spades",
      label: `suited ${rankName(firstRank)}-${rankName(secondRank)}`,
    };
  }

  if (suffix === "o") {
    return {
      code,
      firstRank,
      secondRank,
      kind: "offsuit",
      firstSuit: "spades",
      secondSuit: "hearts",
      label: `offsuit ${rankName(firstRank)}-${rankName(secondRank)}`,
    };
  }

  return null;
}

function noteContradictsHandClass(note: string, handClass: ParsedHandClass): boolean {
  const normalized = note.toLowerCase();
  const mentionsSuited = /\bsuited\b/.test(normalized);
  const mentionsOffsuit = /\boffsuit\b/.test(normalized);
  const mentionsPair = /\bpair|pairs\b/.test(normalized);

  if (handClass.kind === "suited") return mentionsOffsuit && !mentionsSuited;
  if (handClass.kind === "offsuit") return mentionsSuited && !mentionsOffsuit;
  return (mentionsSuited || mentionsOffsuit) && !mentionsPair;
}

export function buildHandClassRevealNote(
  handCode: string,
  action: Action,
  preferredNote?: string | null
): string {
  const handClass = parseHandClass(handCode);

  if (
    preferredNote &&
    (!handClass || !noteContradictsHandClass(preferredNote, handClass))
  ) {
    return preferredNote;
  }

  if (!handClass) {
    return `${handCode} sits in the ${ACTION_LABELS[action].toLowerCase()} region for this preflop spot.`;
  }

  return `${handClass.code} is a ${handClass.label} hand class in the ${ACTION_LABELS[action].toLowerCase()} region for this preflop spot.`;
}
