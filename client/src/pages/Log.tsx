import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  FileText,
  History,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { LogHandModalV2_1 } from "@/components/hands/LogHandModalV2_1";
import { LogTournamentModal } from "@/components/LogTournamentModal";
import { AddLeakModal, type AddLeakFormData } from "@/components/AddLeakModal";
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

type LeakCategory = "PREFLOP";

const supportingActions = [
  {
    id: "tournament",
    title: "Tournament Result",
    helper: "Buy-in, finish, prize, and notes",
    icon: Trophy,
  },
  {
    id: "leak",
    title: "Preflop Leak",
    helper: "Capture recurring mistakes you can train",
    icon: AlertCircle,
  },
  {
    id: "note",
    title: "Add Note",
    helper: "Save quick takeaways tied to study",
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

function leakCategoryFromType(): LeakCategory {
  return "PREFLOP";
}

function reviewStatus(reviewed: boolean, mistakeSeverity: number) {
  if (!reviewed) return "Draft";
  if (mistakeSeverity > 0) return "Needs Review";
  return "Reviewed";
}

export default function Log() {
  const [showLogHandModal, setShowLogHandModal] = useState(false);
  const [showLogTournamentModal, setShowLogTournamentModal] = useState(false);
  const [showAddLeakModal, setShowAddLeakModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const utils = trpc.useUtils();
  const { data: recentHands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 8 });

  const { mutate: createTournament, isPending: isCreatingTournament } =
    trpc.tournaments.create.useMutation({
      onSuccess: () => {
        toast.success("Tournament saved");
        setShowLogTournamentModal(false);
      },
      onError: error => toast.error(`Could not save tournament: ${error.message}`),
    });

  const { mutate: createLeak, isPending: isCreatingLeak } =
    trpc.leaks.create.useMutation({
      onSuccess: async () => {
        toast.success("Leak saved");
        await utils.leaks.getTop.invalidate();
        setShowAddLeakModal(false);
      },
      onError: error => toast.error(`Could not save leak: ${error.message}`),
    });

  const statusCounts = useMemo(() => {
    return recentHands.reduce(
      (accumulator, hand) => {
        const status = reviewStatus(hand.reviewed, hand.mistakeSeverity);
        accumulator[status] = (accumulator[status] ?? 0) + 1;
        return accumulator;
      },
      { Draft: 0, "Needs Review": 0, Reviewed: 0 } as Record<string, number>
    );
  }, [recentHands]);

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

  function handleAddLeak(data: AddLeakFormData) {
    createLeak({
      name: data.leakType.replace(/_/g, " ") || "Poker leak",
      category: leakCategoryFromType(),
      description: data.notes || "",
      status: "ACTIVE",
    });
  }

  function handleAddNote(data: AddNoteFormData) {
    toast.success(data.category ? "Note captured" : "Quick note captured");
    setShowAddNoteModal(false);
  }

  function openSupportingAction(id: (typeof supportingActions)[number]["id"]) {
    if (id === "tournament") setShowLogTournamentModal(true);
    if (id === "leak") setShowAddLeakModal(true);
    if (id === "note") setShowAddNoteModal(true);
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">Capture Hub</p>
              <h1 className="text-3xl font-bold tracking-tight">Log</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Capture preflop hands in seconds, then review them with more
                detail when you have time.
              </p>
            </div>
            <Button
              className="h-11 rounded-xl px-4"
              onClick={() => setShowLogHandModal(true)}
            >
              <Zap className="h-4 w-4" />
              Log a Hand
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
                    Under 30 seconds for the core preflop decision. Add optional
                    detail later.
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  Primary
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Fast capture", icon: Clock3 },
                  { label: "Preflop first", icon: Zap },
                  { label: "Review later", icon: History },
                ].map(item => (
                  <Badge key={item.label} variant="outline" className="rounded-full px-3">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Badge>
                ))}
              </div>

              <Button
                className="h-11 w-full rounded-xl"
                onClick={() => setShowLogHandModal(true)}
              >
                Open Quick Hand Log
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.helper}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="app-surface">
            <CardHeader className="flex flex-row items-end justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Recent Hands</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep the queue moving with clear statuses.
                </p>
              </div>
              <Link href="/hands">
                <Button variant="outline" size="sm" className="rounded-full">
                  Open Review Queue
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {handsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(index => (
                    <Skeleton key={index} className="h-14 rounded-xl" />
                  ))}
                </div>
              )}

              {!handsLoading && recentHands.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-accent/60 p-4 text-sm text-muted-foreground">
                  No hands logged yet. Capture your next preflop decision from the
                  button above.
                </div>
              )}

              {!handsLoading &&
                recentHands.map(hand => {
                  const status = reviewStatus(hand.reviewed, hand.mistakeSeverity);
                  return (
                    <Link key={hand.id} href={`/hands/${hand.id}`}>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/60 p-3 transition hover:bg-accent/85">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {hand.heroHand || "Captured hand"}
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
                              .join(" • ") || "Needs review details"}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full",
                            status === "Reviewed" &&
                              "bg-emerald-500/15 text-emerald-700",
                            status === "Needs Review" &&
                              "bg-amber-500/15 text-amber-700",
                            status === "Draft" && "bg-slate-200 text-slate-700"
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

          <Card className="app-surface">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold">Queue Status</p>
              {[
                { label: "Draft", value: statusCounts.Draft },
                { label: "Needs Review", value: statusCounts["Needs Review"] },
                { label: "Reviewed", value: statusCounts.Reviewed },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-accent/70 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-semibold">{stat.value}</p>
                </div>
              ))}
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

      <AddLeakModal
        isOpen={showAddLeakModal}
        onClose={() => setShowAddLeakModal(false)}
        onSubmit={handleAddLeak}
        isLoading={isCreatingLeak}
      />

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onSubmit={handleAddNote}
      />
    </main>
  );
}
