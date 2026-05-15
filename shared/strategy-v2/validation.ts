import {
  ACTION_TOKENS,
  ALL_HANDS,
  CHART_STATUSES,
  SNAPSHOT_STATUSES,
  SPOT_TYPES,
  STACK_BUCKETS,
  POSITIONS,
  type ActionToken,
  type ChartCells,
  type ChartStatus,
  type SnapshotStatus,
  type SpotType,
  type StackBucket,
  type Position,
} from "./model";

export type StrategyValidationCode =
  | "EMPTY_ALLOWED_ACTIONS"
  | "INVALID_ALLOWED_ACTION"
  | "INVALID_STATUS"
  | "INVALID_SPOT_TYPE"
  | "INVALID_STACK"
  | "INVALID_POSITION"
  | "INVALID_HAND"
  | "DUPLICATE_HAND"
  | "MISSING_HAND"
  | "INVALID_ACTION"
  | "ACTION_NOT_ALLOWED"
  | "INVALID_CELL_COUNT"
  | "CHECKSUM_MISMATCH";

export class StrategyValidationError extends Error {
  readonly code: StrategyValidationCode;
  readonly nodeKey?: string;
  readonly handCode?: string;
  readonly action?: string;

  constructor(input: {
    code: StrategyValidationCode;
    message: string;
    nodeKey?: string;
    handCode?: string;
    action?: string;
  }) {
    super(input.message);
    this.name = "StrategyValidationError";
    this.code = input.code;
    this.nodeKey = input.nodeKey;
    this.handCode = input.handCode;
    this.action = input.action;
  }
}

const VALID_ACTIONS = new Set<string>(ACTION_TOKENS);
const VALID_HANDS = new Set<string>(ALL_HANDS);
const VALID_CHART_STATUSES = new Set<string>(CHART_STATUSES);
const VALID_SNAPSHOT_STATUSES = new Set<string>(SNAPSHOT_STATUSES);
const VALID_SPOT_TYPES = new Set<string>(SPOT_TYPES);
const VALID_STACKS = new Set<number>(STACK_BUCKETS);
const VALID_POSITIONS = new Set<string>(POSITIONS);

function fail(input: ConstructorParameters<typeof StrategyValidationError>[0]): never {
  throw new StrategyValidationError(input);
}

export function assertActionToken(action: string, nodeKey?: string): asserts action is ActionToken {
  if (!VALID_ACTIONS.has(action)) {
    fail({
      code: "INVALID_ACTION",
      message: `${nodeKey ?? "chart"}: invalid action token ${action}.`,
      nodeKey,
      action,
    });
  }
}

export function assertChartStatus(status: string, nodeKey?: string): asserts status is ChartStatus {
  if (!VALID_CHART_STATUSES.has(status)) {
    fail({
      code: "INVALID_STATUS",
      message: `${nodeKey ?? "chart"}: invalid chart status ${status}.`,
      nodeKey,
    });
  }
}

export function assertSnapshotStatus(
  status: string,
  nodeKey?: string
): asserts status is SnapshotStatus {
  if (!VALID_SNAPSHOT_STATUSES.has(status)) {
    fail({
      code: "INVALID_STATUS",
      message: `${nodeKey ?? "chart"}: invalid snapshot status ${status}.`,
      nodeKey,
    });
  }
}

export function assertSpotType(value: string, nodeKey?: string): asserts value is SpotType {
  if (!VALID_SPOT_TYPES.has(value)) {
    fail({
      code: "INVALID_SPOT_TYPE",
      message: `${nodeKey ?? "chart"}: invalid spot type ${value}.`,
      nodeKey,
    });
  }
}

export function assertStackBucket(value: number, nodeKey?: string): asserts value is StackBucket {
  if (!VALID_STACKS.has(value)) {
    fail({
      code: "INVALID_STACK",
      message: `${nodeKey ?? "chart"}: invalid stack bucket ${value}.`,
      nodeKey,
    });
  }
}

