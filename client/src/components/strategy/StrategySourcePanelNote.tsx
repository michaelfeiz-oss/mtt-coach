import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StrategySourcePanelNoteProps {
  sourcePanelLabel: string | null;
  sourcePanelGroup?: string | null;
  sourceCoverageNote?: string | null;
  groupedSourcePanel?: boolean;
  className?: string;
  compact?: boolean;
}

export function StrategySourcePanelNote({
  sourcePanelLabel,
  sourcePanelGroup,
  sourceCoverageNote,
  groupedSourcePanel = false,
  className,
  compact = false,
}: StrategySourcePanelNoteProps) {
  if (!sourcePanelLabel) return null;

  const toneLabel = groupedSourcePanel
    ? "Source-backed grouped panel"
    : "Source panel mapping";
  const prefix = `Source panel: ${sourcePanelLabel}`;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card px-3 py-2.5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="rounded-full border-[var(--border-strong)] bg-background text-[10.5px] font-semibold text-secondary-foreground"
        >
          {toneLabel}
        </Badge>
        <p className="text-[11px] font-medium text-secondary-foreground">
          {prefix}
        </p>
      </div>
      {!compact && sourceCoverageNote && (
        <div className="mt-1.5 space-y-1">
          {groupedSourcePanel && sourcePanelGroup && (
            <p className="text-[11px] font-medium text-secondary-foreground">
              Grouped source panel: {sourcePanelGroup}
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {sourceCoverageNote}
          </p>
        </div>
      )}
    </div>
  );
}

export default StrategySourcePanelNote;
