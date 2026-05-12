import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  buildStrategyTheoryResult,
  type StrategyTheoryContext,
} from "@shared/strategyTheory";
import {
  getStrategySourceHelperText,
  getStrategySourceStatus,
} from "@shared/sourceTruth";

function limitToTwoSentences(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized.match(/[^.!?]+[.!?]?/g);
  if (!sentences) return normalized;
  return sentences
    .slice(0, 2)
    .map(sentence => sentence.trim())
    .join(" ");
}

function firstSentence(text: string) {
  return limitToTwoSentences(text).match(/[^.!?]+[.!?]?/)?.[0]?.trim() ?? text;
}

interface StrategyTheoryNotesProps extends StrategyTheoryContext {
  className?: string;
}

export function StrategyTheoryNotes({
  className,
  ...context
}: StrategyTheoryNotesProps) {
  const result = buildStrategyTheoryResult(context);
  const sourceStatus = getStrategySourceStatus(context);
  const helper = getStrategySourceHelperText(context);

  if (sourceStatus === "unsupported") {
    return (
      <section
        className={cn(
          "rounded-[1rem] border border-amber-200 bg-amber-50 p-3 sm:p-4",
          className
        )}
        aria-label="Spot notes"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-semibold text-amber-900">Spot Notes</p>
          <Badge className="rounded-full border-amber-300 bg-white text-amber-900">
            Unsupported
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">
          Source unavailable. Do not train this spot until reviewed.
        </p>
      </section>
    );
  }

  if (result.sections.length === 0) return null;

  const defaultSection =
    result.sections.find(section => section.key === "defaultLine") ??
    result.sections[0];
  const advancedSections = result.sections.filter(
    section => section.key !== "defaultLine"
  );

  return (
    <section
      className={cn(
        "rounded-[1rem] border border-border bg-background/78 p-3 sm:p-4",
        className
      )}
      aria-label="Spot notes"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Spot Notes
        </p>
        {sourceStatus !== "source_backed" && (
          <Badge className="rounded-full border-amber-200 bg-amber-50 text-amber-900">
            {sourceStatus === "simplified_population"
              ? "Simplified Population - study only"
              : "Proxy - study only"}
          </Badge>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-border/80 bg-card px-3 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
          Default
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
          {firstSentence(defaultSection.body)}
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="mt-3 rounded-xl border border-border/80 bg-card"
      >
        <AccordionItem value="spot-notes-more" className="border-none">
          <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold text-foreground hover:no-underline">
            Show notes
          </AccordionTrigger>
          <AccordionContent className="space-y-2 px-3 pb-3">
            {helper && sourceStatus !== "source_backed" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-sm leading-relaxed text-amber-900">
                  {helper}
                </p>
              </div>
            )}

            {result.sections.map(section => (
              <article
                key={section.key}
                className={cn(
                  "rounded-xl border border-border/80 bg-background px-3 py-2.5",
                  section.accent && "border-primary/20 bg-primary/5"
                )}
              >
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                  {section.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
                  {limitToTwoSentences(section.body)}
                </p>
              </article>
            ))}

            {advancedSections.length === 0 && helper && sourceStatus === "source_backed" && (
              <p className="text-sm text-muted-foreground">{helper}</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

export default StrategyTheoryNotes;
