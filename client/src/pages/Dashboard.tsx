import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookOpen, Trophy, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { QuickLogTournament } from "@/components/QuickLogTournament";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: currentWeek, isLoading: weekLoading } = trpc.weeks.getCurrent.useQuery();

  const { data: todayPlan } = trpc.studyPlan.getToday.useQuery();
  
  const { data: dailyFocus } = trpc.studyPlan.getDailyFocus.useQuery();

  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    { weekId: currentWeek?.id ?? 0 },
    { enabled: !!currentWeek }
  );

  const { data: topLeaks, isLoading: leaksLoading } = trpc.leaks.getTop.useQuery({ limit: 3 });

  const { data: tournaments } = trpc.tournaments.getByWeek.useQuery(
    { weekId: currentWeek?.id ?? 0 },
    { enabled: !!currentWeek }
  );

  const isLoading = weekLoading || statsLoading;

  const studyProgress = dashboardStats
    ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100
    : 0;
  const tournamentsProgress = dashboardStats
    ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">MTT Coach</h1>
              <p className="text-sm text-slate-600">Welcome back, Mike</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Today's Study Card */}
        {todayPlan && (
          <Card className={`${
            todayPlan.completed
              ? "border-green-200 bg-green-50"
              : "border-blue-500 border-2 shadow-md"
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Today's Study</CardTitle>
                  <CardDescription className="mt-1">
                    {todayPlan.label} • {new Date(todayPlan.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardDescription>
                </div>
                {todayPlan.completed && (
                  <div className="text-green-600 text-sm font-medium bg-green-100 px-3 py-1 rounded-full">
                    ✓ Done
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">{todayPlan.description}</p>
              
              {/* Show today's focus areas if available */}
              {dailyFocus && dailyFocus.recommendations && (
                <>
                  {(() => {
                    const todayRec = dailyFocus.recommendations.find(r => r.type === todayPlan.type);
                    if (todayRec && todayRec.priority !== "LOW") {
                      return (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Today's Focus</p>
                          <p className="text-sm text-slate-700">{todayRec.reason}</p>
                          {todayRec.focusAreas.length > 0 && (
                            <ul className="text-xs text-slate-600 space-y-1 ml-4">
                              {todayRec.focusAreas.map((area, idx) => (
                                <li key={idx} className="list-disc">{area}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
              <div className="flex gap-2">
                {!todayPlan.completed ? (
                  <>
                    <Button
                      key="start-session"
                      onClick={() => {
                        const params = new URLSearchParams({
                          fromPlan: "true",
                          planSlot: todayPlan.planSlot,
                          type: todayPlan.type,
                          date: new Date(todayPlan.date).toISOString(),
                        });
                        setLocation(`/log-session?${params.toString()}`);
                      }}
                      className="flex-1"
                    >
                      Start Session
                    </Button>
                    <Button
                      key="view-plan"
                      onClick={() => setLocation("/study-plan")}
                      variant="outline"
                      className="flex-1"
                    >
                      View Full Plan
                    </Button>
                  </>
                ) : (
                  <Button
                    key="view-plan-only"
                    onClick={() => setLocation("/study-plan")}
                    variant="outline"
                    className="w-full"
                  >
                    View Full Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Overview */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>
              {currentWeek &&
                `${new Date(currentWeek.startDate).toLocaleDateString()} - ${new Date(currentWeek.endDate).toLocaleDateString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton key="skeleton-1" className="h-16 w-full" />
                <Skeleton key="skeleton-2" className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Study Hours */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Study Hours</span>
                    <span className="font-medium">
                      {dashboardStats?.studyHours.toFixed(1)} / {dashboardStats?.studyHoursTarget}h
                    </span>
                  </div>
                  <Progress value={studyProgress} className="h-2" />
                </div>

                {/* Tournaments */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tournaments</span>
                    <span className="font-medium">
                      {dashboardStats?.tournamentsCount} / {dashboardStats?.tournamentsTarget}
                    </span>
                  </div>
                  <Progress value={tournamentsProgress} className="h-2" />
                </div>

                {/* Net Result */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-slate-600">Net Result</span>
                  <span
                    className={`text-lg font-bold ${
                      (dashboardStats?.netResult ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${dashboardStats?.netResult.toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            key="log-session-btn"
            size="lg"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setLocation("/log-session")}
          >
            <BookOpen className="h-5 w-5" />
            <span>Log Study Session</span>
          </Button>
          <div key="tournament-actions" className="flex flex-col gap-2">
            <QuickLogTournament key="quick-log" />
            <Button
              key="full-entry"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setLocation("/log-tournament")}
            >
              Full Entry
            </Button>
          </div>
          <Button
            key="review-hands-btn"
            size="lg"
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setLocation("/hands")}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Review Hands</span>
          </Button>
        </div>

        {/* Recent Tournaments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            {!tournaments || tournaments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No tournaments logged yet</p>
            ) : (
              <div className="space-y-3">
                {tournaments.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLocation(`/tournaments/${t.id}`)}
                    className="w-full flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.name || t.venue}</p>
                      <p className="text-xs text-slate-600">
                        {new Date(t.date).toLocaleDateString()} • Position: {t.finalPosition || "—"}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p
                        className={`font-bold text-sm ${
                          t.netResult >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {t.netResult >= 0 ? "+" : ""}${t.netResult.toFixed(0)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Leaks */}
        <Card>
          <CardHeader>
            <CardTitle>Top Leaks This Week</CardTitle>
            <CardDescription>Focus areas for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            {leaksLoading ? (
              <div className="space-y-2">
                <Skeleton key="leak-skeleton-1" className="h-12 w-full" />
                <Skeleton key="leak-skeleton-2" className="h-12 w-full" />
                <Skeleton key="leak-skeleton-3" className="h-12 w-full" />
              </div>
            ) : !topLeaks || topLeaks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No leaks tracked yet</p>
            ) : (
              <div className="space-y-2">
                {topLeaks.map((leak: any) => (
                  <button
                    key={leak.id}
                    onClick={() => setLocation(`/leaks/${leak.id}`)}
                    className="w-full flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{leak.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{leak.category}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {leak.handCount || 0} hands
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
