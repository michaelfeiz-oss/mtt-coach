import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Target } from "lucide-react";
import { toast } from "sonner";
import { ACTION_LABELS } from "../../../shared/strategy";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface HandReviewForm {
  reviewed: boolean;
  mistakeStreet: "NONE" | "PREFLOP";
  mistakeSeverity: string;
  tags: string;
  lesson: string;
  selectedLeakIds: number[];
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

export default function HandDetail() {
  const { id } = useParams();
  const handId = Number(id);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: hand, isLoading } = trpc.hands.getById.useQuery(
    { id: handId },
    { enabled: Number.isFinite(handId) }
  );
  const { data: allLeaks = [] } = trpc.leaks.list.useQuery();
  const { data: handLeaks = [] } = trpc.hands.getLeaks.useQuery(
    { handId },
    { enabled: Number.isFinite(handId) }
  );
  const { data: strategyRecommendation } = trpc.strategy.getHandRecommendation.useQuery(
    { handId },
    { enabled: Number.isFinite(handId) }
  );

  const [formData, setFormData] = useState<HandReviewForm>({
    reviewed: false,
    mistakeStreet: "NONE",
    mistakeSeverity: "0",
    tags: "",
    lesson: "",
    selectedLeakIds: [],
  });

  useEffect(() => {
    if (!hand) return;
    setFormData({
      reviewed: hand.reviewed,
      mistakeStreet: hand.mistakeStreet === "PREFLOP" ? "PREFLOP" : "NONE",
      mistakeSeverity: String(hand.mistakeSeverity),
      tags: safeParseTags(hand.tagsJson).join(", "),
      lesson: hand.lesson ?? "",
      selectedLeakIds: handLeaks.map(leak => leak.id),
    });
  }, [hand, handLeaks]);

  const tagsPreview = useMemo(
    () =>
      formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean),
    [formData.tags]
  );

  const updateHand = trpc.hands.update.useMutation({
    onSuccess: () => {
      toast.success("Hand review saved");
      void utils.hands.getById.invalidate({ id: handId });
      void utils.hands.getByUser.invalidate();
    },
    onError: error => {
      toast.error(`Could not save review: ${error.message}`);
    },
  });

  const linkLeak = trpc.hands.linkLeak.useMutation({
    onSuccess: () => {
      void utils.hands.getLeaks.invalidate({ handId });
      void utils.leaks.getTop.invalidate();
    },
  });

  const unlinkLeak = trpc.hands.unlinkLeak.useMutation({
    onSuccess: () => {
      void utils.hands.getLeaks.invalidate({ handId });
      void utils.leaks.getTop.invalidate();
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
        formData.mistakeStreet === "PREFLOP" ? "PREFLOP" : undefined,
      mistakeSeverity: Number.parseInt(formData.mistakeSeverity, 10) || 0,
      tags: tagsArray,
      lesson: formData.lesson.trim() || undefined,
    });

    const currentLeakIds = handLeaks.map(leak => leak.id);
    const toAdd = formData.selectedLeakIds.filter(leakId => !currentLeakIds.includes(leakId));
    const toRemove = currentLeakIds.filter(leakId => !formData.selectedLeakIds.includes(leakId));

    for (const leakId of toAdd) {
      await linkLeak.mutateAsync({ handId, leakId });
    }

    for (const leakId of toRemove) {
      await unlinkLeak.mutateAsync({ handId, leakId });
    }

    toast.success("Hand and leak links updated");
  }

  function toggleLeak(leakId: number) {
    setFormData(previous => ({
      ...previous,
      selectedLeakIds: previous.selectedLeakIds.includes(leakId)
        ? previous.selectedLeakIds.filter(idValue => idValue !== leakId)
        : [...previous.selectedLeakIds, leakId],
    }));
  }

  if (isLoading) {
    return (
      <div className="app-shell min-h-screen text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90">
          <div className="container py-4">
            <Skeleton className="h-8 w-36" />
          </div>
        </header>
        <main className="container py-6">
            <Card className="app-surface">
              <CardHeader>
                <Skeleton className="h-8 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center text-foreground">
        <Card className="app-surface w-full max-w-md">
          <CardHeader>
            <CardTitle>Hand not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/hands")}>Back to hands</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSaving =
    updateHand.isPending || linkLeak.isPending || unlinkLeak.isPending;

  return (
    <div className="app-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/hands")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Hands
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl space-y-4 py-6">
        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Hand Details</CardTitle>
            <CardDescription className="text-muted-foreground">
              {[hand.heroPosition, hand.spotType?.replace(/_/g, " ")]
                .filter(Boolean)
                .join(" - ") || "Preflop hand log"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Hero Hand</Label>
              <p className="font-mono text-2xl font-black">{hand.heroHand || "-"}</p>
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
              <Label className="text-xs text-muted-foreground">Preflop Decision</Label>
              <p className="text-base font-semibold">{hand.heroDecisionPreflop || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {strategyRecommendation && (
          <Card className="app-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-primary" />
                Recommended Preflop Study
              </CardTitle>
              <CardDescription>{strategyRecommendation.reason}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="app-surface-subtle p-3 text-sm">
                <p className="font-semibold">{strategyRecommendation.chart.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    strategyRecommendation.chart.heroPosition +
                      (strategyRecommendation.chart.villainPosition
                        ? ` vs ${strategyRecommendation.chart.villainPosition}`
                        : ""),
                    `${strategyRecommendation.chart.stackDepth}bb`,
                    strategyRecommendation.handCode,
                    strategyRecommendation.recommendedAction
                      ? ACTION_LABELS[strategyRecommendation.recommendedAction]
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" - ")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  onClick={() =>
                    setLocation(`/strategy/trainer?chartId=${strategyRecommendation.chart.id}`)
                  }
                >
                  Train This Spot
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setLocation(`/strategy/library?chartId=${strategyRecommendation.chart.id}`)
                  }
                >
                  View Chart
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Review and Notes</CardTitle>
            <CardDescription>
              Keep this focused on preflop mistakes and repeatable takeaways.
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
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, tags: event.target.value }))
                  }
                  placeholder="BB_DEFENSE, OVERFOLD, VS_3BET"
                />
                {tagsPreview.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Preview: {tagsPreview.join(" | ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson">Lesson</Label>
                <Textarea
                  id="lesson"
                  rows={4}
                  value={formData.lesson}
                  onChange={event =>
                    setFormData(prev => ({ ...prev, lesson: event.target.value }))
                  }
                  placeholder="Short preflop takeaway for future reps."
                />
              </div>

              {allLeaks.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to Leaks</Label>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-border bg-accent/70 p-3">
                    {allLeaks.map(leak => (
                      <label
                        key={leak.id}
                        className="flex items-start gap-2 rounded-lg p-2 hover:bg-accent/90"
                      >
                        <Checkbox
                          checked={formData.selectedLeakIds.includes(leak.id)}
                          onCheckedChange={() => toggleLeak(leak.id)}
                        />
                        <span className="min-w-0 text-sm">
                          <span className="block font-semibold">{leak.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {leak.category}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setLocation("/hands")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
