import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { FileText, Hand, Plus, Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTournamentModal } from "@/components/EditTournamentModal";

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}$${Math.round(value)}`;
}

function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: hands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 5 });
  const { data: tournaments = [], isLoading: tournamentsLoading } =
    trpc.tournaments.getByUser.useQuery({ limit: 5 });
  const { data: notes = [] } = trpc.notes.list.useQuery({ limit: 3 });

  const { mutate: updateTournament, isPending: isUpdatingTournament } =
    trpc.tournaments.update.useMutation({
      onSuccess: async () => {
        setShowEditModal(false);
        setSelectedTournament(null);
        await utils.tournaments.getByUser.invalidate();
      },
    });

  const pendingHands = useMemo(
    () => hands.filter(hand => !hand.reviewed).length,
    [hands]
  );
  const netResult = useMemo(
    () =>
      tournaments.reduce(
        (total, tournament) => total + (tournament.netResult ?? 0),
        0
      ),
    [tournaments]
  );

  function handleEditTournament(data: any) {
    if (!selectedTournament) return;
    updateTournament({
      id: selectedTournament.id,
      buyIn: Number(data.buyIn) || 0,
      reEntries: Number.parseInt(data.reEntries, 10) || 0,
      startingStack: parseOptionalNumber(data.startingStack),
      finalPosition: parseOptionalNumber(data.finalPosition),
      prize: Number(data.prize) || 0,
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <p className="app-eyebrow mb-2">Live Play Desk</p>
          <h1 className="text-3xl font-bold tracking-tight">MTT Coach</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Log hands, track tournaments, and keep notes without the study
            tools getting in the way.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Hands",
              value: String(hands.length),
              helper: `${pendingHands} pending`,
            },
            {
              label: "Tournaments",
              value: String(tournaments.length),
              helper: formatMoney(netResult),
            },
            {
              label: "Notes",
              value: String(notes.length),
              helper: "latest saved",
            },
          ].map(stat => (
            <Card key={stat.label} className="app-surface">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {stat.helper}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-3 gap-2">
          {[
            {
              label: "Log Hand",
              icon: Hand,
              onClick: () => setLocation("/log"),
            },
            {
              label: "Tournament",
              icon: Trophy,
              onClick: () => setLocation("/tournaments"),
            },
            {
              label: "Note",
              icon: FileText,
              onClick: () => setLocation("/notes"),
            },
          ].map(action => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="app-surface flex min-h-24 flex-col items-center justify-center gap-2 p-3 text-center transition hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary ring-1 ring-border/70">
                <action.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold">{action.label}</span>
            </button>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Card className="app-surface">
            <CardHeader className="flex flex-row items-end justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Recent Hands</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quick review queue from the latest logs.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setLocation("/hands")}
              >
                Open
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {handsLoading &&
                [1, 2, 3].map(index => (
                  <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
              {!handsLoading && hands.length === 0 && (
                <div className="app-empty-state px-4 py-3.5">
                  No hands yet. Use Log Hand during or after play.
                </div>
              )}
              {hands.map(hand => (
                <button
                  key={hand.id}
                  type="button"
                  onClick={() => setLocation(`/hands/${hand.id}`)}
                  className="app-list-row flex w-full items-center justify-between gap-3 p-3.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {hand.heroHand || hand.handClass || "Logged hand"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[hand.heroPosition, hand.effectiveStackBb ? `${Math.round(hand.effectiveStackBb)}bb` : null]
                        .filter(Boolean)
                        .join(" | ") || "No details yet"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {hand.reviewed ? "Reviewed" : "Review"}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="app-surface">
            <CardHeader className="flex flex-row items-end justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Recent Tournaments</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest results and session notes.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setLocation("/tournaments")}
              >
                Open
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {tournamentsLoading &&
                [1, 2, 3].map(index => (
                  <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
              {!tournamentsLoading && tournaments.length === 0 && (
                <div className="app-empty-state px-4 py-3.5">
                  No tournaments yet. Add the result when the session ends.
                </div>
              )}
              {tournaments.map(tournament => (
                <button
                  key={tournament.id}
                  type="button"
                  onClick={() => {
                    setSelectedTournament(tournament);
                    setShowEditModal(true);
                  }}
                  className="app-list-row flex w-full items-center justify-between gap-3 p-3.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {tournament.venue || tournament.name || "Tournament"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(tournament.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      (tournament.netResult ?? 0) >= 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-[#FFF7E6] text-[#9A4D12]"
                    }
                  >
                    {formatMoney(tournament.netResult)}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <Button
          className="h-12 rounded-xl"
          onClick={() => setLocation("/log")}
        >
          <Plus className="h-4 w-4" />
          Open Live Log
        </Button>
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
