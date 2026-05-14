import {
  ACTION_PRIORITY,
  ALL_HANDS,
  RANKS,
  type Action,
  type HandAction,
  type StrategyNodeRangeRow,
} from "./preflopStrategy";

const VALID_HANDS = new Set(ALL_HANDS);
const RANK_PATTERN = "[AKQJT98765432]";
const EXACT_PAIR_REGEX = new RegExp(`^(${RANK_PATTERN})\\1$`);
const EXACT_HAND_REGEX = new RegExp(`^(${RANK_PATTERN})(${RANK_PATTERN})(s|o)$`);
const PAIR_PLUS_REGEX = new RegExp(`^(${RANK_PATTERN})\\1\\+$`);
const PAIR_RANGE_REGEX = new RegExp(`^(${RANK_PATTERN})\\1-(${RANK_PATTERN})\\2$`);
const NON_PAIR_PLUS_REGEX = new RegExp(
  `^(${RANK_PATTERN})(${RANK_PATTERN})(s|o)\\+$`
);
const NON_PAIR_RANGE_REGEX = new RegExp(
  `^(${RANK_PATTERN})(${RANK_PATTERN})(s|o)-(${RANK_PATTERN})(${RANK_PATTERN})(s|o)$`
);

function rankIndex(rank: string) {
  const index = RANKS.indexOf(rank as (typeof RANKS)[number]);
  if (index === -1) {
    throw new Error(`Unsupported rank "${rank}" in range notation.`);
  }

  return index;
}

function normalizeExactHandCode(token: string) {
  if (EXACT_PAIR_REGEX.test(token)) {
    return token;
  }

  const exactMatch = token.match(EXACT_HAND_REGEX);
  if (!exactMatch) {
    throw new Error(`Unsupported exact hand token "${token}".`);
  }

  const [, first, second, suffix] = exactMatch;
  const firstIndex = rankIndex(first);
  const secondIndex = rankIndex(second);

  if (firstIndex === secondIndex) {
    throw new Error(`Pairs must not use suitedness suffix: "${token}".`);
  }

  const high = firstIndex < secondIndex ? first : second;
  const low = firstIndex < secondIndex ? second : first;
  const normalized = `${high}${low}${suffix}`;

  if (!VALID_HANDS.has(normalized)) {
    throw new Error(`Unsupported exact hand token "${token}".`);
  }

  return normalized;
}

function expandPairPlus(token: string) {
  const match = token.match(PAIR_PLUS_REGEX);
  if (!match) return null;

  const startRank = match[1];
  const startIndex = rankIndex(startRank);
  const hands: string[] = [];

  for (let index = startIndex; index >= 0; index -= 1) {
    const rank = RANKS[index];
    hands.push(`${rank}${rank}`);
  }

  return hands;
}

function expandPairRange(token: string) {
  const match = token.match(PAIR_RANGE_REGEX);
  if (!match) return null;

  const [, startRank, endRank] = match;
  const startIndex = rankIndex(startRank);
  const endIndex = rankIndex(endRank);
  const step = startIndex <= endIndex ? 1 : -1;
  const hands: string[] = [];

  for (
    let index = startIndex;
    step > 0 ? index <= endIndex : index >= endIndex;
    index += step
  ) {
    const rank = RANKS[index];
    hands.push(`${rank}${rank}`);
  }

  return hands;
}

function expandNonPairPlus(token: string) {
  const match = token.match(NON_PAIR_PLUS_REGEX);
  if (!match) return null;

  const [, highRank, lowRank, suffix] = match;
  const highIndex = rankIndex(highRank);
  const lowIndex = rankIndex(lowRank);

  if (highIndex >= lowIndex) {
    throw new Error(`Invalid plus token "${token}". Use stronger rank first.`);
  }

  const hands: string[] = [];
  for (let index = lowIndex; index > highIndex; index -= 1) {
    hands.push(`${highRank}${RANKS[index]}${suffix}`);
  }

  return hands;
}

