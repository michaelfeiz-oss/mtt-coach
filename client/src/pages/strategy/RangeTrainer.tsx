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

import React, { useEffect, useMemo, useState } from "react";
import { useSearch } from "wouter";
import {
  CheckCircle2,
  Flame,
  RotateCcw,
  Search,
  Shuffle,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { TrainerCard } from "@/components/strategy/TrainerCard";
import { TrainerResultReveal } from "@/components/strategy/TrainerResultReveal";
import { calcAccuracy } from "@/components/strategy/utils";
import {
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  type Action,
  type SpotGroup,
} from "../../../../shared/strategy";
import { toast } from "sonner";

interface SessionStats {
  total: number;
  correct: number;
  streak: number;
}

interface AnswerRevealState {
  chartId: number;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  explanation?: string | null;
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
  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [answerReveal, setAnswerReveal] = useState<AnswerRevealState | null>(
    null
  );
  const [questionVersion, setQuestionVersion] = useState(0);

  const { data: spots = [], isLoading: spotsLoading } =
    trpc.strategy.listSpots.useQuery({ stackDepth, spotGroup });
  const { data: groupCountSpots = [] } = trpc.strategy.listSpots.useQuery({
    stackDepth,
  });

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
  const {
    data: revealChart,
    isLoading: revealChartLoading,
    isFetching: revealChartFetching,
  } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const submitAttempt = trpc.strategy.submitTrainerAttempt.useMutation({
    onError: error => {
      toast.error(`Could not submit answer: ${error.message}`);
    },
  });

  const accuracy = calcAccuracy(sessionStats.correct, sessionStats.total);
  const filteredSpots = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return spots;

    return spots.filter(spot => {
      const searchable = [
        spot.title,
        spot.heroPosition,
        spot.villainPosition ?? "",
        SPOT_GROUP_LABELS[spot.spotGroup],
        `${spot.stackDepth}bb`,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [searchTerm, spots]);

  const groupCounts = useMemo(
    () =>
      groupCountSpots.reduce<Partial<Record<SpotGroup, number>>>(
        (counts, spot) => {
          counts[spot.spotGroup] = (counts[spot.spotGroup] ?? 0) + 1;
          return counts;
        },
        {}
      ),
    [groupCountSpots]
  );

  const selectedSpot = useMemo(
    () => spots.find(spot => spot.id === selectedChartId),
    [selectedChartId, spots]
  );

  useEffect(() => {
    setSessionStats({ total: 0, correct: 0, streak: 0 });
    setAnswerReveal(null);
    setQuestionVersion(0);
  }, [selectedChartId]);

  useEffect(() => {
    setAnswerReveal(null);
  }, [trainerSpot?.chartId, trainerSpot?.handCode]);

  useEffect(() => {
    if (selectedChartId !== undefined || spots.length === 0) return;
    setSelectedChartId(spots[0].id);
  }, [selectedChartId, spots]);

  useEffect(() => {
    if (selectedChartId === undefined || spots.length === 0) return;
    if (spots.some(spot => spot.id === selectedChartId)) return;
    setSelectedChartId(spots[0].id);
  }, [selectedChartId, spots, stackDepth, spotGroup]);

  function handleAnswer(selectedAction: Action, isCorrect: boolean) {
    if (!trainerSpot) return;

    setAnswerReveal({
      chartId: trainerSpot.chartId,
      handCode: trainerSpot.handCode,
      selectedAction,
      correctAction: trainerSpot.correctAction,
      isCorrect,
      explanation: trainerSpot.correctNote,
    });

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
    setAnswerReveal(null);
    setQuestionVersion(version => version + 1);
    void refetchTrainerSpot();
  }

  function selectSpot(chartId: number) {
    setAnswerReveal(null);
    setSelectedChartId(chartId);
  }

  function selectRandomSpot() {
    const pool = filteredSpots.length > 0 ? filteredSpots : spots;
    if (pool.length === 0) return;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    setAnswerReveal(null);
    setSelectedChartId(selected.id);
  }

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,111,0,0.08),transparent_32rem),linear-gradient(180deg,#fffaf4_0%,#ffffff_36%,#f8fafc_100%)]">
      <div className="grid h-full grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-border/80 bg-white/90 backdrop-blur md:border-b-0 md:border-r">
          <div className="space-y-4 border-b border-border/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                    <Target className="h-4 w-4" />
                  </span>
                  Range Trainer
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Pick a spot, answer hands, and keep the drill moving.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5"
                onClick={selectRandomSpot}
                disabled={spots.length === 0}
              >
                <Shuffle className="h-3.5 w-3.5" />
                Random
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Stack
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  <Button
                    size="sm"
                    variant={stackDepth === undefined ? "default" : "outline"}
                    className="h-8 px-2 text-xs"
                    onClick={() => setStackDepth(undefined)}
                  >
                    All
                  </Button>
                  {STACK_DEPTHS.map(depth => (
                    <Button
                      key={depth}
                      size="sm"
                      variant={stackDepth === depth ? "default" : "outline"}
                      className="h-8 px-2 text-xs"
                      onClick={() => setStackDepth(depth)}
                    >
                      {depth}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Spot Type
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <Button
                    size="sm"
                    variant={spotGroup === undefined ? "default" : "outline"}
                    className="h-8 shrink-0 px-3 text-xs"
                    onClick={() => setSpotGroup(undefined)}
                  >
                    All
                  </Button>
                  {SPOT_GROUPS.map(group => (
                    <Button
                      key={group}
                      size="sm"
                      variant={spotGroup === group ? "default" : "outline"}
                      className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                      onClick={() => setSpotGroup(group)}
                    >
                      {SPOT_GROUP_LABELS[group].replace(" (Open Raise)", "")}
                      {(groupCounts[group] ?? 0) > 0 && (
                        <span className="rounded-full bg-background/70 px-1.5 text-[10px] text-muted-foreground">
                          {groupCounts[group]}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Search BTN, BB, 20bb..."
                  className="h-10 bg-white pl-9"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Drills
              </p>
              <Badge variant="secondary" className="h-5 text-[11px]">
                {filteredSpots.length}
              </Badge>
            </div>

            {spotsLoading && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!spotsLoading && spots.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No charts available. Run the seed script to add ranges.
                </CardContent>
              </Card>
            )}

            {!spotsLoading && spots.length > 0 && filteredSpots.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No drills match this search. Clear the search or change the
                  filters.
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {filteredSpots.map(spot => {
                const active = selectedChartId === spot.id;

                return (
                  <button
                    key={spot.id}
                    className={`group w-full rounded-2xl border p-3 text-left shadow-sm transition ${
                      active
                        ? "border-orange-400 bg-orange-50 text-orange-950 shadow-orange-500/10"
                        : "border-border bg-white hover:border-orange-200 hover:bg-orange-50/40"
                    }`}
                    onClick={() => selectSpot(spot.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {spot.title}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {SPOT_GROUP_LABELS[spot.spotGroup]}
                        </p>
                      </div>
                      <Badge
                        variant={active ? "default" : "outline"}
                        className="h-6 shrink-0"
                      >
                        {spot.stackDepth}bb
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-background px-2 py-0.5">
                        {spot.heroPosition}
                        {spot.villainPosition ? ` vs ${spot.villainPosition}` : ""}
                      </span>
                      {active && (
                        <span className="font-medium text-orange-600">
                          Training now
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border/80 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                This Session
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSessionStats({ total: 0, correct: 0, streak: 0 });
                  void refetchTrainerSpot();
                }}
                disabled={!selectedChartId}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border bg-slate-50 p-2 text-center">
                <p className="text-lg font-bold text-foreground">
                  {sessionStats.total}
                </p>
                <p className="text-[11px] text-muted-foreground">Hands</p>
              </div>
              <div className="rounded-xl border bg-orange-50 p-2 text-center">
                <p className="text-lg font-bold text-orange-600">
                  {accuracy}%
                </p>
                <p className="text-[11px] text-muted-foreground">Accuracy</p>
              </div>
              <div className="rounded-xl border bg-green-50 p-2 text-center">
                <p className="text-lg font-bold text-green-600">
                  {sessionStats.streak}
                </p>
                <p className="text-[11px] text-muted-foreground">Streak</p>
              </div>
            </div>
            {!isAuthenticated && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Practice works now. Log in when you want saved history and weak
                spot tracking.
              </p>
            )}
          </div>
        </aside>

        <main className="min-h-0 overflow-y-auto p-4 md:p-6 xl:p-8">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-5">
            <Card className="overflow-hidden border-0 bg-zinc-950 text-white shadow-xl shadow-orange-950/10">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300">
                      Current Drill
                    </p>
                    <h2 className="truncate text-2xl font-bold">
                      {trainerSpot?.chart.title ??
                        selectedSpot?.title ??
                        "Choose a range spot"}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                      {(trainerSpot?.chart.stackDepth ??
                        selectedSpot?.stackDepth) && (
                        <Badge className="bg-orange-500 text-white">
                          {trainerSpot?.chart.stackDepth ??
                            selectedSpot?.stackDepth}
                          bb
                        </Badge>
                      )}
                      {(trainerSpot?.chart.spotGroup ??
                        selectedSpot?.spotGroup) && (
                        <Badge
                          variant="outline"
                          className="border-zinc-700 text-zinc-200"
                        >
                          {
                            SPOT_GROUP_LABELS[
                              trainerSpot?.chart.spotGroup ??
                                selectedSpot!.spotGroup
                            ]
                          }
                        </Badge>
                      )}
                      <span className="text-zinc-400">
                        Answer with buttons or keyboard 1-4.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:w-72">
                    <div className="rounded-2xl bg-white/8 p-3 text-center">
                      <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-green-400" />
                      <p className="text-lg font-bold">{sessionStats.correct}</p>
                      <p className="text-[11px] text-zinc-400">Correct</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-3 text-center">
                      <Target className="mx-auto mb-1 h-4 w-4 text-orange-300" />
                      <p className="text-lg font-bold">{accuracy}%</p>
                      <p className="text-[11px] text-zinc-400">Accuracy</p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-3 text-center">
                      <Flame className="mx-auto mb-1 h-4 w-4 text-amber-300" />
                      <p className="text-lg font-bold">{sessionStats.streak}</p>
                      <p className="text-[11px] text-zinc-400">Streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-1 items-start justify-center">
              {!selectedChartId && !spotsLoading && (
                <Card className="w-full max-w-lg border-dashed bg-white/90">
                  <CardContent className="space-y-4 p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                      <Target className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Start with one focused drill
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pick a spot on the left or use Random to jump straight
                        into practice.
                      </p>
                    </div>
                    <Button
                      className="bg-orange-500 text-white hover:bg-orange-600"
                      onClick={selectRandomSpot}
                      disabled={spots.length === 0}
                    >
                      Start random drill
                    </Button>
                  </CardContent>
                </Card>
              )}

              {selectedChartId &&
                (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
                  <Skeleton className="h-[440px] w-full max-w-xl rounded-3xl" />
                )}

              {trainerSpot && (
                <div className="w-full max-w-3xl space-y-4">
                  <TrainerCard
                    key={`${trainerSpot.chartId}-${trainerSpot.handCode}-${questionVersion}`}
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
                    showInlineResult={false}
                    onAnswer={handleAnswer}
                    onSkip={handleNext}
                    className="mx-auto w-full max-w-xl"
                  />

                  {answerReveal && (
                    <TrainerResultReveal
                      chart={revealChart}
                      isLoadingChart={
                        revealChartLoading || revealChartFetching
                      }
                      chartId={answerReveal.chartId}
                      handCode={answerReveal.handCode}
                      selectedAction={answerReveal.selectedAction}
                      correctAction={answerReveal.correctAction}
                      isCorrect={answerReveal.isCorrect}
                      explanation={answerReveal.explanation}
                      onNext={handleNext}
                    />
                  )}
                </div>
              )}

              {selectedChartId && !trainerSpotLoading && !trainerSpot && (
                <Card className="w-full max-w-lg border-dashed bg-white/90">
                  <CardContent className="space-y-3 p-8 text-center">
                    <Target className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">
                      {trainerSpotError?.message ??
                        "No trainable hands in this chart."}
                    </p>
                    <Button variant="outline" onClick={selectRandomSpot}>
                      Try another drill
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
