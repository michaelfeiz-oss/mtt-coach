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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { calcAccuracy } from "@/components/strategy/utils";
import { ACTION_LABELS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";
import { toast } from "sonner";

export default function StudyHub() {
  const { data: stats } = trpc.strategy.getStats.useQuery();
  const { data: recentAttempts } = trpc.strategy.getRecentAttempts.useQuery({ limit: 5 });

  // TODO: Implement full page with proper styling and animations
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

        <Card
          className="cursor-pointer hover:border-orange-500/50 transition-colors group opacity-60"
          onClick={() => toast("Coming soon — Progress tracking is in development.")}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-6 w-6 text-orange-500" />
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
            </div>
            <CardTitle className="text-base mt-2">Progress</CardTitle>
            <CardDescription className="text-xs">
              Track your accuracy over time — coming soon
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Attempts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.accuracy}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.correct}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Correct</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      {recentAttempts && recentAttempts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.map((attempt, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono font-medium">{attempt.handCode}</span>
                <span className={`text-xs ${attempt.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {attempt.isCorrect ? "✓" : "✗"} {ACTION_LABELS[attempt.correctAction as Action]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
