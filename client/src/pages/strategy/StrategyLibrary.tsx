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
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col gap-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.1),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] pb-20 md:h-[calc(100dvh-4rem)] md:flex-row md:overflow-hidden md:pb-0">
      {/* Left sidebar */}
      <div className="flex w-full flex-shrink-0 flex-col border-b border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5 backdrop-blur md:h-full md:w-80 md:border-b-0 md:border-r xl:w-[22rem]">
        <div className="border-b border-slate-200/80 p-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-orange-300 shadow-lg shadow-zinc-950/15">
              <BookOpen className="h-4 w-4" />
            </span>
            Strategy Library
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick a stack, then choose the spot you want to review.
          </p>
        </div>

        <div className="border-b border-slate-200/80 bg-slate-50/70 p-3">
          <SpotFilters
            stackDepth={stackDepth}
            spotGroup={spotGroup}
            onStackChange={setStackDepth}
            onGroupChange={setSpotGroup}
            groupCounts={groupCounts}
          />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-3">
          {spotsLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          )}

          {!spotsLoading && spots.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-center text-xs text-muted-foreground">
              {spotsError?.message ??
                "No charts available. Run the seed script to add ranges."}
            </div>
          )}

          {recentSpots.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Recently Viewed
              </div>
              <div className="grid grid-cols-1 gap-2">
                {recentSpots.map(spot => (
                  <button
                    key={spot.id}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left text-sm shadow-sm transition ${
                      selectedChartId === spot.id
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-zinc-950/15"
                        : "border-slate-200 bg-white text-foreground hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-md"
                    }`}
                    onClick={() => selectChart(spot.id)}
                  >
                    <div className="truncate font-medium">{spot.title}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`h-5 rounded-full px-1.5 text-xs ${
                          selectedChartId === spot.id
                            ? "border-white/15 bg-white/10 text-zinc-200"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {spot.stackDepth}bb
                      </Badge>
                      <span
                        className={`truncate text-xs ${
                          selectedChartId === spot.id
                            ? "text-zinc-400"
                            : "text-muted-foreground"
                        }`}
                      >
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {SPOT_GROUP_LABELS[group.group]}
                  </p>
                  <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-xs">
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
                    className={`w-full rounded-2xl border px-3 py-3 text-left text-sm shadow-sm transition ${
                      selectedChartId === spot.id
                        ? "border-zinc-950 bg-zinc-950 text-white shadow-zinc-950/15"
                        : "border-slate-200 bg-white text-foreground hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/50 hover:shadow-md"
                    }`}
                    onClick={() => selectChart(spot.id)}
                  >
                    <div className="font-medium truncate">{spot.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="outline"
                        className={`h-5 rounded-full px-1.5 text-xs ${
                          selectedChartId === spot.id
                            ? "border-white/15 bg-white/10 text-zinc-200"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        {spot.stackDepth}bb
                      </Badge>
                      <span
                        className={`truncate text-xs ${
                          selectedChartId === spot.id
                            ? "text-zinc-400"
                            : "text-muted-foreground"
                        }`}
                      >
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
            <div className="w-full max-w-md rounded-[1.75rem] border border-dashed bg-white/90 p-8 shadow-xl shadow-slate-950/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Choose a spot to study
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Select a range from the library to view the chart, notes, and
                trainer shortcut.
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
            <p className="rounded-2xl border border-dashed bg-white/90 p-6 text-sm text-muted-foreground shadow-xl shadow-slate-950/5">
              {chartError.message}
            </p>
          </div>
        )}

        {chart && (
          <div className="mx-auto max-w-4xl space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-950/5 sm:flex-row sm:items-start sm:justify-between sm:p-5">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">
                  Range Chart
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {chart.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="default" className="rounded-full bg-orange-500">
                    {chart.stackDepth}bb
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
                    {SPOT_GROUP_LABELS[chart.spotGroup]}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
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
                  className="h-11 w-full gap-1 rounded-2xl bg-orange-500 px-4 font-bold text-white shadow-lg shadow-orange-950/15 hover:bg-orange-600 sm:w-auto"
                >
                  <Play className="h-3 w-3" />
                  Train this spot
                </Button>
              </Link>
            </div>

            {/* Notes */}
            {chartNotes.length > 0 && (
              <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/90 shadow-sm shadow-slate-950/5">
                <CardContent className="pb-3 pt-3">
                  <ul className="space-y-2">
                    {chartNotes.map((note, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-xs leading-relaxed text-muted-foreground [&>span:first-child]:hidden"
                      >
                        <span className="text-orange-500 flex-shrink-0">•</span>
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-600">
                          {i + 1}
                        </span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Range matrix */}
            <div className="space-y-3 rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-3 shadow-xl shadow-slate-950/5 sm:p-4">
              <ActionLegend
                actions={visibleActions}
                className="rounded-2xl bg-slate-50/90 p-2"
              />
              <RangeMatrix actions={actionMap} size="md" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
