import React from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import {
  ACTION_LABELS,
  type Action,
  type RangeChartWithActions,
} from "../../../../shared/strategy";
import {
  TRAINER_ATTEMPT_CONFIDENCES,
  type TrainerAttemptConfidence,
} from "../../../../shared/coachingLoop";
import { getStrategyChartTrustMetadata } from "../../../../shared/sourceTruth";
import type { StrategyChartPresentation } from "@shared/strategyPresentation";
import type { ChartLikeSpotContext } from "../../../../shared/spotIds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ActionLegend } from "./ActionLegend";
import { RangeMatrix } from "./RangeMatrix";
import { StrategySourcePanelNote } from "./StrategySourcePanelNote";
import { buildActionMap } from "./utils";

interface TrainerResultRevealProps {
  chart?: RangeChartWithActions;
  contextChart: ChartLikeSpotContext;
  isLoadingChart?: boolean;
  chartId: number;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  chartPresentation?: StrategyChartPresentation | null;
  confidence?: TrainerAttemptConfidence | null;
  onConfidenceSelect?: (confidence: TrainerAttemptConfidence) => void;
  isSavingConfidence?: boolean;
  onNext: () => void;
  className?: string;
}

export function TrainerResultReveal({
  chart,
  contextChart,
  isLoadingChart = false,
  chartId,
  handCode,
  selectedAction,
  correctAction,
  isCorrect,
  chartPresentation,
  confidence = null,
  onConfidenceSelect,
  isSavingConfidence = false,
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
  const sourcePanelTrust = React.useMemo(
    () => getStrategyChartTrustMetadata(chart ?? contextChart),
    [chart, contextChart]
  );

  return (
    <Card
      className={cn(
        "rounded-[1.2rem] border border-border bg-card text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.14)]",
        className
      )}
    >
      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-3">
          <div
            className={cn(
              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm",
              isCorrect
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
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
                className="rounded-full border-[var(--border-strong)] bg-card px-2.5 text-secondary-foreground"
              >
                You chose: {ACTION_LABELS[selectedAction]}
              </Badge>
              <Badge className="rounded-full bg-primary px-2.5 text-primary-foreground">
                Correct: {ACTION_LABELS[correctAction]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-[1rem] border border-border bg-secondary p-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            How sure were you?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TRAINER_ATTEMPT_CONFIDENCES.map(option => {
              const isActive = confidence === option;
              const label =
                option === "knew_it"
                  ? "Knew it"
                  : option === "unsure"
                    ? "Unsure"
                    : "Guessed";

              return (
                <Button
                  key={option}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs font-semibold",
                    !isActive &&
                      "border-[var(--border-strong)] bg-card text-secondary-foreground hover:bg-slate-100"
                  )}
                  disabled={!onConfidenceSelect || isSavingConfidence}
                  onClick={() => onConfidenceSelect?.(option)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 space-y-2.5 rounded-[1rem] border border-border bg-secondary p-2.5 sm:p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Chart
              </p>
              <p className="text-sm font-semibold text-foreground">
                {chartPresentation?.title ?? chart?.title ?? "Loading chart"}
              </p>
              {chartPresentation?.sourceStatus !== "source_backed" &&
                chartPresentation?.sourceHelper && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {chartPresentation.sourceHelper}
                </p>
                )}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-1.5">
                {chartPresentation?.sourceStatus !== "source_backed" &&
                  chartPresentation?.sourceBadge && (
                    <Badge
                      className={cn(
                        "rounded-full",
                        chartPresentation.sourceStatus === "proxy"
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-amber-200 bg-[#FFF7E6] text-[#9A4D12]"
                      )}
                    >
                      {chartPresentation.sourceBadge}
                    </Badge>
                  )}
                {chartPresentation?.sharedFamilyLabel && (
                  <Badge variant="outline" className="rounded-full">
                    {chartPresentation.sharedFamilyLabel}
                  </Badge>
                )}
              </div>
              <ActionLegend
                actions={visibleActions}
                className="rounded-xl border border-border bg-card p-1.5"
              />
              </div>
            </div>

            {(sourcePanelTrust.sourcePanelLabel ||
              sourcePanelTrust.provenanceLabel) && (
                <details className="rounded-xl border border-border/80 bg-card px-3 py-2.5">
                  <summary className="cursor-pointer list-none text-xs font-semibold text-secondary-foreground">
                    Source detail
                  </summary>
                  <StrategySourcePanelNote
                    className="mt-2"
                    sourceStatus={sourcePanelTrust.sourceStatus}
                    sourcePanelLabel={sourcePanelTrust.sourcePanelLabel}
                    sourcePanelGroup={sourcePanelTrust.sourcePanelGroup}
                    sourceCoverageNote={sourcePanelTrust.sourceCoverageNote}
                    groupedSourcePanel={sourcePanelTrust.groupedSourcePanel}
                    provenanceLabel={sourcePanelTrust.provenanceLabel}
                    provenanceNote={sourcePanelTrust.provenanceNote}
                  />
                </details>
              )}

          {chart && (
            <>
              <div className="md:hidden">
                <RangeMatrix
                  actions={actionMap}
                  compact
                  readonly
                  strictComplete
                  highlightedHand={handCode}
                  size="sm"
                />
              </div>
              <div className="hidden md:block">
                <RangeMatrix
                  actions={actionMap}
                  readonly
                  strictComplete
                  highlightedHand={handCode}
                  size="md"
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
            <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
              Chart actions are not available for this reveal.
            </div>
          )}
        </div>

        <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 -mx-3 border-t border-border/80 bg-card/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4 md:static md:mx-0 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
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
        </div>
      </CardContent>
    </Card>
  );
}

export default TrainerResultReveal;
