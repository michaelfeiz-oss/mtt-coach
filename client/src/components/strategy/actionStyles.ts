import {
  ACTION_COLORS,
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
    backgroundColor: ACTION_COLORS.FOLD,
    color: "#ffffff",
    label: ACTION_LABELS.FOLD,
  },
  RAISE: {
    backgroundColor: ACTION_COLORS.RAISE,
    color: "#ffffff",
    label: ACTION_LABELS.RAISE,
  },
  CALL: {
    backgroundColor: ACTION_COLORS.CALL,
    color: "#052e16",
    label: ACTION_LABELS.CALL,
  },
  THREE_BET: {
    backgroundColor: ACTION_COLORS.THREE_BET,
    color: "#ffffff",
    label: ACTION_LABELS.THREE_BET,
  },
  JAM: {
    backgroundColor: ACTION_COLORS.JAM,
    color: "#ffffff",
    label: ACTION_LABELS.JAM,
  },
  LIMP: {
    backgroundColor: ACTION_COLORS.LIMP,
    color: "#18181b",
    label: ACTION_LABELS.LIMP,
  },
  CHECK: {
    backgroundColor: ACTION_COLORS.CHECK,
    color: "#ffffff",
    label: ACTION_LABELS.CHECK,
  },
};

export function isStrategyAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
