import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Hand, TrendingUp, Trophy, Plus, FileText, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: todayPlan } = trpc.studyPlan.getToday.useQuery();
  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery({ weekId: 1 });

  const studyProgress = dashboardStats ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100 : 0;
  const tournamentsProgress = dashboardStats ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100 : 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-6 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your poker progress at a glance</p>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Today's Plan - Compact */}
        {todayPlan && (
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Today's Plan</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {new Date(todayPlan.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
                {todayPlan.completed && <span className="text-green-600 text-sm font-medium">✓ Done</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">{todayPlan.label}</p>
              <p className="text-sm text-muted-foreground">{todayPlan.description}</p>
              <div className="flex gap-2 pt-2">
                {!todayPlan.completed && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation("/log-session")}
                  >
                    Start Session
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/study-plan")}
                >
                  View Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Action Buttons - 6 Icon Grid */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setLocation("/hands")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <Hand className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium text-center">Log Hand</span>
          </button>
          <button
            onClick={() => setLocation("/log-tournament")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <Trophy className="h-6 w-6 text-orange-500" />
            <span className="text-xs font-medium text-center">Log Tournament</span>
          </button>
          <button
            onClick={() => setLocation("/hands")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <Zap className="h-6 w-6 text-red-500" />
            <span className="text-xs font-medium text-center">Add Leak</span>
          </button>
          <button
            onClick={() => setLocation("/log-session")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <BookOpen className="h-6 w-6 text-blue-500" />
            <span className="text-xs font-medium text-center">Add Study</span>
          </button>
          <button
            onClick={() => setLocation("/hands")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <TrendingUp className="h-6 w-6 text-green-500" />
            <span className="text-xs font-medium text-center">Review Hands</span>
          </button>
          <button
            onClick={() => setLocation("/study-plan")}
            className="p-4 bg-card rounded-lg border border-border hover:bg-muted transition-colors flex flex-col items-center gap-2"
          >
            <FileText className="h-6 w-6 text-slate-500" />
            <span className="text-xs font-medium text-center">My Notes</span>
          </button>
        </div>

        {/* Weekly Progress - 4 Stat Cards */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">This Week</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-card rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-primary">{dashboardStats?.studyHours.toFixed(1) || "0"}</p>
              <p className="text-xs text-muted-foreground mt-1">Hours Studied</p>
              <Progress value={studyProgress} className="h-1 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{dashboardStats?.studyHoursTarget}h target</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-orange-500">{dashboardStats?.tournamentsCount || "0"}</p>
              <p className="text-xs text-muted-foreground mt-1">Tournaments</p>
              <Progress value={tournamentsProgress} className="h-1 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{dashboardStats?.tournamentsTarget} target</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-slate-600">0</p>
              <p className="text-xs text-muted-foreground mt-1">Hands Logged</p>
              <p className="text-xs text-muted-foreground mt-2">50+ recommended</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center">
              <p className="text-2xl font-bold text-green-600">${dashboardStats?.netResult.toFixed(0) || "0"}</p>
              <p className="text-xs text-muted-foreground mt-1">Net Result</p>
              <p className="text-xs text-muted-foreground mt-2">This week</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
