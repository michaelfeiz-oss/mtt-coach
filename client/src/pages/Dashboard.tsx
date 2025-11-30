import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, Trophy, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: currentWeek, isLoading: weekLoading } = trpc.weeks.getCurrent.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: dashboardStats, isLoading: statsLoading } = trpc.dashboard.getStats.useQuery(
    { weekId: currentWeek?.id ?? 0 },
    { enabled: !!currentWeek }
  );

  const { data: topLeaks, isLoading: leaksLoading } = trpc.leaks.getTop.useQuery(
    { limit: 3 },
    { enabled: isAuthenticated }
  );

  const { data: tournaments } = trpc.tournaments.getByWeek.useQuery(
    { weekId: currentWeek?.id ?? 0 },
    { enabled: !!currentWeek }
  );

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">MTT Coach</CardTitle>
            <CardDescription>Track your poker tournament progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" asChild>
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <p className="text-sm text-slate-600">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Week Overview */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>
              {currentWeek && (
                <>
                  {new Date(currentWeek.startDate).toLocaleDateString()} -{" "}
                  {new Date(currentWeek.endDate).toLocaleDateString()}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            size="lg"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setLocation("/log-session")}
          >
            <BookOpen className="h-5 w-5" />
            <span>Log Study Session</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => setLocation("/log-tournament")}
          >
            <Trophy className="h-5 w-5" />
            <span>Log Tournament</span>
          </Button>
          <Button
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
                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
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
                  </div>
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
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !topLeaks || topLeaks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No leaks tracked yet</p>
            ) : (
              <div className="space-y-2">
                {topLeaks.map((leak: any) => (
                  <div key={leak.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{leak.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{leak.category}</p>
                    </div>
                    <div className="text-xs text-slate-500">
                      {leak.handCount || 0} hands
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
