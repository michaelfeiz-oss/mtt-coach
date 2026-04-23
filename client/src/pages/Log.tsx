import { useState } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  ChevronRight,
  FileText,
  History,
  Plus,
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
import { Card, CardContent } from "@/components/ui/card";
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

const secondaryActions = [
  {
    id: "tournament",
    title: "Tournament Result",
    helper: "Buy-in, finish, prize, and notes",
    icon: Trophy,
  },
  {
    id: "leak",
    title: "Preflop Leak",
    helper: "Track a recurring range or spot mistake",
    icon: AlertCircle,
  },
  {
    id: "note",
    title: "Add Note",
    helper: "Save a thought or observation",
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

export default function Log() {
  const [showLogHandModal, setShowLogHandModal] = useState(false);
  const [showLogTournamentModal, setShowLogTournamentModal] = useState(false);
  const [showAddLeakModal, setShowAddLeakModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);

  const utils = trpc.useUtils();
  const { data: recentHands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 4 });

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
      name: data.leakType.replace(/-/g, " ") || "Poker leak",
      category: leakCategoryFromType(),
      description: data.notes || "",
      status: "ACTIVE",
    });
  }

  function handleAddNote(data: AddNoteFormData) {
    toast.success(data.category ? "Note captured" : "Quick note captured");
    setShowAddNoteModal(false);
  }

  function openSecondaryAction(id: (typeof secondaryActions)[number]["id"]) {
    if (id === "tournament") setShowLogTournamentModal(true);
    if (id === "leak") setShowAddLeakModal(true);
    if (id === "note") setShowAddNoteModal(true);
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-7">
        <section className="app-surface-elevated rounded-[1.3rem] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">
                Fast Capture
              </p>
              <h1 className="text-3xl font-black tracking-tight">Log</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Capture preflop tournament hands while the decision is fresh.
                Keep the first pass fast, then review mistakes when you are ready.
              </p>
            </div>
            <Button
              className="h-12 rounded-2xl bg-primary px-5 font-semibold text-primary-foreground shadow-sm shadow-black/25 hover:bg-[#FF8A1F]"
              onClick={() => setShowLogHandModal(true)}
            >
              <Zap className="mr-2 h-4 w-4" />
              Log a Hand
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card
            className="cursor-pointer rounded-[1.2rem] border-border/80 bg-card/92 shadow-[0_10px_28px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-border hover:bg-card"
            onClick={() => setShowLogHandModal(true)}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-black/20">
                  <Zap className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        Guided Hand Entry
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Preflop context, key action, review signal, and save.
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Under 60 sec", "Preflop first", "Review later"].map(
                      label => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="rounded-full border-border/80 bg-accent/55 text-secondary-foreground"
                        >
                          {label}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            {secondaryActions.map(action => {
              const Icon = action.icon;

              return (
                <button
                  key={action.id}
                  type="button"
                  className="rounded-[1rem] border border-border/80 bg-card/88 p-4 text-left shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:border-border hover:bg-card"
                  onClick={() => openSecondaryAction(action.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {action.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{action.helper}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
                Review Queue
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Recent Hands
              </h2>
            </div>
            <Link href="/hands">
              <Button
                variant="ghost"
                size="sm"
                    className="h-8 rounded-full text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    Open review
                  </Button>
            </Link>
          </div>

          <Card className="rounded-[1.2rem] border-border/80 bg-card/92 shadow-[0_10px_28px_rgba(0,0,0,0.24)]">
            <CardContent className="space-y-2 p-4 sm:p-5">
              {handsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(index => (
                    <Skeleton key={index} className="h-14 rounded-2xl" />
                  ))}
                </div>
              )}

              {!handsLoading && recentHands.length === 0 && (
                <div className="rounded-[1rem] border border-dashed border-border/75 bg-accent/45 p-6 text-center">
                  <History className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    No hands logged yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with one fast capture. You can add detail later.
                  </p>
                </div>
              )}

              {!handsLoading &&
                recentHands.map(hand => (
                  <Link key={hand.id} href={`/hands/${hand.id}`}>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-accent/45 p-3 transition hover:border-border hover:bg-accent/65 hover:shadow-md hover:shadow-black/20">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
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
                            .join(" - ") || "Ready for review"}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "shrink-0 rounded-full",
                          hand.reviewed
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-800 text-zinc-100"
                        )}
                      >
                        {hand.reviewed ? "Reviewed" : "Review"}
                      </Badge>
                    </div>
                  </Link>
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
