import { cn } from "@/lib/utils";
import {
  buildStrategyTheorySections,
  type StrategyTheoryContext,
} from "@shared/strategyTheory";

interface StrategyTheoryNotesProps extends StrategyTheoryContext {
  className?: string;
}

export function StrategyTheoryNotes({
  className,
  ...context
}: StrategyTheoryNotesProps) {
  const sections = buildStrategyTheorySections(context);

  return (
    <section
      className={cn(
        "rounded-[1rem] border border-border bg-background/78 p-3 sm:p-4",
        className
      )}
      aria-label="Spot theory notes"
    >
      <div className="mb-3">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Spot Notes
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Core idea, default, exploit lever, the common punt, and the exact drill cue for this node.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {sections.map(section => (
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
    </section>
  );
}

export default StrategyTheoryNotes;
