import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Hand,
  Layers,
  Target,
  Trophy,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EditTournamentModal } from "@/components/EditTournamentModal";

type TournamentActivity = {
  id: number;
  title: string;
  time: string;
  tournament: any;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  const { data: dashboardStats } = trpc.dashboard.getStats.useQuery({
    weekId: currentWeek,
  });
  const { data: tournaments } = trpc.tournaments.getByWeek.useQuery({
    weekId: currentWeek,
  });
  const { mutate: updateTournament, isPending: isUpdatingTournament } =
    trpc.tournaments.update.useMutation({
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedTournament(null);
      },
    });

  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000
    );
    const weekNumber = Math.ceil(dayOfYear / 7);
    const cycleWeek = ((weekNumber - 1) % 12) + 1;
    setCurrentWeek(cycleWeek);
  }, []);

  const studyProgress = dashboardStats
    ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100
    : 0;
  const tournamentsProgress = dashboardStats
    ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100
    : 0;

  const recentActivity: TournamentActivity[] =
    tournaments?.map((t: any) => ({
      id: t.id,
      title: `${t.venue || "Tournament"} ${
        t.buyIn > 0 ? `$${t.buyIn}` : ""
      }`,
      time: new Date(t.date).toLocaleDateString(),
      tournament: t,
    })) || [];

  const pendingReviewCount = useMemo(
    () => recentActivity.filter(activity => activity.tournament.netResult < 0).length,
    [recentActivity]
  );

  function handleEditTournament(data: any) {
    if (!selectedTournament) return;
    updateTournament({
      id: selectedTournament.id,
      buyIn: parseFloat(data.buyIn),
      reEntries: parseInt(data.reEntries, 10) || 0,
      startingStack: parseInt(data.startingStack, 10) || 0,
      finalPosition: data.finalPosition,
      prize: parseFloat(data.prize) || 0,
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <p className="app-eyebrow mb-2">Daily Workspace</p>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose the next preflop task, drill reps, and capture lessons while
            they are still fresh.
          </p>
        </header>

        <Card className="app-surface">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Today&apos;s Focus
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Continue Preflop Session
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open a chart, run trainer reps, then log one hand for review.
                </p>
              </div>
              <Button
                className="h-11 rounded-xl px-4"
                onClick={() => setLocation("/study")}
              >
                Start Session
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: "BBA", value: "Only" },
                { label: "Stack Cap", value: "40bb" },
                { label: "Review Queue", value: `${pendingReviewCount}` },
                { label: "Week", value: `${currentWeek}` },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-accent/70 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              label: "Log Hand",
              icon: Hand,
              onClick: () => setLocation("/log"),
            },
            {
              label: "Tournament",
              icon: Trophy,
              onClick: () => setLocation("/log"),
            },
            {
              label: "Add Leak",
              icon: ClipboardCheck,
              onClick: () => setLocation("/log"),
            },
            {
              label: "Add Note",
              icon: FileText,
              onClick: () => setLocation("/log"),
            },
          ].map(action => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="app-surface flex items-center gap-2 p-3 text-left transition hover:-translate-y-0.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setLocation("/strategy/library")}
            className="app-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Hand Ranges</p>
              <p className="text-xs text-muted-foreground">
                Open the current chart setup quickly.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setLocation("/strategy/trainer")}
            className="app-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Range Trainer</p>
              <p className="text-xs text-muted-foreground">
                Drill current spot and review misses.
              </p>
            </div>
          </button>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            {
              title: "Study Hours",
              value: dashboardStats?.studyHours.toFixed(0) || "0",
              progress: studyProgress,
            },
            {
              title: "Tournaments",
              value: `${dashboardStats?.tournamentsCount || 0}`,
              progress: tournamentsProgress,
            },
            {
              title: "Range Reps",
              value: "0",
              progress: 0,
            },
            {
              title: "Max Stack",
              value: "40bb",
              progress: 100,
            },
          ].map(stat => (
            <Card key={stat.title} className="app-surface">
              <CardContent className="space-y-2 p-3">
                <p className="text-xs text-muted-foreground">{stat.title}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
                <Progress value={stat.progress} className="h-1.5" />
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="app-surface">
          <CardHeader className="flex flex-row items-end justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Last tournament updates and result edits.
              </p>
            </div>
            <Badge variant="outline">Latest {recentActivity.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-accent/50 p-4 text-sm text-muted-foreground">
                No activity yet this week. Start with one quick hand log.
              </div>
            )}

            {recentActivity.map(activity => (
              <button
                key={activity.id}
                type="button"
                onClick={() => {
                  setSelectedTournament(activity.tournament);
                  setShowEditModal(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-accent/50 p-3 text-left transition hover:bg-accent/75"
              >
                <div>
                  <p className="text-sm font-semibold">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <Badge variant="outline">
                  {activity.tournament.netResult >= 0 ? "Win" : "Review"}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <EditTournamentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditTournament}
        isLoading={isUpdatingTournament}
        tournament={selectedTournament}
      />
    </main>
  );
}

