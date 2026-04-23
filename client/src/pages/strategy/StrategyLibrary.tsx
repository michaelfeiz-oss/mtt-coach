import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { BookOpen, ChevronDown, ChevronUp, Play, SlidersHorizontal } from "lucide-react";
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
} from "@/lib/strategyRecentSpots";
import { trpc } from "@/lib/trpc";
import {
  POSITIONS,
  SPOT_GROUP_LABELS,
  SPOT_GROUPS,
  STACK_DEPTHS,
  type Action,
  type Position,
  type SpotGroup,
} from "@shared/strategy";

type SpotSummary = {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
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

function spotMatchesSetup(
  spot: SpotSummary,
  stackDepth: number | undefined,
  spotGroup: SpotGroup | undefined,
  heroPosition: string | undefined,
  villainPosition: string | undefined
) {
  if (stackDepth !== undefined && spot.stackDepth !== stackDepth) return false;
  if (spotGroup !== undefined && spot.spotGroup !== spotGroup) return false;
  if (heroPosition !== undefined && spot.heroPosition !== heroPosition) {
    return false;
  }
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
  const [setupCollapsed, setSetupCollapsed] = useState(false);

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

  const villainOptions = useMemo(
    () =>
      uniqueSorted(
        baseSetupSpots
          .filter(spot =>
            heroPosition === undefined
              ? true
              : spot.heroPosition === heroPosition
          )
          .map(spot => spot.villainPosition)
          .filter((position): position is string => Boolean(position))
      ).sort(positionSort),
    [baseSetupSpots, heroPosition]
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

  const actionMap = chart ? buildActionMap(chart.actions) : {};
  const chartNotes = parseChartNotes(chart?.notesJson);
  const visibleActions = chart
    ? (Array.from(
        new Set(chart.actions.map(action => action.primaryAction))
      ) as Action[])
    : undefined;
  const setupSummary = [
    {
      label: "Decision",
      value:
        (spotGroup
          ? SPOT_GROUP_LABELS[spotGroup].replace(" (Open Raise)", "")
          : undefined) ?? "Any",
    },
    { label: "Stack", value: stackDepth ? `${stackDepth}bb` : "Any" },
    { label: "Players", value: "9" },
    { label: "Hero", value: heroPosition ?? "Any" },
    { label: "Opener", value: villainPosition ?? "Any / no opener" },
  ];

  useEffect(() => {
    if (!chart) return;

    setStackDepth(chart.stackDepth);
    setSpotGroup(chart.spotGroup);
    setHeroPosition(chart.heroPosition);
    setVillainPosition(chart.villainPosition ?? undefined);

    const nextRecentSpot = {
      id: chart.id,
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
    };
    const updatedRecent = addRecentStrategySpot(
      loadRecentStrategySpots(),
      nextRecentSpot
    );
    saveRecentStrategySpots(updatedRecent);
    setSetupCollapsed(true);
  }, [chart]);

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

  function setGroup(nextGroup: SpotGroup | undefined) {
    setSpotGroup(nextGroup);
    setVillainPosition(undefined);
    setSelectedChartId(undefined);
  }

  function setStack(nextStack: number | undefined) {
    setStackDepth(nextStack);
    setSelectedChartId(undefined);
  }

  function setHero(nextHero: string | undefined) {
    setHeroPosition(nextHero);
    setVillainPosition(undefined);
    setSelectedChartId(undefined);
  }

  function setVillain(nextVillain: string | undefined) {
    setVillainPosition(nextVillain);
    setSelectedChartId(undefined);
  }

  return (
    <div className="app-shell min-h-[calc(100dvh-4rem)] overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-foreground">
      <main className="mx-auto w-full max-w-4xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
        <header className="app-surface p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-black/20">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Hand Ranges
                  </p>
                  <h1 className="truncate text-xl font-black tracking-tight">
                    Preflop Chart Viewer
                  </h1>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Select a setup, review the range, then train the same spot.
              </p>
            </div>
            {chart && (
              <Link href={`/strategy/trainer?chartId=${chart.id}`}>
                <Button
                  variant="outline"
                  className="h-9 shrink-0 gap-1.5 rounded-xl border-border/80 bg-accent/55 px-3 text-xs font-semibold text-secondary-foreground hover:bg-accent"
                >
                  <Play className="h-3.5 w-3.5" />
                  Train
                </Button>
              </Link>
            )}
          </div>
        </header>

        <section className="app-surface bg-card/90 p-3 sm:p-3.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Setup
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-7 rounded-lg px-2 text-[11px] font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              onClick={() => setSetupCollapsed(current => !current)}
            >
              {setupCollapsed ? "Edit setup" : "Collapse"}
              {setupCollapsed ? (
                <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="ml-1.5 h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {setupCollapsed ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {setupSummary.map(item => (
                <Badge
                  key={item.label}
                  className="rounded-full border border-border/75 bg-accent/55 px-2 py-1 text-[10px] font-semibold text-secondary-foreground"
                >
                  <span className="mr-1 text-muted-foreground">{item.label}:</span>
                  <span>{item.value}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <PreflopSetupControls
              spotGroup={spotGroup}
              stackDepth={stackDepth}
              heroPosition={heroPosition}
              villainPosition={villainPosition}
              availableStacks={availableStacks}
              heroOptions={heroOptions}
              villainOptions={villainOptions}
              onSpotGroupChange={setGroup}
              onStackDepthChange={setStack}
              onHeroPositionChange={setHero}
              onVillainPositionChange={setVillain}
            />
          )}
        </section>

        <section className="app-surface p-3 sm:p-4">
          {chartLoading && selectedChartId !== undefined && (
            <div className="space-y-3">
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
            <div className="rounded-2xl border border-dashed border-border/75 bg-accent/40 p-6 text-center">
              <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-bold">No chart selected</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {spotsError?.message ??
                  "Choose a supported setup to load a preflop chart."}
              </p>
            </div>
          )}

          {chart && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Current Chart
                  </p>
                  <h2 className="mt-0.5 truncate text-lg font-black tracking-tight sm:text-2xl">
                    {chart.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge className="rounded-full bg-primary text-primary-foreground">
                      {chart.stackDepth}bb
                    </Badge>
                    <Badge className="rounded-full border-border/80 bg-accent/55 text-secondary-foreground">
                      {SPOT_GROUP_LABELS[chart.spotGroup]}
                    </Badge>
                    <Badge className="rounded-full border-border/80 bg-accent/55 text-secondary-foreground">
                      {chart.heroPosition}
                      {chart.villainPosition
                        ? ` vs ${chart.villainPosition}`
                        : ""}
                    </Badge>
                    <Badge className="rounded-full border-border/80 bg-accent/55 text-secondary-foreground">
                      BBA
                    </Badge>
                  </div>
                </div>
                <ActionLegend
                  actions={visibleActions}
                  className="rounded-xl border border-border/80 bg-accent/45 p-1.5"
                />
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-accent/50 p-1 shadow-inner shadow-black/25 sm:p-2.5">
                <div className="md:hidden">
                  <RangeMatrix actions={actionMap} compact size="md" />
                </div>
                <div className="hidden md:block">
                  <RangeMatrix actions={actionMap} size="lg" />
                </div>
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-accent/45 p-3 text-secondary-foreground">
                <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
                  Spot Notes
                </p>
                {chartNotes.length > 0 ? (
                  <ul className="space-y-1.5">
                    {chartNotes.map((note, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-xs leading-relaxed"
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                          {index + 1}
                        </span>
                        <span className="text-secondary-foreground">{note}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No notes saved for this spot yet.
                  </p>
                )}
              </div>

              <div className="pt-1">
                <Link href={`/strategy/trainer?chartId=${chart.id}`}>
                  <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-[#FF8A1F]">
                    Train This Spot
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
