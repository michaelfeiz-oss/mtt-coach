import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { BookOpen, Clock, Play, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionLegend } from "@/components/strategy/ActionLegend";
import { PreflopSetupControls } from "@/components/strategy/PreflopSetupControls";
import { RangeMatrix } from "@/components/strategy/RangeMatrix";
import { buildActionMap } from "@/components/strategy/utils";
import {
  addRecentStrategySpot,
  loadRecentStrategySpots,
  saveRecentStrategySpots,
  type RecentStrategySpot,
} from "@/lib/strategyRecentSpots";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  POSITIONS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  SPOT_GROUP_SUBTITLES,
  STACK_DEPTHS,
  type Action,
  type Position,
  type SpotGroup,
} from "../../../../shared/strategy";

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

const GROUP_ORDER = new Map(SPOT_GROUPS.map((group, index) => [group, index]));
const POSITION_ORDER = new Map(
  POSITIONS.map((position, index) => [position, index])
);

function parseChartNotes(notesJson?: string | null): string[] {
  if (!notesJson) return [];

  try {
    const parsed = JSON.parse(notesJson);
    return Array.isArray(parsed)
      ? parsed.filter((note): note is string => typeof note === "string")
      : [];
  } catch {
    return [];
  }
}

function positionSort(a: string, b: string) {
  return (
    (POSITION_ORDER.get(a as Position) ?? 99) -
    (POSITION_ORDER.get(b as Position) ?? 99)
  );
}

function sortSpots(a: SpotSummary, b: SpotSummary) {
  return (
    a.stackDepth - b.stackDepth ||
    (GROUP_ORDER.get(a.spotGroup) ?? 99) -
      (GROUP_ORDER.get(b.spotGroup) ?? 99) ||
    positionSort(a.heroPosition, b.heroPosition) ||
    a.title.localeCompare(b.title)
  );
}

function uniqueSorted<T extends string | number>(items: T[]): T[] {
  return Array.from(new Set(items));
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
    SPOT_GROUP_LABELS[spot.spotGroup],
    spot.spotGroup,
  ]
    .join(" ")
    .toLowerCase();
}

function spotMatchesSetup(
  spot: SpotSummary,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined,
  heroPosition: string | undefined,
  villainPosition: string | undefined
) {
  if (stackDepth !== undefined && spot.stackDepth !== stackDepth) return false;
  if (spotGroup !== undefined && spot.spotGroup !== spotGroup) return false;
  if (heroPosition !== undefined && spot.heroPosition !== heroPosition)
    return false;
  if (
    villainPosition !== undefined &&
    (spot.villainPosition ?? "") !== villainPosition
  ) {
    return false;
  }
  return true;
}

