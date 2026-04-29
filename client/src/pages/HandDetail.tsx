import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LEAK_FAMILIES, type LeakFamilyDefinition } from "../../../shared/leakFamilies";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedAction {
  street: string;
  actor: string;
  action: string;
  size?: string;
  sizeUnit?: string;
}

interface ParsedBoard {
  flopText?: string | null;
  turnCard?: string | null;
  riverCard?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

function safeParseActions(json?: string | null): ParsedAction[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseBoard(json?: string | null): ParsedBoard | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as ParsedBoard;
  } catch {
    return null;
  }
}

function formatActionLine(a: ParsedAction): string {
  const sizeStr = a.size ? ` to ${a.size}${a.sizeUnit === "bb" ? "bb" : a.sizeUnit ? ` ${a.sizeUnit}` : ""}` : "";
  return `${a.actor} ${a.action.toLowerCase()}${sizeStr}`;
}

const SUIT_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  s: { symbol: "♠", color: "text-gray-800" },
  h: { symbol: "♥", color: "text-red-600" },
  d: { symbol: "♦", color: "text-red-600" },
  c: { symbol: "♣", color: "text-green-700" },
};

function CardDisplay({ card }: { card: string }) {
  if (!card || card.length < 2) return <span className="font-mono text-sm">{card}</span>;
  const rank = card[0];
  const suit = card[1];
  const { symbol, color } = SUIT_SYMBOLS[suit] || { symbol: suit, color: "text-gray-700" };
  return (
    <span className={`font-mono text-sm font-bold ${color}`}>
      {rank}{symbol}
    </span>
  );
}

function HandDisplay({ card1, card2, handClass }: { card1?: string | null; card2?: string | null; handClass?: string | null }) {
  if (card1 && card2) {
    return (
      <span className="inline-flex gap-1">
        <CardDisplay card={card1} />
        <CardDisplay card={card2} />
      </span>
    );
  }
  if (handClass) return <span className="font-mono text-sm font-bold">{handClass}</span>;
  return <span className="text-gray-400 text-sm">—</span>;
}

const SEVERITY_LABELS: Record<number, string> = { 0: "None", 1: "Small", 2: "Medium", 3: "Big" };
const REVIEW_STATUS_INFO: Record<string, { label: string; color: string }> = {
  REVIEWED: { label: "Reviewed", color: "bg-green-100 text-green-800" },
  NEEDS_REVIEW: { label: "Needs Review", color: "bg-yellow-100 text-yellow-800" },
  DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600" },
};

// ─── Timeline Section ─────────────────────────────────────────────────────────

