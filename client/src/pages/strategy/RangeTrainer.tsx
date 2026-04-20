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

import React, { useState, useCallback, useEffect } from "react";
import { useSearch } from "wouter";
import { Target, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { TrainerCard } from "@/components/strategy/TrainerCard";
import { pickRandomHand, calcAccuracy } from "@/components/strategy/utils";
import type { Action } from "../../../../shared/strategy";

interface SessionStats {
  total: number;
  correct: number;
  streak: number;
}

export default function RangeTrainer() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialChartId = params.get("chartId") ? Number(params.get("chartId")) : undefined;

  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(initialChartId);
  const [currentHand, setCurrentHand] = useState<{ handCode: string; correctAction: Action } | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ total: 0, correct: 0, streak: 0 });

  const { data: spots = [], isLoading: spotsLoading } = trpc.strategy.listSpots.useQuery({});

  const { data: chart, isLoading: chartLoading } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const logAttempt = trpc.strategy.logAttempt.useMutation();

  // Pick a new random hand from the chart
  const pickNextHand = useCallback(() => {
    if (!chart?.actions) return;
    const hand = pickRandomHand(chart.actions);
    if (hand) {
      setCurrentHand({
        handCode: hand.handCode,
        correctAction: hand.primaryAction as Action,
      });
    }
  }, [chart]);

  // When chart loads, pick first hand
  useEffect(() => {
    if (chart) {
      setSessionStats({ total: 0, correct: 0, streak: 0 });
      pickNextHand();
    }
  }, [chart?.id]);

  function handleAnswer(selectedAction: Action, isCorrect: boolean) {
    if (!chart || !currentHand) return;

    // Log to server
    logAttempt.mutate({
      chartId: chart.id,
      handCode: currentHand.handCode,
      selectedAction,
      correctAction: currentHand.correctAction,
      isCorrect,
    });

    // Update session stats
    setSessionStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
  }

  function handleNext() {
    pickNextHand();
  }

  return (
    <div className="flex h-full gap-0">
      {/* Left panel: chart selector + stats */}
      <div className="w-64 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            Range Trainer
          </h2>
        </div>

        {/* Chart list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {spotsLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}

          {!spotsLoading && spots.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No charts available. Run the seed script to add ranges.
            </div>
          )}

          {spots.map((spot) => (
            <button
              key={spot.id}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedChartId === spot.id
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "hover:bg-muted text-foreground"
              }`}
              onClick={() => setSelectedChartId(spot.id)}
            >
              <div className="font-medium truncate">{spot.title}</div>
              <Badge variant="outline" className="text-xs h-4 px-1 mt-0.5">
                {spot.stackDepth}bb
              </Badge>
            </button>
          ))}
        </div>

        {/* Session stats */}
        {selectedChartId && (
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Session</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSessionStats({ total: 0, correct: 0, streak: 0 });
                  pickNextHand();
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{sessionStats.total}</p>
                <p className="text-xs text-muted-foreground">Hands</p>
              </div>
              <div>
                <p className="text-lg font-bold text-orange-500">
                  {calcAccuracy(sessionStats.correct, sessionStats.total)}%
                </p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-500">{sessionStats.streak}</p>
                <p className="text-xs text-muted-foreground">Streak</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content: trainer card */}
      <div className="flex-1 flex items-center justify-center p-6">
        {!selectedChartId && (
          <div className="text-center space-y-2">
            <Target className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
            <p className="text-sm text-muted-foreground">Select a chart from the left to start drilling.</p>
          </div>
        )}

        {selectedChartId && chartLoading && (
          <Skeleton className="w-80 h-96" />
        )}

        {chart && currentHand && (
          <TrainerCard
            chartId={chart.id}
            handCode={currentHand.handCode}
            spotLabel={chart.title}
            correctAction={currentHand.correctAction}
            onAnswer={handleAnswer}
            onSkip={handleNext}
            className="w-full max-w-sm"
          />
        )}

        {chart && !currentHand && (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">No trainable hands in this chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}
