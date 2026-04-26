import { cn } from "@/lib/utils";
import {
  buildStrategyTheoryResult,
  type StrategyTheoryContext,
} from "@shared/strategyTheory";
import { getSourceStatusBadgeClass } from "@shared/sourceTruth";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface StrategyTheoryNotesProps extends StrategyTheoryContext {
  className?: string;
}

export function StrategyTheoryNotes({
  className,
  ...context
}: StrategyTheoryNotesProps) {
  const { sections, sourceStatus, sourceLabel } =
    buildStrategyTheoryResult(context);
  const [expanded, setExpanded] = useState(false);

  if (!sections.length) return null;

  // On mobile, show only Core Idea + Default by default; expand for the rest
  const visibleSections = expanded ? sections : sections.slice(0, 2);

  return (
    <section
      className={cn(
        "rounded-[1rem] border border-border bg-background/78 p-3 sm:p-4",
        className
      )}
      aria-label="Spot theory notes"
    >
      {/* Header row with source badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Spot Notes
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">
            Core idea, default line, exploit lever, common punt, and drill cue.
          </p>
        </div>
        {sourceStatus && sourceLabel && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              getSourceStatusBadgeClass(sourceStatus)
            )}
            title={
              sourceStatus === "source_backed"
                ? "Backed by the GTO chart PDF — actions are exact."
                : "No exact chart for this spot — guidance is population-derived."
            }
          >
            {sourceLabel}
          </span>
        )}
      </div>

      {/* Notes grid — 1 col on mobile, 2 on desktop */}
      <div className="grid gap-2 sm:grid-cols-2">
        {visibleSections.map(section => (
          <article
            key={section.key}
            className={cn(
              "rounded-xl border border-border/80 bg-card px-3 py-2.5",
              section.accent && "border-primary/25 bg-primary/5"
            )}
          >
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
              {section.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
              {section.body}
            </p>
          </article>
        ))}
      </div>

      {/* Mobile expand/collapse toggle */}
      {sections.length > 2 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-xs text-muted-foreground sm:hidden"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Show {sections.length - 2} more
            </>
          )}
        </button>
      )}
    </section>
  );
}

export default StrategyTheoryNotes;
