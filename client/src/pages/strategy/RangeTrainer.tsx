/**
 * client/src/pages/strategy/RangeTrainer.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Range Trainer page — flashcard-style range drilling.
 * Route: /strategy/trainer (optionally ?chartId=X to pre-select a chart)
 *
 * CODEX TASK: Implement the page body.
 *
 * Layout:
 *   - Left panel (280px): chart selector + session stats
 *   - Right panel: TrainerCard (centred, max-w-sm)
 *
 * State:
 *   - selectedChartId: number | undefined (from URL param or user selection)
 *   - currentHand: { handCode, correctAction } | null
 *   - sessionStats: { total, correct } (local, reset on chart change)
 *
 * Flow:
 *   1. User selects a chart from the left panel
 *   2. A random non-FOLD hand is picked from chart.actions
 *   3. TrainerCard shows the hand and action buttons
 *   4. On answer: call trpc.strategy.logAttempt.mutate(...)
 *   5. After reveal, "Next hand" picks a new random hand
 *   6. Session stats update in real-time
 *
 * Chart selector (left panel):
 *   - Dropdown or list of available charts
 *   - Shows chart title + stack depth
 *   - Selecting a chart resets session stats and picks first hand
 *
 * Session stats:
 *   - Attempts: N
 *   - Accuracy: N%
 *   - Streak: N (consecutive correct)
 *
 * Empty state:
 *   - No charts: "No charts available. Run the seed script."
 *   - No hands (all FOLD): "No trainable hands in this chart."
 *
 * Design:
 *   - Dark theme consistent with rest of app
 *   - Orange accent for correct answers / CTAs
 *   - Smooth transitions between hands
 */

import React, { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Target, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrainerCard } from "@/components/strategy/TrainerCard";
import { calcAccuracy } from "@/components/strategy/utils";
import { SPOT_GROUP_LABELS, type Action } from "../../../../shared/strategy";
import { toast } from "sonner";

interface SessionStats {
  total: number;
  correct: number;
  streak: number;
}

export default function RangeTrainer() {
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams(search);
  const chartIdParamRaw = params.get("chartId");
  const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
  const initialChartId = Number.isFinite(chartIdParam)
    ? chartIdParam
    : undefined;

  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(
    initialChartId
  );
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    streak: 0,
  });

  const { data: spots = [], isLoading: spotsLoading } =
    trpc.strategy.listSpots.useQuery({});

  const {
    data: trainerSpot,
    isLoading: trainerSpotLoading,
    isFetching: trainerSpotFetching,
    error: trainerSpotError,
    refetch: refetchTrainerSpot,
  } = trpc.strategy.getTrainerSpot.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const submitAttempt = trpc.strategy.submitTrainerAttempt.useMutation({
    onError: error => {
      toast.error(`Could not submit answer: ${error.message}`);
    },
  });

  const accuracy = calcAccuracy(sessionStats.correct, sessionStats.total);

  useEffect(() => {
    setSessionStats({ total: 0, correct: 0, streak: 0 });
  }, [selectedChartId]);

  function handleAnswer(selectedAction: Action, isCorrect: boolean) {
    if (!trainerSpot) return;

    submitAttempt.mutate({
      chartId: trainerSpot.chartId,
      handCode: trainerSpot.handCode,
      selectedAction,
    });

    setSessionStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
  }

  function handleNext() {
    void refetchTrainerSpot();
  }

  return (
    <div className="flex min-h-screen flex-col gap-0 pb-20 md:flex-row md:pb-0">
      {/* Left panel: chart selector + stats */}
      <div className="flex max-h-[45vh] w-full flex-shrink-0 flex-col border-b border-border md:max-h-none md:w-80 md:border-b-0 md:border-r">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            Range Trainer
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose one chart and drill live hand decisions.
          </p>
        </div>

        {/* Chart list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {spotsLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!spotsLoading && spots.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No charts available. Run the seed script to add ranges.
            </div>
          )}

          {spots.map(spot => (
            <button
              key={spot.id}
              className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                selectedChartId === spot.id
                  ? "border-orange-500/40 bg-orange-500/15 text-orange-600"
                  : "border-transparent hover:border-border hover:bg-muted text-foreground"
              }`}
              onClick={() => setSelectedChartId(spot.id)}
            >
              <div className="font-medium truncate">{spot.title}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <Badge variant="outline" className="text-xs h-5 px-1.5">
                  {spot.stackDepth}bb
                </Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {SPOT_GROUP_LABELS[spot.spotGroup]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Session stats */}
        {selectedChartId && (
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Local Session
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSessionStats({ total: 0, correct: 0, streak: 0 });
                  void refetchTrainerSpot();
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border bg-card px-2 py-2">
                <p className="text-lg font-bold text-foreground">
                  {sessionStats.total}
                </p>
                <p className="text-xs text-muted-foreground">Attempts</p>
              </div>
              <div className="rounded-md border bg-card px-2 py-2">
                <p className="text-lg font-bold text-orange-500">
                  {accuracy}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="rounded-md border bg-card px-2 py-2">
                <p className="text-lg font-bold text-green-500">
                  {sessionStats.streak}
                </p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
            {!isAuthenticated && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Log in to save trainer history. This session stays local.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main content: trainer card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        {!selectedChartId && (
          <div className="text-center space-y-2">
            <Target className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
            <p className="text-sm text-muted-foreground">
              Select a chart from the left to start drilling.
            </p>
          </div>
        )}

        {selectedChartId &&
          (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
            <Skeleton className="w-80 h-96" />
          )}

        {trainerSpot && (
          <TrainerCard
            key={`${trainerSpot.chartId}-${trainerSpot.handCode}`}
            chartId={trainerSpot.chartId}
            handCode={trainerSpot.handCode}
            spotLabel={trainerSpot.chart.title}
            spotContext={SPOT_GROUP_LABELS[trainerSpot.chart.spotGroup]}
            stackDepth={trainerSpot.chart.stackDepth}
            heroPosition={trainerSpot.chart.heroPosition}
            villainPosition={trainerSpot.chart.villainPosition}
            correctAction={trainerSpot.correctAction}
            explanation={trainerSpot.correctNote}
            isPersisted={isAuthenticated}
            choices={trainerSpot.choices}
            onAnswer={handleAnswer}
            onSkip={handleNext}
            className="w-full max-w-md"
          />
        )}

        {selectedChartId && !trainerSpotLoading && !trainerSpot && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {trainerSpotError?.message ?? "No trainable hands in this chart."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
