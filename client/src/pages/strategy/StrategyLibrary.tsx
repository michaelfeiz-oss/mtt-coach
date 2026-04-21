/**
 * client/src/pages/strategy/StrategyLibrary.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Strategy Library page — browse and view range charts.
 * Route: /strategy/library
 *
 * CODEX TASK: Implement the page body.
 *
 * Layout:
 *   - Left sidebar (240px): SpotFilters + list of matching spots
 *   - Right main area: selected chart view (RangeMatrix + ActionLegend + notes)
 *
 * State:
 *   - selectedStackDepth: number | undefined
 *   - selectedSpotGroup: SpotGroup | undefined
 *   - selectedChartId: number | undefined
 *
 * Data:
 *   - trpc.strategy.listSpots.useQuery({ stackDepth, spotGroup }) → spot list
 *   - trpc.strategy.getChart.useQuery({ chartId }) → chart with actions
 *
 * Spot list item:
 *   - Shows title + stack depth badge
 *   - Clicking sets selectedChartId
 *   - Active item highlighted in orange
 *
 * Chart view (right panel):
 *   - Chart title + source label
 *   - Notes (if any) in a collapsible section
 *   - RangeMatrix (size="md") with buildActionMap(chart.actions)
 *   - ActionLegend below matrix
 *   - "Train this spot →" button linking to /strategy/trainer?chartId=X
 *
 * Empty state:
 *   - No spots: "No charts available. Run the seed script to add ranges."
 *   - No selection: "Select a spot from the left to view its range chart."
 *
 * Design:
 *   - Consistent with rest of app (dark theme, orange accents)
 *   - Responsive: on mobile, show list first, matrix on selection
 */