export function assertPosition(value: string, nodeKey?: string): asserts value is Position {
  if (!VALID_POSITIONS.has(value)) {
    fail({
      code: "INVALID_POSITION",
      message: `${nodeKey ?? "chart"}: invalid position ${value}.`,
      nodeKey,
    });
  }
}

export function validateAllowedActions(
  allowedActions: string[],
  nodeKey?: string
): ActionToken[] {
  if (!Array.isArray(allowedActions) || allowedActions.length === 0) {
    fail({
      code: "EMPTY_ALLOWED_ACTIONS",
      message: `${nodeKey ?? "chart"}: allowedActions must not be empty.`,
      nodeKey,
    });
  }

  const seen = new Set<string>();
  const normalized: ActionToken[] = [];

  for (const action of allowedActions) {
    if (!VALID_ACTIONS.has(action)) {
      fail({
        code: "INVALID_ALLOWED_ACTION",
        message: `${nodeKey ?? "chart"}: allowed action ${action} is not canonical.`,
        nodeKey,
        action,
      });
    }

    if (!seen.has(action)) {
      seen.add(action);
      normalized.push(action as ActionToken);
    }
  }

  return normalized;
}

export function validateChartCells(input: {
  nodeKey?: string;
  allowedActions: string[];
  cells: Record<string, string>;
}): ChartCells {
  const { nodeKey } = input;
  const allowedActions = validateAllowedActions(input.allowedActions, nodeKey);
  const allowedSet = new Set<string>(allowedActions);
  const cellEntries = Object.entries(input.cells ?? {});

  if (cellEntries.length !== ALL_HANDS.length) {
    fail({
      code: "INVALID_CELL_COUNT",
      message: `${nodeKey ?? "chart"}: expected ${ALL_HANDS.length} cells, found ${cellEntries.length}.`,
      nodeKey,
    });
  }

  const seen = new Set<string>();
  const cells: Record<string, ActionToken> = {};

  for (const [handCode, action] of cellEntries) {
    if (!VALID_HANDS.has(handCode)) {
      fail({
        code: "INVALID_HAND",
        message: `${nodeKey ?? "chart"}: invalid hand code ${handCode}.`,
        nodeKey,
        handCode,
      });
    }

    if (seen.has(handCode)) {
      fail({
        code: "DUPLICATE_HAND",
        message: `${nodeKey ?? "chart"}: duplicate hand ${handCode}.`,
        nodeKey,
        handCode,
      });
    }
    seen.add(handCode);

    if (!VALID_ACTIONS.has(action)) {
      fail({
        code: "INVALID_ACTION",
        message: `${nodeKey ?? "chart"}: ${handCode} has invalid action ${action}.`,
        nodeKey,
        handCode,
        action,
      });
    }

    if (!allowedSet.has(action)) {
      fail({
        code: "ACTION_NOT_ALLOWED",
        message: `${nodeKey ?? "chart"}: ${handCode} action ${action} is outside allowedActions.`,
        nodeKey,
        handCode,
        action,
      });
    }

    cells[handCode] = action as ActionToken;
  }

  for (const handCode of ALL_HANDS) {
    if (!seen.has(handCode)) {
      fail({
        code: "MISSING_HAND",
        message: `${nodeKey ?? "chart"}: missing hand ${handCode}.`,
        nodeKey,
        handCode,
      });
    }
  }

  return Object.fromEntries(ALL_HANDS.map(hand => [hand, cells[hand]])) as ChartCells;
}

export function toValidationProblem(error: unknown) {
  if (error instanceof StrategyValidationError) {
    return {
      code: error.code,
      message: error.message,
      nodeKey: error.nodeKey,
      handCode: error.handCode,
      action: error.action,
    };
  }

  return {
    code: "UNKNOWN",
    message: error instanceof Error ? error.message : String(error),
  };
}
