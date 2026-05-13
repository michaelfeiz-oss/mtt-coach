import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { BookOpen, CheckCircle2, Flame, Lock, Target } from "lucide-react";
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
import {
  getPriorityDrillPack,
  resolvePriorityDrillPack,
} from "@shared/drillPacks";
import { type TrainerAttemptConfidence } from "@shared/coachingLoop";
import {
  getLeakFamily,
  suggestLeakFamilyFromTrainerMiss,
} from "@shared/leakFamilies";
import { canonicalSpotContextFromChart } from "@shared/spotIds";
import { getSpotNote } from "@shared/spotNotes";
import { buildStrategyChartPresentation } from "@shared/strategyPresentation";
import {
  displayPositionLabel,
  POSITIONS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  type Action,
  type Position,
  type SpotGroup,
} from "@shared/strategy";

type TrainerMode =
  | "current_spot"
  | "decision_family"
  | "random_spot"
  | "priority_pack";

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
  attemptId: number | null;
  confidence: TrainerAttemptConfidence | null;
}

type SpotSummary = {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  sourceLabel?: string | null;
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
  spotGroup: SpotGroup | undefined,
  packId?: string | null
) {
  if (mode === "priority_pack" && packId) {
    return getPriorityDrillPack(packId)?.title ?? "Priority drill pack";
  }
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
  spotGroup: SpotGroup | undefined,
  packId?: string | null
) {
  if (mode === "priority_pack" && packId) {
    return (
      getPriorityDrillPack(packId)?.purpose ??
      "Focused drill pack built from trainer-safe preflop spots."
    );
  }
  if (mode === "current_spot") {
    return "Drill this chart one decision at a time.";
  }
  if (mode === "decision_family" && spotGroup && stackDepth) {
    return `Drilling ${SPOT_GROUP_LABELS[spotGroup]} spots at ${stackDepth}bb.`;
  }
  if (mode === "decision_family" && spotGroup) {
    return `Drilling ${SPOT_GROUP_LABELS[spotGroup]} across trainer-safe stacks.`;
  }
  if (stackDepth) return `Drilling preflop spots at ${stackDepth}bb.`;
  return "Drilling trainer-safe 15bb / 25bb / 40bb preflop spots.";
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

function replaceTrainerUrl(options: { chartId?: number | null; packId?: string | null }) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (options.chartId) params.set("chartId", String(options.chartId));
  if (options.packId) params.set("packId", options.packId);
  const nextUrl = params.size > 0 ? `/strategy/trainer?${params}` : "/strategy/trainer";
  window.history.replaceState(window.history.state, "", nextUrl);
}

