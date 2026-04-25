import React from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import {
  ACTION_LABELS,
  type Action,
  type RangeChartWithActions,
} from "../../../../shared/strategy";
import { buildHandClassRevealNote } from "../../../../shared/preflop";
import type { ResolvedPriorityDrillPack } from "../../../../shared/drillPacks";
import type { LeakFamilyDefinition } from "../../../../shared/leakFamilies";
import type { StudySpotNote } from "../../../../shared/spotNotes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ActionLegend } from "./ActionLegend";
import { RangeMatrix } from "./RangeMatrix";
import { buildActionMap } from "./utils";

interface TrainerResultRevealProps {
  chart?: RangeChartWithActions;
  isLoadingChart?: boolean;
  chartId: number;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  explanation?: string | null;
  spotNote?: StudySpotNote | null;
  leakHint?: LeakFamilyDefinition | null;
  recommendedPack?: ResolvedPriorityDrillPack | null;
  onNext: () => void;
  className?: string;
}

export function TrainerResultReveal({
  chart,
  isLoadingChart = false,
  chartId,
  handCode,
  selectedAction,
  correctAction,
  isCorrect,
  explanation,
  spotNote,
  leakHint,
  recommendedPack,
  onNext,
  className = "",
}: TrainerResultRevealProps) {
  const actionMap = React.useMemo(
    () => (chart ? buildActionMap(chart.actions) : {}),
    [chart]
  );
  const visibleActions = React.useMemo(
    () =>
      chart
        ? (Array.from(
            new Set(chart.actions.map(action => action.primaryAction))
          ) as Action[])
        : undefined,
    [chart]
  );
  const chartActionNote = chart?.actions.find(
    action => action.handCode === handCode
  )?.note;
  const revealNote = buildHandClassRevealNote(
    handCode,
    correctAction,
    explanation ?? chartActionNote
  );

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[1.2rem] border border-border bg-card text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.14)]",
        className
      )}
    >
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-accent/70 p-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
              isCorrect
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-base font-bold",
                isCorrect ? "text-emerald-700" : "text-red-700"
              )}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full border-border bg-accent px-2.5 text-secondary-foreground"
              >
                You chose: {ACTION_LABELS[selectedAction]}
              </Badge>
              <Badge className="rounded-full bg-primary/90 px-2.5 text-primary-foreground">
                Correct: {ACTION_LABELS[correctAction]}
              </Badge>
            </div>
            {revealNote && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {revealNote}
              </p>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-2.5 rounded-[1rem] border border-border bg-accent/70 p-2.5 sm:p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Chart
              </p>
              <p className="text-sm font-semibold text-foreground">
                {chart?.title ?? "Loading chart"}
              </p>
            </div>
            <ActionLegend
              actions={visibleActions}
              className="rounded-xl border border-border/80 bg-accent/45 p-1.5"
            />
          </div>

          {chart && (
            <>
              <div className="md:hidden">
                <RangeMatrix
                  actions={actionMap}
                  compact
                  readonly
                  highlightedHand={handCode}
                  size="sm"
                />
              </div>
              <div className="hidden md:block">
                <RangeMatrix
                  actions={actionMap}
                  readonly
                  highlightedHand={handCode}
                  size="lg"
                />
              </div>
            </>
          )}

          {!chart && isLoadingChart && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          )}

          {!chart && !isLoadingChart && (
            <div className="rounded-2xl border border-dashed border-border/75 bg-accent/40 p-4 text-center text-sm text-muted-foreground">
              Chart actions are not available for this reveal.
            </div>
          )}
        </div>

        {(spotNote || leakHint || recommendedPack) && (
          <div className="space-y-2 rounded-[1rem] border border-border bg-background/78 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {leakHint && (
                <Badge variant="outline" className="rounded-full">
                  Likely leak: {leakHint.label}
                </Badge>
              )}
              {recommendedPack && (
                <Badge variant="outline" className="rounded-full">
                  Suggested pack: {recommendedPack.title}
                </Badge>
              )}
            </div>

            {spotNote && (
              <div className="grid gap-2 md:grid-cols-2">
                {(
                  [
                  ["Core Idea", spotNote.coreIdea],
                  ["Default", spotNote.defaultLine],
                  ["Exploit Lever", spotNote.exploitLever],
                  ["Common Punt", spotNote.commonPunt],
                  ["Drill Cue", spotNote.drillCue],
                  spotNote.stageAdjustment
                    ? ["Stage Adjustment", spotNote.stageAdjustment]
                    : null,
                ] as Array<[string, string] | null>
                )
                  .filter((section): section is [string, string] => Boolean(section))
                  .map(([title, body]) => (
                    <div
                      key={title as string}
                      className="rounded-xl border border-border bg-card px-3 py-2.5"
                    >
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {title as string}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                        {body as string}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {recommendedPack && (
              <Link href={`/strategy/trainer?packId=${recommendedPack.id}`}>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl text-sm font-semibold"
                >
                  Drill Recommended Pack
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Button
            className="h-11 rounded-xl text-sm font-semibold"
            onClick={onNext}
          >
            Next Hand
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href={`/strategy/library?chartId=${chartId}`}>
            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl text-sm font-semibold sm:w-auto"
            >
              View Full Chart
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainerResultReveal;
