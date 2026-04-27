import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const primarySections = sections.slice(0, 2);
  const secondarySections = sections.slice(2);

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
          Spot-specific coaching for this exact node.
        </p>
      </div>

      <div className="grid gap-2 md:hidden">
        {primarySections.map(section => (
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

        {secondarySections.length > 0 && (
          <Accordion type="single" collapsible className="rounded-xl border border-border/80 bg-card">
            <AccordionItem value="more-coaching" className="border-none">
              <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold text-foreground hover:no-underline">
                More coaching
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <div className="grid gap-2">
                  {secondarySections.map(section => (
                    <article
                      key={section.key}
                      className={cn(
                        "rounded-xl border border-border/80 bg-background px-3 py-2.5",
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>

      <div className="hidden gap-2 md:grid md:grid-cols-2">
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
