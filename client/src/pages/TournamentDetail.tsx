import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, ChevronRight, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";

function formatCurrency(amount?: number | null) {
  if (amount === undefined || amount === null) return "-";
  const sign = amount > 0 ? "+" : "";
  return `${sign}$${amount.toFixed(0)}`;
}

function formatPosition(finalPosition?: number | null) {
  if (!finalPosition) return "-";
  return `${finalPosition}`;
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = Number(id);
  const [, setLocation] = useLocation();
  const [handFilter, setHandFilter] = useState("all");

  const { data: tournament, isLoading: tournamentLoading } =
    trpc.tournaments.getById.useQuery(
      { id: tournamentId },
      { enabled: Number.isFinite(tournamentId) }
    );

  const { data: hands = [], isLoading: handsLoading } =
    trpc.hands.getByTournament.useQuery(
      { tournamentId },
      { enabled: Number.isFinite(tournamentId) }
    );

  const preflopMistakes = useMemo(
    () =>
      hands.filter(
        hand => hand.mistakeStreet === "PREFLOP" && (hand.mistakeSeverity ?? 0) > 0
      ),
    [hands]
  );

  const reviewedCount = useMemo(
    () => hands.filter(hand => hand.reviewed).length,
    [hands]
  );

  const averageSeverity = useMemo(() => {
    if (preflopMistakes.length === 0) return "-";
    const total = preflopMistakes.reduce(
      (sum, hand) => sum + (hand.mistakeSeverity ?? 0),
      0
    );
    return (total / preflopMistakes.length).toFixed(1);
  }, [preflopMistakes]);

  const topSpots = useMemo(() => {
    const counts = new Map<string, number>();
    for (const hand of hands) {
      const key = hand.spotType ? hand.spotType.replace(/_/g, " ") : "Unlabeled";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [hands]);

  const visibleHands = useMemo(() => {
    if (handFilter === "all") return hands;
    if (handFilter === "reviewed") return hands.filter(hand => hand.reviewed);
    return hands.filter(
      hand => hand.mistakeStreet === "PREFLOP" && (hand.mistakeSeverity ?? 0) > 0
    );
  }, [handFilter, hands]);

  if (tournamentLoading) {
    return (
      <div className="app-shell min-h-screen text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90">
          <div className="container py-4">
            <Skeleton className="h-8 w-40" />
          </div>
        </header>
        <main className="container max-w-5xl space-y-4 py-6">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-foreground">
        <Card className="app-surface w-full max-w-md">
          <CardHeader>
            <CardTitle>Tournament not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl space-y-4 py-6">
        <Card className="app-surface">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-xl">
                  {tournament.name || tournament.venue || "Tournament Session"}
                </CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">
                  {new Date(tournament.date).toLocaleDateString()} - BBA tournament review
                </CardDescription>
              </div>
              <Badge className="rounded-full bg-primary text-primary-foreground">
                <Trophy className="mr-1 h-3.5 w-3.5" />
                Preflop Focus
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Buy-in</p>
                <p className="mt-1 text-lg font-black text-foreground">
                  {formatCurrency(tournament.buyIn)}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Finish</p>
                <p className="mt-1 text-lg font-black text-foreground">
                  {formatPosition(tournament.finalPosition)}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Net</p>
                <p
                  className={`mt-1 text-lg font-black ${
                    (tournament.netResult ?? 0) >= 0 ? "text-emerald-300" : "text-red-300"
                  }`}
                >
                  {formatCurrency(tournament.netResult)}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Prize</p>
                <p className="mt-1 text-lg font-black text-foreground">
                  {formatCurrency(tournament.prize)}
                </p>
              </div>
            </div>

            {tournament.notesOverall && (
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Tournament Note</p>
                <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                  {tournament.notesOverall}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Preflop Review Summary</CardTitle>
            <CardDescription>
              Hand logs and mistakes from this tournament session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Hands Logged</p>
                <p className="mt-1 text-2xl font-black">{hands.length}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Reviewed</p>
                <p className="mt-1 text-2xl font-black">{reviewedCount}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Preflop Mistakes</p>
                <p className="mt-1 text-2xl font-black text-red-300">
                  {preflopMistakes.length}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Avg Severity</p>
                <p className="mt-1 text-2xl font-black">{averageSeverity}</p>
              </div>
            </div>

            {topSpots.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Top Spot Types</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {topSpots.map(([spot, count]) => (
                    <Badge
                      key={spot}
                      variant="outline"
                      className="rounded-full border-border/80 bg-accent/60 text-secondary-foreground"
                    >
                      {spot} - {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Hands in This Session</CardTitle>
                <CardDescription>Open any hand to review and tag takeaways.</CardDescription>
              </div>
              <Select value={handFilter} onValueChange={setHandFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hands</SelectItem>
                  <SelectItem value="mistakes">Preflop Mistakes</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {handsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(index => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : visibleHands.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/75 bg-accent/45 py-10 text-center">
                <p className="text-sm font-semibold text-foreground">No hands match this filter</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Switch filters or log another hand from this session.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleHands.map(hand => (
                  <button
                    key={hand.id}
                    type="button"
                    onClick={() => setLocation(`/hands/${hand.id}`)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-border/80 bg-accent/45 p-3 text-left transition hover:border-border hover:bg-accent/65"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-semibold">
                          {hand.heroHand || "Hand"}
                        </span>
                        {hand.heroPosition && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/80 bg-accent/60 text-[11px] text-secondary-foreground"
                          >
                            {hand.heroPosition}
                          </Badge>
                        )}
                        {(hand.mistakeSeverity ?? 0) > 0 && (
                          <Badge className="rounded-full bg-red-500/85 text-white">
                            Sev {hand.mistakeSeverity}
                          </Badge>
                        )}
                        {hand.reviewed && (
                          <Badge className="rounded-full bg-emerald-500 text-white">
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          hand.spotType?.replace(/_/g, " "),
                          hand.effectiveStackBb ? `${Math.round(hand.effectiveStackBb)}bb` : null,
                          "BBA",
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
