import React from "react";
import { Link } from "wouter";
import { BookOpen, ChevronRight, Target, TrendingUp } from "lucide-react";
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
    <div className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.1),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] p-4 pb-24 sm:p-6">
      <div className="rounded-[1.75rem] border-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">
          Study
        </p>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Study Hub
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Build your tournament foundation with ranges, focused drills, and
          saved leak feedback when logged in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/strategy/library">
          <Card className="group h-full cursor-pointer rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-orange-300">
                  <BookOpen className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
              </div>
              <CardTitle className="mt-4 text-base">Strategy Library</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Browse preflop ranges by stack depth and spot type.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/strategy/trainer">
          <Card className="group h-full cursor-pointer rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-950/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/15">
                  <Target className="h-5 w-5" />
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-orange-500" />
              </div>
              <CardTitle className="mt-4 text-base">Range Trainer</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Drill hands quickly with flashcards and chart reveal feedback.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="h-full rounded-[1.5rem] border-orange-200/80 bg-orange-50/70 shadow-sm shadow-orange-950/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm">
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>
            <CardTitle className="mt-4 text-base">Progress</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Review saved accuracy, weak spots, and missed hands.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="rounded-[1.25rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
            <CardContent className="px-3 pb-3 pt-4 text-center">
              <p className="text-2xl font-black text-orange-500">
                {stats.total}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Attempts
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.25rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
            <CardContent className="px-3 pb-3 pt-4 text-center">
              <p className="text-2xl font-black text-orange-500">
                {stats.accuracy}%
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Accuracy
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.25rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
            <CardContent className="px-3 pb-3 pt-4 text-center">
              <p className="text-2xl font-black text-orange-500">
                {progress?.bySpot.length ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Spots
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isAuthenticated && (
        <Card className="rounded-[1.5rem] border-dashed border-slate-300 bg-white/90 shadow-sm shadow-slate-950/5">
          <CardContent className="py-4">
            <p className="text-sm font-semibold">Saved progress is login-only</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weak Spots</CardTitle>
                <CardDescription className="text-xs">
                  Lowest saved trainer accuracy first.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {progress.weakSpots.slice(0, 4).map(spot => (
                  <div
                    key={spot.chartId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {spot.chartTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {spot.accuracy}% accuracy over {spot.attempts} attempts
                      </p>
                    </div>
                    <Link href={`/strategy/trainer?chartId=${spot.chartId}`}>
                      <Button size="sm" variant="outline" className="rounded-full">
                        Train
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Most Missed Hands</CardTitle>
                <CardDescription className="text-xs">
                  Hands answered incorrectly most often.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {progress.missedHands.length === 0 ? (
                  <p className="rounded-2xl border border-dashed bg-slate-50 py-4 text-center text-sm text-muted-foreground">
                    No missed hands saved yet.
                  </p>
                ) : (
                  progress.missedHands.slice(0, 5).map(hand => (
                    <div
                      key={`${hand.chartId}-${hand.handCode}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-base font-black">
                          {hand.handCode}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hand.chartTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-red-500">
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

          <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trainer History by Spot</CardTitle>
              <CardDescription className="text-xs">
                Saved attempts grouped by chart.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {progress.bySpot.slice(0, 6).map(spot => (
                <div
                  key={spot.chartId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {spot.chartTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spot.attempts} attempts - {spot.accuracy}% accuracy
                    </p>
                  </div>
                  <Link href={`/strategy/trainer?chartId=${spot.chartId}`}>
                    <Button size="sm" variant="ghost" className="rounded-full">
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
        <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
          <CardContent className="py-5 text-center">
            <p className="text-sm font-semibold">No saved trainer attempts yet</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Run a few Range Trainer hands while logged in to populate weak
              spots and missed-hand feedback.
            </p>
          </CardContent>
        </Card>
      )}

      {recentAttempts && recentAttempts.length > 0 && (
        <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.map((attempt, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm"
              >
                <span className="font-mono font-bold">{attempt.handCode}</span>
                <span
                  className={`text-xs font-semibold ${
                    attempt.isCorrect ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {attempt.isCorrect ? "Correct" : "Missed"} -{" "}
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
