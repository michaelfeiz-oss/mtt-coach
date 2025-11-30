import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const tournamentId = parseInt(id!);

  const { data: tournament, isLoading: tournamentLoading } = trpc.tournaments.getById.useQuery({
    id: tournamentId,
  });

  const { data: hands, isLoading: handsLoading } = trpc.hands.getByTournament.useQuery({
    tournamentId,
  });

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200">
          <div className="container py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container py-6 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200">
          <div className="container py-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </header>
        <main className="container py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Tournament not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Calculate mistake summary
  const mistakesByStreet = hands?.reduce(
    (acc: Record<string, number>, hand) => {
      if (hand.mistakeStreet) {
        acc[hand.mistakeStreet] = (acc[hand.mistakeStreet] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const totalMistakes = Object.values(mistakesByStreet || {}).reduce((sum: number, count) => sum + (count as number), 0);

  // Get top 3 leaks (would need to aggregate from handLeaks junction table)
  // For now, just show mistake count by severity
  const mistakesBySeverity = hands?.reduce(
    (acc: Record<number, number>, hand) => {
      if (hand.mistakeSeverity && hand.mistakeSeverity > 0) {
        const severity = hand.mistakeSeverity;
        acc[severity] = (acc[severity] || 0) + 1;
      }
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Tournament Info */}
        <Card>
          <CardHeader>
            <CardTitle>{tournament.name || tournament.venue}</CardTitle>
            <CardDescription>{new Date(tournament.date).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Buy-in</p>
                <p className="font-semibold">${tournament.buyIn}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Field Size</p>
                <p className="font-semibold">{tournament.fieldSize || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Position</p>
                <p className="font-semibold">{tournament.finalPosition || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Result</p>
                <p
                  className={`font-bold ${
                    tournament.netResult >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tournament.netResult >= 0 ? "+" : ""}${tournament.netResult.toFixed(0)}
                </p>
              </div>
            </div>

            {tournament.notesOverall && (
              <div className="pt-4 border-t">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm">{tournament.notesOverall}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mistake Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Mistake Summary</CardTitle>
            <CardDescription>
              {totalMistakes} total mistakes across {hands?.length || 0} hands
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* By Street */}
            <div>
              <p className="text-sm font-medium mb-2">Mistakes by Street</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["PREFLOP", "FLOP", "TURN", "RIVER"].map((street) => (
                  <div key={street} className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">{street}</p>
                    <p className="text-lg font-bold">{mistakesByStreet?.[street] || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* By Severity */}
            <div>
              <p className="text-sm font-medium mb-2">Mistakes by Severity</p>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((severity) => (
                  <div key={severity} className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600">
                      {severity === 1 ? "Minor" : severity === 2 ? "Moderate" : "Major"}
                    </p>
                    <p className="text-lg font-bold">{mistakesBySeverity?.[severity] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hands List */}
        <Card>
          <CardHeader>
            <CardTitle>Hands Played</CardTitle>
            <CardDescription>{hands?.length || 0} hands logged</CardDescription>
          </CardHeader>
          <CardContent>
            {handsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !hands || hands.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No hands logged for this tournament</p>
            ) : (
              <div className="space-y-2">
                {hands.map((hand: any) => {
                  const tags = hand.tagsJson ? JSON.parse(hand.tagsJson) : [];

                  return (
                    <button
                      key={hand.id}
                      onClick={() => setLocation(`/hands/${hand.id}`)}
                      className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Hero Hand & Position */}
                          <div className="flex items-center gap-2 mb-1">
                            {hand.heroHand && (
                              <span className="font-mono font-bold text-lg">{hand.heroHand}</span>
                            )}
                            {hand.heroPosition && (
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {hand.heroPosition}
                              </span>
                            )}
                            {hand.reviewed && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Reviewed
                              </span>
                            )}
                          </div>

                          {/* Board */}
                          {hand.boardRunout && (
                            <p className="text-sm text-slate-600 font-mono mb-1">{hand.boardRunout}</p>
                          )}

                          {/* Spot Type & Stack */}
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            {hand.spotType && <span>{hand.spotType}</span>}
                            {hand.effectiveStackBb && <span>{hand.effectiveStackBb}bb</span>}
                            {hand.mistakeStreet && (
                              <span className="text-red-600">
                                Mistake: {hand.mistakeStreet} (Severity: {hand.mistakeSeverity})
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
