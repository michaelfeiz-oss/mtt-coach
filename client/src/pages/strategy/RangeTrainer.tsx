import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import {
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  Flame,
  RotateCcw,
  Search,
  Shuffle,
  Target,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { TableContext } from "@/components/strategy/TableContext";
import { TrainerCard } from "@/components/strategy/TrainerCard";
import { TrainerResultReveal } from "@/components/strategy/TrainerResultReveal";
import { calcAccuracy } from "@/components/strategy/utils";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ACTION_LABELS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  SPOT_GROUP_SUBTITLES,
  STACK_DEPTHS,
  type Action,
  type SpotGroup,
} from "../../../../shared/strategy";

type TrainerMode = "exact_chart" | "family" | "stack" | "full_pool";

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
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
  sourceLabel?: string | null;
};

const RECENT_CHART_LIMIT = 10;
const RECENT_HAND_LIMIT = 28;
const GROUP_ORDER = new Map(SPOT_GROUPS.map((group, index) => [group, index]));

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
  if (spotGroup) return "family";
  if (stackDepth !== undefined) return "stack";
  return "full_pool";
}

function searchTextForSpot(spot: SpotSummary) {
  const villain = spot.villainPosition ?? "";
  return [
    spot.title,
    spot.spotKey,
    spot.stackDepth,
    `${spot.stackDepth}bb`,
    spot.heroPosition,
    villain,
    villain ? `${spot.heroPosition} vs ${villain}` : "",
    villain ? `${villain} vs ${spot.heroPosition}` : "",
    SPOT_GROUP_LABELS[spot.spotGroup],
    SPOT_GROUP_LABELS[spot.spotGroup].replace(" (Open Raise)", ""),
    spot.spotGroup,
  ]
    .join(" ")
    .toLowerCase();
}

function sortSpots(a: SpotSummary, b: SpotSummary) {
  return (
    a.stackDepth - b.stackDepth ||
    (GROUP_ORDER.get(a.spotGroup) ?? 99) -
      (GROUP_ORDER.get(b.spotGroup) ?? 99) ||
    a.title.localeCompare(b.title)
  );
}

function formatModeLabel(
  mode: TrainerMode,
  selectedSpot: SpotSummary | undefined,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined
) {
  if (mode === "exact_chart") {
    return selectedSpot ? `Exact Chart - ${selectedSpot.title}` : "Exact Chart";
  }

  if (mode === "family" && spotGroup) {
    return `${SPOT_GROUP_LABELS[spotGroup]} - ${
      stackDepth ? `${stackDepth}bb` : "All stacks"
    }`;
  }

  if (mode === "stack" && stackDepth) {
    return `${stackDepth}bb - All Families`;
  }

  return "Full Pool";
}

