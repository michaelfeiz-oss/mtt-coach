import {
  ACTION_LABELS,
  ACTIONS,
  type Action,
} from "../../../../shared/strategy";

export const STRATEGY_ACTION_ORDER: Action[] = [
  "RAISE",
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
    backgroundColor: "#eef2f7",
    color: "#64748b",
    label: ACTION_LABELS.FOLD,
  },
  RAISE: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    label: ACTION_LABELS.RAISE,
  },
  CALL: {
    backgroundColor: "#15803d",
    color: "#ffffff",
    label: ACTION_LABELS.CALL,
  },
  THREE_BET: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    label: ACTION_LABELS.THREE_BET,
  },
  JAM: {
    backgroundColor: "#ea580c",
    color: "#ffffff",
    label: ACTION_LABELS.JAM,
  },
  LIMP: {
    backgroundColor: "#ca8a04",
    color: "#ffffff",
    label: ACTION_LABELS.LIMP,
  },
  CHECK: {
    backgroundColor: "#52525b",
    color: "#ffffff",
    label: ACTION_LABELS.CHECK,
  },
};

export function isStrategyAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
