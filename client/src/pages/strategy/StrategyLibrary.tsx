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

import React, { useState } from "react";
import { Link } from "wouter";
import { ChevronRight, BookOpen, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { SpotFilters } from "@/components/strategy/SpotFilters";
import { RangeMatrix } from "@/components/strategy/RangeMatrix";
import { ActionLegend } from "@/components/strategy/ActionLegend";
import { buildActionMap } from "@/components/strategy/utils";
import type { SpotGroup } from "../../../../shared/strategy";

export default function StrategyLibrary() {
  const [stackDepth, setStackDepth] = useState<number | undefined>(undefined);
  const [spotGroup, setSpotGroup] = useState<SpotGroup | undefined>(undefined);
  const [selectedChartId, setSelectedChartId] = useState<number | undefined>(undefined);

  const { data: spots = [], isLoading: spotsLoading } = trpc.strategy.listSpots.useQuery({
    stackDepth,
    spotGroup,
  });

  const { data: chart, isLoading: chartLoading } = trpc.strategy.getChart.useQuery(
    { chartId: selectedChartId! },
    { enabled: selectedChartId !== undefined }
  );

  const actionMap = chart ? buildActionMap(chart.actions) : {};

  return (
    <div className="flex h-full gap-0">
      {/* Left sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-orange-500" />
            Strategy Library
          </h2>
        </div>

        <div className="p-3 border-b border-border">
          <SpotFilters
            stackDepth={stackDepth}
            spotGroup={spotGroup}
            onStackChange={setStackDepth}
            onGroupChange={setSpotGroup}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {spotsLoading && (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          )}

          {!spotsLoading && spots.length === 0 && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No charts available. Run the seed script to add ranges.
            </div>
          )}

          {spots.map((spot) => (
            <button
              key={spot.id}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selectedChartId === spot.id
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                  : "hover:bg-muted text-foreground"
              }`}
              onClick={() => setSelectedChartId(spot.id)}
            >
              <div className="font-medium truncate">{spot.title}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="outline" className="text-xs h-4 px-1">
                  {spot.stackDepth}bb
                </Badge>
                <span className="text-xs text-muted-foreground truncate">{spot.heroPosition}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedChartId && (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
              <p className="text-sm text-muted-foreground">Select a spot from the left to view its range chart.</p>
            </div>
          </div>
        )}

        {selectedChartId && chartLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {chart && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-foreground">{chart.title}</h1>
                {chart.sourceLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">Source: {chart.sourceLabel}</p>
                )}
              </div>
              <Link href={`/strategy/trainer?chartId=${chart.id}`}>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
                  <Play className="h-3 w-3" />
                  Train this spot
                </Button>
              </Link>
            </div>

            {/* Notes */}
            {chart.notesJson && (
              <Card className="bg-muted/30">
                <CardContent className="pt-3 pb-3">
                  <ul className="space-y-1">
                    {(JSON.parse(chart.notesJson) as string[]).map((note, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-orange-500 flex-shrink-0">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Range matrix */}
            <div className="space-y-3">
              <RangeMatrix actions={actionMap} size="md" />
              <ActionLegend />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
