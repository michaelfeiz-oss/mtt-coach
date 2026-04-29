import { Link } from "wouter";
import type { ResolvedPriorityDrillPack } from "@shared/drillPacks";
import type { TrainerSpotInsight as TrainerSpotInsightModel } from "@shared/trainerInsight";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrainerSpotInsightProps {
  insight: TrainerSpotInsightModel;
  recommendedPack?: ResolvedPriorityDrillPack | null;
  className?: string;
}

export function TrainerSpotInsight({
  insight,
  recommendedPack,
  className,
}: TrainerSpotInsightProps) {
  const hasMoreDetail = Boolean(
    insight.exploitAdjustment || insight.commonMistake || recommendedPack
  );

  return (
    <section
      className={cn(
        "space-y-3 rounded-[1rem] border border-border bg-background/78 p-3",
        className
      )}
      aria-label="Spot insight"
    >
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground">
          Spot Insight
        </p>
        <p className="text-base font-semibold text-foreground">
          {insight.resultLine}
        </p>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border border-border/80 bg-card px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
            Why
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
            {insight.why}
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
            Rule
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {insight.rule}
          </p>
        </div>
      </div>

      {hasMoreDetail && (
        <Accordion type="single" collapsible className="rounded-xl border border-border/80 bg-card">
          <AccordionItem value="spot-insight-more" className="border-none">
            <AccordionTrigger className="px-3 py-2.5 text-sm font-semibold text-foreground hover:no-underline">
              Show more
            </AccordionTrigger>
            <AccordionContent className="space-y-2 px-3 pb-3">
              {insight.exploitAdjustment && (
                <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                    Exploit adjustment
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
                    {insight.exploitAdjustment}
                  </p>
                </div>
              )}

              {insight.commonMistake && (
                <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                    Common mistake
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">
                    {insight.commonMistake}
                  </p>
                </div>
              )}

              {recommendedPack?.supported && (
                <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                      Suggested drill
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {recommendedPack.title}
                    </p>
                  </div>
                  <Link href={`/strategy/trainer?packId=${recommendedPack.id}`}>
                    <Button
                      variant="outline"
                      className="h-9 rounded-xl px-3 text-sm font-semibold"
                    >
                      Start
                    </Button>
                  </Link>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </section>
  );
}

export default TrainerSpotInsight;
