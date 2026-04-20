/**
 * client/src/components/strategy/RangeMatrix.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 13×13 poker hand grid that renders action colours for each hand cell.
 *
 * CODEX TASK: Implement the component body.
 *
 * Props:
 *   actions       – Map of handCode → HandAction (from RangeChartWithActions.actions)
 *   highlightHand – Optional hand to highlight (used by trainer)
 *   onCellClick   – Optional callback when a cell is clicked (used by trainer)
 *   readOnly      – If true, disable hover/click interactions (default: false)
 *   size          – "sm" | "md" | "lg" (default: "md")
 *
 * Layout:
 *   - 13 columns × 13 rows grid
 *   - Top-left = AA (pair), diagonal = pairs, above diagonal = suited, below = offsuit
 *   - Each cell shows the hand code (e.g. "AKs") and is coloured by primaryAction
 *   - Use ACTION_COLORS from shared/strategy for fill colours
 *   - Mixed hands (mixJson) show a split diagonal fill
 *   - Hovering a cell shows a tooltip with action + weightPercent
 *
 * Sizing guide:
 *   sm: cell = 22px, font = 8px   (for compact sidebar previews)
 *   md: cell = 36px, font = 10px  (default study view)
 *   lg: cell = 48px, font = 12px  (full-screen trainer)
 *
 * Accessibility:
 *   - Each cell should have aria-label="[handCode] [action]"
 *   - Keyboard navigation: arrow keys to move, Enter to select
 */

import React from "react";
import { RANKS, ACTION_COLORS, generateHandGrid } from "../../../../shared/strategy";
import type { HandAction } from "../../../../shared/strategy";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatrixSize = "sm" | "md" | "lg";

interface RangeMatrixProps {
  /** Map of handCode → HandAction */
  actions: Record<string, HandAction>;
  /** Hand to highlight (e.g. current trainer question) */
  highlightHand?: string;
  /** Called when user clicks a cell */
  onCellClick?: (handCode: string) => void;
  /** Disable interactions */
  readOnly?: boolean;
  /** Grid size variant */
  size?: MatrixSize;
  /** Optional CSS class */
  className?: string;
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG: Record<MatrixSize, { cell: number; font: number }> = {
  sm: { cell: 22, font: 8 },
  md: { cell: 36, font: 10 },
  lg: { cell: 48, font: 12 },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CODEX TASK: Implement this component.
 *
 * Steps:
 * 1. Call generateHandGrid() to get the 13×13 grid of hand codes.
 * 2. For each cell, look up the action in the `actions` prop.
 * 3. Render a coloured cell using ACTION_COLORS[action.primaryAction].
 * 4. If no action found, render as FOLD (dark background).
 * 5. Handle mixJson: parse and render split diagonal fill.
 * 6. Handle highlightHand: add a bright border/ring to that cell.
 * 7. Handle onCellClick: call with handCode on click (if !readOnly).
 * 8. Render a tooltip on hover showing action name + frequency.
 */
export function RangeMatrix({
  actions,
  highlightHand,
  onCellClick,
  readOnly = false,
  size = "md",
  className = "",
}: RangeMatrixProps) {
  const grid = generateHandGrid();
  const { cell, font } = SIZE_CONFIG[size];

  // TODO: Implement full rendering with colours, tooltips, mixed fills
  // Placeholder: renders grey grid with hand codes
  return (
    <div
      className={`inline-block ${className}`}
      style={{ lineHeight: 0 }}
      role="grid"
      aria-label="Range matrix"
    >
      {grid.map((row, ri) => (
        <div key={ri} style={{ display: "flex" }}>
          {row.map((handCode, ci) => {
            const action = actions[handCode];
            const bg = action ? ACTION_COLORS[action.primaryAction] : ACTION_COLORS.FOLD;
            const isHighlighted = handCode === highlightHand;

            return (
              <div
                key={ci}
                role="gridcell"
                aria-label={`${handCode}${action ? ` ${action.primaryAction}` : " FOLD"}`}
                onClick={() => !readOnly && onCellClick?.(handCode)}
                style={{
                  width: cell,
                  height: cell,
                  backgroundColor: bg,
                  border: isHighlighted ? "2px solid #fff" : "1px solid rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: readOnly ? "default" : "pointer",
                  boxSizing: "border-box",
                  outline: isHighlighted ? "2px solid #f97316" : undefined,
                }}
                title={action ? `${handCode}: ${action.primaryAction}${action.weightPercent ? ` (${action.weightPercent}%)` : ""}` : `${handCode}: FOLD`}
              >
                <span
                  style={{
                    fontSize: font,
                    color: "#fff",
                    fontWeight: 600,
                    userSelect: "none",
                    textShadow: "0 1px 2px rgba(0,0,0,0.6)",
                  }}
                >
                  {handCode}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default RangeMatrix;
