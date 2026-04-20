/**
 * client/src/components/strategy/ActionLegend.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Colour legend for the range matrix actions.
 *
 * CODEX TASK: Implement the component body.
 *
 * Props:
 *   actions   – Array of actions to show (default: all actions)
 *   layout    – "horizontal" | "vertical" (default: "horizontal")
 *   className – Optional CSS class
 *
 * Renders a row/column of colour swatches with action labels.
 * Use ACTION_COLORS and ACTION_LABELS from shared/strategy.
 */

import React from "react";
import { ACTION_COLORS, ACTION_LABELS, ACTIONS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";

interface ActionLegendProps {
  actions?: Action[];
  layout?: "horizontal" | "vertical";
  className?: string;
}

export function ActionLegend({
  actions = [...ACTIONS],
  layout = "horizontal",
  className = "",
}: ActionLegendProps) {
  // TODO: Implement with proper styling
  return (
    <div
      className={`flex gap-2 flex-wrap ${layout === "vertical" ? "flex-col" : "flex-row"} ${className}`}
    >
      {actions.map((action) => (
        <div key={action} className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-sm flex-shrink-0"
            style={{ backgroundColor: ACTION_COLORS[action] }}
          />
          <span className="text-xs text-muted-foreground font-medium">
            {ACTION_LABELS[action]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ActionLegend;
