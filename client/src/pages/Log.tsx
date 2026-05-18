import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Clock3, FileText, History, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { LogHandModalV2_1 } from "@/components/hands/LogHandModalV2_1";
import { LogTournamentModal } from "@/components/LogTournamentModal";
import { AddNoteModal, type AddNoteFormData } from "@/components/AddNoteModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface TournamentFormData {
  buyIn: string;
  reEntries: string;
  startingStack: string;
  finalPosition: string;
  prize: string;
  venue: string;
  notes: string;
}

const supportingActions = [
  {
    id: "tournament",
    title: "Tournament Result",
    helper: "Buy-in, finish, prize, and notes",
    icon: Trophy,
  },
  {
    id: "note",
    title: "Quick Note",
    helper: "Player read, mental note, or session reminder",
    icon: FileText,
  },
] as const;

function parseNumber(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFinalPosition(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : undefined;
}

function reviewStatus(reviewed: boolean, mistakeSeverity: number) {
  if (!reviewed) return "Review";
  if (mistakeSeverity > 0) return "Mistake";
  return "Done";
}

function reviewStatusClass(status: string) {
  if (status === "Done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Mistake") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function Log() {
  const [showLogHandModal, setShowLogHandModal] = useState(false);
  const [showLogTournamentModal, setShowLogTournamentModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const utils = trpc.useUtils();
  const { data: recentHands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 8 });

  const { mutate: createTournament, isPending: isCreatingTournament } =
    trpc.tournaments.create.useMutation({
      onSuccess: async () => {
        toast.success("Tournament saved");
        setShowLogTournamentModal(false);
        await utils.tournaments.getByUser.invalidate();
      },
      onError: error =>
        toast.error(`Could not save tournament: ${error.message}`),
    });

  const { mutate: createNote, isPending: isCreatingNote } =
    trpc.notes.create.useMutation({
      onSuccess: async () => {
        toast.success("Note saved");
        setShowAddNoteModal(false);
        await utils.notes.list.invalidate();
      },
      onError: error => toast.error(`Could not save note: ${error.message}`),
    });

  const statusCounts = useMemo(() => {
    return recentHands.reduce(
      (accumulator, hand) => {
        const status = reviewStatus(hand.reviewed, hand.mistakeSeverity);
        accumulator[status] = (accumulator[status] ?? 0) + 1;
        return accumulator;
      },
      { Review: 0, Mistake: 0, Done: 0 } as Record<string, number>
    );
  }, [recentHands]);
  const recentHandPreview = recentHands.slice(0, 6);

  function handleLogTournament(data: TournamentFormData) {
    createTournament({
      date: new Date(),
      buyIn: parseNumber(data.buyIn),
      reEntries: Number.parseInt(data.reEntries, 10) || 0,
      startingStack: Number.parseInt(data.startingStack, 10) || 0,
      finalPosition: parseFinalPosition(data.finalPosition),
      prize: parseNumber(data.prize),
      venue: data.venue || "",
      notesOverall: data.notes || "",
    });
  }

  function handleAddNote(data: AddNoteFormData) {
    createNote({
      category: data.category || "general",
      content: data.content,
    });
  }

  function openSupportingAction(id: (typeof supportingActions)[number]["id"]) {
    if (id === "tournament") setShowLogTournamentModal(true);
    if (id === "note") setShowAddNoteModal(true);
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">Fast Capture</p>
              <h1 className="text-3xl font-bold tracking-tight">Log</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Keep entries short while playing, then review details later.
              </p>
            </div>
            <Button
              className="h-11 rounded-xl px-4"
              onClick={() => setShowLogHandModal(true)}
            >
              <Zap className="h-4 w-4" />
              Log Hand
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)]">
          <Card className="app-surface">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Quick Hand Log</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hand, stack, spot, line, and one lesson when needed.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Primary
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Fast", icon: Clock3 },
                  { label: "Live-safe", icon: Zap },
                  { label: "Review later", icon: History },
                ].map(item => (
                  <Badge
                    key={item.label}
                    variant="outline"
                    className="rounded-full px-3"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Badge>
                ))}
              </div>

              <Button
                className="h-11 w-full rounded-xl"
                onClick={() => setShowLogHandModal(true)}
              >
                Open Hand Log
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-2.5">
            {supportingActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className="app-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5"
                  onClick={() => openSupportingAction(action.id)}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary ring-1 ring-border/70">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.helper}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <Card className="app-surface">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-lg">Recent Hands</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  The latest hands waiting for review.
                </p>
              </div>
              <Link href="/hands">
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start rounded-full"
                >
                  Open Hands
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Review", value: statusCounts.Review },
                  { label: "Mistake", value: statusCounts.Mistake },
                  { label: "Done", value: statusCounts.Done },
                ].map(stat => (
                  <div key={stat.label} className="app-chip">
                    {stat.label}: {stat.value}
                  </div>
                ))}
              </div>

              {handsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(index => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                  ))}
                </div>
              )}

              {!handsLoading && recentHands.length === 0 && (
                <div className="app-empty-state p-4">
                  No hands logged yet. Capture your next decision from the
                  button above.
                </div>
              )}

              {!handsLoading &&
                recentHandPreview.map(hand => {
                  const status = reviewStatus(
                    hand.reviewed,
                    hand.mistakeSeverity
                  );
                  return (
                    <Link key={hand.id} href={`/hands/${hand.id}`}>
                      <div className="app-list-row flex items-center justify-between gap-3 p-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            {hand.heroHand || hand.handClass || "Captured hand"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {[
                              hand.heroPosition,
                              hand.effectiveStackBb
                                ? `${Math.round(hand.effectiveStackBb)}bb`
                                : null,
                              hand.spotType?.replace(/_/g, " "),
                            ]
                              .filter(Boolean)
                              .join(" | ") || "Needs review details"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full",
                            reviewStatusClass(status)
                          )}
                        >
                          {status}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
            </CardContent>
          </Card>
        </section>
      </div>

      <LogHandModalV2_1
        isOpen={showLogHandModal}
        onClose={() => setShowLogHandModal(false)}
      />

      <LogTournamentModal
        isOpen={showLogTournamentModal}
        onClose={() => setShowLogTournamentModal(false)}
        onSubmit={handleLogTournament}
        isLoading={isCreatingTournament}
      />

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onSubmit={handleAddNote}
        isLoading={isCreatingNote}
      />
    </main>
  );
}
