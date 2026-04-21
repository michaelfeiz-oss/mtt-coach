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
        "overflow-hidden rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/10",
        className
      )}
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3 rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4">
          <div
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
              isCorrect
                ? "bg-green-100 text-green-700 shadow-green-950/10"
                : "bg-red-100 text-red-700 shadow-red-950/10"
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
                isCorrect ? "text-green-700" : "text-red-700"
              )}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant={isCorrect ? "secondary" : "outline"}
                className="rounded-full px-2.5"
              >
                You chose: {ACTION_LABELS[selectedAction]}
              </Badge>
              <Badge className="rounded-full bg-zinc-950 px-2.5 text-white">
                Correct: {ACTION_LABELS[correctAction]}
              </Badge>
            </div>
            {revealNote && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {revealNote}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-3 shadow-inner shadow-slate-950/5 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Chart Context
              </p>
              <p className="text-sm font-semibold text-foreground">
                {chart?.title ?? "Loading chart"}
              </p>
            </div>
            <ActionLegend
              actions={visibleActions}
              className="rounded-2xl bg-slate-50/80 p-2"
            />
          </div>

          {chart && (
            <RangeMatrix
              actions={actionMap}
              compact
              readonly
              highlightedHand={handCode}
              size="sm"
            />
          )}

          {!chart && isLoadingChart && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          )}

          {!chart && !isLoadingChart && (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-center text-sm text-muted-foreground">
              Chart actions are not available for this reveal.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Button
            className="h-12 rounded-2xl bg-orange-500 text-base font-bold text-white shadow-lg shadow-orange-950/15 hover:bg-orange-600"
            onClick={onNext}
          >
            Next Hand
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href={`/strategy/library?chartId=${chartId}`}>
            <Button
              variant="outline"
              className="h-12 w-full gap-2 rounded-2xl border-slate-200 bg-white font-semibold sm:w-auto"
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
