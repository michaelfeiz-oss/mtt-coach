import React from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import {
  ACTION_LABELS,
  type Action,
  type RangeChartWithActions,
} from "../../../../shared/strategy";
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
  const revealNote =
    explanation ??
    chartActionNote ??
    `This hand sits inside the ${ACTION_LABELS[correctAction].toLowerCase()} region for this spot.`;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-[1.2rem] border-white/10 bg-zinc-950/90 text-white shadow-xl shadow-black/25",
        className
      )}
    >
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
                  isCorrect
                    ? "bg-green-500/15 text-green-300 shadow-green-950/10"
                    : "bg-red-500/15 text-red-300 shadow-red-950/10"
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
                    isCorrect ? "text-green-300" : "text-red-300"
                  )}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/[0.06] px-2.5 text-zinc-300"
                  >
                    You chose: {ACTION_LABELS[selectedAction]}
                  </Badge>
                  <Badge className="rounded-full bg-orange-500/90 px-2.5 text-white">
                    Correct: {ACTION_LABELS[correctAction]}
                  </Badge>
                </div>
                {revealNote && (
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {revealNote}
                  </p>
                )}
              </div>
            </div>

            <div className="hidden grid-cols-1 gap-2 lg:grid">
              <Button
                className="h-11 rounded-xl bg-orange-500 text-sm font-black text-white shadow-lg shadow-orange-950/15 hover:bg-orange-600"
                onClick={onNext}
              >
                Next Hand
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href={`/strategy/library?chartId=${chartId}`}>
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 rounded-xl border-white/10 bg-white/[0.06] text-sm font-bold text-zinc-200 hover:bg-white/10"
                >
                  View Full Chart
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="min-w-0 space-y-2.5 rounded-[1rem] border border-white/10 bg-white/[0.055] p-2.5 shadow-inner shadow-black/20 sm:p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Chart
                </p>
                <p className="text-sm font-semibold text-zinc-100">
                  {chart?.title ?? "Loading chart"}
                </p>
              </div>
              <ActionLegend
                actions={visibleActions}
                className="rounded-xl border border-white/10 bg-black/20 p-1.5"
              />
            </div>

            {chart && (
              <>
                <div className="lg:hidden">
                  <RangeMatrix
                    actions={actionMap}
                    compact
                    readonly
                    highlightedHand={handCode}
                    size="sm"
                  />
                </div>
                <div className="hidden lg:block">
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
                <Skeleton className="h-6 w-48 bg-white/10" />
                <Skeleton className="h-72 w-full rounded-2xl bg-white/10" />
              </div>
            )}

            {!chart && !isLoadingChart && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-4 text-center text-sm text-zinc-400">
                Chart actions are not available for this reveal.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] lg:hidden">
          <Button
            className="h-11 rounded-xl bg-orange-500 text-sm font-black text-white shadow-lg shadow-orange-950/15 hover:bg-orange-600"
            onClick={onNext}
          >
            Next Hand
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href={`/strategy/library?chartId=${chartId}`}>
            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl border-white/10 bg-white/[0.06] text-sm font-bold text-zinc-200 hover:bg-white/10 sm:w-auto"
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
