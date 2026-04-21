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
import { AddLeakModal } from "@/components/AddLeakModal";
import { AddNoteModal } from "@/components/AddNoteModal";
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

interface LeakFormData {
  leakType: string;
  notes?: string;
}

interface NoteFormData {
  category?: string;
  content: string;
}

type LeakCategory = "PREFLOP" | "POSTFLOP" | "ICM" | "MENTAL" | "EXPLOIT";

const secondaryActions = [
  {
    id: "tournament",
    title: "Tournament Result",
    helper: "Buy-in, finish, prize, and notes",
    icon: Trophy,
  },
  {
    id: "leak",
    title: "Add Leak",
    helper: "Track a recurring mistake",
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

function leakCategoryFromType(leakType: string): LeakCategory {
  if (leakType.includes("preflop") || leakType.includes("3bet")) {
    return "PREFLOP";
  }
  if (leakType.includes("tilt")) return "MENTAL";
  if (leakType.includes("bankroll")) return "MENTAL";
  if (leakType.includes("icm")) return "ICM";
  if (leakType.includes("strategy") || leakType.includes("play")) {
    return "POSTFLOP";
  }
  return "EXPLOIT";
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

  function handleAddLeak(data: LeakFormData) {
    createLeak({
      name: data.leakType.replace(/-/g, " ") || "Poker leak",
      category: leakCategoryFromType(data.leakType),
      description: data.notes || "",
      status: "ACTIVE",
    });
  }

  function handleAddNote(data: NoteFormData) {
    toast.success(data.category ? "Note captured" : "Quick note captured");
    setShowAddNoteModal(false);
  }

  function openSecondaryAction(id: (typeof secondaryActions)[number]["id"]) {
    if (id === "tournament") setShowLogTournamentModal(true);
    if (id === "leak") setShowAddLeakModal(true);
    if (id === "note") setShowAddNoteModal(true);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.11),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_44%,#eef2f7_100%)] pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-7">
        <section className="rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.2),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 text-white shadow-2xl shadow-slate-950/20 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-300">
                Fast Capture
              </p>
              <h1 className="text-3xl font-black tracking-tight">Log</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Capture hands while the decision is fresh. Keep the first pass
                fast, then review mistakes when you are ready.
              </p>
            </div>
            <Button
              className="h-12 rounded-2xl bg-orange-500 px-5 font-black text-white shadow-lg shadow-orange-950/25 hover:bg-orange-600"
              onClick={() => setShowLogHandModal(true)}
            >
              <Zap className="mr-2 h-4 w-4" />
              Log a Hand
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <Card
            className="cursor-pointer rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-2xl hover:shadow-slate-950/10"
            onClick={() => setShowLogHandModal(true)}
          >
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/15">
                  <Zap className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-950">
                        Guided Hand Entry
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        Four focused steps: context, key action, review signal,
                        and save.
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Under 60 sec", "Mobile first", "Review later"].map(
                      label => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="rounded-full border-orange-200 bg-orange-50 text-orange-700"
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
                  className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 text-left shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-md"
                  onClick={() => openSecondaryAction(action.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-orange-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-950">
                        {action.title}
                      </p>
                      <p className="text-sm text-slate-600">{action.helper}</p>
                    </div>
                    <Plus className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
                Review Queue
              </p>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Recent Hands
              </h2>
            </div>
            <Link href="/hands">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-xs font-bold text-slate-600 hover:text-slate-950"
              >
                Open review
              </Button>
            </Link>
          </div>

          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5">
            <CardContent className="space-y-2 p-4 sm:p-5">
              {handsLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map(index => (
                    <Skeleton key={index} className="h-14 rounded-2xl" />
                  ))}
                </div>
              )}

              {!handsLoading && recentHands.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center">
                  <History className="mx-auto h-7 w-7 text-slate-400" />
                  <p className="mt-3 text-sm font-bold text-slate-950">
                    No hands logged yet
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Start with one fast capture. You can add detail later.
                  </p>
                </div>
              )}

              {!handsLoading &&
                recentHands.map(hand => (
                  <Link key={hand.id} href={`/hands/${hand.id}`}>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition hover:border-orange-200 hover:bg-white hover:shadow-md">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">
                          {hand.heroHand || "Captured hand"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-600">
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
                            : "bg-zinc-950 text-white"
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
