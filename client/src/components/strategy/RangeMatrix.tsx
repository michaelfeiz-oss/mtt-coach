import React from "react";
import { generateHandGrid } from "../../../../shared/strategy";
import type { Action, HandAction } from "../../../../shared/strategy";
import { cn } from "@/lib/utils";
import { ACTION_CELL_STYLES } from "./actionStyles";

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
  showCellLabels?: boolean;
  size?: MatrixSize;
  className?: string;
}

const SIZE_CONFIG: Record<
  MatrixSize,
  { minCell: number; maxCell: number; font: number }
> = {
  sm: { minCell: 20, maxCell: 26, font: 9 },
  md: { minCell: 22, maxCell: 38, font: 10 },
  lg: { minCell: 28, maxCell: 48, font: 12 },
};

const COMPACT_SIZE_CONFIG = { minCell: 18, maxCell: 29, font: 9 };

const DEFAULT_ACTION: Action = "FOLD";

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

function getActionLabel(action: HandAction | undefined): string {
  return ACTION_CELL_STYLES[action?.primaryAction ?? DEFAULT_ACTION].label;
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

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "mx-auto grid rounded-lg bg-border/80 shadow-sm",
          compact ? "gap-px p-0.5" : "gap-[2px] p-1"
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
          const action = getActionForHand(actionLookup, handCode);
          const actionName = action?.primaryAction ?? DEFAULT_ACTION;
          const style = ACTION_CELL_STYLES[actionName];
          const isHighlighted = handCode === selectedHand;
          const label = getActionLabel(action);
          const frequency = action?.weightPercent;
          const title = `${handCode}: ${label}${frequency ? ` (${frequency}%)` : ""}`;

          return (
            <button
              key={handCode}
              type="button"
              role="gridcell"
              aria-label={`${handCode} ${label}`}
              aria-selected={isHighlighted}
              tabIndex={isInteractive ? 0 : -1}
              title={title}
              onClick={() => selectHand(handCode)}
              className={cn(
                "relative flex aspect-square min-h-0 items-center justify-center overflow-hidden border border-black/10 font-semibold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] transition",
                compact ? "rounded-[3px]" : "rounded-[4px]",
                isInteractive
                  ? "cursor-pointer active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                  : "cursor-default",
                isHighlighted &&
                  "z-10 scale-[1.08] border-white/80 shadow-[0_0_0_2px_rgba(249,115,22,0.95),0_0_18px_rgba(249,115,22,0.55),inset_0_0_0_1px_rgba(255,255,255,0.28)] ring-2 ring-orange-500 ring-offset-2 ring-offset-background"
              )}
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color,
                fontSize: font,
                lineHeight: 1,
              }}
            >
              {showCellLabels && (
                <span className="select-none drop-shadow-sm">{handCode}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RangeMatrix;
