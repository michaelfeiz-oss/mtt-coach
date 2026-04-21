import React from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { ACTION_LABELS, type Action, type RangeChartWithActions } from "../../../../shared/strategy";
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
        "border-orange-200 bg-white/95 shadow-lg shadow-orange-950/5",
        className
      )}
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              isCorrect
                ? "bg-green-100 text-green-700"
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
                isCorrect ? "text-green-700" : "text-red-700"
              )}
            >
              {isCorrect ? "Correct" : "Incorrect"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={isCorrect ? "secondary" : "outline"}>
                You chose: {ACTION_LABELS[selectedAction]}
              </Badge>
              <Badge className="bg-zinc-950 text-white">
                Correct: {ACTION_LABELS[correctAction]}
              </Badge>
            </div>
            {revealNote && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {revealNote}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border bg-slate-50/80 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Chart Context
              </p>
              <p className="text-sm font-semibold text-foreground">
                {chart?.title ?? "Loading chart"}
              </p>
            </div>
            <ActionLegend
              actions={visibleActions}
              className="rounded-md bg-white/80 px-2 py-1"
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
              <Skeleton className="h-72 w-full rounded-lg" />
            </div>
          )}

          {!chart && !isLoadingChart && (
            <div className="rounded-lg border border-dashed bg-white p-4 text-center text-sm text-muted-foreground">
              Chart actions are not available for this reveal.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <Button
            className="h-12 bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"
            onClick={onNext}
          >
            Next Hand
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href={`/strategy/library?chartId=${chartId}`}>
            <Button variant="outline" className="h-12 w-full gap-2 sm:w-auto">
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
