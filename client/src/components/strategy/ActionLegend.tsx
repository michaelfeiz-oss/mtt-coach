import React from "react";
import type { Action } from "../../../../shared/strategy";
import { cn } from "@/lib/utils";
import { ACTION_CELL_STYLES, STRATEGY_ACTION_ORDER } from "./actionStyles";

interface ActionLegendProps {
  actions?: Action[];
  layout?: "horizontal" | "vertical";
  className?: string;
}

function getVisibleActions(actions: Action[] | undefined): Action[] {
  const requested = actions ?? STRATEGY_ACTION_ORDER;
  const visible = new Set(requested);
  return STRATEGY_ACTION_ORDER.filter(action => visible.has(action));
}

export function ActionLegend({
  actions,
  layout = "horizontal",
  className = "",
}: ActionLegendProps) {
  const visibleActions = getVisibleActions(actions);

  return (
    <div
      className={cn(
        "flex gap-x-1.5 gap-y-1.5 text-[11px] text-muted-foreground",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
      aria-label="Range action legend"
    >
      {visibleActions.map(action => {
        const style = ACTION_CELL_STYLES[action];

        return (
          <div
            key={action}
            className="flex min-h-6 items-center gap-1.5 rounded-full border border-border/80 bg-background/85 px-2 py-0.5"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-slate-200/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: style.backgroundColor }}
              aria-hidden="true"
            />
            <span className="font-semibold leading-none text-secondary-foreground">
              {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ActionLegend;