function expandNonPairRange(token: string) {
  const match = token.match(NON_PAIR_RANGE_REGEX);
  if (!match) return null;

  const [, startHigh, startLow, startSuffix, endHigh, endLow, endSuffix] =
    match;

  if (startSuffix !== endSuffix) {
    throw new Error(
      `Range token "${token}" must keep the same suitedness across the interval.`
    );
  }

  const startHighIndex = rankIndex(startHigh);
  const startLowIndex = rankIndex(startLow);
  const endHighIndex = rankIndex(endHigh);
  const endLowIndex = rankIndex(endLow);

  if (startHighIndex >= startLowIndex || endHighIndex >= endLowIndex) {
    throw new Error(`Invalid non-pair range token "${token}".`);
  }

  const highDelta = endHighIndex - startHighIndex;
  const lowDelta = endLowIndex - startLowIndex;

  if (highDelta !== 0 && Math.abs(highDelta) !== Math.abs(lowDelta)) {
    throw new Error(
      `Range token "${token}" must move both ranks together or keep the top rank fixed.`
    );
  }

  const hands: string[] = [];

  if (highDelta === 0) {
    const step = startLowIndex <= endLowIndex ? 1 : -1;
    for (
      let index = startLowIndex;
      step > 0 ? index <= endLowIndex : index >= endLowIndex;
      index += step
    ) {
      hands.push(`${startHigh}${RANKS[index]}${startSuffix}`);
    }
    return hands;
  }

  const highStep = highDelta > 0 ? 1 : -1;
  const lowStep = lowDelta > 0 ? 1 : -1;
  const steps = Math.abs(highDelta);

  for (let offset = 0; offset <= steps; offset += 1) {
    const high = RANKS[startHighIndex + offset * highStep];
    const low = RANKS[startLowIndex + offset * lowStep];
    hands.push(`${high}${low}${startSuffix}`);
  }

  return hands;
}

export function expandRangeToken(token: string) {
  const normalized = token.trim();

  if (!normalized) return [];

  if (EXACT_PAIR_REGEX.test(normalized) || EXACT_HAND_REGEX.test(normalized)) {
    return [normalizeExactHandCode(normalized)];
  }

  return (
    expandPairPlus(normalized) ??
    expandPairRange(normalized) ??
    expandNonPairPlus(normalized) ??
    expandNonPairRange(normalized) ??
    (() => {
      throw new Error(`Unsupported range token "${normalized}".`);
    })()
  );
}

export function parseRangeNotation(rangeNotation: string) {
  const tokens = rangeNotation
    .split(/[\n,]/)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("Range notation is empty.");
  }

  const hands = new Set<string>();

  for (const token of tokens) {
    for (const handCode of expandRangeToken(token)) {
      hands.add(handCode);
    }
  }

  return Array.from(hands).sort(
    (left, right) => ALL_HANDS.indexOf(left) - ALL_HANDS.indexOf(right)
  );
}

export interface CompiledNodeResult {
  actions: HandAction[];
  missingHands: string[];
  overlaps: Array<{
    handCode: string;
    firstAction: Action;
    secondAction: Action;
  }>;
}

export function compileNotationRows(
  rows: StrategyNodeRangeRow[],
  options?: {
    requireComplete?: boolean;
    fillMissingWithAction?: Action;
  }
): CompiledNodeResult {
  const handOwner = new Map<string, { action: Action; note?: string | null }>();
  const overlaps: CompiledNodeResult["overlaps"] = [];

  const sortedRows = [...rows].sort((left, right) => {
    const priorityDelta = right.priority - left.priority;
    if (priorityDelta !== 0) return priorityDelta;
    return ACTION_PRIORITY[right.action] - ACTION_PRIORITY[left.action];
  });

  for (const row of sortedRows) {
    const hands = parseRangeNotation(row.rangeNotation);

    for (const handCode of hands) {
      const existing = handOwner.get(handCode);
      if (existing) {
        overlaps.push({
          handCode,
          firstAction: existing.action,
          secondAction: row.action,
        });
        continue;
      }

      handOwner.set(handCode, {
        action: row.action,
        note: row.notes ?? null,
      });
    }
  }

  let missingHands = ALL_HANDS.filter(handCode => !handOwner.has(handCode));

  if (options?.fillMissingWithAction) {
    for (const handCode of missingHands) {
      handOwner.set(handCode, {
        action: options.fillMissingWithAction,
        note: null,
      });
    }
    missingHands = [];
  }

  const actions = ALL_HANDS.filter(handCode => handOwner.has(handCode)).map(
    handCode => {
      const owner = handOwner.get(handCode)!;
      return {
        handCode,
        primaryAction: owner.action,
        weightPercent: 100,
        note: owner.note ?? undefined,
      };
    }
  );

  if (overlaps.length > 0) {
    const overlapSummary = overlaps
      .slice(0, 8)
      .map(
        overlap =>
          `${overlap.handCode}: ${overlap.firstAction} vs ${overlap.secondAction}`
      )
      .join(", ");
    throw new Error(`Strategy node has overlapping actions: ${overlapSummary}`);
  }

  if (options?.requireComplete && missingHands.length > 0) {
    throw new Error(
      `Strategy node is missing ${missingHands.length} hands: ${missingHands.join(", ")}`
    );
  }

  return {
    actions,
    missingHands,
    overlaps,
  };
}
