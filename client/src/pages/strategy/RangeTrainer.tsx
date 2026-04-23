import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import { CheckCircle2, Flame, Target } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { PreflopSetupControls } from "@/components/strategy/PreflopSetupControls";
import { TableContext } from "@/components/strategy/TableContext";
import { TrainerCard } from "@/components/strategy/TrainerCard";
import { TrainerResultReveal } from "@/components/strategy/TrainerResultReveal";
import { calcAccuracy } from "@/components/strategy/utils";
import { trpc } from "@/lib/trpc";
import { buildHandClassRevealNote } from "@shared/preflop";
import {
  POSITIONS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  type Action,
  type Position,
  type SpotGroup,
} from "@shared/strategy";

type TrainerMode = "current_spot" | "decision_family" | "random_spot";

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

type SpotSummary = {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
};

const RECENT_CHART_LIMIT = 10;
const RECENT_HAND_LIMIT = 28;

function handHistoryKey(chartId: number, handCode: string) {
  return `${chartId}:${handCode}`;
}

function dedupePush<T>(items: T[], next: T, limit: number): T[] {
  return [next, ...items.filter(item => item !== next)].slice(0, limit);
}

function modeForFilters(
  stackDepth?: number,
  spotGroup?: SpotGroup
): TrainerMode {
  if (spotGroup) return "decision_family";
  if (stackDepth !== undefined) return "random_spot";
  return "random_spot";
}

function positionSort(a: string, b: string) {
  return (
    (POSITIONS.indexOf(a as Position) === -1
      ? 99
      : POSITIONS.indexOf(a as Position)) -
    (POSITIONS.indexOf(b as Position) === -1
      ? 99
      : POSITIONS.indexOf(b as Position))
  );
}

function toPosition(value: string | undefined): Position | undefined {
  return POSITIONS.includes(value as Position) ? (value as Position) : undefined;
}

function uniqueSorted<T extends string | number>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function formatModeLabel(
  mode: TrainerMode,
  selectedSpot: SpotSummary | undefined,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined
) {
  if (mode === "current_spot") {
    return selectedSpot?.title ?? "Current setup";
  }
  if (mode === "decision_family" && spotGroup) {
    return `${SPOT_GROUP_LABELS[spotGroup]}${
      stackDepth ? ` - ${stackDepth}bb` : ""
    }`;
  }
  return stackDepth ? `${stackDepth}bb setup` : "Any preflop setup";
}

function filterSummary(
  mode: TrainerMode,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined
) {
  if (mode === "current_spot") {
    return "Drilling this chart one hand at a time.";
  }
  if (mode === "decision_family" && spotGroup && stackDepth) {
    return `Drilling ${SPOT_GROUP_LABELS[spotGroup]} spots at ${stackDepth}bb.`;
  }
  if (mode === "decision_family" && spotGroup) {
    return `Drilling ${SPOT_GROUP_LABELS[spotGroup]} across supported stacks.`;
  }
  if (stackDepth) return `Drilling preflop spots at ${stackDepth}bb.`;
  return "Drilling preflop spots up to 40bb.";
}