function filterSummary(
  mode: TrainerMode,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined
) {
  if (mode === "exact_chart") return "Stays inside the selected chart.";
  if (spotGroup && stackDepth) {
    return `Rotating ${SPOT_GROUP_LABELS[spotGroup]} charts at ${stackDepth}bb.`;
  }
  if (spotGroup) return `Rotating all ${SPOT_GROUP_LABELS[spotGroup]} charts.`;
  if (stackDepth) return `Rotating every family at ${stackDepth}bb.`;
  return "Rotating across all eligible stacks and families.";
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
    initialChartId !== null ? "exact_chart" : "full_pool"
  );
  const [selectedChartId, setSelectedChartId] = useState<number | null>(
    initialChartId
  );
  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    total: 0,
    correct: 0,
    streak: 0,
  });
  const [recentChartIds, setRecentChartIds] = useState<number[]>([]);
  const [recentHandKeys, setRecentHandKeys] = useState<string[]>([]);
  const [chartsCovered, setChartsCovered] = useState<number[]>([]);
  const [actionsCovered, setActionsCovered] = useState<Action[]>([]);
  const [answerReveal, setAnswerReveal] = useState<AnswerRevealState | null>(
    null
  );
  const [questionVersion, setQuestionVersion] = useState(0);
  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const resultRevealRef = useRef<HTMLDivElement | null>(null);

  const { data: spots = [], isLoading: spotsLoading } =
    trpc.strategy.listSpots.useQuery({ stackDepth, spotGroup });
  const { data: allVisibleStackSpots = [] } = trpc.strategy.listSpots.useQuery({
    stackDepth,
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
      recentChartIds: number[];
      recentHandKeys: string[];
    } = {
      recentChartIds,
      recentHandKeys,
    };

    switch (mode) {
      case "exact_chart":
        if (selectedChartId !== null) input.chartId = selectedChartId;
        return input;
      case "family":
        if (spotGroup !== undefined) input.spotGroup = spotGroup;
        if (stackDepth !== undefined) input.stackDepth = stackDepth;
        return input;
      case "stack":
        if (stackDepth !== undefined) input.stackDepth = stackDepth;
        return input;
      case "full_pool":
        return input;
    }
  }, [
    mode,
    recentChartIds,
    recentHandKeys,
    selectedChartId,
    stackDepth,
    spotGroup,
  ]);

  const trainerEnabled = mode !== "exact_chart" || selectedChartId !== null;
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
  const groupCounts = useMemo(
    () =>
      allVisibleStackSpots.reduce<Partial<Record<SpotGroup, number>>>(
        (counts, spot) => {
          counts[spot.spotGroup] = (counts[spot.spotGroup] ?? 0) + 1;
          return counts;
        },
        {}
      ),
    [allVisibleStackSpots]
  );

  const filteredSpots = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const base = [...spots].sort(sortSpots);
    if (!query) return base;

    const tokens = query.split(/\s+/).filter(Boolean);
    return base.filter(spot => {
      const searchable = searchTextForSpot(spot);
      return tokens.every(token => searchable.includes(token));
    });
  }, [searchTerm, spots]);

  const quickSpots = useMemo(() => filteredSpots.slice(0, 12), [filteredSpots]);

  const activeSpot = trainerSpot?.chart ?? selectedSpot;
  const modeLabel = formatModeLabel(mode, activeSpot, stackDepth, spotGroup);
  const modeHelper = filterSummary(mode, stackDepth, spotGroup);

  useEffect(() => {
    if (!answerReveal) return;

    const timeout = window.setTimeout(() => {
      scrollElementIntoComfortView(resultRevealRef.current);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [answerReveal]);

  function resetSessionState() {
    setSessionStats({ total: 0, correct: 0, streak: 0 });
    setRecentChartIds([]);
    setRecentHandKeys([]);
    setChartsCovered([]);
    setActionsCovered([]);
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

  function selectExactChart(chartId: number) {
    setSelectedChartId(chartId);
    setMode("exact_chart");
    replaceTrainerUrl(chartId);
    resetSessionState();
  }

  function startFullRandom() {
    setStackDepth(undefined);
    setSpotGroup(undefined);
    setSelectedChartId(null);
    setMode("full_pool");
    replaceTrainerUrl(null);
    resetSessionState();
  }

  function mixCurrentFilters() {
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

    setChartsCovered(previous =>
      dedupePush(previous, trainerSpot.chartId, 100)
    );
    setActionsCovered(previous =>
      dedupePush(previous, trainerSpot.correctAction, 20)
    );
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

  function handleShuffle() {
    rememberQuestionForRepeatGuard();
    setAnswerReveal(null);
    setQuestionVersion(version => version + 1);
    if (!trainerSpot) void refetchTrainerSpot();
  }

  function resetDrill() {
    resetSessionState();
    void refetchTrainerSpot();
  }

  function scenarioSublabel(spot: SpotSummary) {
    return spot.villainPosition
      ? `${spot.heroPosition} vs ${spot.villainPosition}`
      : SPOT_GROUP_LABELS[spot.spotGroup];
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(180deg,#09090b_0%,#18181b_48%,#0f172a_100%)] pb-24 text-white">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-3 overflow-x-hidden px-3 py-3 sm:px-5 md:gap-4 md:py-5">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Range Trainer
                </p>
                <h1 className="truncate text-xl font-black tracking-tight">
                  {modeLabel}
                </h1>
              </div>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
              {modeHelper}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-xl border-white/10 bg-white/[0.06] px-3 text-xs font-black text-zinc-200 hover:bg-white/10"
              onClick={resetDrill}
              disabled={!trainerEnabled}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-white hover:bg-orange-600"
              onClick={handleShuffle}
              disabled={!trainerEnabled}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle
            </Button>
          </div>
        </header>

        <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-zinc-950/75 p-2.5 shadow-xl shadow-black/20 sm:p-3">
          <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
            <div className="min-w-0 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className={cn(
                    "h-9 rounded-xl text-xs font-black",
                    mode === "full_pool"
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/10"
                  )}
                  variant={mode === "full_pool" ? "default" : "outline"}
                  onClick={startFullRandom}
                >
                  Full pool
                </Button>
                <Button
                  size="sm"
                  className="h-9 gap-1 rounded-xl border-white/10 bg-white/[0.06] text-xs font-black text-zinc-200 hover:bg-white/10"
                  variant="outline"
                  onClick={mixCurrentFilters}
                  disabled={
                    selectedChartId === null &&
                    stackDepth === undefined &&
                    spotGroup === undefined &&
                    mode !== "exact_chart"
                  }
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                  Mix filters
                </Button>
              </div>

              <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] gap-2.5">
                <div className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Stack
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      size="sm"
                      variant={stackDepth === undefined ? "default" : "outline"}
                      className={cn(
                        "h-8 rounded-xl px-2 text-xs font-black",
                        stackDepth === undefined
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10"
                      )}
                      onClick={() => setStackFilter(undefined)}
                    >
                      All
                    </Button>
                    {STACK_DEPTHS.map(depth => (
                      <Button
                        key={depth}
                        size="sm"
                        variant={stackDepth === depth ? "default" : "outline"}
                        className={cn(
                          "h-8 rounded-xl px-2 text-xs font-black",
                          stackDepth === depth
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10"
                        )}
                        onClick={() => setStackFilter(depth)}
                      >
                        {depth}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Decision
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    <Button
                      size="sm"
                      variant={spotGroup === undefined ? "default" : "outline"}
                      className={cn(
                        "h-8 shrink-0 rounded-xl px-3 text-xs font-black",
                        spotGroup === undefined
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10"
                      )}
                      onClick={() => setFamilyFilter(undefined)}
                    >
                      All
                    </Button>
                    {SPOT_GROUPS.map(group => (
                      <Button
                        key={group}
                        size="sm"
                        variant={spotGroup === group ? "default" : "outline"}
                        className={cn(
                          "h-8 shrink-0 gap-1.5 rounded-xl px-3 text-xs font-black",
                          spotGroup === group
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/10"
                        )}
                        onClick={() => setFamilyFilter(group)}
                      >
                        {SPOT_GROUP_LABELS[group].replace(" (Open Raise)", "")}
                        {(groupCounts[group] ?? 0) > 0 && (
                          <span className="rounded-full bg-black/20 px-1.5 text-[10px] text-current opacity-80">
                            {groupCounts[group]}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Jump to 40bb sb rfi..."
                  className="h-10 rounded-xl border-white/10 bg-white/[0.06] pl-9 text-sm text-white placeholder:text-zinc-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {searchTerm.trim().length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {spotsLoading && (
                    <>
                      <Skeleton className="h-12 w-32 shrink-0 rounded-xl bg-white/10" />
                      <Skeleton className="h-12 w-32 shrink-0 rounded-xl bg-white/10" />
                      <Skeleton className="h-12 w-32 shrink-0 rounded-xl bg-white/10" />
                    </>
                  )}

                  {!spotsLoading && spots.length === 0 && (
                    <div className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.04] p-3 text-center text-xs text-zinc-400">
                      No charts available. Run the seed script to add ranges.
                    </div>
                  )}

                  {!spotsLoading &&
                    spots.length > 0 &&
                    quickSpots.length === 0 && (
                      <div className="w-full rounded-xl border border-dashed border-white/10 bg-white/[0.04] p-3 text-center text-xs text-zinc-400">
                        No scenarios match this setup.
                      </div>
                    )}

                  {quickSpots.map(spot => {
                    const active =
                      mode === "exact_chart" && selectedChartId === spot.id;

                    return (
                      <button
                        key={spot.id}
                        type="button"
                        className={cn(
                          "min-h-12 w-32 shrink-0 rounded-xl border px-3 py-2 text-left transition sm:w-36",
                          active
                            ? "border-orange-400 bg-orange-500 text-white shadow-lg shadow-orange-950/20"
                            : "border-white/10 bg-white/[0.06] text-zinc-200 hover:border-orange-300/70 hover:bg-orange-500/10"
                        )}
                        onClick={() => selectExactChart(spot.id)}
                      >
                        <span className="block truncate text-xs font-black">
                          {spot.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] opacity-70">
                          {spot.stackDepth}bb - {scenarioSublabel(spot)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-zinc-500">
            <Badge className="rounded-full bg-orange-500 text-white">
              {mode === "exact_chart"
                ? "Exact Chart"
                : mode === "family"
                  ? "Family"
                  : mode === "stack"
                    ? "Stack"
                    : "Full Pool"}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              {sessionStats.correct}/{sessionStats.total} correct
            </span>
            <span className="inline-flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-orange-300" />
              {accuracy}% accuracy
            </span>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              {sessionStats.streak} streak
            </span>
            <span>Charts covered: {chartsCovered.length}</span>
            {actionsCovered.length > 0 && (
              <span>
                Actions:{" "}
                {actionsCovered
                  .slice(0, 4)
                  .map(action => ACTION_LABELS[action])
                  .join(", ")}
              </span>
            )}
            {!isAuthenticated && (
              <span className="ml-auto">
                Practice is local while logged out.
              </span>
            )}
          </div>
        </section>

        <section className="flex flex-1 items-start justify-center">
          {trainerEnabled &&
            (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
              <Skeleton className="h-[520px] w-full rounded-[1.35rem] bg-white/10" />
            )}

          {trainerSpot && (
            <div className="w-full space-y-3">
              <div
                ref={questionCardRef}
                className="grid gap-3 lg:grid-cols-[0.85fr_1fr]"
              >
                <TableContext
                  title={trainerSpot.chart.title}
                  stackDepth={trainerSpot.chart.stackDepth}
                  heroPosition={trainerSpot.chart.heroPosition}
                  villainPosition={trainerSpot.chart.villainPosition}
                  spotGroup={trainerSpot.chart.spotGroup}
                />
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
                  showContextBadges={false}
                  onAnswer={handleAnswer}
                  onSkip={handleNext}
                  className="w-full"
                />
              </div>

              {answerReveal && (
                <div
                  ref={resultRevealRef}
                  className="scroll-mt-4 md:scroll-mt-6"
                >
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
                  />
                </div>
              )}
            </div>
          )}

          {trainerEnabled &&
            !trainerSpotLoading &&
            !trainerSpotFetching &&
            !trainerSpot && (
              <Card className="w-full max-w-lg rounded-[1.75rem] border-dashed border-white/10 bg-white/[0.06] text-white shadow-xl shadow-black/20">
                <CardContent className="space-y-4 p-8 text-center">
                  <Target className="mx-auto h-10 w-10 text-zinc-500" />
                  <div>
                    <p className="text-sm font-semibold">
                      No trainer hand available
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {trainerSpotError?.message ??
                        "Clear filters or choose a different scenario."}
                    </p>
                  </div>
                  <Button
                    className="rounded-2xl bg-orange-500 text-white hover:bg-orange-600"
                    onClick={startFullRandom}
                  >
                    Train full pool
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
        </section>
      </main>
    </div>
  );
}