export default function RangeTrainer() {
  const search = useSearch();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { chartIdFromSearch, packIdFromSearch } = useMemo(() => {
    const params = new URLSearchParams(search);
    const chartIdParamRaw = params.get("chartId");
    const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
    const packIdParam = params.get("packId");
    return {
      chartIdFromSearch:
        chartIdParam !== undefined && Number.isFinite(chartIdParam)
          ? chartIdParam
          : null,
      packIdFromSearch: packIdParam,
    };
  }, [search]);

  const [mode, setMode] = useState<TrainerMode>(
    chartIdFromSearch !== null
      ? "current_spot"
      : packIdFromSearch
        ? "priority_pack"
        : "random_spot"
  );
  const [selectedChartId, setSelectedChartId] = useState<number | null>(
    chartIdFromSearch
  );
  const [selectedPackId, setSelectedPackId] = useState<string | null>(
    packIdFromSearch
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
  const [missLeakCounts, setMissLeakCounts] = useState<
    Record<string, number>
  >({});
  const [answerReveal, setAnswerReveal] = useState<AnswerRevealState | null>(
    null
  );
  const [questionVersion, setQuestionVersion] = useState(0);

  const questionCardRef = useRef<HTMLDivElement | null>(null);
  const resultRevealRef = useRef<HTMLDivElement | null>(null);
  const questionStartedAtRef = useRef<number>(Date.now());

  const { data: allStudySpots = [] } = trpc.strategy.listSpots.useQuery({});
  const { data: spots = [] } = trpc.strategy.listTrainerSpots.useQuery({
    stackDepth,
    spotGroup,
  });
  const { data: selectedStudyChart } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId ?? 1 },
    {
      enabled: mode === "current_spot" && selectedChartId !== null,
      retry: false,
    }
  );
  const resolvedPack = useMemo(() => {
    if (!selectedPackId) return null;
    const pack = getPriorityDrillPack(selectedPackId);
    return pack ? resolvePriorityDrillPack(pack.id, allStudySpots) : null;
  }, [allStudySpots, selectedPackId]);
  const selectedSpot = useMemo(
    () => allStudySpots.find(spot => spot.id === selectedChartId),
    [allStudySpots, selectedChartId]
  );

  const trainerInput = useMemo(() => {
    const input: {
      chartId?: number;
      chartIds?: number[];
      stackDepth?: number;
      spotGroup?: SpotGroup;
      heroPosition?: Position;
      villainPosition?: Position;
      focusHandCodes?: string[];
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

    if (mode === "priority_pack" && resolvedPack?.supported) {
      input.chartIds = resolvedPack.trainerChartIds;
      input.focusHandCodes = resolvedPack.focusHandCodes;
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
    resolvedPack,
    stackDepth,
    spotGroup,
    villainPosition,
  ]);

  const selectedStudyChartPresentation = useMemo(
    () =>
      selectedStudyChart
        ? buildStrategyChartPresentation(selectedStudyChart)
        : null,
    [selectedStudyChart]
  );
  const directChartBlocked =
    mode === "current_spot" &&
    selectedChartId !== null &&
    selectedStudyChartPresentation !== null &&
    !selectedStudyChartPresentation.trainerAllowed;
  const trainerEnabled =
    mode === "priority_pack"
      ? Boolean(resolvedPack?.trainerAvailable)
      : mode !== "current_spot" ||
        (selectedChartId !== null && !directChartBlocked);
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

  const submitAttempt = trpc.trainerAttempts.submit.useMutation({
    onError: error => {
      toast.error(`Could not submit answer: ${error.message}`);
    },
  });
  const updateConfidence = trpc.trainerAttempts.updateConfidence.useMutation({
    onError: error => {
      toast.error(`Could not save confidence: ${error.message}`);
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

  const activeSpot = trainerSpot?.chart ?? selectedSpot ?? selectedStudyChart;
  const activeSpotPresentation = useMemo(
    () => (activeSpot ? buildStrategyChartPresentation(activeSpot) : null),
    [activeSpot]
  );
  const revealChartPresentation = useMemo(
    () => (revealChart ? buildStrategyChartPresentation(revealChart) : null),
    [revealChart]
  );
  const fallbackModeLabel = formatModeLabel(
    mode,
    activeSpot,
    stackDepth,
    spotGroup,
    selectedPackId
  );
  const modeLabel =
    mode === "current_spot" && activeSpotPresentation
      ? activeSpotPresentation.title
      : fallbackModeLabel;
  const modeHelper = filterSummary(mode, stackDepth, spotGroup, selectedPackId);
  const currentLeakHintId =
    answerReveal && trainerSpot
      ? (() => {
          const context = canonicalSpotContextFromChart(trainerSpot.chart);
          return context
            ? suggestLeakFamilyFromTrainerMiss({
                context,
                handCode: answerReveal.handCode,
                selectedAction: answerReveal.selectedAction,
                correctAction: answerReveal.correctAction,
              })
            : null;
        })()
      : null;
  const repeatedLeakHintId = Object.entries(missLeakCounts)
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])[0]?.[0];
  const leakHint = getLeakFamily(repeatedLeakHintId ?? currentLeakHintId);
  const recommendedPack = useMemo(() => {
    const nextPackId = leakHint?.relatedPackIds?.[0];
    if (!nextPackId) return null;
    const pack = getPriorityDrillPack(nextPackId);
    return pack ? resolvePriorityDrillPack(pack.id, allStudySpots) : null;
  }, [allStudySpots, leakHint]);

  useEffect(() => {
    if (chartIdFromSearch !== null) {
      if (selectedChartId !== chartIdFromSearch || mode !== "current_spot") {
        setSelectedChartId(chartIdFromSearch);
        setSelectedPackId(null);
        setMode("current_spot");
        resetSessionState();
      }
      return;
    }

    if (packIdFromSearch) {
      if (selectedPackId !== packIdFromSearch || mode !== "priority_pack") {
        setSelectedChartId(null);
        setSelectedPackId(packIdFromSearch);
        setMode("priority_pack");
        resetSessionState();
      }
      return;
    }

    if (mode === "current_spot" && selectedChartId !== null) {
      setSelectedChartId(null);
      setSelectedPackId(null);
      setMode(modeForFilters(stackDepth, spotGroup));
      resetSessionState();
    }
  }, [
    chartIdFromSearch,
    mode,
    packIdFromSearch,
    selectedChartId,
    selectedPackId,
    stackDepth,
    spotGroup,
  ]);

  useEffect(() => {
    if (!answerReveal) return;
    const timeout = window.setTimeout(() => {
      scrollElementIntoComfortView(resultRevealRef.current);
    }, 80);
    return () => window.clearTimeout(timeout);
  }, [answerReveal]);

  useEffect(() => {
    if (!trainerSpot) return;
    questionStartedAtRef.current = Date.now();
  }, [questionVersion, trainerSpot?.chartId, trainerSpot?.handCode]);

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
    setMissLeakCounts({});
    setAnswerReveal(null);
    setQuestionVersion(0);
  }

  function setStackFilter(nextStackDepth: number | undefined) {
    setStackDepth(nextStackDepth);
    setSelectedChartId(null);
    setSelectedPackId(null);
    setMode(modeForFilters(nextStackDepth, spotGroup));
    replaceTrainerUrl({});
    resetSessionState();
  }

  function setFamilyFilter(nextSpotGroup: SpotGroup | undefined) {
    setSpotGroup(nextSpotGroup);
    setSelectedChartId(null);
    setSelectedPackId(null);
    setMode(modeForFilters(stackDepth, nextSpotGroup));
    replaceTrainerUrl({});
    resetSessionState();
  }

  function setHeroFilter(nextHeroPosition: string | undefined) {
    setHeroPosition(nextHeroPosition);
    setVillainPosition(undefined);
    setSelectedChartId(null);
    setSelectedPackId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl({});
    resetSessionState();
  }

  function setVillainFilter(nextVillainPosition: string | undefined) {
    setVillainPosition(nextVillainPosition);
    setSelectedChartId(null);
    setSelectedPackId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl({});
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
    const responseTimeMs = Math.max(0, Date.now() - questionStartedAtRef.current);

    setAnswerReveal({
      chartId: trainerSpot.chartId,
      handCode: trainerSpot.handCode,
      selectedAction,
      correctAction: trainerSpot.correctAction,
      isCorrect,
      attemptId: null,
      confidence: null,
    });

    submitAttempt.mutate(
      {
        chartId: trainerSpot.chartId,
        handCode: trainerSpot.handCode,
        selectedAction,
        drillPackId: mode === "priority_pack" ? selectedPackId ?? undefined : undefined,
        responseTimeMs,
      },
      {
        onSuccess: result => {
          setAnswerReveal(previous => {
            if (
              !previous ||
              previous.chartId !== trainerSpot.chartId ||
              previous.handCode !== trainerSpot.handCode
            ) {
              return previous;
            }

            const nextState = {
              ...previous,
              attemptId: result?.attemptId ?? null,
            };

            if (nextState.attemptId && nextState.confidence) {
              updateConfidence.mutate({
                attemptId: nextState.attemptId,
                confidence: nextState.confidence,
              });
            }

            return nextState;
          });

          void utils.weakSpots.getTop.invalidate();
          void utils.weakSpots.getSummary.invalidate();
          void utils.suggestions.getTodayTraining.invalidate();
          void utils.hands.getReviewQueueSummary.invalidate();
          void utils.strategy.getRecentAttempts.invalidate();
          void utils.strategy.getProgress.invalidate();
          void utils.strategy.getStats.invalidate();
        },
      }
    );

    setSessionStats(previous => ({
      total: previous.total + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? previous.streak + 1 : 0,
    }));

    if (!isCorrect) {
      const canonicalSpotContext = canonicalSpotContextFromChart(trainerSpot.chart);
      if (canonicalSpotContext) {
        const leakId = suggestLeakFamilyFromTrainerMiss({
          context: canonicalSpotContext,
          handCode: trainerSpot.handCode,
          selectedAction,
          correctAction: trainerSpot.correctAction,
        });

        if (leakId) {
          setMissLeakCounts(previous => ({
            ...previous,
            [leakId]: (previous[leakId] ?? 0) + 1,
          }));
        }
      }
    }
  }

  function handleNext() {
    rememberQuestionForRepeatGuard();
    setAnswerReveal(null);
    setQuestionVersion(version => version + 1);
    window.setTimeout(() => {
      scrollElementIntoComfortView(questionCardRef.current);
    }, 80);
  }

  function handleConfidenceSelect(confidence: TrainerAttemptConfidence) {
    setAnswerReveal(previous => {
      if (!previous) return previous;
      return {
        ...previous,
        confidence,
      };
    });

    if (answerReveal?.attemptId) {
      updateConfidence.mutate({
        attemptId: answerReveal.attemptId,
        confidence,
      });
    }
  }

  function unlockCurrentSpotAndContinue() {
    setSelectedChartId(null);
    setSelectedPackId(null);
    setMode(modeForFilters(stackDepth, spotGroup));
    replaceTrainerUrl({});
    resetSessionState();
    void refetchTrainerSpot();
  }

  return (
    <div className="app-shell min-h-[calc(100dvh-4rem)] overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-foreground">
      <main className="mx-auto w-full max-w-[58rem] space-y-3 px-3 py-3 sm:space-y-3.5 sm:px-5 sm:py-5">
        <header className="app-surface-elevated p-4 sm:p-4.5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Target className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="app-eyebrow">Range Trainer</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">
                Range Trainer
              </h1>
            </div>
          </div>
        </header>

        <section className="app-surface p-3 sm:p-3.5">
          <div className="space-y-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Current Node
                </p>
                <h2 className="truncate text-lg font-black tracking-tight sm:text-[1.4rem]">
                  {modeLabel}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {modeHelper}
                </p>
                {activeSpotPresentation?.sourceHelper &&
                  activeSpotPresentation.sourceStatus !== "source_backed" && (
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {activeSpotPresentation.sourceHelper}
                  </p>
                  )}
                {activeSpotPresentation?.sourceStatus === "source_backed" &&
                  activeSpotPresentation.provenanceNote && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {activeSpotPresentation.provenanceNote}
                    </p>
                  )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="rounded-full bg-primary text-primary-foreground">
                  BBA
                </Badge>
                <Badge className="rounded-full border-border bg-background/85 text-secondary-foreground">
                  15bb / 25bb / 40bb
                </Badge>
                {activeSpot && (
                  <Badge className="rounded-full border-border bg-background/85 text-secondary-foreground">
                    {displayPositionLabel(activeSpot.heroPosition)}
                    {activeSpot.villainPosition
                      ? ` vs ${displayPositionLabel(activeSpot.villainPosition)}`
                      : ""}
                  </Badge>
                )}
                {activeSpotPresentation?.sourceBadge && (
                  <Badge
                    className={
                      activeSpotPresentation.sourceStatus === "source_backed"
                        ? "rounded-full border-emerald-200 bg-emerald-50 text-emerald-800"
                        : activeSpotPresentation.sourceStatus === "unsupported"
                          ? "rounded-full border-rose-200 bg-rose-50 text-rose-800"
                          : activeSpotPresentation.sourceStatus === "proxy"
                            ? "rounded-full border-blue-200 bg-blue-50 text-blue-700"
                            : "rounded-full border-amber-200 bg-[#FFF7E6] text-[#9A4D12]"
                    }
                  >
                    {activeSpotPresentation.sourceBadge}
                  </Badge>
                )}
                {activeSpotPresentation?.provenanceLabel && (
                  <Badge className="rounded-full border-amber-200 bg-[#FFF7E6] text-[#9A4D12]">
                    {activeSpotPresentation.provenanceLabel}
                  </Badge>
                )}
                {activeSpotPresentation && (
                  <Badge className="rounded-full border-[var(--border-strong)] bg-card text-secondary-foreground">
                    {activeSpotPresentation.trainerAllowed
                      ? "Trainer-safe"
                      : "Study-only"}
                  </Badge>
                )}
                {activeSpotPresentation?.sharedFamilyLabel && (
                  <Badge className="rounded-full border-[var(--border-strong)] bg-card text-secondary-foreground">
                    {activeSpotPresentation.sharedFamilyLabel}
                  </Badge>
                )}
                {resolvedPack && (
                  <Badge className="rounded-full border-[var(--border-strong)] bg-card text-secondary-foreground">
                    Pack - {resolvedPack.trainerSpotCount} trainer-safe
                  </Badge>
                )}
              </div>
            </div>

            {activeSpotPresentation?.trainingGateMessage && (
            <div className="app-note-warning rounded-xl px-3 py-2.5 text-sm">
                {activeSpotPresentation.trainingGateMessage}
              </div>
            )}

            <div className="rounded-[1rem] border border-border bg-secondary p-3">
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
                compact
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-[11px] text-secondary-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  {sessionStats.correct}/{sessionStats.total}
                </span>
                <span>{accuracy}% accuracy</span>
                <span className="inline-flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-600" />
                  {sessionStats.streak} streak
                </span>
              </div>
              {!isAuthenticated && (
                <p className="text-[10px] text-muted-foreground">
                  Logged-out practice stays local to this device.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {mode === "priority_pack" && resolvedPack && !resolvedPack.trainerAvailable && (
              <Card className="border-amber-200 bg-[#FFF7E6] text-[#9A4D12]">
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="font-semibold">{resolvedPack.title}</p>
                <p>
                  {resolvedPack.purpose} This pack currently has no trainer-safe
                  spots. The study-only nodes stay visible for reference, but
                  they are blocked from quizzes until a human approval exists.
                </p>
                {resolvedPack.blockedSpotCount > 0 && (
                  <p className="text-xs text-[#9A4D12]">
                    {resolvedPack.blockedSpotCount} study-only spot
                    {resolvedPack.blockedSpotCount === 1 ? "" : "s"} blocked
                    from trainer
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {directChartBlocked && selectedStudyChartPresentation && selectedChartId !== null && (
            <Card className="rounded-[1.2rem] border-amber-200 bg-[#FFF7E6] text-[#9A4D12] shadow-none">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#9A4D12]">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Study-only chart</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#9A4D12]">
                      {selectedStudyChartPresentation.trainingGateMessage ??
                        "This chart is blocked from training because it is not exact source-backed."}
                    </p>
                    <p className="mt-2 text-xs text-[#9A4D12]">
                      Keep it in the chart viewer for study, but do not use it
                      for answer validation.
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <Link href={`/strategy/library?chartId=${selectedChartId}`}>
                    <Button
                      variant="outline"
                    className="h-10 w-full rounded-xl border-amber-300 bg-white text-[#9A4D12] hover:bg-[#FFF3E8]"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      View chart
                    </Button>
                  </Link>
                  <Button
                    className="h-10 rounded-xl"
                    onClick={unlockCurrentSpotAndContinue}
                  >
                    Go to trainer-safe spot
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {trainerEnabled &&
            (trainerSpotLoading || (trainerSpotFetching && !trainerSpot)) && (
              <Skeleton className="h-[480px] w-full rounded-[1.2rem]" />
            )}

          {trainerSpot && (
            <div className="space-y-3">
              <div
                ref={questionCardRef}
                className="space-y-2 rounded-[1.2rem] border border-border bg-card p-3 shadow-[0_10px_26px_rgba(15,23,42,0.12)] sm:p-3.5"
              >
                <TableContext
                  title={activeSpotPresentation?.title ?? trainerSpot.chart.title}
                  stackDepth={trainerSpot.chart.stackDepth}
                  heroPosition={trainerSpot.chart.heroPosition}
                  villainPosition={trainerSpot.chart.villainPosition}
                  spotGroup={trainerSpot.chart.spotGroup}
                  embedded
                />

                <div className="h-px bg-border/80" />

                <TrainerCard
                  key={`${trainerSpot.chartId}-${trainerSpot.handCode}-${questionVersion}`}
                  chartId={trainerSpot.chartId}
                  handCode={trainerSpot.handCode}
                  spotLabel={activeSpotPresentation?.title ?? trainerSpot.chart.title}
                  spotContext={
                    activeSpotPresentation?.contextLine ??
                    SPOT_GROUP_LABELS[trainerSpot.chart.spotGroup]
                  }
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
                      contextChart={trainerSpot.chart}
                      isLoadingChart={revealChartLoading || revealChartFetching}
                      chartId={answerReveal.chartId}
                      handCode={answerReveal.handCode}
                      selectedAction={answerReveal.selectedAction}
                      correctAction={answerReveal.correctAction}
                      isCorrect={answerReveal.isCorrect}
                      spotNote={getSpotNote(trainerSpot.chart)}
                      recommendedPack={recommendedPack}
                      confidence={answerReveal.confidence}
                      onConfidenceSelect={handleConfidenceSelect}
                      isSavingConfidence={updateConfidence.isPending}
                      onNext={handleNext}
                      chartPresentation={revealChartPresentation}
                      className="border-border/80 bg-card/90 shadow-none"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {trainerEnabled &&
            !trainerSpotLoading &&
            !trainerSpotFetching &&
            !directChartBlocked &&
            !trainerSpot && (
              <Card className="rounded-[1.2rem] border-dashed border-border bg-card text-foreground">
                <CardContent className="space-y-4 p-6 text-center">
                  <Target className="mx-auto h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold">
                      No trainer hand available
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {trainerSpotError?.message ??
                        "Adjust setup to another trainer-safe preflop spot."}
                    </p>
                  </div>
                  <Button
                    className="rounded-xl"
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