function scrollElementIntoComfortView(element: HTMLElement | null) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const isComfortablyVisible =
    rect.top >= 72 && rect.top <= viewportHeight * 0.45;

  if (isComfortablyVisible) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function replaceTrainerUrl(chartId: number | null) {
  if (typeof window === "undefined") return;
  const nextUrl =
    chartId === null
      ? "/strategy/trainer"
      : `/strategy/trainer?chartId=${chartId}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export default function RangeTrainer() {
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams(search);
  const chartIdParamRaw = params.get("chartId");
  const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
  const initialChartId =
    chartIdParam !== undefined && Number.isFinite(chartIdParam)
      ? chartIdParam
      : null;

  const [mode, setMode] = useState<TrainerMode>(
    initialChartId !== null ? "current_spot" : "random_spot"
  );
  const [selectedChartId, setSelectedChartId] = useState<number | null>(
    initialChartId
  );
  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [heroPosition, setHeroPosition] = useState<string | undefined>(
    undefined
  );
  const [villainPosition, setVillainPosition] = useState<string | undefined>(
    undefined
  );
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    streak: 0,
  });
  const [recentChartIds, setRecentChartIds] = useState<number[]>([]);
  const [recentHandKeys, setRecentHandKeys] = useState<string[]>([]);
  const [answerReveal, setAnswerReveal] = useState<AnswerRevealState | null>(
    null
  );
  const [questionVersion, setQuestionVersion] = useState(0);

  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const resultRevealRef = useRef<HTMLDivElement | null>(null);

  const { data: spots = [] } = trpc.strategy.listSpots.useQuery({
    stackDepth,
    spotGroup,
  });
  const selectedSpot = useMemo(
    () => spots.find(spot => spot.id === selectedChartId),
    [selectedChartId, spots]
  );

  const trainerInput = useMemo(() => {
    const input: {
      chartId?: number;
      stackDepth?: number;
      spotGroup?: SpotGroup;
      heroPosition?: Position;
      villainPosition?: Position;
      recentChartIds: number[];
      recentHandKeys: string[];
    } = {
      recentChartIds,
      recentHandKeys,
    };
    const selectedHeroPosition = toPosition(heroPosition);
    const selectedVillainPosition = toPosition(villainPosition);

    if (mode === "current_spot") {
      if (selectedChartId !== null) input.chartId = selectedChartId;
      return input;
    }

    if (mode === "decision_family" && spotGroup !== undefined) {
      input.spotGroup = spotGroup;
    }
    if (stackDepth !== undefined) {
      input.stackDepth = stackDepth;
    }
    if (selectedHeroPosition !== undefined) {
      input.heroPosition = selectedHeroPosition;
    }
    if (selectedVillainPosition !== undefined) {
      input.villainPosition = selectedVillainPosition;
    }
    return input;
  }, [
    heroPosition,
    mode,
    recentChartIds,
    recentHandKeys,
    selectedChartId,
    stackDepth,
    spotGroup,
    villainPosition,
  ]);

  const trainerEnabled = mode !== "current_spot" || selectedChartId !== null;
  const {
    data: trainerSpot,
    isLoading: trainerSpotLoading,
    isFetching: trainerSpotFetching,
    error: trainerSpotError,
    refetch: refetchTrainerSpot,
  } = trpc.strategy.getTrainerSpot.useQuery(trainerInput, {
    enabled: trainerEnabled,
  });

  const {
    data: revealChart,
    isLoading: revealChartLoading,
    isFetching: revealChartFetching,
  } = trpc.strategy.getChart.useQuery(
    { chartId: answerReveal?.chartId ?? 1 },
    { enabled: answerReveal !== null }
  );

  const submitAttempt = trpc.strategy.submitTrainerAttempt.useMutation({
    onError: error => {
      toast.error(`Could not submit answer: ${error.message}`);
    },
  });

  const accuracy = calcAccuracy(sessionStats.correct, sessionStats.total);
  const availableStacks = [...STACK_DEPTHS];
  const heroOptions = useMemo(
    () =>
      uniqueSorted(spots.map(spot => spot.heroPosition)).sort(positionSort),
    [spots]
  );
  const villainOptions = useMemo(
    () =>
      uniqueSorted(
        spots
          .filter(spot =>
            heroPosition === undefined
              ? true
              : spot.heroPosition === heroPosition
          )
          .map(spot => spot.villainPosition)
          .filter((position): position is string => Boolean(position))
      ).sort(positionSort),
    [heroPosition, spots]
  );

  const activeSpot = trainerSpot?.chart ?? selectedSpot;
  const modeLabel = formatModeLabel(mode, activeSpot, stackDepth, spotGroup);
  const modeHelper = filterSummary(mode, stackDepth, spotGroup);
  const revealNote = answerReveal
    ? buildHandClassRevealNote(
        answerReveal.handCode,
        answerReveal.correctAction,
        answerReveal.explanation
      )
    : null;

  useEffect(() => {
    if (!answerReveal) return;
    const timeout = window.setTimeout(() => {
      scrollElementIntoComfortView(resultRevealRef.current);
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [answerReveal]);

  useEffect(() => {
    if (heroPosition !== undefined && !heroOptions.includes(heroPosition)) {
      setHeroPosition(undefined);
    }
  }, [heroOptions, heroPosition]);

  useEffect(() => {
    if (
      villainPosition !== undefined &&
      !villainOptions.includes(villainPosition)
    ) {
      setVillainPosition(undefined);
    }
  }, [villainOptions, villainPosition]);

  function resetSessionState() {
    setSessionStats({ total: 0, correct: 0, streak: 0 });
    setRecentChartIds([]);
    setRecentHandKeys([]);
    setAnswerReveal(null);
    setQuestionVersion(0);
  }

  function setStackFilter(nextStackDepth: number | undefined) {
    setStackDepth(nextStackDepth);
    setSelectedChartId(null);
    setMode(modeForFilters(nextStackDepth, spotGroup));
    replaceTrainerUrl(null);
    resetSessionState();
  }

  function setFamilyFilter(nextSpotGroup: SpotGroup | undefined) {
    setSpotGroup(nextSpotGroup);
    setSelectedChartId(null);
    setMode(modeForFilters(stackDepth, nextSpotGroup));
    replaceTrainerUrl(null);
    resetSessionState();
  }

  function setHeroFilter(nextHeroPosition: string | undefined) {
    setHeroPosition(nextHeroPosition);
    setVillainPosition(undefined);
    setSelectedChartId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl(null);
    resetSessionState();
  }

  function setVillainFilter(nextVillainPosition: string | undefined) {
    setVillainPosition(nextVillainPosition);
    setSelectedChartId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl(null);
    resetSessionState();
  }

  function rememberQuestionForRepeatGuard() {
    if (!trainerSpot) return;

    setRecentChartIds(previous =>
      dedupePush(previous, trainerSpot.chartId, RECENT_CHART_LIMIT)
    );
    setRecentHandKeys(previous =>
      dedupePush(
        previous,
        handHistoryKey(trainerSpot.chartId, trainerSpot.handCode),
        RECENT_HAND_LIMIT
      )
    );
  }

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

    setSessionStats(previous => ({
      total: previous.total + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? previous.streak + 1 : 0,
    }));
  }

  function handleNext() {
    rememberQuestionForRepeatGuard();
    setAnswerReveal(null);
    setQuestionVersion(version => version + 1);
    window.setTimeout(() => {
      scrollElementIntoComfortView(questionCardRef.current);
    }, 80);
  }

  function unlockCurrentSpotAndContinue() {
    setSelectedChartId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl(null);
    resetSessionState();
    void refetchTrainerSpot();
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_18rem),linear-gradient(180deg,#09090b_0%,#18181b_48%,#0f172a_100%)] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white">
      <main className="mx-auto w-full max-w-4xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
        <header className="rounded-[1.2rem] border border-white/10 bg-zinc-950/78 p-3 shadow-xl shadow-black/20 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                Range Trainer
              </p>
              <h1 className="truncate text-xl font-black tracking-tight">
                Preflop Drill Flow
              </h1>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {modeLabel}. {modeHelper}
          </p>
        </header>

        <section className="rounded-[1.2rem] border border-white/10 bg-zinc-950/75 p-3 shadow-xl shadow-black/20 sm:p-4">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
            Setup
          </p>
          <PreflopSetupControls
            spotGroup={spotGroup}
            stackDepth={stackDepth}
            heroPosition={heroPosition}
            villainPosition={villainPosition}
            availableStacks={availableStacks}
            heroOptions={heroOptions}
            villainOptions={villainOptions}
            onSpotGroupChange={setFamilyFilter}
            onStackDepthChange={setStackFilter}
            onHeroPositionChange={setHeroFilter}
            onVillainPositionChange={setVillainFilter}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <Badge className="rounded-full bg-orange-500 text-white">BBA</Badge>
            <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-200">
              Up to 40bb
            </Badge>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              {sessionStats.correct}/{sessionStats.total} correct
            </span>
            <span>{accuracy}% accuracy</span>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              {sessionStats.streak} streak
            </span>
            {!isAuthenticated && <span>Practice stays local while logged out.</span>}
          </div>
        </section>

        <section className="space-y-3">
          {trainerEnabled &&
            (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
              <Skeleton className="h-[480px] w-full rounded-[1.2rem] bg-white/10" />
            )}

          {trainerSpot && (
            <div className="space-y-3">
              <div
                ref={questionCardRef}
                className="space-y-3 rounded-[1.2rem] border border-white/10 bg-zinc-950/82 p-3 shadow-xl shadow-black/20 sm:p-4"
              >
                <TableContext
                  title={trainerSpot.chart.title}
                  stackDepth={trainerSpot.chart.stackDepth}
                  heroPosition={trainerSpot.chart.heroPosition}
                  villainPosition={trainerSpot.chart.villainPosition}
                  spotGroup={trainerSpot.chart.spotGroup}
                  embedded
                />

                <div className="h-px bg-white/10" />

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
                  compact
                  embedded
                  showContextBadges={false}
                  showSpotText={false}
                  onAnswer={handleAnswer}
                  onSkip={handleNext}
                  className="w-full"
                />
              </div>

              {answerReveal && (
                <>
                  <div ref={resultRevealRef} className="scroll-mt-4 sm:scroll-mt-6">
                    <TrainerResultReveal
                      chart={revealChart}
                      isLoadingChart={revealChartLoading || revealChartFetching}
                      chartId={answerReveal.chartId}
                      handCode={answerReveal.handCode}
                      selectedAction={answerReveal.selectedAction}
                      correctAction={answerReveal.correctAction}
                      isCorrect={answerReveal.isCorrect}
                      explanation={answerReveal.explanation}
                      onNext={handleNext}
                      className="border-white/10 bg-black/20 shadow-none"
                    />
                  </div>
                  <div className="rounded-[1rem] border border-white/10 bg-white/[0.045] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                      Takeaway
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                      {revealNote}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {trainerEnabled &&
            !trainerSpotLoading &&
            !trainerSpotFetching &&
            !trainerSpot && (
              <Card className="rounded-[1.2rem] border-dashed border-white/10 bg-white/[0.06] text-white shadow-xl shadow-black/20">
                <CardContent className="space-y-4 p-6 text-center">
                  <Target className="mx-auto h-10 w-10 text-zinc-500" />
                  <div>
                    <p className="text-sm font-semibold">
                      No trainer hand available
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {trainerSpotError?.message ??
                        "Adjust setup to another supported preflop spot."}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                    onClick={unlockCurrentSpotAndContinue}
                  >
                    Try Another Spot
                  </Button>
                </CardContent>
              </Card>
            )}
        </section>
      </main>
    </div>
  );
}
