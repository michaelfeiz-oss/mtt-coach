import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronRight, Edit, Trash2, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, useSearch } from "wouter";
import { QuickEditHand } from "@/components/QuickEditHand";
import { useState, useCallback, useMemo } from "react";

// ─── helpers ────────────────────────────────────────────────────────────────

function useQueryParams() {
  const search = useSearch();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const SPOT_TYPE_LABELS: Record<string, string> = {
  RFI: "RFI / Open",
  DEFEND_VS_RFI: "Defend vs RFI",
  THREE_BET: "3-Bet",
  FACING_3BET: "Facing 3-Bet",
  BVB: "BVB",
  LIMP_ISO: "Limp / Iso",
  FOUR_BET_JAM: "Push/Fold",
  OTHER_PREFLOP: "Other",
  SINGLE_RAISED_POT: "SRP",
  "3BET_POT": "3-Bet Pot",
  ICM_SPOT: "ICM Spot",
  LIMPED_POT: "Limped Pot",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  NEEDS_REVIEW: "Needs Review",
  REVIEWED: "Reviewed",
};

const SEVERITY_COLORS: Record<number, string> = {
  0: "text-muted-foreground",
  1: "text-yellow-600",
  2: "text-orange-600",
  3: "text-red-600",
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  NEEDS_REVIEW: "bg-orange-100 text-orange-700",
  REVIEWED: "bg-emerald-100 text-emerald-700",
};

// ─── component ──────────────────────────────────────────────────────────────

export default function HandsList() {
  const [, setLocation] = useLocation();
  const qp = useQueryParams();

  // Filter state — initialised from URL params
  const [reviewStatus, setReviewStatus] = useState<string>(qp.get("rs") ?? "");
  const [spotType, setSpotType] = useState<string>(qp.get("st") ?? "");
  const [severity, setSeverity] = useState<string>(qp.get("sv") ?? "");
  const [mistakeStreet, setMistakeStreet] = useState<string>(qp.get("ms") ?? "");
  const [sortBy, setSortBy] = useState<string>(qp.get("sort") ?? "newest");
  const [search, setSearch] = useState<string>(qp.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const [editingHandId, setEditingHandId] = useState<number | null>(null);
  const [deletingHandId, setDeletingHandId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Push filter state to URL
  const syncUrl = useCallback((overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    const vals = { rs: reviewStatus, st: spotType, sv: severity, ms: mistakeStreet, sort: sortBy, q: search, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) p.set(k, v); });
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/hands?${qs}` : "/hands");
  }, [reviewStatus, spotType, severity, mistakeStreet, sortBy, search]);

  const setFilter = (key: string, val: string, setter: (v: string) => void) => {
    setter(val);
    syncUrl({ [key]: val });
  };

  // Build query input
  const filterInput = useMemo(() => ({
    reviewStatus: reviewStatus ? [reviewStatus as "DRAFT" | "NEEDS_REVIEW" | "REVIEWED"] : undefined,
    spotType: spotType ? [spotType] : undefined,
    mistakeSeverity: severity !== "" ? [Number(severity)] : undefined,
    mistakeStreet: mistakeStreet ? [mistakeStreet as "PREFLOP" | "FLOP" | "TURN" | "RIVER"] : undefined,
    search: search || undefined,
    sortBy: (sortBy || "newest") as "newest" | "oldest" | "severity_desc" | "review_status" | "updated" | "stack",
    limit: 100,
    offset: 0,
  }), [reviewStatus, spotType, severity, mistakeStreet, search, sortBy]);

  const { data: hands, isLoading } = trpc.hands.filter.useQuery(filterInput);

  const deleteHand = trpc.hands.delete.useMutation({
    onSuccess: () => {
      toast.success("Hand deleted");
      utils.hands.filter.invalidate();
      utils.hands.getByUser.invalidate();
      utils.dashboard.getStats.invalidate();
      setDeletingHandId(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete hand: ${error.message}`);
    },
  });

  const clearFilters = () => {
    setReviewStatus("");
    setSpotType("");
    setSeverity("");
    setMistakeStreet("");
    setSearch("");
    setSortBy("newest");
    window.history.replaceState(null, "", "/hands");
  };

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (reviewStatus) activeFilters.push({ label: REVIEW_STATUS_LABELS[reviewStatus] ?? reviewStatus, clear: () => setFilter("rs", "", setReviewStatus) });
  if (spotType) activeFilters.push({ label: SPOT_TYPE_LABELS[spotType] ?? spotType, clear: () => setFilter("st", "", setSpotType) });
  if (severity !== "") activeFilters.push({ label: `Severity ${severity}`, clear: () => setFilter("sv", "", setSeverity) });
  if (mistakeStreet) activeFilters.push({ label: mistakeStreet.charAt(0) + mistakeStreet.slice(1).toLowerCase(), clear: () => setFilter("ms", "", setMistakeStreet) });
  if (search) activeFilters.push({ label: `"${search}"`, clear: () => setFilter("q", "", setSearch) });

  return (
    <div className="app-shell min-h-screen pb-24 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 ${showFilters ? "bg-accent" : ""}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
              <Button size="sm" className="rounded-full" onClick={() => setLocation("/log")}>
                Log a Hand
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-6 space-y-4">
        {/* Filter panel */}
        {showFilters && (
          <Card className="app-surface">
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {/* Review Status */}
                <Select value={reviewStatus} onValueChange={(v) => setFilter("rs", v === "all" ? "" : v, setReviewStatus)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Spot Type */}
                <Select value={spotType} onValueChange={(v) => setFilter("st", v === "all" ? "" : v, setSpotType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Spot type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All spots</SelectItem>
                    <SelectItem value="RFI">RFI / Open</SelectItem>
                    <SelectItem value="DEFEND_VS_RFI">Defend vs RFI</SelectItem>
                    <SelectItem value="THREE_BET">3-Bet</SelectItem>
                    <SelectItem value="FACING_3BET">Facing 3-Bet</SelectItem>
                    <SelectItem value="BVB">BVB</SelectItem>
                    <SelectItem value="LIMP_ISO">Limp / Iso</SelectItem>
                    <SelectItem value="FOUR_BET_JAM">Push/Fold</SelectItem>
                    <SelectItem value="OTHER_PREFLOP">Other</SelectItem>
                  </SelectContent>
                </Select>

                {/* Mistake Street */}
                <Select value={mistakeStreet} onValueChange={(v) => setFilter("ms", v === "all" ? "" : v, setMistakeStreet)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Street" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streets</SelectItem>
                    <SelectItem value="PREFLOP">Preflop</SelectItem>
                    <SelectItem value="FLOP">Flop</SelectItem>
                    <SelectItem value="TURN">Turn</SelectItem>
                    <SelectItem value="RIVER">River</SelectItem>
                  </SelectContent>
                </Select>

                {/* Severity */}
                <Select value={severity} onValueChange={(v) => setFilter("sv", v === "all" ? "" : v, setSeverity)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any severity</SelectItem>
                    <SelectItem value="0">0 — None</SelectItem>
                    <SelectItem value="1">1 — Minor</SelectItem>
                    <SelectItem value="2">2 — Moderate</SelectItem>
                    <SelectItem value="3">3 — Major</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setFilter("sort", v, setSortBy)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="severity_desc">Severity ↓</SelectItem>
                    <SelectItem value="review_status">Review status</SelectItem>
                    <SelectItem value="updated">Recently updated</SelectItem>
                    <SelectItem value="stack">Stack size ↓</SelectItem>
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative">
                  <Input
                    placeholder="Search hand, note…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      syncUrl({ q: e.target.value });
                    }}
                    className="h-9 text-xs pr-7"
                  />
                  {search && (
                    <button
                      onClick={() => setFilter("q", "", setSearch)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((f) => (
              <span
                key={f.label}
                className="flex items-center gap-1 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs text-foreground"
              >
                {f.label}
                <button onClick={f.clear} className="ml-1 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Hands list */}
        <Card className="app-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">
              Hand Review
              {hands && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({hands.length} hand{hands.length !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : !hands || hands.length === 0 ? (
              <div className="py-12 text-center">
                {activeFilters.length > 0 ? (
                  <>
                    <p className="mb-2 text-secondary-foreground">No hands match the active filters.</p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Active: {activeFilters.map((f) => f.label).join(", ")}
                    </p>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </>
                ) : (
                  <p className="mb-4 text-secondary-foreground">No hands logged yet.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {hands.map((hand) => {
                  const tags = hand.tagsJson ? JSON.parse(hand.tagsJson) : [];
                  const rs = hand.reviewStatus ?? (hand.reviewed ? "REVIEWED" : "DRAFT");

                  return (
                    <div
                      key={hand.id}
                      onClick={() => setLocation(`/hands/${hand.id}`)}
                      className="w-full cursor-pointer rounded-xl border border-border bg-accent/70 p-4 transition-all hover:bg-accent/90"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            {(hand.heroHand || hand.handClass) && (
                              <span className="font-mono text-lg font-bold">
                                {hand.heroHand || hand.handClass}
                              </span>
                            )}
                            {hand.heroPosition && (
                              <span className="rounded bg-accent px-2 py-1 text-xs text-secondary-foreground">
                                {hand.heroPosition}
                              </span>
                            )}
                            <span className={`rounded px-2 py-1 text-xs font-medium ${REVIEW_STATUS_COLORS[rs] ?? "bg-muted text-muted-foreground"}`}>
                              {REVIEW_STATUS_LABELS[rs] ?? rs}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {hand.spotType && (
                              <span>{SPOT_TYPE_LABELS[hand.spotType] ?? hand.spotType.replace(/_/g, " ")}</span>
                            )}
                            {hand.effectiveStackBb && (
                              <span>{hand.effectiveStackBb.toFixed(1)}bb</span>
                            )}
                            {hand.mistakeSeverity > 0 && (
                              <span className={`font-medium ${SEVERITY_COLORS[hand.mistakeSeverity] ?? "text-red-600"}`}>
                                Mistake {hand.mistakeSeverity}/3
                              </span>
                            )}
                            {hand.mistakeStreet && (
                              <span className="capitalize">
                                {hand.mistakeStreet.charAt(0) + hand.mistakeStreet.slice(1).toLowerCase()}
                              </span>
                            )}
                          </div>

                          {hand.lesson && (
                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{hand.lesson}</p>
                          )}

                          {tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tags.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingHandId(hand.id);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingHandId(hand.id);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {editingHandId && (
        <QuickEditHand
          handId={editingHandId}
          open={!!editingHandId}
          onOpenChange={(open) => !open && setEditingHandId(null)}
        />
      )}

      <AlertDialog open={!!deletingHandId} onOpenChange={(open) => !open && setDeletingHandId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this hand and remove it from all leak associations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHandId && deleteHand.mutate({ id: deletingHandId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
