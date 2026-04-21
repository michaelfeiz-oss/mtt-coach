/**
 * client/src/pages/strategy/StudyHub.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Study Hub landing page — entry point for the strategy module.
 * Route: /strategy
 *
 * CODEX TASK: Implement the page body.
 *
 * Layout:
 *   - Page header: "Study Hub" title + subtitle
 *   - 3 feature cards in a grid:
 *       1. "Strategy Library" → /strategy/library
 *          Icon: BookOpen, description: "Browse GTO ranges by stack and spot"
 *       2. "Range Trainer" → /strategy/trainer
 *          Icon: Target, description: "Drill your range knowledge with flashcards"
 *       3. "Progress" → /strategy/progress (placeholder, show "Coming Soon" toast)
 *          Icon: TrendingUp, description: "Track your accuracy over time"
 *   - Stats row below cards: total attempts, accuracy %, spots studied
 *   - Recent activity section: last 5 trainer attempts
 *
 * Data:
 *   - trpc.strategy.getStats.useQuery() for stats row
 *   - trpc.strategy.getRecentAttempts.useQuery({ limit: 5 }) for recent activity
 *   - Both are optional — show skeleton while loading, empty state if no data
 *
 * Design:
 *   - Dark card style consistent with rest of app
 *   - Orange accent for primary CTAs
 *   - Use DashboardLayout wrapper (already handles sidebar + auth)
 */

import React from "react";
import { Link } from "wouter";
import { BookOpen, Target, TrendingUp, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ACTION_LABELS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";

export default function StudyHub() {
  const { isAuthenticated } = useAuth();
  // Only fire these protected queries when the user is logged in.
  // Without the guard, an unauthenticated visit would trigger the global
  // UNAUTHORIZED redirect even though the rest of the page is public.
  const { data: stats } = trpc.strategy.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recentAttempts } = trpc.strategy.getRecentAttempts.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );
  const { data: progress } = trpc.strategy.getProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Study Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build your GTO foundation — ranges, spots, and drilling.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/strategy/library">
          <Card className="cursor-pointer hover:border-orange-500/50 transition-colors group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <BookOpen className="h-6 w-6 text-orange-500" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
              <CardTitle className="text-base mt-2">Strategy Library</CardTitle>
              <CardDescription className="text-xs">
                Browse GTO ranges by stack depth and spot type
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/strategy/trainer">
          <Card className="cursor-pointer hover:border-orange-500/50 transition-colors group">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-6 w-6 text-orange-500" />
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
              <CardTitle className="text-base mt-2">Range Trainer</CardTitle>
              <CardDescription className="text-xs">
                Drill your range knowledge with flashcard-style quizzes
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-6 w-6 text-orange-500" />
            </div>
            <CardTitle className="text-base mt-2">Progress</CardTitle>
            <CardDescription className="text-xs">
              Review saved accuracy, weak spots, and missed hands
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {stats.total}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total Attempts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {stats.accuracy}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {progress?.bySpot.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Spots Studied
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress loop */}
      {!isAuthenticated && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm font-medium">Saved progress is login-only</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can browse charts and train while logged out, but history,
              weak spots, and missed hands are only saved for authenticated
              users.
            </p>
          </CardContent>
        </Card>
      )}

      {isAuthenticated && progress && progress.bySpot.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weak Spots</CardTitle>
                <CardDescription className="text-xs">
                  Lowest saved trainer accuracy first
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {progress.weakSpots.slice(0, 4).map(spot => (
                  <div
                    key={spot.chartId}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {spot.chartTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {spot.accuracy}% accuracy over {spot.attempts} attempts
                      </p>
                    </div>
                    <Link href={`/strategy/trainer?chartId=${spot.chartId}`}>
                      <Button size="sm" variant="outline">
                        Train
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Most Missed Hands</CardTitle>
                <CardDescription className="text-xs">
                  Hands you have answered incorrectly most often
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {progress.missedHands.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No missed hands saved yet.
                  </p>
                ) : (
                  progress.missedHands.slice(0, 5).map(hand => (
                    <div
                      key={`${hand.chartId}-${hand.handCode}`}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-base font-bold">
                          {hand.handCode}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hand.chartTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-red-500">
                          Missed {hand.missed}/{hand.attempts}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ACTION_LABELS[hand.correctAction]}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trainer History by Spot</CardTitle>
              <CardDescription className="text-xs">
                Saved attempts grouped by chart
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {progress.bySpot.slice(0, 6).map(spot => (
                <div
                  key={spot.chartId}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {spot.chartTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spot.attempts} attempts - {spot.accuracy}% accuracy
                    </p>
                  </div>
                  <Link href={`/strategy/trainer?chartId=${spot.chartId}`}>
                    <Button size="sm" variant="ghost">
                      Train
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {isAuthenticated && progress && progress.bySpot.length === 0 && (
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-sm font-medium">No saved trainer attempts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run a few Range Trainer hands while logged in to populate weak
              spots and missed-hand feedback.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {recentAttempts && recentAttempts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.map((attempt, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono font-medium">
                  {attempt.handCode}
                </span>
                <span
                  className={`text-xs ${attempt.isCorrect ? "text-green-500" : "text-red-500"}`}
                >
                  {attempt.isCorrect ? "✓" : "✗"}{" "}
                  {ACTION_LABELS[attempt.correctAction as Action]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
