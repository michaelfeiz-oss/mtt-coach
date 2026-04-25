import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { BookOpen, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionLegend } from "@/components/strategy/ActionLegend";
import { PreflopSetupControls } from "@/components/strategy/PreflopSetupControls";
import { RangeMatrix } from "@/components/strategy/RangeMatrix";
import { StrategyTheoryNotes } from "@/components/strategy/StrategyTheoryNotes";
import { buildActionMap } from "@/components/strategy/utils";
import {
  addRecentStrategySpot,
  loadRecentStrategySpots,
  saveRecentStrategySpots,
} from "@/lib/strategyRecentSpots";
import { trpc } from "@/lib/trpc";
import {
  buildPriorityPackSummary,
  getRelatedPriorityDrillPacksForSpot,
} from "@shared/drillPacks";
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
  const chartIdFromSearch = useMemo(() => {
    const params = new URLSearchParams(search);
    const chartIdParamRaw = params.get("chartId");
    const chartIdParam = chartIdParamRaw ? Number(chartIdParamRaw) : undefined;
    return Number.isFinite(chartIdParam) ? chartIdParam : undefined;
  }, [search]);

  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [heroPosition, setHeroPosition] = useState<string | undefined>(
    undefined
  );
  const [villainPosition, setVillainPosition] = useState<string | undefined>(
    undefined
  );
  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(
    chartIdFromSearch
  );

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
  const visibleActions = chart
    ? (Array.from(
        new Set(chart.actions.map(action => action.primaryAction))
      ) as Action[])
    : undefined;
  const relatedDrillPacks = useMemo(
    () =>
      chart
        ? getRelatedPriorityDrillPacksForSpot(chart, allSpots).filter(
            pack => pack.supported
          )
        : [],
    [allSpots, chart]
  );

  useEffect(() => {
    if (chartIdFromSearch !== undefined && chartIdFromSearch !== selectedChartId) {
      setSelectedChartId(chartIdFromSearch);
    }
  }, [chartIdFromSearch, selectedChartId]);

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
  }, [chart]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextUrl =
      selectedChartId !== undefined
        ? `/strategy/library?chartId=${selectedChartId}`
        : "/strategy/library";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [selectedChartId]);

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
        <header className="app-surface-elevated p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="app-eyebrow">Hand Ranges</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">
                Preflop Chart Viewer
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Adjust the setup inline, study the exact matrix, then train the same
            spot without leaving the flow.
          </p>
        </header>

        <section className="app-surface p-3 sm:p-4">
          <div className="space-y-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Current Chart
                </p>
                <h2 className="mt-0.5 truncate text-lg font-black tracking-tight sm:text-[1.65rem]">
                  {chart?.title ?? "Choose a supported preflop spot"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {chart
                    ? `${SPOT_GROUP_LABELS[chart.spotGroup]} · ${displayPositionLabel(
                        chart.heroPosition
                      )}${chart.villainPosition ? ` vs ${displayPositionLabel(chart.villainPosition)}` : ""} · 9 players · BBA`
                    : "Decision, stack, hero, and opener stay visible here so you can move around the chart library quickly."}
                </p>
              </div>
            </div>

            <div className="rounded-[1rem] border border-border bg-background/78 p-3">
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
            </div>

            {chart && (
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    {chart.stackDepth}bb
                  </Badge>
                  <Badge className="rounded-full border-border bg-background/85 text-secondary-foreground">
                    {SPOT_GROUP_LABELS[chart.spotGroup].replace(
                      " (Open Raise)",
                      ""
                    )}
                  </Badge>
                  <Badge className="rounded-full border-border bg-background/85 text-secondary-foreground">
                    {displayPositionLabel(chart.heroPosition)}
                    {chart.villainPosition
                      ? ` vs ${displayPositionLabel(chart.villainPosition)}`
                      : ""}
                  </Badge>
                  <Badge className="rounded-full border-border bg-background/85 text-secondary-foreground">
                    BBA
                  </Badge>
                </div>
                <ActionLegend actions={visibleActions} />
              </div>
            )}

            {chartLoading && selectedChartId !== undefined && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-56 rounded-xl" />
                <Skeleton className="h-80 w-full rounded-2xl" />
              </div>
            )}

            {chartError && (
              <Card className="border-red-200 bg-red-50 text-red-800">
                <CardContent className="p-4 text-sm">
                  {chartError.message}
                </CardContent>
              </Card>
            )}

            {!chart && !chartLoading && (
              <div className="rounded-2xl border border-dashed border-border bg-background/82 p-6 text-center">
                <BookOpen className="mx-auto h-9 w-9 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold">No chart selected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {spotsError?.message ??
                    "Choose a supported setup to load a preflop chart."}
                </p>
              </div>
            )}

            {chart && (
              <>
                <div className="rounded-[1rem] border border-border/80 bg-background/88 p-1 sm:p-1.5">
                  <div className="md:hidden">
                    <RangeMatrix actions={actionMap} compact size="md" />
                  </div>
                  <div className="hidden md:block">
                    <RangeMatrix actions={actionMap} size="lg" />
                  </div>
                </div>

                <StrategyTheoryNotes
                  spotGroup={chart.spotGroup}
                  stackDepth={chart.stackDepth}
                  heroPosition={chart.heroPosition}
                  villainPosition={chart.villainPosition}
                />

                {relatedDrillPacks.length > 0 && (
                  <section className="rounded-[1rem] border border-border bg-background/78 p-3 sm:p-4">
                    <div className="mb-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Related Drill Packs
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Launch a focused drill pack when this spot sits inside a high-value leak zone.
                      </p>
                    </div>
                    <div className="grid gap-2.5">
                      {relatedDrillPacks.map(pack => (
                        <div
                          key={pack.id}
                          className="rounded-xl border border-border bg-card p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {pack.title}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {pack.purpose}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="rounded-full">
                                  {buildPriorityPackSummary(pack)}
                                </Badge>
                                {pack.focusTags.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="rounded-full"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Link href={`/strategy/trainer?packId=${pack.id}`}>
                              <Button className="h-10 rounded-xl px-4 text-sm font-semibold">
                                Start Drill
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="pt-1">
                  <Link href={`/strategy/trainer?chartId=${chart.id}`}>
                    <Button className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-[#FF8A1F]">
                      <Play className="mr-2 h-4 w-4" />
                      Train This Spot
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
