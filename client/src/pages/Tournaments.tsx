import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LogTournamentModal } from "@/components/LogTournamentModal";
import { EditTournamentModal } from "@/components/EditTournamentModal";
import { trpc } from "@/lib/trpc";

interface TournamentFormData {
  buyIn: string;
  reEntries: string;
  startingStack: string;
  finalPosition: string;
  prize: string;
  venue: string;
  notes: string;
}

function formatMoney(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}$${Math.round(value)}`;
}

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalInt(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseFinalPosition(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : undefined;
}

export default function Tournaments() {
  const [, setLocation] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: tournaments = [], isLoading } =
    trpc.tournaments.getByUser.useQuery({ limit: 100 });

  const createTournament = trpc.tournaments.create.useMutation({
    onSuccess: async () => {
      toast.success("Tournament saved");
      setShowCreateModal(false);
      await utils.tournaments.getByUser.invalidate();
    },
    onError: error => toast.error(`Could not save tournament: ${error.message}`),
  });

  const updateTournament = trpc.tournaments.update.useMutation({
    onSuccess: async () => {
      toast.success("Tournament updated");
      setSelectedTournament(null);
      await utils.tournaments.getByUser.invalidate();
    },
    onError: error => toast.error(`Could not update tournament: ${error.message}`),
  });

  const deleteTournament = trpc.tournaments.delete.useMutation({
    onSuccess: async () => {
      toast.success("Tournament deleted");
      await utils.tournaments.getByUser.invalidate();
    },
    onError: error => toast.error(`Could not delete tournament: ${error.message}`),
  });

  function handleCreate(data: TournamentFormData) {
    createTournament.mutate({
      date: new Date(),
      buyIn: parseNumber(data.buyIn),
      reEntries: Number.parseInt(data.reEntries, 10) || 0,
      startingStack: parseOptionalInt(data.startingStack),
      finalPosition: parseFinalPosition(data.finalPosition),
      prize: parseNumber(data.prize),
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  }

  function handleUpdate(data: TournamentFormData) {
    if (!selectedTournament) return;
    updateTournament.mutate({
      id: selectedTournament.id,
      buyIn: parseNumber(data.buyIn),
      reEntries: Number.parseInt(data.reEntries, 10) || 0,
      startingStack: parseOptionalInt(data.startingStack),
      finalPosition: parseFinalPosition(data.finalPosition),
      prize: parseNumber(data.prize),
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">Results</p>
              <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Buy-ins, results, and notes from live sessions.
              </p>
            </div>
            <Button
              className="h-11 rounded-xl px-4"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Result
            </Button>
          </div>
        </header>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Tournament History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading &&
              [1, 2, 3, 4].map(index => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}

            {!isLoading && tournaments.length === 0 && (
              <div className="app-empty-state p-5">
                No tournaments saved yet. Add your next result after play.
              </div>
            )}

            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className="app-list-row flex items-start justify-between gap-3 p-3.5"
              >
                <button
                  type="button"
                  onClick={() => setLocation(`/tournaments/${tournament.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">
                      {tournament.venue || tournament.name || "Tournament"}
                    </p>
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
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(tournament.date).toLocaleDateString()} | Buy-in{" "}
                    {formatMoney(tournament.buyIn)} | Prize{" "}
                    {formatMoney(tournament.prize)}
                  </p>
                  {tournament.notesOverall && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {tournament.notesOverall}
                    </p>
                  )}
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setSelectedTournament(tournament)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => deleteTournament.mutate({ id: tournament.id })}
                    disabled={deleteTournament.isPending}
                    aria-label="Delete tournament"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <LogTournamentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={createTournament.isPending}
      />

      <EditTournamentModal
        isOpen={Boolean(selectedTournament)}
        onClose={() => setSelectedTournament(null)}
        onSubmit={handleUpdate}
        isLoading={updateTournament.isPending}
        tournament={selectedTournament}
      />
    </main>
  );
}
