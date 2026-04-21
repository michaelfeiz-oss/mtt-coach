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
import {
  STACK_DEPTHS,
  SPOT_GROUP_LABELS,
  SPOT_GROUP_SUBTITLES,
  SPOT_GROUPS,
} from "../../../../shared/strategy";
import type { SpotGroup } from "../../../../shared/strategy";
import { Button } from "@/components/ui/button";

interface SpotFiltersProps {
  stackDepth?: number;
  spotGroup?: SpotGroup;
  onStackChange: (depth: number | undefined) => void;
  onGroupChange: (group: SpotGroup | undefined) => void;
  groupCounts?: Partial<Record<SpotGroup, number>>;
  className?: string;
}

export function SpotFilters({
  stackDepth,
  spotGroup,
  onStackChange,
  onGroupChange,
  groupCounts = {},
  className = "",
}: SpotFiltersProps) {
  const totalCount = SPOT_GROUPS.reduce(
    (sum, group) => sum + (groupCounts[group] ?? 0),
    0
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stack depth filter */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
          Stack Depth
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          <Button
            size="sm"
            variant={stackDepth === undefined ? "default" : "outline"}
            className="h-9 px-2 text-xs"
            onClick={() => onStackChange(undefined)}
          >
            All
          </Button>
          {STACK_DEPTHS.map(d => (
            <Button
              key={d}
              size="sm"
              variant={stackDepth === d ? "default" : "outline"}
              className="h-9 px-2 text-xs"
              onClick={() => onStackChange(d)}
            >
              {d}bb
            </Button>
          ))}
        </div>
      </div>

      {/* Spot group filter */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
          Spot Type
        </p>
        <div className="space-y-1.5">
          <Button
            size="sm"
            variant={spotGroup === undefined ? "default" : "outline"}
            className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left text-xs"
            onClick={() => onGroupChange(undefined)}
          >
            <span>All spots</span>
            {totalCount > 0 && <span className="font-mono">{totalCount}</span>}
          </Button>
          {SPOT_GROUPS.map(g => (
            <Button
              key={g}
              size="sm"
              variant={spotGroup === g ? "default" : "outline"}
              className="h-auto min-h-12 w-full justify-start px-3 py-2 text-left"
              onClick={() => onGroupChange(g)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-semibold leading-tight">
                  {SPOT_GROUP_LABELS[g]}
                </span>
                <span className="mt-0.5 text-[11px] font-normal leading-tight opacity-75">
                  {SPOT_GROUP_SUBTITLES[g]}
                </span>
              </span>
              {(groupCounts[g] ?? 0) > 0 && (
                <span className="ml-2 font-mono text-xs">{groupCounts[g]}</span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpotFilters;