import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { BookOpen, Clock, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { SpotFilters } from "@/components/strategy/SpotFilters";
import { RangeMatrix } from "@/components/strategy/RangeMatrix";
import { ActionLegend } from "@/components/strategy/ActionLegend";
import { buildActionMap } from "@/components/strategy/utils";
import {
  SPOT_GROUP_LABELS,
  SPOT_GROUP_SUBTITLES,
  SPOT_GROUPS,
  type Action,
  type SpotGroup,
} from "../../../../shared/strategy";

const RECENT_SPOTS_KEY = "mtt.strategy.recentSpots";
const RECENT_SPOTS_LIMIT = 6;

interface RecentSpot {
  id: number;
  title: string;
  stackDepth: number;
  spotGroup: SpotGroup;
  spotKey: string;
  heroPosition: string;
  villainPosition?: string | null;
}

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

function loadRecentSpots(): RecentSpot[] {
  try {
    const raw = window.localStorage.getItem(RECENT_SPOTS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((spot): spot is RecentSpot => {
        return (
          spot &&
          typeof spot.id === "number" &&
          typeof spot.title === "string" &&
          typeof spot.stackDepth === "number" &&
          typeof spot.spotGroup === "string" &&
          typeof spot.spotKey === "string" &&
          typeof spot.heroPosition === "string"
        );
      })
      .slice(0, RECENT_SPOTS_LIMIT);
  } catch {
    return [];
  }
}

function saveRecentSpots(spots: RecentSpot[]) {
  try {
    window.localStorage.setItem(
      RECENT_SPOTS_KEY,
      JSON.stringify(spots.slice(0, RECENT_SPOTS_LIMIT))
    );
  } catch {
    // Recently viewed is a convenience only.
  }
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
  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(
    initialChartId
  );
  const [recentSpots, setRecentSpots] = useState<RecentSpot[]>([]);

  const {
    data: spots = [],
    isLoading: spotsLoading,
    error: spotsError,
  } = trpc.strategy.listSpots.useQuery({
    stackDepth,
    spotGroup,
  });
  const { data: countSpots = [] } = trpc.strategy.listSpots.useQuery({
    stackDepth,
  });

  const {
    data: chart,
    isLoading: chartLoading,
    error: chartError,
  } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const actionMap = chart ? buildActionMap(chart.actions) : {};
  const chartNotes = parseChartNotes(chart?.notesJson);
  const visibleActions = chart
    ? (Array.from(
        new Set(chart.actions.map(action => action.primaryAction))
      ) as Action[])
    : undefined;

  const groupCounts = useMemo(
    () =>
      countSpots.reduce<Partial<Record<SpotGroup, number>>>((counts, spot) => {
        counts[spot.spotGroup] = (counts[spot.spotGroup] ?? 0) + 1;
        return counts;
      }, {}),
    [countSpots]
  );

  const groupedSpots = useMemo(
    () =>
      SPOT_GROUPS.map(group => ({
        group,
        spots: spots.filter(spot => spot.spotGroup === group),
      })).filter(group => group.spots.length > 0),
    [spots]
  );

  useEffect(() => {
    setRecentSpots(loadRecentSpots());
  }, []);

  useEffect(() => {
    if (!chart) return;

    const nextSpot: RecentSpot = {
      id: chart.id,
      title: chart.title,
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      spotKey: chart.spotKey,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
    };

    setRecentSpots(previous => {
      const next = [
        nextSpot,
        ...previous.filter(spot => spot.id !== nextSpot.id),
      ].slice(0, RECENT_SPOTS_LIMIT);
      saveRecentSpots(next);
      return next;
    });
  }, [chart?.id]);

  function selectChart(chartId: number) {
    setSelectedChartId(chartId);
  }

  return (
    <div className="flex h-full flex-col gap-0 pb-20 md:flex-row md:pb-0">
      {/* Left sidebar */}
      <div className="flex max-h-[58vh] w-full flex-shrink-0 flex-col border-b border-border md:max-h-none md:w-80 md:border-b-0 md:border-r">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-orange-500" />
            Strategy Library
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick a stack, then choose the spot you want to review.
          </p>
        </div>

        <div className="p-3 border-b border-border">
          <SpotFilters
            stackDepth={stackDepth}
            spotGroup={spotGroup}
            onStackChange={setStackDepth}
            onGroupChange={setSpotGroup}
            groupCounts={groupCounts}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {spotsLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {!spotsLoading && spots.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {spotsError?.message ??
                "No charts available. Run the seed script to add ranges."}
            </div>
          )}

          {recentSpots.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Recently Viewed
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {recentSpots.map(spot => (
                  <button
                    key={spot.id}
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedChartId === spot.id
                        ? "border-orange-500/40 bg-orange-500/15 text-orange-600"
                        : "border-border bg-card hover:bg-muted text-foreground"
                    }`}
                    onClick={() => selectChart(spot.id)}
                  >
                    <div className="truncate font-medium">{spot.title}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="outline" className="h-5 px-1.5 text-xs">
                        {spot.stackDepth}bb
                      </Badge>
                      <span className="truncate text-xs text-muted-foreground">
                        {SPOT_GROUP_LABELS[spot.spotGroup]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {groupedSpots.map(group => (
            <div key={group.group} className="space-y-1.5">
              <div className="px-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {SPOT_GROUP_LABELS[group.group]}
                  </p>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {group.spots.length}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {SPOT_GROUP_SUBTITLES[group.group]}
                </p>
              </div>

              <div className="space-y-1">
                {group.spots.map(spot => (
                  <button
                    key={spot.id}
                    className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                      selectedChartId === spot.id
                        ? "border-orange-500/40 bg-orange-500/15 text-orange-600"
                        : "border-transparent hover:border-border hover:bg-muted text-foreground"
                    }`}
                    onClick={() => selectChart(spot.id)}
                  >
                    <div className="font-medium truncate">{spot.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge variant="outline" className="text-xs h-5 px-1.5">
                        {spot.stackDepth}bb
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {spot.heroPosition}
                        {spot.villainPosition ? ` vs ${spot.villainPosition}` : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {!selectedChartId && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
              <p className="text-sm text-muted-foreground">
                Select a spot from the left to view its range chart.
              </p>
            </div>
          </div>
        )}

        {selectedChartId && chartLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {selectedChartId && chartError && (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {chartError.message}
            </p>
          </div>
        )}

        {chart && (
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  {chart.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="default" className="bg-orange-500">
                    {chart.stackDepth}bb
                  </Badge>
                  <Badge variant="outline">
                    {SPOT_GROUP_LABELS[chart.spotGroup]}
                  </Badge>
                  <Badge variant="outline">
                    {chart.heroPosition}
                    {chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
                  </Badge>
                </div>
                {chart.sourceLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Source: {chart.sourceLabel}
                  </p>
                )}
              </div>
              <Link href={`/strategy/trainer?chartId=${chart.id}`}>
                <Button
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-1 sm:w-auto"
                >
                  <Play className="h-3 w-3" />
                  Train this spot
                </Button>
              </Link>
            </div>

            {/* Notes */}
            {chartNotes.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="pt-3 pb-3">
                  <ul className="space-y-1">
                    {chartNotes.map((note, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex gap-2"
                      >
                        <span className="text-orange-500 flex-shrink-0">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Range matrix */}
            <div className="space-y-2">
              <ActionLegend
                actions={visibleActions}
                className="rounded-md border bg-muted/30 p-2"
              />
              <RangeMatrix actions={actionMap} size="md" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
