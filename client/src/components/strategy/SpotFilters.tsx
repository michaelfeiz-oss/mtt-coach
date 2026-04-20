/**
 * client/src/components/strategy/SpotFilters.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Filter bar for the strategy library page.
 * Allows filtering by stack depth and spot group.
 *
 * CODEX TASK: Implement the component body.
 *
 * Props:
 *   stackDepth      – Currently selected stack depth (or undefined = all)
 *   spotGroup       – Currently selected spot group (or undefined = all)
 *   onStackChange   – Callback when stack depth changes
 *   onGroupChange   – Callback when spot group changes
 *   className       – Optional CSS class
 *
 * UI:
 *   - Stack depth: pill buttons for each value in STACK_DEPTHS
 *   - Spot group: pill buttons for each value in SPOT_GROUP_LABELS
 *   - Active selection highlighted in orange (brand colour)
 *   - "All" option to clear filter
 */

import React from "react";
import { STACK_DEPTHS, SPOT_GROUP_LABELS, SPOT_GROUPS } from "../../../../shared/strategy";
import type { SpotGroup } from "../../../../shared/strategy";
import { Button } from "@/components/ui/button";

interface SpotFiltersProps {
  stackDepth?: number;
  spotGroup?: SpotGroup;
  onStackChange: (depth: number | undefined) => void;
  onGroupChange: (group: SpotGroup | undefined) => void;
  className?: string;
}

export function SpotFilters({
  stackDepth,
  spotGroup,
  onStackChange,
  onGroupChange,
  className = "",
}: SpotFiltersProps) {
  // TODO: Implement with proper pill button styling
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Stack depth filter */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Stack Depth</p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={stackDepth === undefined ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => onStackChange(undefined)}
          >
            All
          </Button>
          {STACK_DEPTHS.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={stackDepth === d ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => onStackChange(d)}
            >
              {d}bb
            </Button>
          ))}
        </div>
      </div>

      {/* Spot group filter */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Spot Type</p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={spotGroup === undefined ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => onGroupChange(undefined)}
          >
            All
          </Button>
          {SPOT_GROUPS.map((g) => (
            <Button
              key={g}
              size="sm"
              variant={spotGroup === g ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => onGroupChange(g)}
            >
              {SPOT_GROUP_LABELS[g]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpotFilters;
