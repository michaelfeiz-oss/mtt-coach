import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const statusClassName: Record<string, string> = {
  ACTIVE: "bg-red-500/15 text-red-300 border border-red-400/30",
  IMPROVING: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
  FIXED: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
};

export default function LeakDetail() {
  const { id } = useParams();
  const leakId = Number(id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [severityFilter, setSeverityFilter] = useState("all");

  const { data: leak, isLoading: leakLoading } = trpc.leaks.getById.useQuery(
    { id: leakId },
    { enabled: Number.isFinite(leakId) }
  );

  const { data: linkedHands = [], isLoading: handsLoading } =
    trpc.leaks.getLinkedHands.useQuery(
      { leakId },
      { enabled: Number.isFinite(leakId) }
    );

  const updateLeak = trpc.leaks.update.useMutation({
    onSuccess: () => {
      toast.success("Leak marked as fixed");
      void utils.leaks.getById.invalidate({ id: leakId });
      void utils.leaks.list.invalidate();
      void utils.leaks.getTop.invalidate();
    },
    onError: error => {
      toast.error(`Could not update leak: ${error.message}`);
    },
  });

  const filteredHands = useMemo(
    () =>
      linkedHands.filter(hand =>
        severityFilter === "all"
          ? true
          : String(hand.mistakeSeverity) === severityFilter
      ),
    [linkedHands, severityFilter]
  );

  const averageSeverity =
    linkedHands.length > 0
      ? (
          linkedHands.reduce((sum, hand) => sum + hand.mistakeSeverity, 0) /
          linkedHands.length
        ).toFixed(1)
      : "-";

  if (leakLoading) {
    return (
      <div className="app-shell min-h-screen text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90">
          <div className="container py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container max-w-5xl space-y-4 py-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!leak) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-foreground">
        <Card className="app-surface w-full max-w-md">
          <CardHeader>
            <CardTitle>Leak not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/log")}>Back to Log</Button>
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
            onClick={() => setLocation("/log")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Log
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl space-y-4 py-6">
        <Card className="app-surface">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-xl">{leak.name}</CardTitle>
                <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-accent text-secondary-foreground">
                    {leak.category}
                  </Badge>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[leak.status] ?? "bg-accent text-secondary-foreground"}`}>
                    {leak.status}
                  </span>
                </CardDescription>
              </div>
              {leak.status !== "FIXED" && (
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-full"
                  onClick={() => updateLeak.mutate({ id: leakId, status: "FIXED" })}
                  disabled={updateLeak.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Fixed
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {leak.description && (
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-sm leading-relaxed text-secondary-foreground">
                  {leak.description}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Linked Hands</p>
                <p className="mt-1 text-xl font-black">{linkedHands.length}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Average Severity</p>
                <p className="mt-1 text-xl font-black">{averageSeverity}</p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs text-muted-foreground">Last Seen</p>
                <p className="mt-1 text-sm font-semibold">
                  {leak.lastSeenAt ? new Date(leak.lastSeenAt).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Linked Hands</CardTitle>
                <CardDescription>
                  Review recent hands tied to this preflop leak.
                </CardDescription>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="1">Minor (1)</SelectItem>
                  <SelectItem value="2">Moderate (2)</SelectItem>
                  <SelectItem value="3">Major (3)</SelectItem>
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
            ) : filteredHands.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/75 bg-accent/45 py-8 text-center text-sm text-muted-foreground">
                {severityFilter === "all"
                  ? "No hands linked to this leak yet."
                  : "No linked hands match this severity filter."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredHands.map(hand => (
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
                          <span className="rounded-full border border-border/80 bg-accent/60 px-2 py-0.5 text-xs text-secondary-foreground">
                            {hand.heroPosition}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[
                          hand.spotType?.replace(/_/g, " "),
                          hand.effectiveStackBb ? `${hand.effectiveStackBb}bb` : null,
                          hand.mistakeSeverity > 0
                            ? `Severity ${hand.mistakeSeverity}`
                            : null,
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
