import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Edit2,
  FileText,
  Hand,
  Layers,
  Target,
  Trophy,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PROGRAM_WEEKS } from "@/lib/curriculum";
import { EditTournamentModal } from "@/components/EditTournamentModal";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [todayDrill, setTodayDrill] = useState<any>(null);
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

    const weekData = PROGRAM_WEEKS[cycleWeek - 1];
    if (!weekData) return;

    const dayOfWeek = today.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const day = weekData.days[dayIndex];
    if (!day) return;

    setTodayDrill({
      title: day.label,
      description: day.description,
      tool: day.drills[0]?.tool || "Poker Trainer",
      week: cycleWeek,
      dayName: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ][dayIndex],
    });
  }, []);

  const studyProgress = dashboardStats
    ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100
    : 0;
  const tournamentsProgress = dashboardStats
    ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) *
      100
    : 0;

  const recentActivity =
    tournaments?.map((t: any) => ({
      id: t.id,
      title: `Tournament - ${t.venue || "Tournament"} ${
        t.buyIn > 0 ? "$" + t.buyIn : ""
      } - ${t.netResult >= 0 ? "+" : ""}$${Math.abs(t.netResult).toFixed(0)}`,
      time: new Date(t.date).toLocaleDateString(),
      tournament: t,
    })) || [];

  const handleEditTournament = (data: any) => {
    if (!selectedTournament) return;
    updateTournament({
      id: selectedTournament.id,
      buyIn: parseFloat(data.buyIn),
      reEntries: parseInt(data.reEntries) || 0,
      startingStack: parseInt(data.startingStack) || 0,
      finalPosition: data.finalPosition,
      prize: parseFloat(data.prize) || 0,
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.09),transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] pb-24">
      <div className="px-4 py-5">
        <div className="mx-auto max-w-6xl rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 text-white shadow-2xl shadow-slate-950/20">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">
            MTT Coach
          </p>
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Your poker progress and study plan at a glance.
          </p>
        </div>
      </div>

      <div className="container max-w-6xl space-y-6 py-2">
        {todayDrill && (
          <Card className="overflow-hidden rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black">
                Today's Training
              </CardTitle>
              <CardDescription className="text-xs">
                Week {currentWeek} - {todayDrill.dayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-bold">{todayDrill.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Focus: {todayDrill.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tool: {todayDrill.tool}
                </p>
              </div>
              <Button
                className="h-11 w-full rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-950/15 hover:bg-orange-600"
                onClick={() => setLocation("/study")}
              >
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Preflop Study
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card
              className="group cursor-pointer rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-950/10"
              onClick={() => setLocation("/strategy/library")}
            >
              <CardContent className="flex items-center gap-3 pb-4 pt-4">
                <div className="rounded-2xl bg-zinc-950 p-2.5 text-orange-300 shadow-lg shadow-zinc-950/15 transition group-hover:scale-105">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    Hand Ranges
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                    Preflop charts by stack and spot
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card
              className="group cursor-pointer rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-950/10"
              onClick={() => setLocation("/strategy/trainer")}
            >
              <CardContent className="flex items-center gap-3 pb-4 pt-4">
                <div className="rounded-2xl bg-orange-500 p-2.5 text-white shadow-lg shadow-orange-950/15 transition group-hover:scale-105">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">
                    Range Trainer
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-muted-foreground">
                    Drill hands with flashcards
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-2xl border-slate-200 bg-white/95 py-3 shadow-sm"
              onClick={() => setLocation("/log")}
            >
              <Trophy className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-medium">Log Tournament</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-2xl border-slate-200 bg-white/95 py-3 shadow-sm"
              onClick={() => setLocation("/log")}
            >
              <Hand className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Log Hand</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-2xl border-slate-200 bg-white/95 py-3 shadow-sm"
              onClick={() => setLocation("/log")}
            >
              <FileText className="h-5 w-5 text-slate-500" />
              <span className="text-xs font-medium">My Notes</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            This Week's Progress
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-[1.5rem] border-blue-200 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-blue-600">
                  {dashboardStats?.studyHours.toFixed(0) || "0"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hours Studied
                </p>
                <Progress value={studyProgress} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-orange-200 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-orange-600">0</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Solver Drills
                </p>
                <Progress value={50} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-green-200 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-green-600">
                  {dashboardStats?.tournamentsCount || "0"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  APT Sessions
                </p>
                <Progress value={tournamentsProgress} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.5rem] border-purple-200 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-purple-600">18</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ICM Spots
                </p>
                <Progress value={75} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.map(activity => (
              <Card
                key={activity.id}
                className="rounded-2xl border-slate-200/80 bg-white/95 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <CardContent className="flex items-start justify-between gap-3 pt-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  {activity.tournament && (
                    <button
                      onClick={() => {
                        setSelectedTournament(activity.tournament);
                        setShowEditModal(true);
                      }}
                      className="ml-2 flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-slate-100"
                      title="Edit tournament"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <EditTournamentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditTournament}
        isLoading={isUpdatingTournament}
        tournament={selectedTournament}
      />
    </div>
  );
}
