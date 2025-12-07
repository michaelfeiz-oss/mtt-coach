import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Hand, TrendingUp, Trophy, Plus, FileText, Zap, Clock, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PROGRAM_WEEKS } from "@/lib/curriculum";
import { useState, useEffect } from "react";
import { EditTournamentModal } from "@/components/EditTournamentModal";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(1);
  const { data: dashboardStats } = trpc.dashboard.getStats.useQuery({ weekId: currentWeek });
  const { data: tournaments } = trpc.tournaments.getByWeek.useQuery({ weekId: currentWeek });
  const [todayDrill, setTodayDrill] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  
  const { mutate: updateTournament, isPending: isUpdatingTournament } =
    trpc.tournaments.update.useMutation({
      onSuccess: () => {
        setShowEditModal(false);
        setSelectedTournament(null);
      },
    });

  // Calculate current week based on calendar
  useEffect(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const weekNumber = Math.ceil(dayOfYear / 7);
    const cycleWeek = ((weekNumber - 1) % 12) + 1;
    setCurrentWeek(cycleWeek);

    // Get today's drill
    const weekData = PROGRAM_WEEKS[cycleWeek - 1];
    if (weekData) {
      const dayOfWeek = today.getDay();
      const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 (Mon-Sun)
      const day = weekData.days[dayIndex];
      if (day) {
        setTodayDrill({
          title: day.label,
          description: day.description,
          tool: day.drills[0]?.tool || "Poker Trainer",
          week: cycleWeek,
          dayName: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][dayIndex],
        });
      }
    }
  }, []);

  const weekData = PROGRAM_WEEKS[currentWeek - 1];
  const studyProgress = dashboardStats ? (dashboardStats.studyHours / dashboardStats.studyHoursTarget) * 100 : 0;
  const tournamentsProgress = dashboardStats ? (dashboardStats.tournamentsCount / dashboardStats.tournamentsTarget) * 100 : 0;

  // Build activity feed from real tournament data
  const recentActivity = tournaments?.map((t: any) => ({
    id: t.id,
    emoji: "🏆",
    title: `Tournament — ${t.venue || "Tournament"} ${t.buyIn > 0 ? "$" + t.buyIn : ""} — ${t.netResult >= 0 ? "+" : ""}$${Math.abs(t.netResult).toFixed(0)}`,
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
        {todayDrill && (
          <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Today's Training</CardTitle>
              <CardDescription className="text-xs">
                Week {currentWeek} • {todayDrill.dayName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-bold">{todayDrill.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Focus: {todayDrill.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Tool: {todayDrill.tool}</p>
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setLocation("/study")}
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
              onClick={() => setLocation("/log")}
            >
              <Trophy className="h-5 w-5 text-orange-500" />
              <span className="text-xs font-medium">Log Tournament</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col gap-1 py-3"
              onClick={() => setLocation("/log")}
            >
              <Hand className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Log Hand</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto flex flex-col gap-1 py-3"
              onClick={() => setLocation("/log")}
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
                <p className="text-2xl font-bold text-orange-600">0</p>
                <p className="text-xs text-muted-foreground mt-1">Solver Drills</p>
                <Progress value={50} className="h-1 mt-2" />
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-transparent border-green-200">
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-green-600">{dashboardStats?.tournamentsCount || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">APT Sessions</p>
                <Progress value={tournamentsProgress} className="h-1 mt-2" />
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
            {recentActivity.map((activity) => (
              <Card key={activity.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="pt-4 flex items-start gap-3 justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl">{activity.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                  {activity.tournament && (
                    <button
                      onClick={() => {
                        setSelectedTournament(activity.tournament);
                        setShowEditModal(true);
                      }}
                      className="ml-2 p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
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

      {/* EDIT TOURNAMENT MODAL */}
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
