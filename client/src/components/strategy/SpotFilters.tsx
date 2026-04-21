import React from "react";
import {
  STACK_DEPTHS,
  SPOT_GROUP_LABELS,
  SPOT_GROUP_SUBTITLES,
  SPOT_GROUPS,
} from "../../../../shared/strategy";
import type { SpotGroup } from "../../../../shared/strategy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const stackButtonClass = (active: boolean) =>
    cn(
      "h-9 rounded-full px-2 text-xs font-semibold shadow-sm transition",
      active
        ? "border-zinc-950 bg-zinc-950 text-white shadow-zinc-950/15 hover:bg-zinc-900"
        : "border-slate-200 bg-white/85 text-slate-700 hover:border-orange-200 hover:bg-orange-50"
    );

  const groupButtonClass = (active: boolean) =>
    cn(
      "h-auto min-h-12 w-full rounded-2xl px-3 py-2.5 text-left shadow-sm transition",
      active
        ? "border-zinc-950 bg-zinc-950 text-white shadow-zinc-950/15 hover:bg-zinc-900"
        : "border-slate-200 bg-white/85 text-slate-800 hover:border-orange-200 hover:bg-orange-50"
    );

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Stack Depth
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          <Button
            size="sm"
            variant={stackDepth === undefined ? "default" : "outline"}
            className={stackButtonClass(stackDepth === undefined)}
            onClick={() => onStackChange(undefined)}
          >
            All
          </Button>
          {STACK_DEPTHS.map(depth => (
            <Button
              key={depth}
              size="sm"
              variant={stackDepth === depth ? "default" : "outline"}
              className={stackButtonClass(stackDepth === depth)}
              onClick={() => onStackChange(depth)}
            >
              {depth}bb
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Spot Type
        </p>
        <div className="space-y-2">
          <Button
            size="sm"
            variant={spotGroup === undefined ? "default" : "outline"}
            className={cn(
              groupButtonClass(spotGroup === undefined),
              "min-h-10 justify-between text-xs"
            )}
            onClick={() => onGroupChange(undefined)}
          >
            <span>All spots</span>
            {totalCount > 0 && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px]">
                {totalCount}
              </span>
            )}
          </Button>
          {SPOT_GROUPS.map(group => (
            <Button
              key={group}
              size="sm"
              variant={spotGroup === group ? "default" : "outline"}
              className={groupButtonClass(spotGroup === group)}
              onClick={() => onGroupChange(group)}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-bold leading-tight">
                  {SPOT_GROUP_LABELS[group]}
                </span>
                <span className="mt-1 text-[11px] font-normal leading-tight opacity-75">
                  {SPOT_GROUP_SUBTITLES[group]}
                </span>
              </span>
              {(groupCounts[group] ?? 0) > 0 && (
                <span className="ml-2 rounded-full bg-white/15 px-2 py-0.5 font-mono text-[11px]">
                  {groupCounts[group]}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpotFilters;
