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
  THREE_BET: {
    backgroundColor: "#2563EB",
    color: "#ffffff",
    label: ACTION_LABELS.THREE_BET,
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

export function isStrategyAction(value: string): value is Action {
  return (ACTIONS as readonly string[]).includes(value);
}
