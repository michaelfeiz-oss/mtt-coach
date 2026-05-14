import {
  ACTION_LABELS,
  ACTIONS,
  type Action,
} from "../../../../shared/preflopStrategy";

export const STRATEGY_ACTION_ORDER: Action[] = [
  "FOUR_BET",
  "RAISE",
  "CALL_JAM",
  "CALL",
  "THREE_BET",
  "JAM",
  "LIMP",
  "CHECK",
  "FOLD",
];

export const ACTION_CELL_STYLES: Record<
  Action,
  {
    backgroundColor: string;
    color: string;
    label: string;
  }
> = {
  FOLD: {
    backgroundColor: "#E2E8F0",
    color: "#64748B",
    label: ACTION_LABELS.FOLD,
  },
  RAISE: {
    backgroundColor: "#D96B1D",
    color: "#ffffff",
    label: ACTION_LABELS.RAISE,
  },
  CALL: {
    backgroundColor: "#16A34A",
    color: "#ffffff",
    label: ACTION_LABELS.CALL,
  },
  CALL_JAM: {
    backgroundColor: "#0F9F6E",
    color: "#ffffff",
    label: ACTION_LABELS.CALL_JAM,
  },
  THREE_BET: {
    backgroundColor: "#2563EB",
    color: "#ffffff",
    label: ACTION_LABELS.THREE_BET,
  },
  FOUR_BET: {
    backgroundColor: "#7C3AED",
    color: "#ffffff",
    label: ACTION_LABELS.FOUR_BET,
  },
  JAM: {
    backgroundColor: "#D96B1D",
    color: "#ffffff",
    label: ACTION_LABELS.JAM,
  },
  LIMP: {
    backgroundColor: "#FDE7C6",
    color: "#9A4D12",
    label: ACTION_LABELS.LIMP,
  },
  CHECK: {
    backgroundColor: "#94A3B8",
    color: "#ffffff",
    label: ACTION_LABELS.CHECK,
  },
};

export const MISSING_ACTION_CELL_STYLE = {
  backgroundColor: "#FEF2F2",
  color: "#B91C1C",
  label: "Missing data",
} as const;

export const UNKNOWN_ACTION_CELL_STYLE = {
  backgroundColor: "#FFF7E6",
  color: "#9A4D12",
  label: "Unknown action",
} as const;

export function isStrategyAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}

export function getActionCellStyle(action: string | null | undefined) {
  if (action && isStrategyAction(action)) {
    return ACTION_CELL_STYLES[action];
  }

  return UNKNOWN_ACTION_CELL_STYLE;
}
