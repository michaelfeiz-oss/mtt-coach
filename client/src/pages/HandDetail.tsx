import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

interface HandReviewForm {
  reviewed: boolean;
  mistakeStreet: "NONE" | "PREFLOP" | "FLOP" | "TURN" | "RIVER";
  mistakeSeverity: string;
  tags: string;
  lesson: string;
}

interface LoggedAction {
  street?: string;
  actor?: string;
  action?: string;
  size?: string;
  sizeUnit?: string;
}

function safeParseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function safeParseActions(actionsJson?: string | null): LoggedAction[] {
  if (!actionsJson) return [];
  try {
    const parsed = JSON.parse(actionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseBoard(boardJson?: string | null): Record<string, string | null> {
  if (!boardJson) return {};
  try {
    const parsed = JSON.parse(boardJson);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function actionLabel(action: LoggedAction) {
  const size = action.size
    ? ` to ${action.size}${action.sizeUnit === "bb" ? "bb" : ` ${action.sizeUnit ?? ""}`}`
    : "";
  return [action.actor, action.action].filter(Boolean).join(" ") + size;
}

export default function HandDetail() {
  const { id } = useParams();
  const handId = Number(id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: hand, isLoading } = trpc.hands.getById.useQuery(
    { id: handId },
    { enabled: Number.isFinite(handId) }
  );

  const [formData, setFormData] = useState<HandReviewForm>({
    reviewed: false,
    mistakeStreet: "NONE",
    mistakeSeverity: "0",
    tags: "",
    lesson: "",
  });

  useEffect(() => {
    if (!hand) return;
    setFormData({
      reviewed: hand.reviewed,
      mistakeStreet: hand.mistakeStreet ?? "NONE",
      mistakeSeverity: String(hand.mistakeSeverity),
      tags: safeParseTags(hand.tagsJson).join(", "),
      lesson: hand.lesson ?? "",
    });
  }, [hand]);

  const tagsPreview = useMemo(
    () =>
      formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    [formData.tags]
  );

  const actionsByStreet = useMemo(() => {
    const grouped = new Map<string, LoggedAction[]>();
    for (const action of safeParseActions(hand?.actionsJson)) {
      const street = action.street ?? "OTHER";
      grouped.set(street, [...(grouped.get(street) ?? []), action]);
    }
    return grouped;
  }, [hand?.actionsJson]);

  const board = useMemo(() => safeParseBoard(hand?.boardJson), [hand?.boardJson]);

  const updateHand = trpc.hands.update.useMutation({
    onSuccess: async () => {
      toast.success("Hand review saved");
      await utils.hands.getById.invalidate({ id: handId });
      await utils.hands.getByUser.invalidate();
    },
    onError: error => {
      toast.error(`Could not save review: ${error.message}`);
    },
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const tagsArray = formData.tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    await updateHand.mutateAsync({
      id: handId,
      reviewed: formData.reviewed,
      mistakeStreet:
        formData.mistakeStreet === "NONE" ? null : formData.mistakeStreet,
      mistakeSeverity: Number.parseInt(formData.mistakeSeverity, 10) || 0,
      tags: tagsArray,
      lesson: formData.lesson.trim() || undefined,
      reviewStatus: formData.reviewed ? "REVIEWED" : "NEEDS_REVIEW",
    });
  }

  if (isLoading) {
    return (
      <main className="app-shell min-h-screen text-foreground">
        <div className="container max-w-5xl py-6">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!hand) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center text-foreground">
        <Card className="app-surface w-full max-w-md">
          <CardHeader>
            <CardTitle>Hand not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/hands")}>Back to hands</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/hands")}
          className="w-fit gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hands
        </Button>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Hand Details</CardTitle>
            <CardDescription>
              {[hand.heroPosition, hand.spotType?.replace(/_/g, " ")]
                .filter(Boolean)
                .join(" | ") || "Logged hand"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Hero Hand</Label>
              <p className="font-mono text-2xl font-black">
                {hand.heroHand || hand.handClass || "-"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Effective Stack</Label>
              <p className="text-lg font-semibold">
                {hand.effectiveStackBb ? `${hand.effectiveStackBb.toFixed(1)}bb` : "-"}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Hero Position</Label>
              <p className="text-base font-semibold">{hand.heroPosition || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Villain / Opener</Label>
              <p className="text-base font-semibold">{hand.villainPosition || "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Preflop Line</Label>
              <p className="text-sm leading-relaxed">
                {hand.preflopDecision || hand.heroDecisionPreflop || "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {(actionsByStreet.size > 0 || Object.keys(board).length > 0) && (
          <Card className="app-surface">
            <CardHeader>
              <CardTitle>Logged Line</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["PREFLOP", "FLOP", "TURN", "RIVER"].map(street => {
                const streetActions = actionsByStreet.get(street) ?? [];
                const boardText =
                  street === "FLOP"
                    ? board.flopText
                    : street === "TURN"
                      ? board.turnCard
                      : street === "RIVER"
                        ? board.riverCard
                        : null;

                if (streetActions.length === 0 && !boardText) return null;
                return (
                  <div
                    key={street}
                    className="rounded-xl border border-border bg-secondary/70 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">{street}</Badge>
                      {boardText && (
                        <span className="text-xs text-muted-foreground">
                          {boardText}
                        </span>
                      )}
                    </div>
                    {streetActions.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {streetActions.map((action, index) => (
                          <li key={`${street}-${index}`}>{actionLabel(action)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Review and Notes</CardTitle>
            <CardDescription>
              Mark the hand reviewed and keep the lesson practical.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={formData.reviewed}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, reviewed: Boolean(checked) }))
                  }
                />
                <span className="text-sm font-medium">Marked as reviewed</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mistakeStreet">Mistake Street</Label>
                  <Select
                    value={formData.mistakeStreet}
                    onValueChange={value =>
                      setFormData(prev => ({
                        ...prev,
                        mistakeStreet: value as HandReviewForm["mistakeStreet"],
                      }))
                    }
                  >
                    <SelectTrigger id="mistakeStreet">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="PREFLOP">Preflop</SelectItem>
                      <SelectItem value="FLOP">Flop</SelectItem>
                      <SelectItem value="TURN">Turn</SelectItem>
                      <SelectItem value="RIVER">River</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mistakeSeverity">Mistake Severity</Label>
                  <Select
                    value={formData.mistakeSeverity}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, mistakeSeverity: value }))
                    }
                  >
                    <SelectTrigger id="mistakeSeverity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 - None</SelectItem>
                      <SelectItem value="1">1 - Minor</SelectItem>
                      <SelectItem value="2">2 - Moderate</SelectItem>
                      <SelectItem value="3">3 - Major</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder="player-read, bubble, value-bet"
                />
                {tagsPreview.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Preview: {tagsPreview.join(" | ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson">Lesson / Note</Label>
                <Textarea
                  id="lesson"
                  rows={4}
                  value={formData.lesson}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, lesson: event.target.value }))
                  }
                  placeholder="One useful takeaway from this hand."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/hands")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={updateHand.isPending}>
                  {updateHand.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