function TimelineSection({ label, board, actions, isLast }: { label: string; board?: string | null; actions: ParsedAction[]; isLast?: boolean }) {
  if (!board && actions.length === 0) return null;
  return (
    <div className="relative pl-6">
      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white" />
      {!isLast && <div className="absolute left-1 top-4 bottom-0 w-px bg-gray-200" />}
      <div className="space-y-1 pb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
        {board && (
          <div className="text-sm font-mono text-gray-700">{board}</div>
        )}
        {actions.map((a, i) => (
          <div key={i} className="text-sm text-gray-700">{formatActionLine(a)}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HandDetail() {
  const { id } = useParams();
  const handId = Number(id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: hand, isLoading } = trpc.hands.getById.useQuery(
    { id: handId },
    { enabled: Number.isFinite(handId) }
  );

  // Edit state
  const [editLesson, setEditLesson] = useState("");
  const [editLeakFamilyId, setEditLeakFamilyId] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!hand) return;
    setEditLesson(hand.lesson ?? "");
    setEditLeakFamilyId((hand as any).leakFamilyId ?? "");
    setIsDirty(false);
  }, [hand]);

  const updateHand = trpc.hands.update.useMutation({
    onSuccess: () => {
      toast.success("Hand updated.");
      void utils.hands.getById.invalidate({ id: handId });
      void utils.hands.getByUser.invalidate();
      setIsDirty(false);
    },
    onError: err => toast.error("Failed to save: " + err.message),
  });

  const handleSave = () => {
    updateHand.mutate({
      id: handId,
      lesson: editLesson.trim() || undefined,
      leakFamilyId: editLeakFamilyId && editLeakFamilyId !== "none" ? editLeakFamilyId : "",
    });
  };

  const handleMarkReviewed = () => {
    updateHand.mutate({ id: handId, reviewed: true });
  };

  // Parse structured data
  const actions = useMemo(() => safeParseActions((hand as any)?.actionsJson), [hand]);
  const board = useMemo(() => safeParseBoard((hand as any)?.boardJson), [hand]);
  const tags = useMemo(() => safeParseTags(hand?.tagsJson), [hand]);

  const preflopActions = actions.filter(a => a.street === "PREFLOP");
  const flopActions = actions.filter(a => a.street === "FLOP");
  const turnActions = actions.filter(a => a.street === "TURN");
  const riverActions = actions.filter(a => a.street === "RIVER");

  const leakFamily = LEAK_FAMILIES.find((f: LeakFamilyDefinition) => f.id === ((hand as any)?.leakFamilyId));
  const reviewStatusInfo = REVIEW_STATUS_INFO[((hand as any)?.reviewStatus) ?? (hand?.reviewed ? "REVIEWED" : "NEEDS_REVIEW")] || REVIEW_STATUS_INFO.NEEDS_REVIEW;

  // Fallback: use heroDecisionPreflop if no structured actions
  const preflopSummary = preflopActions.length > 0
    ? null // will render individual rows
    : hand?.heroDecisionPreflop ?? null;

  const hasPostflop = (board?.flopText || flopActions.length > 0 || board?.turnCard || turnActions.length > 0 || board?.riverCard || riverActions.length > 0);

  if (isLoading) {
    return (
      <div className="app-shell min-h-screen text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90">
          <div className="container py-4">
            <Skeleton className="h-8 w-36" />
          </div>
        </header>
        <main className="container py-6 max-w-2xl">
          <Card><CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent></Card>
        </main>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-foreground">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Hand not found</CardTitle></CardHeader>
          <CardContent><Button onClick={() => setLocation("/hands")}>Back to hands</Button></CardContent>
        </Card>
      </div>
    );
  }

  const stackBB = (hand as any)?.actualStackBB ?? hand.effectiveStackBb;
  const spotTypeLabel = hand.spotType?.replace(/_/g, " ") ?? "—";
  const mistakeStreetLabel = hand.mistakeStreet ?? null;
  const severityLabel = hand.mistakeSeverity ? SEVERITY_LABELS[hand.mistakeSeverity] : null;

  return (
    <div className="app-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="container py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/hands")} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Hands
          </Button>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-4">

        {/* ── Summary Card ── */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <HandDisplay
                    card1={(hand as any).heroCard1}
                    card2={(hand as any).heroCard2}
                    handClass={(hand as any).handClass ?? hand.heroHand}
                  />
                  {hand.heroPosition && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm font-medium text-gray-700">{hand.heroPosition}</span>
                    </>
                  )}
                  {stackBB && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-700">{stackBB}bb</span>
                    </>
                  )}
                  {hand.spotType && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-600 capitalize">{spotTypeLabel.toLowerCase()}</span>
                    </>
                  )}
                </div>
                {(mistakeStreetLabel || (severityLabel && severityLabel !== "None")) && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {mistakeStreetLabel && <span>Mistake: {mistakeStreetLabel.charAt(0) + mistakeStreetLabel.slice(1).toLowerCase()}</span>}
                    {severityLabel && severityLabel !== "None" && <span>· Severity: {severityLabel}</span>}
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${reviewStatusInfo.color}`}>
                {hand.reviewed ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {reviewStatusInfo.label}
              </div>
            </div>
            {tags.length > 0 && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {tags.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Hand Timeline ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Hand Timeline</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-0">
              {/* Preflop */}
              <div className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white" />
                {hasPostflop && <div className="absolute left-1 top-4 bottom-0 w-px bg-gray-200" />}
                <div className="space-y-1 pb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preflop</div>
                  {preflopActions.length > 0 ? (
                    preflopActions.map((a, i) => (
                      <div key={i} className="text-sm text-gray-700">{formatActionLine(a)}</div>
                    ))
                  ) : preflopSummary ? (
                    <div className="text-sm text-gray-700">{preflopSummary}</div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">No preflop actions recorded</div>
                  )}
                </div>
              </div>

              {/* Flop */}
              <TimelineSection
                label="Flop"
                board={board?.flopText}
                actions={flopActions}
                isLast={!board?.turnCard && turnActions.length === 0 && !board?.riverCard && riverActions.length === 0}
              />

              {/* Turn */}
              <TimelineSection
                label="Turn"
                board={board?.turnCard}
                actions={turnActions}
                isLast={!board?.riverCard && riverActions.length === 0}
              />

              {/* River */}
              <TimelineSection
                label="River"
                board={board?.riverCard}
                actions={riverActions}
                isLast
              />

              {/* Fallback: old boardRunout */}
              {!board && hand.boardRunout && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white" />
                  <div className="space-y-1 pb-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Board</div>
                    <div className="text-sm font-mono text-gray-700">{hand.boardRunout}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Review Card ── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Review</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {/* Metadata row */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {mistakeStreetLabel && (
                <div>
                  <span className="text-xs text-gray-500 block">Mistake Street</span>
                  <span className="font-medium">{mistakeStreetLabel.charAt(0) + mistakeStreetLabel.slice(1).toLowerCase()}</span>
                </div>
              )}
              {severityLabel && severityLabel !== "None" && (
                <div>
                  <span className="text-xs text-gray-500 block">Severity</span>
                  <span className="font-medium">{hand.mistakeSeverity} {severityLabel}</span>
                </div>
              )}
              {leakFamily && (
                <div>
                  <span className="text-xs text-gray-500 block">Leak Family</span>
                  <span className="font-medium">{leakFamily.label}</span>
                </div>
              )}
              {(hand as any).villainType && (
                <div>
                  <span className="text-xs text-gray-500 block">Villain Type</span>
                  <span className="font-medium">{(hand as any).villainType}</span>
                </div>
              )}
              {(hand as any).confidence && (
                <div>
                  <span className="text-xs text-gray-500 block">Confidence</span>
                  <span className="font-medium capitalize">{((hand as any).confidence as string).toLowerCase()}</span>
                </div>
              )}
            </div>

            {/* Lesson display */}
            {hand.lesson && !isDirty && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="text-xs font-semibold text-orange-700 mb-1">Lesson</div>
                <div className="text-sm text-gray-800">{hand.lesson}</div>
              </div>
            )}

            {/* Edit section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-sm">Lesson</Label>
                <Textarea
                  className="text-sm resize-none"
                  rows={2}
                  placeholder="What is the one thing to remember next time?"
                  value={editLesson}
                  onChange={e => { setEditLesson(e.target.value); setIsDirty(true); }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Leak Family</Label>
                <Select
                  value={editLeakFamilyId || "none"}
                  onValueChange={v => { setEditLeakFamilyId(v === "none" ? "" : v); setIsDirty(true); }}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="No leak family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No leak family</SelectItem>
                    {LEAK_FAMILIES.map((f: LeakFamilyDefinition) => (
                      <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-1">
                {!hand.reviewed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleMarkReviewed}
                    disabled={updateHand.isPending}
                    className="gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Reviewed
                  </Button>
                )}
                {isDirty && (
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleSave}
                    disabled={updateHand.isPending}
                  >
                    {updateHand.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
