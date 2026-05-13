import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StrategySourcePanelNoteProps {
  sourceStatus?: string | null;
  sourcePanelLabel: string | null;
  sourcePanelGroup?: string | null;
  sourceCoverageNote?: string | null;
  groupedSourcePanel?: boolean;
  provenanceLabel?: string | null;
  provenanceNote?: string | null;
  className?: string;
  compact?: boolean;
}

export function StrategySourcePanelNote({
  sourceStatus,
  sourcePanelLabel,
  sourcePanelGroup,
  sourceCoverageNote,
  groupedSourcePanel = false,
  provenanceLabel,
  provenanceNote,
  className,
  compact = false,
}: StrategySourcePanelNoteProps) {
  if (!sourcePanelLabel && !provenanceLabel) return null;

  const toneLabel = groupedSourcePanel
    ? sourceStatus === "source_backed"
      ? "Source-backed grouped panel"
      : "Grouped source panel mapping"
    : sourceStatus === "source_backed"
      ? "Source-backed panel"
      : "Source panel mapping";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card px-3 py-2.5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {provenanceLabel && (
          <Badge className="rounded-full border-amber-200 bg-[#FFF7E6] text-[10.5px] font-semibold text-[#9A4D12]">
            {provenanceLabel}
          </Badge>
        )}
        {sourcePanelLabel && (
          <>
            <Badge
              variant="outline"
              className="rounded-full border-[var(--border-strong)] bg-background text-[10.5px] font-semibold text-secondary-foreground"
            >
              {toneLabel}
            </Badge>
            <p className="text-[11px] font-medium text-secondary-foreground">
              {`Source panel: ${sourcePanelLabel}`}
            </p>
          </>
        )}
      </div>
      {(!compact ||
        groupedSourcePanel ||
        sourceCoverageNote ||
        provenanceNote) && (
        <div className="mt-1.5 space-y-1">
          {provenanceNote && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {provenanceNote}
            </p>
          )}
          {groupedSourcePanel && sourcePanelGroup && (
            <p className="text-[11px] font-medium text-secondary-foreground">
              Grouped source panel: {sourcePanelGroup}
            </p>
          )}
          {sourceCoverageNote && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {sourceCoverageNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default StrategySourcePanelNote;