export default function StrategyLibrary() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const chartIdParamRaw = params.get("chartId");
  const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
  const initialChartId = Number.isFinite(chartIdParam)
    ? chartIdParam
    : undefined;

  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [heroPosition, setHeroPosition] = useState<string | undefined>(
    undefined
  );
  const [villainPosition, setVillainPosition] = useState<string | undefined>(
    undefined
  );
  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(
    initialChartId
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSpots, setRecentSpots] = useState<RecentStrategySpot[]>([]);

  const {
    data: allSpots = [],
    isLoading: spotsLoading,
    error: spotsError,
  } = trpc.strategy.listSpots.useQuery({});

  const {
    data: chart,
    isLoading: chartLoading,
    error: chartError,
  } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const availableStacks = useMemo(
    () =>
      STACK_DEPTHS.filter(depth =>
        allSpots.some(spot => spot.stackDepth === depth)
      ),
    [allSpots]
  );

  const baseSetupSpots = useMemo(
    () =>
      allSpots
        .filter(spot =>
          spotMatchesSetup(spot, stackDepth, spotGroup, undefined, undefined)
        )
        .sort(sortSpots),
    [allSpots, stackDepth, spotGroup]
  );

  const heroOptions = useMemo(
    () =>
      uniqueSorted(baseSetupSpots.map(spot => spot.heroPosition)).sort(
        positionSort
      ),
    [baseSetupSpots]
  );

  const villainBaseSpots = useMemo(
    () =>
      baseSetupSpots.filter(spot =>
        heroPosition === undefined ? true : spot.heroPosition === heroPosition
      ),
    [baseSetupSpots, heroPosition]
  );

  const villainOptions = useMemo(
    () =>
      uniqueSorted(
        villainBaseSpots
          .map(spot => spot.villainPosition)
          .filter((position): position is string => Boolean(position))
      ).sort(positionSort),
    [villainBaseSpots]
  );

  const matchingSpots = useMemo(
    () =>
      allSpots
        .filter(spot =>
          spotMatchesSetup(
            spot,
            stackDepth,
            spotGroup,
            heroPosition,
            villainPosition
          )
        )
        .sort(sortSpots),
    [allSpots, stackDepth, spotGroup, heroPosition, villainPosition]
  );

  const visibleScenarioSpots = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const base = matchingSpots.length > 0 ? matchingSpots : baseSetupSpots;
    if (!query) return base.slice(0, 12);

    const tokens = query.split(/\s+/).filter(Boolean);
    return base
      .filter(spot => {
        const searchable = searchTextForSpot(spot);
        return tokens.every(token => searchable.includes(token));
      })
      .slice(0, 12);
  }, [baseSetupSpots, matchingSpots, searchTerm]);

  const actionMap = chart ? buildActionMap(chart.actions) : {};
  const chartNotes = parseChartNotes(chart?.notesJson);
  const visibleActions = chart
    ? (Array.from(
        new Set(chart.actions.map(action => action.primaryAction))
      ) as Action[])
    : undefined;

  useEffect(() => {
    setRecentSpots(loadRecentStrategySpots());
  }, []);

  useEffect(() => {
    if (!chart) return;

    setStackDepth(chart.stackDepth);
    setSpotGroup(chart.spotGroup);
    setHeroPosition(chart.heroPosition);
    setVillainPosition(chart.villainPosition ?? undefined);

    const nextSpot: RecentStrategySpot = {
      id: chart.id,
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
    };

    setRecentSpots(previous => {
      const next = addRecentStrategySpot(previous, nextSpot);
      saveRecentStrategySpots(next);
      return next;
    });
  }, [chart?.id]);

  useEffect(() => {
    if (spotsLoading) return;
    if (
      selectedChartId !== undefined &&
      matchingSpots.some(spot => spot.id === selectedChartId)
    ) {
      return;
    }

    setSelectedChartId(matchingSpots[0]?.id);
  }, [matchingSpots, selectedChartId, spotsLoading]);

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

  function selectSpot(spot: SpotSummary | RecentStrategySpot) {
    setSelectedChartId(spot.id);
    setStackDepth(spot.stackDepth);
    setSpotGroup(spot.spotGroup);
    setHeroPosition(spot.heroPosition);
    setVillainPosition(spot.villainPosition ?? undefined);
  }

  function setGroup(nextGroup: SpotGroup | undefined) {
    setSpotGroup(nextGroup);
    setSelectedChartId(undefined);
    setVillainPosition(undefined);
  }

  function setStack(nextStack: number | undefined) {
    setStackDepth(nextStack);
    setSelectedChartId(undefined);
  }

  function setHero(nextHero: string | undefined) {
    setHeroPosition(nextHero);
    setSelectedChartId(undefined);
    setVillainPosition(undefined);
  }

  function setVillain(nextVillain: string | undefined) {
    setVillainPosition(nextVillain);
    setSelectedChartId(undefined);
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_18rem),linear-gradient(180deg,#09090b_0%,#18181b_42%,#0f172a_100%)] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white">
      <main className="mx-auto grid w-full max-w-5xl gap-3 overflow-x-hidden px-3 py-3 sm:px-5 md:gap-4 md:py-5 lg:max-w-[1500px] lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:max-w-[1660px]">
        <header className="flex items-center justify-between gap-3 lg:col-span-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
                <BookOpen className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                  Hand Ranges
                </p>
                <h1 className="truncate text-xl font-black tracking-tight">
                  Compact Range Viewer
                </h1>
              </div>
            </div>
          </div>
          {chart && (
            <Link href={`/strategy/trainer?chartId=${chart.id}`}>
              <Button className="h-9 shrink-0 gap-1.5 rounded-xl bg-orange-500 px-3 text-xs font-black text-white hover:bg-orange-600">
                <Play className="h-3.5 w-3.5" />
                Train
              </Button>
            </Link>
          )}
        </header>

        <section className="min-w-0 rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-2.5 shadow-xl shadow-black/15 backdrop-blur sm:p-3 lg:min-h-[calc(100dvh-9.25rem)] lg:p-3 xl:p-4">
          {chartLoading && selectedChartId !== undefined && (
            <div className="space-y-3 lg:flex lg:min-h-[calc(100dvh-11.5rem)] lg:flex-col">
              <Skeleton className="h-10 w-56 rounded-xl bg-white/10" />
              <Skeleton className="h-80 w-full rounded-2xl bg-white/10" />
            </div>
          )}

          {chartError && (
            <Card className="border-red-500/30 bg-red-500/10 text-white">
              <CardContent className="p-4 text-sm">
                {chartError.message}
              </CardContent>
            </Card>
          )}

          {!chart && !chartLoading && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-center">
              <BookOpen className="mx-auto h-9 w-9 text-zinc-500" />
              <p className="mt-3 text-sm font-bold">No range selected</p>
              <p className="mt-1 text-xs text-zinc-400">
                {spotsError?.message ??
                  "Choose a supported setup below to load a chart."}
              </p>
            </div>
          )}

          {chart && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                    Current Chart
                  </p>
                  <h2 className="mt-0.5 truncate text-lg font-black tracking-tight sm:text-2xl">
                    {chart.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge className="rounded-full bg-orange-500 text-white">
                      {chart.stackDepth}bb
                    </Badge>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-200">
                      {SPOT_GROUP_LABELS[chart.spotGroup]}
                    </Badge>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-200">
                      {chart.heroPosition}
                      {chart.villainPosition
                        ? ` vs ${chart.villainPosition}`
                        : ""}
                    </Badge>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-300">
                      9 players
                    </Badge>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-300">
                      BBA
                    </Badge>
                  </div>
                </div>
                <ActionLegend
                  actions={visibleActions}
                  className="rounded-xl border border-white/10 bg-black/20 p-1.5"
                />
              </div>

              <div className="rounded-[1rem] border border-white/10 bg-zinc-950/55 p-1.5 shadow-inner shadow-black/25 lg:flex lg:flex-1 lg:items-center lg:justify-center lg:p-3 xl:p-4">
                <div className="lg:hidden">
                  <RangeMatrix actions={actionMap} compact size="md" />
                </div>
                <div className="hidden w-full lg:block">
                  <RangeMatrix actions={actionMap} size="lg" />
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-[1.2rem] border border-white/10 bg-zinc-950/75 p-2.5 shadow-xl shadow-black/20 sm:p-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Setup
              </p>
            </div>
            <Badge className="rounded-full border-white/10 bg-white/10 text-zinc-300">
              {matchingSpots.length} match
              {matchingSpots.length === 1 ? "" : "es"}
            </Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr] lg:grid-cols-1">
            <div className="space-y-2.5">
              <PreflopSetupControls
                spotGroup={spotGroup}
                stackDepth={stackDepth}
                heroPosition={heroPosition}
                villainPosition={villainPosition}
                availableStacks={availableStacks}
                heroOptions={heroOptions}
                villainOptions={villainOptions}
                searchTerm={searchTerm}
                searchPlaceholder="40bb SB RFI"
                onSpotGroupChange={setGroup}
                onStackDepthChange={setStack}
                onHeroPositionChange={setHero}
                onVillainPositionChange={setVillain}
                onSearchTermChange={setSearchTerm}
              />

              {recentSpots.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    Recent
                  </p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                    {recentSpots.slice(0, 6).map(spot => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => selectSpot(spot)}
                        className={cn(
                          "shrink-0 rounded-xl border px-2.5 py-1.5 text-left text-xs font-bold transition",
                          selectedChartId === spot.id
                            ? "border-orange-400 bg-orange-500/90 text-white"
                            : "border-white/10 bg-white/[0.06] text-zinc-300 hover:border-orange-300/70"
                        )}
                      >
                        <span className="block max-w-32 truncate">
                          {spot.title}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {spot.stackDepth}bb
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  Matching Spots
                </p>
                <div className="grid max-h-44 gap-1.5 overflow-y-auto pr-1 lg:max-h-64">
                  {spotsLoading && (
                    <>
                      <Skeleton className="h-10 rounded-xl bg-white/10" />
                      <Skeleton className="h-10 rounded-xl bg-white/10" />
                      <Skeleton className="h-10 rounded-xl bg-white/10" />
                    </>
                  )}

                  {!spotsLoading && visibleScenarioSpots.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.04] p-3 text-center text-xs text-zinc-400">
                      No supported chart for this setup yet.
                    </div>
                  )}

                  {visibleScenarioSpots.map(spot => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => selectSpot(spot)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                        selectedChartId === spot.id
                          ? "border-orange-400 bg-orange-500/90 text-white shadow-lg shadow-orange-950/20"
                          : "border-white/10 bg-white/[0.06] text-zinc-200 hover:border-orange-300/70 hover:bg-orange-500/10"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black">
                          {spot.title}
                        </span>
                        <span className="block truncate text-[10px] opacity-70">
                          {SPOT_GROUP_SUBTITLES[spot.spotGroup]}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-black/20 px-2 py-1 text-[10px] font-black">
                        {spot.stackDepth}bb
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {chart && chartNotes.length > 0 && (
                <div className="hidden rounded-xl border border-white/10 bg-white/[0.045] p-3 text-zinc-200 lg:block">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Spot Notes
                  </p>
                  <ul className="space-y-1.5">
                    {chartNotes.map((note, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-xs leading-relaxed"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[9px] font-black text-white">
                          {index + 1}
                        </span>
                        <span className="text-zinc-300">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {chart && chartNotes.length > 0 && (
          <section className="rounded-[1.2rem] border border-white/10 bg-white/[0.055] p-2.5 text-zinc-200 sm:p-3 lg:hidden">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
              Spot Notes
            </p>
            <ul className="space-y-1.5">
              {chartNotes.map((note, index) => (
                <li key={index} className="flex gap-2 text-xs leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
                    {index + 1}
                  </span>
                  <span className="text-zinc-300">{note}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
