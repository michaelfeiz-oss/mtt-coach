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
import { Badge } from "@/components/ui/badge";
import {
  Edit2,
  FileText,
  Hand,
  Layers,
  Target,
  Trophy,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  const [todayDrill, setTodayDrill] = useState<{
    title: string;
    description: string;
    tool: string;
    week: number;
    dayName: string;
  } | null>(null);
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

    const dayOfWeek = today.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    setTodayDrill({
      title: "Preflop Range Reps",
      description:
        "Review one BBA chart, then drill hands from the same spot.",
      tool: "Range Trainer",
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
    ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100
    : 0;

  const recentActivity: TournamentActivity[] =
    tournaments?.map((t: any) => ({
      id: t.id,
      title: `Tournament - ${t.venue || "Tournament"} ${
        t.buyIn > 0 ? "$" + t.buyIn : ""
      } - ${t.netResult >= 0 ? "+" : ""}$${Math.abs(t.netResult).toFixed(0)}`,
      time: new Date(t.date).toLocaleDateString(),
      tournament: t,
    })) || [];

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_26rem),linear-gradient(180deg,#09090b_0%,#18181b_48%,#0f172a_100%)] pb-24 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5 sm:px-6">
        <header className="rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 shadow-2xl shadow-black/25">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-300">
            MTT Coach
          </p>
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Preflop tournament study, hand logs, and notes in one place.
          </p>
        </header>

        {todayDrill && (
          <Card className="overflow-hidden rounded-[1.2rem] border-white/10 bg-zinc-950/78 shadow-xl shadow-black/25">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-black text-zinc-100">
                Today&apos;s Training
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Week {currentWeek} - {todayDrill.dayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-bold text-zinc-100">
                  {todayDrill.title}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Focus: {todayDrill.description}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Tool: {todayDrill.tool} - BBA only - up to 40bb
                </p>
              </div>
              <Button
                className="h-11 w-full rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600"
                onClick={() => setLocation("/study")}
              >
                Start Session
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Preflop Study
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card
              className="group cursor-pointer rounded-[1.2rem] border-white/10 bg-zinc-950/75 shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-zinc-900/90"
              onClick={() => setLocation("/strategy/library")}
            >
              <CardContent className="flex items-center gap-3 pb-4 pt-4">
                <div className="rounded-xl bg-zinc-900 p-2.5 text-orange-300 shadow-md shadow-black/20 transition group-hover:scale-105">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-zinc-100">
                    Hand Ranges
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-zinc-400">
                    BBA tournament charts up to 40bb
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card
              className="group cursor-pointer rounded-[1.2rem] border-white/10 bg-zinc-950/75 shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-zinc-900/90"
              onClick={() => setLocation("/strategy/trainer")}
            >
              <CardContent className="flex items-center gap-3 pb-4 pt-4">
                <div className="rounded-xl bg-orange-500 p-2.5 text-white shadow-md shadow-orange-950/30 transition group-hover:scale-105">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-zinc-100">
                    Range Trainer
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-zinc-400">
                    Drill current spot or random preflop spots
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-xl border-white/10 bg-zinc-950/75 py-3 text-zinc-100 shadow-sm shadow-black/20 hover:bg-zinc-900/90"
              onClick={() => setLocation("/log")}
            >
              <Trophy className="h-5 w-5 text-orange-400" />
              <span className="text-xs font-medium">Log Tournament</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-xl border-white/10 bg-zinc-950/75 py-3 text-zinc-100 shadow-sm shadow-black/20 hover:bg-zinc-900/90"
              onClick={() => setLocation("/log")}
            >
              <Hand className="h-5 w-5 text-blue-300" />
              <span className="text-xs font-medium">Log Hand</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex h-auto flex-col gap-1 rounded-xl border-white/10 bg-zinc-950/75 py-3 text-zinc-100 shadow-sm shadow-black/20 hover:bg-zinc-900/90"
              onClick={() => setLocation("/log")}
            >
              <FileText className="h-5 w-5 text-zinc-300" />
              <span className="text-xs font-medium">My Notes</span>
            </Button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            This Week&apos;s Progress
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-[1.2rem] border-blue-500/30 bg-zinc-950/75 shadow-sm shadow-black/20">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-blue-400">
                  {dashboardStats?.studyHours.toFixed(0) || "0"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Hours Studied</p>
                <Progress value={studyProgress} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.2rem] border-orange-500/30 bg-zinc-950/75 shadow-sm shadow-black/20">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-orange-400">0</p>
                <p className="mt-1 text-xs text-zinc-400">Range Reps</p>
                <Progress value={50} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.2rem] border-green-500/30 bg-zinc-950/75 shadow-sm shadow-black/20">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-green-400">
                  {dashboardStats?.tournamentsCount || "0"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">APT Sessions</p>
                <Progress value={tournamentsProgress} className="mt-2 h-1" />
              </CardContent>
            </Card>
            <Card className="rounded-[1.2rem] border-purple-500/30 bg-zinc-950/75 shadow-sm shadow-black/20">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-black text-purple-400">40</p>
                <p className="mt-1 text-xs text-zinc-400">Max Stack bb</p>
                <Progress value={75} className="mt-2 h-1" />
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {recentActivity.map(activity => (
              <Card
                key={activity.id}
                className="rounded-xl border-white/10 bg-zinc-950/75 shadow-sm transition hover:border-orange-300/40 hover:bg-zinc-900/90"
              >
                <CardContent className="flex items-start justify-between gap-3 pt-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {activity.title}
                      </p>
                      <p className="text-xs text-zinc-400">{activity.time}</p>
                    </div>
                  </div>
                  {activity.tournament && (
                    <button
                      onClick={() => {
                        setSelectedTournament(activity.tournament);
                        setShowEditModal(true);
                      }}
                      className="ml-2 flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-white/[0.08]"
                      title="Edit tournament"
                    >
                      <Edit2 className="h-4 w-4 text-zinc-500 hover:text-zinc-100" />
                    </button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
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
