import React from "react";
import { generateHandGrid } from "../../../../shared/preflopStrategy";
import type { HandAction } from "../../../../shared/preflopStrategy";
import { cn } from "@/lib/utils";
import {
  getActionCellStyle,
  MISSING_ACTION_CELL_STYLE,
} from "./actionStyles";

export type MatrixSize = "sm" | "md" | "lg";

interface RangeMatrixProps {
  actions: Record<string, HandAction> | HandAction[];
  compact?: boolean;
  highlightHand?: string;
  highlightedHand?: string | null;
  onCellClick?: (handCode: string) => void;
  onSelectHand?: (handCode: string) => void;
  readOnly?: boolean;
  readonly?: boolean;
  strictComplete?: boolean;
  showCellLabels?: boolean;
  size?: MatrixSize;
  className?: string;
}

const SIZE_CONFIG: Record<
  MatrixSize,
  { minCell: number; maxCell: number; font: number }
> = {
  sm: { minCell: 20, maxCell: 28, font: 9 },
  md: { minCell: 24, maxCell: 38, font: 10.5 },
  lg: { minCell: 32, maxCell: 54, font: 12.5 },
};

const COMPACT_SIZE_CONFIG = { minCell: 18, maxCell: 30, font: 9 };

export function getRangeGrid(): string[][] {
  return generateHandGrid();
}

export function buildRangeActionLookup(
  actions: Record<string, HandAction> | HandAction[]
): Record<string, HandAction> {
  if (!Array.isArray(actions)) return actions;

  return actions.reduce<Record<string, HandAction>>((lookup, action) => {
    lookup[action.handCode] = action;
    return lookup;
  }, {});
}

export function getActionForHand(
  actions: Record<string, HandAction>,
  handCode: string
): HandAction | undefined {
  return actions[handCode];
}

export type MatrixCellState =
  | { kind: "action"; action: HandAction }
  | { kind: "missing"; handCode: string };

export function getMatrixCellState(
  actions: Record<string, HandAction>,
  handCode: string
): MatrixCellState {
  const action = getActionForHand(actions, handCode);

  return action
    ? { kind: "action", action }
    : { kind: "missing", handCode };
}

function getMissingHandCodes(
  actions: Record<string, HandAction>,
  grid: string[][]
) {
  return grid.flat().filter(handCode => actions[handCode] === undefined);
}

export function getMatrixCellDisplay(
  action: HandAction | undefined,
  strictComplete = false
) {
  if (!action) {
    return {
      primaryAction: null,
      label: "Missing",
      style: MISSING_ACTION_CELL_STYLE,
      isMissing: true,
      frequency: null,
    };
  }

  const style = getActionCellStyle(action.primaryAction);
  const isUnknownAction = style.label === "Unknown action";

  return {
    primaryAction: action.primaryAction,
    label: style.label,
    style,
    isMissing: false,
    isUnknownAction,
    frequency: action.weightPercent ?? null,
  };
}

export function RangeMatrix({
  actions,
  compact = false,
  highlightHand,
  highlightedHand,
  onCellClick,
  onSelectHand,
  readOnly = false,
  readonly: readOnlyAlias,
  strictComplete = false,
  showCellLabels = true,
  size = "md",
  className = "",
}: RangeMatrixProps) {
  const grid = React.useMemo(() => getRangeGrid(), []);
  const actionLookup = React.useMemo(
    () => buildRangeActionLookup(actions),
    [actions]
  );
  const { minCell, maxCell, font } = compact
    ? COMPACT_SIZE_CONFIG
    : SIZE_CONFIG[size];
  const selectedHand = highlightedHand ?? highlightHand ?? null;
  const isReadOnly = readOnly || readOnlyAlias === true;
  const isInteractive =
    !isReadOnly && (onCellClick !== undefined || onSelectHand !== undefined);

  function selectHand(handCode: string) {
    if (!isInteractive) return;
    onCellClick?.(handCode);
    onSelectHand?.(handCode);
  }

  const missingHandCodes = React.useMemo(
    () => getMissingHandCodes(actionLookup, grid),
    [actionLookup, grid]
  );
  const isProductionEnv =
    import.meta.env.PROD || process.env.NODE_ENV === "production";
  const shouldThrowForMissing =
    strictComplete &&
    missingHandCodes.length > 0 &&
    !isProductionEnv;

  if (shouldThrowForMissing) {
    throw new Error(
      `Missing reviewed strategy cell data: ${missingHandCodes.join(", ")}`
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "mx-auto grid border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_20px_rgba(15,23,42,0.04)]",
          compact
            ? "gap-px rounded-xl p-1"
            : "gap-[2px] rounded-[1rem] p-1 sm:p-1.5"
        )}
        style={{
          gridTemplateColumns: "repeat(13, minmax(0, 1fr))",
          minWidth: minCell * 13,
          maxWidth: maxCell * 13,
          width: "100%",
          boxSizing: "border-box",
        }}
        role="grid"
        aria-label="Preflop range matrix"
      >
        {grid.flat().map(handCode => {
          const cellState = getMatrixCellState(actionLookup, handCode);
          const action =
            cellState.kind === "action" ? cellState.action : undefined;
          const cellDisplay = getMatrixCellDisplay(action, strictComplete);
          const style = cellDisplay.style;
          const isHighlighted = handCode === selectedHand;
          const label = cellDisplay.label;
          const frequency = cellDisplay.frequency;
          const title = cellDisplay.isMissing
            ? strictComplete
              ? `${handCode}: Missing action data (reviewed/source-backed chart should be complete)`
              : `${handCode}: Missing action data`
            : cellDisplay.isUnknownAction
              ? `${handCode}: Unknown action token (${action?.primaryAction ?? "unknown"})`
            : `${handCode}: ${label}${frequency ? ` (${frequency}%)` : ""}`;
          const ariaLabel = cellDisplay.isMissing
            ? `${handCode} missing action`
            : cellDisplay.isUnknownAction
              ? `${handCode} unknown action`
            : `${handCode} ${label}`;

          return (
            <button
              key={handCode}
              type="button"
              role="gridcell"
              aria-label={ariaLabel}
              data-missing={cellDisplay.isMissing ? "true" : "false"}
              aria-selected={isHighlighted}
              tabIndex={isInteractive ? 0 : -1}
              title={title}
              onClick={() => selectHand(handCode)}
              className={cn(
                "relative flex aspect-square min-h-0 items-center justify-center overflow-hidden border border-white font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition duration-150",
                compact ? "rounded-[5px]" : "rounded-md",
                cellDisplay.isMissing &&
                  "border-rose-200 shadow-[inset_0_0_0_1px_rgba(220,38,38,0.12)]",
                cellDisplay.isUnknownAction &&
                  "border-amber-200 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.12)]",
                isInteractive
                  ? "cursor-pointer hover:-translate-y-0.5 hover:brightness-[1.03] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FB923C] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  : "cursor-default",
                isHighlighted &&
                  "z-10 scale-[1.04] border-[#FB923C] shadow-[0_0_0_1px_rgba(251,146,60,0.45),0_10px_18px_rgba(15,23,42,0.12)] ring-2 ring-[#FB923C] ring-offset-2 ring-offset-background"
              )}
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
                fontSize: font,
                lineHeight: 1,
              }}
            >
              {showCellLabels && (
                <span className="select-none">
                  {handCode}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RangeMatrix;
