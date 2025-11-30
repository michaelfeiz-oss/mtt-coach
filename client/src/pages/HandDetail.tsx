import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function HandDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: hand, isLoading } = trpc.hands.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  const { data: allLeaks } = trpc.leaks.list.useQuery();
  const { data: handLeaks } = trpc.hands.getLeaks.useQuery(
    { handId: parseInt(id!) },
    { enabled: !!id }
  );

  const [formData, setFormData] = useState({
    reviewed: false,
    mistakeStreet: "NONE",
    mistakeSeverity: "0",
    tags: "",
    lesson: "",
    selectedLeakIds: [] as number[],
  });

  useEffect(() => {
    if (hand) {
      setFormData({
        reviewed: hand.reviewed,
        mistakeStreet: hand.mistakeStreet || "NONE",
        mistakeSeverity: hand.mistakeSeverity.toString(),
        tags: hand.tagsJson ? JSON.parse(hand.tagsJson).join(", ") : "",
        lesson: hand.lesson || "",
        selectedLeakIds: handLeaks?.map((l) => l.id) || [],
      });
    }
  }, [hand, handLeaks]);

  const updateHand = trpc.hands.update.useMutation({
    onSuccess: () => {
      toast.success("Hand updated successfully!");
      utils.hands.getById.invalidate({ id: parseInt(id!) });
      utils.hands.getByUser.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update hand: ${error.message}`);
    },
  });

  const linkLeak = trpc.hands.linkLeak.useMutation({
    onSuccess: () => {
      utils.hands.getLeaks.invalidate({ handId: parseInt(id!) });
      utils.leaks.getTop.invalidate();
    },
  });

  const unlinkLeak = trpc.hands.unlinkLeak.useMutation({
    onSuccess: () => {
      utils.hands.getLeaks.invalidate({ handId: parseInt(id!) });
      utils.leaks.getTop.invalidate();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update hand details
    const tagsArray = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    await updateHand.mutateAsync({
      id: parseInt(id!),
      reviewed: formData.reviewed,
      mistakeStreet: (formData.mistakeStreet && formData.mistakeStreet !== "NONE") ? (formData.mistakeStreet as any) : undefined,
      mistakeSeverity: parseInt(formData.mistakeSeverity),
      tags: tagsArray,
      lesson: formData.lesson || undefined,
    });

    // Update leak links
    const currentLeakIds = handLeaks?.map((l) => l.id) || [];
    const toAdd = formData.selectedLeakIds.filter((id) => !currentLeakIds.includes(id));
    const toRemove = currentLeakIds.filter((id) => !formData.selectedLeakIds.includes(id));

    for (const leakId of toAdd) {
      await linkLeak.mutateAsync({ handId: parseInt(id!), leakId });
    }

    for (const leakId of toRemove) {
      await unlinkLeak.mutateAsync({ handId: parseInt(id!), leakId });
    }

    toast.success("Hand and leaks updated!");
  };

  const toggleLeak = (leakId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedLeakIds: prev.selectedLeakIds.includes(leakId)
        ? prev.selectedLeakIds.filter((id) => id !== leakId)
        : [...prev.selectedLeakIds, leakId],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container py-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!hand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Hand Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/hands")}>Back to Hands List</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/hands")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Hands
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Hand Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Hand Details</CardTitle>
            <CardDescription>
              {hand.heroPosition && `${hand.heroPosition} • `}
              {hand.spotType && hand.spotType.replace(/_/g, " ")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hero Hand & Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500">Hero Hand</Label>
                <p className="font-mono font-bold text-2xl">{hand.heroHand || "—"}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Board</Label>
                <p className="font-mono text-lg">{hand.boardRunout || "—"}</p>
              </div>
            </div>

            {/* Stack & SPR */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-xs text-slate-500">Effective Stack</Label>
                <p className="font-medium">{hand.effectiveStackBb?.toFixed(1) || "—"} bb</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">SPR</Label>
                <p className="font-medium">{hand.spr?.toFixed(1) || "—"}</p>
              </div>
            </div>

            {/* Hero Decisions */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">Hero Actions</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {hand.heroDecisionPreflop && (
                  <div>
                    <span className="text-xs text-slate-400">Preflop:</span>
                    <p className="font-medium">{hand.heroDecisionPreflop}</p>
                  </div>
                )}
                {hand.heroDecisionFlop && (
                  <div>
                    <span className="text-xs text-slate-400">Flop:</span>
                    <p className="font-medium">{hand.heroDecisionFlop}</p>
                  </div>
                )}
                {hand.heroDecisionTurn && (
                  <div>
                    <span className="text-xs text-slate-400">Turn:</span>
                    <p className="font-medium">{hand.heroDecisionTurn}</p>
                  </div>
                )}
                {hand.heroDecisionRiver && (
                  <div>
                    <span className="text-xs text-slate-400">River:</span>
                    <p className="font-medium">{hand.heroDecisionRiver}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Review & Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reviewed Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reviewed"
                  checked={formData.reviewed}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, reviewed: checked as boolean })
                  }
                />
                <Label htmlFor="reviewed" className="cursor-pointer">
                  Mark as reviewed
                </Label>
              </div>

              {/* Mistake Street */}
              <div className="space-y-2">
                <Label htmlFor="mistakeStreet">Mistake Street</Label>
                <Select
                  value={formData.mistakeStreet}
                  onValueChange={(value) => setFormData({ ...formData, mistakeStreet: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select street (if applicable)" />
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

              {/* Mistake Severity */}
              <div className="space-y-2">
                <Label htmlFor="severity">Mistake Severity (0-3)</Label>
                <Select
                  value={formData.mistakeSeverity}
                  onValueChange={(value) => setFormData({ ...formData, mistakeSeverity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - No mistake</SelectItem>
                    <SelectItem value="1">1 - Minor</SelectItem>
                    <SelectItem value="2">2 - Moderate</SelectItem>
                    <SelectItem value="3">3 - Major</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="BB_DEFENCE, OVERFOLD, ICM"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              {/* Lesson */}
              <div className="space-y-2">
                <Label htmlFor="lesson">Lesson / Notes</Label>
                <Textarea
                  id="lesson"
                  placeholder="What did you learn from this hand?"
                  rows={4}
                  value={formData.lesson}
                  onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                />
              </div>

              {/* Link to Leaks */}
              {allLeaks && allLeaks.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to Leaks</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {allLeaks.map((leak) => (
                      <div key={leak.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`leak-${leak.id}`}
                          checked={formData.selectedLeakIds.includes(leak.id)}
                          onCheckedChange={() => toggleLeak(leak.id)}
                        />
                        <Label htmlFor={`leak-${leak.id}`} className="cursor-pointer flex-1">
                          <span className="font-medium">{leak.name}</span>
                          <span className="text-xs text-slate-500 ml-2">({leak.category})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/hands")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateHand.isPending || linkLeak.isPending || unlinkLeak.isPending}
                  className="flex-1"
                >
                  {updateHand.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
