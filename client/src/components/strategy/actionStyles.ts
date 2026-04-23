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
    backgroundColor: "#d4dce7",
    color: "#526175",
    label: ACTION_LABELS.FOLD,
  },
  RAISE: {
    backgroundColor: "#d54f3f",
    color: "#ffffff",
    label: ACTION_LABELS.RAISE,
  },
  CALL: {
    backgroundColor: "#1f9b63",
    color: "#ffffff",
    label: ACTION_LABELS.CALL,
  },
  THREE_BET: {
    backgroundColor: "#2f6ccb",
    color: "#ffffff",
    label: ACTION_LABELS.THREE_BET,
  },
  JAM: {
    backgroundColor: "#dd6e2a",
    color: "#ffffff",
    label: ACTION_LABELS.JAM,
  },
  LIMP: {
    backgroundColor: "#b48b2a",
    color: "#ffffff",
    label: ACTION_LABELS.LIMP,
  },
  CHECK: {
    backgroundColor: "#5d6777",
    color: "#ffffff",
    label: ACTION_LABELS.CHECK,
  },
};

export function isStrategyAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
