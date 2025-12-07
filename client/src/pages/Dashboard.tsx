import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Hand, TrendingUp, Trophy, Plus, FileText, Zap, Clock, Zap as ZapIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: todayPlan } = trpc.studyPlan.getToday.useQuery();
  const { data: dashboardStats } = trpc.dashboard.getStats.useQuery({ weekId: 1 });

  const studyProgress = dashboardStats ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100 : 0;
  const tournamentsProgress = dashboardStats ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100 : 0;

  // Mock activity feed data
  const recentActivity = [
    { emoji: "🃏", title: "Hand Review — AQo vs CO", time: "2h ago" },
    { emoji: "📘", title: "Study Session — 35m", time: "Yesterday" },
    { emoji: "🏆", title: "Tournament — Kings 350 — +$850", time: "3 days ago" },
  ];

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
        {/* TODAY'S TRAINING */}
        {todayPlan && (
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today's Training</CardTitle>
              <CardDescription className="text-xs">
                Week {Math.ceil(new Date().getDate() / 7)} • {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-bold">{todayPlan.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Focus: {todayPlan.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Tool: Advanced Poker Training</p>
              </div>
              <Button
                className="w-full"
                onClick={() => setLocation("/log-session")}
              >
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}

        {/* QUICK ACTIONS - 3 Buttons */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col gap-1 py-3"
              onClick={() => setLocation("/log-tournament")}
            >
              <Trophy className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-medium">Log Tournament</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col gap-1 py-3"
              onClick={() => setLocation("/hands")}
            >
              <Hand className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Log Hand</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col gap-1 py-3"
              onClick={() => setLocation("/hands")}
            >
              <FileText className="h-5 w-5 text-slate-500" />
              <span className="text-xs font-medium">My Notes</span>
            </Button>
          </div>
        </div>

        {/* THIS WEEK'S PROGRESS - 4 Stat Tiles */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">This Week's Progress</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-gradient-to-br from-blue-50 to-transparent border-blue-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{dashboardStats?.studyHours.toFixed(0) || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Hours Studied</p>
                <Progress value={studyProgress} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-transparent border-orange-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{dashboardStats?.tournamentsCount || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Solver Drills</p>
                <Progress value={tournamentsProgress} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-transparent border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">12</p>
                <p className="text-xs text-muted-foreground mt-1">APT Sessions</p>
                <Progress value={60} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-transparent border-purple-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-purple-600">18</p>
                <p className="text-xs text-muted-foreground mt-1">ICM Spots</p>
                <Progress value={75} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RECENT ACTIVITY FEED */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity, idx) => (
              <Card key={idx} className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="pt-4 flex items-start gap-3">
                  <span className="text-lg">{activity.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
