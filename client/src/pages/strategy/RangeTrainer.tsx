import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";
import {
  CheckCircle2,
  ChevronDown,
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

function modeForFilters(stackDepth?: number, spotGroup?: SpotGroup): TrainerMode {
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
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const isComfortablyVisible = rect.top >= 72 && rect.top <= viewportHeight * 0.45;

  if (isComfortablyVisible) return;

  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function replaceTrainerUrl(chartId: number | null) {
  if (typeof window === "undefined") return;

  const nextUrl =
    chartId === null ? "/strategy/trainer" : `/strategy/trainer?chartId=${chartId}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export default function RangeTrainer() {
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const params = new URLSearchParams(search);
  const chartIdParamRaw = params.get("chartId");
  const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
  const initialChartId = chartIdParam !== undefined && Number.isFinite(chartIdParam)
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
  const [openGroups, setOpenGroups] = useState<Partial<Record<SpotGroup, boolean>>>(
    {}
  );
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
  const { data: allVisibleStackSpots = [] } =
    trpc.strategy.listSpots.useQuery({ stackDepth });

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
  }, [mode, recentChartIds, recentHandKeys, selectedChartId, stackDepth, spotGroup]);

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

  const groupedSpots = useMemo(
    () =>
      SPOT_GROUPS.map(group => ({
        group,
        spots: filteredSpots.filter(spot => spot.spotGroup === group),
      })).filter(section => section.spots.length > 0),
    [filteredSpots]
  );

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

  function groupIsOpen(group: SpotGroup) {
    if (searchTerm.trim()) return true;
    if (spotGroup) return group === spotGroup;
    if (mode === "exact_chart" && selectedSpot?.spotGroup === group) return true;
    return openGroups[group] ?? group === "RFI";
  }

  function toggleGroup(group: SpotGroup) {
    setOpenGroups(previous => ({
      ...previous,
      [group]: !groupIsOpen(group),
    }));
  }

  function scenarioSublabel(spot: SpotSummary) {
    return spot.villainPosition
      ? `${spot.heroPosition} vs ${spot.villainPosition}`
      : SPOT_GROUP_LABELS[spot.spotGroup];
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] pb-24 md:h-[calc(100dvh-4rem)] md:overflow-hidden md:pb-0">
      <div className="grid min-h-full grid-cols-1 md:h-full md:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5 backdrop-blur md:min-h-0 md:border-b-0 md:border-r">
          <div className="space-y-4 border-b border-slate-200/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="flex items-center gap-2 text-base font-black text-foreground">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-orange-300 shadow-lg shadow-zinc-950/15">
                    <Target className="h-4 w-4" />
                  </span>
                  Range Trainer
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Train one chart, one family, one stack, or the full pool.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-9 shrink-0 gap-1.5 rounded-full border-slate-200 bg-white px-3 text-xs font-bold shadow-sm"
                onClick={handleShuffle}
                disabled={!trainerEnabled}
              >
                <Shuffle className="h-3.5 w-3.5" />
                Shuffle
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className={cn(
                  "h-9 rounded-2xl text-xs font-black",
                  mode === "full_pool"
                    ? "bg-zinc-950 text-white hover:bg-zinc-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-orange-50"
                )}
                variant={mode === "full_pool" ? "default" : "outline"}
                onClick={startFullRandom}
              >
                Full pool
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1 rounded-2xl border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-orange-50"
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

            <div className="space-y-3 rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-3">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Stack
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  <Button
                    size="sm"
                    variant={stackDepth === undefined ? "default" : "outline"}
                    className={cn(
                      "h-8 rounded-full px-2 text-xs font-bold shadow-sm",
                      stackDepth === undefined
                        ? "bg-zinc-950 text-white hover:bg-zinc-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
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
                        "h-8 rounded-full px-2 text-xs font-bold shadow-sm",
                        stackDepth === depth
                          ? "bg-zinc-950 text-white hover:bg-zinc-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
                      )}
                      onClick={() => setStackFilter(depth)}
                    >
                      {depth}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Family
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <Button
                    size="sm"
                    variant={spotGroup === undefined ? "default" : "outline"}
                    className={cn(
                      "h-8 shrink-0 rounded-full px-3 text-xs font-bold shadow-sm",
                      spotGroup === undefined
                        ? "bg-zinc-950 text-white hover:bg-zinc-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
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
                        "h-8 shrink-0 gap-1.5 rounded-full px-3 text-xs font-bold shadow-sm",
                        spotGroup === group
                          ? "bg-zinc-950 text-white hover:bg-zinc-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
                      )}
                      onClick={() => setFamilyFilter(group)}
                    >
                      {SPOT_GROUP_LABELS[group].replace(" (Open Raise)", "")}
                      {(groupCounts[group] ?? 0) > 0 && (
                        <span className="rounded-full bg-white/15 px-1.5 text-[10px] text-current opacity-75">
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
                  placeholder="Try 40bb sb rfi, btn vs bb..."
                  className="h-11 rounded-2xl border-slate-200 bg-white pl-9 shadow-sm"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-3 md:min-h-0 md:max-h-none md:flex-1">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Scenario Browser
              </p>
              <Badge variant="secondary" className="h-5 rounded-full text-[11px]">
                {filteredSpots.length}
              </Badge>
            </div>

            {spotsLoading && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(index => (
                  <Skeleton key={index} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}

            {!spotsLoading && spots.length === 0 && (
              <Card className="rounded-2xl border-dashed bg-slate-50/80">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No charts available. Run the seed script to add ranges.
                </CardContent>
              </Card>
            )}

            {!spotsLoading && spots.length > 0 && filteredSpots.length === 0 && (
              <Card className="rounded-2xl border-dashed bg-slate-50/80">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  No scenarios match this search. Try "40bb sb rfi" or clear a
                  filter.
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {groupedSpots.map(section => {
                const open = groupIsOpen(section.group);

                return (
                  <div
                    key={section.group}
                    className="rounded-[1.35rem] border border-slate-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                      onClick={() => toggleGroup(section.group)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-black text-slate-950">
                            {SPOT_GROUP_LABELS[section.group]}
                          </p>
                          <Badge
                            variant="secondary"
                            className="h-5 rounded-full px-1.5 text-[10px]"
                          >
                            {section.spots.length}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs leading-tight text-slate-500">
                          {SPOT_GROUP_SUBTITLES[section.group]}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition",
                          open && "rotate-180"
                        )}
                      />
                    </button>

                    {open && (
                      <div className="space-y-1 border-t border-slate-100 p-2">
                        {section.spots.map(spot => {
                          const active =
                            mode === "exact_chart" && selectedChartId === spot.id;

                          return (
                            <button
                              key={spot.id}
                              type="button"
                              className={cn(
                                "group w-full rounded-2xl border p-3 text-left shadow-sm transition",
                                active
                                  ? "border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/15"
                                  : "border-slate-200 bg-slate-50/80 text-foreground hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/60 hover:shadow-md"
                              )}
                              onClick={() => selectExactChart(spot.id)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold">
                                    {spot.title}
                                  </p>
                                  <p
                                    className={cn(
                                      "mt-1 truncate text-xs",
                                      active
                                        ? "text-zinc-400"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {scenarioSublabel(spot)}
                                  </p>
                                </div>
                                <Badge
                                  variant={active ? "default" : "outline"}
                                  className={cn(
                                    "h-6 shrink-0 rounded-full",
                                    active
                                      ? "bg-orange-500 text-white"
                                      : "border-slate-200 bg-white"
                                  )}
                                >
                                  {spot.stackDepth}bb
                                </Badge>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200/80 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Session Quality
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={resetDrill}
                disabled={!trainerEnabled}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-center shadow-sm">
                <p className="text-lg font-bold text-foreground">
                  {sessionStats.total}
                </p>
                <p className="text-[11px] text-muted-foreground">Hands</p>
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-2.5 text-center shadow-sm">
                <p className="text-lg font-bold text-orange-600">
                  {chartsCovered.length}
                </p>
                <p className="text-[11px] text-muted-foreground">Charts</p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50 p-2.5 text-center shadow-sm">
                <p className="text-lg font-bold text-green-600">
                  {actionsCovered.length}
                </p>
                <p className="text-[11px] text-muted-foreground">Actions</p>
              </div>
            </div>
            {actionsCovered.length > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Actions covered:{" "}
                {actionsCovered
                  .slice(0, 5)
                  .map(action => ACTION_LABELS[action])
                  .join(", ")}
              </p>
            )}
            {!isAuthenticated && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Practice works while logged out. Saved weak spots require login.
              </p>
            )}
          </div>
        </aside>

        <main className="min-h-0 p-4 md:overflow-y-auto md:p-6 xl:p-8">
          <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-5">
            <Card className="overflow-hidden rounded-[1.75rem] border-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] text-white shadow-2xl shadow-slate-950/20">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-300">
                      Training
                    </p>
                    <h2 className="text-2xl font-black tracking-tight">
                      {modeLabel}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      {modeHelper}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                      <Badge className="rounded-full bg-orange-500 text-white">
                        {mode === "exact_chart"
                          ? "Exact Chart"
                          : mode === "family"
                            ? "Family Mode"
                            : mode === "stack"
                              ? "Stack Mode"
                              : "Full Pool"}
                      </Badge>
                      {stackDepth !== undefined && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/5 text-zinc-200"
                        >
                          {stackDepth}bb
                        </Badge>
                      )}
                      {spotGroup !== undefined && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/15 bg-white/5 text-zinc-200"
                        >
                          {SPOT_GROUP_LABELS[spotGroup]}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:w-72">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-center">
                      <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-green-400" />
                      <p className="text-lg font-bold">{sessionStats.correct}</p>
                      <p className="text-[11px] text-zinc-400">Correct</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-center">
                      <Target className="mx-auto mb-1 h-4 w-4 text-orange-300" />
                      <p className="text-lg font-bold">{accuracy}%</p>
                      <p className="text-[11px] text-zinc-400">Accuracy</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 text-center">
                      <Flame className="mx-auto mb-1 h-4 w-4 text-amber-300" />
                      <p className="text-lg font-bold">{sessionStats.streak}</p>
                      <p className="text-[11px] text-zinc-400">Streak</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-1 items-start justify-center">
              {trainerEnabled &&
                (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
                  <Skeleton className="h-[440px] w-full max-w-xl rounded-3xl" />
                )}

              {trainerSpot && (
                <div className="w-full max-w-3xl space-y-4">
                  <div ref={questionCardRef}>
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
                  </div>

                  {answerReveal && (
                    <div ref={resultRevealRef} className="scroll-mt-4 md:scroll-mt-6">
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
                    </div>
                  )}
                </div>
              )}

              {trainerEnabled &&
                !trainerSpotLoading &&
                !trainerSpotFetching &&
                !trainerSpot && (
                  <Card className="w-full max-w-lg rounded-[1.75rem] border-dashed bg-white/95 shadow-xl shadow-slate-950/5">
                    <CardContent className="space-y-4 p-8 text-center">
                      <Target className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          No trainer hand available
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
