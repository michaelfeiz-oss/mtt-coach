import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface QuickEditHandProps {
  handId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickEditHand({ handId, open, onOpenChange }: QuickEditHandProps) {
  const utils = trpc.useUtils();

  const { data: hand } = trpc.hands.getById.useQuery(
    { id: handId },
    { enabled: open && !!handId }
  );

  const { data: allLeaks } = trpc.leaks.list.useQuery(undefined, { enabled: open });
  const { data: handLeaks } = trpc.hands.getLeaks.useQuery(
    { handId },
    { enabled: open && !!handId }
  );

  const [formData, setFormData] = useState({
    reviewed: false,
    mistakeStreet: "NONE",
    mistakeSeverity: "0",
    selectedLeakIds: [] as number[],
  });

  useEffect(() => {
    if (hand && handLeaks) {
      setFormData({
        reviewed: hand.reviewed,
        mistakeStreet: hand.mistakeStreet || "NONE",
        mistakeSeverity: hand.mistakeSeverity.toString(),
        selectedLeakIds: handLeaks.map((l) => l.id),
      });
    }
  }, [hand, handLeaks]);

  const updateHand = trpc.hands.update.useMutation({
    onSuccess: () => {
      toast.success("Hand updated!");
      utils.hands.getByUser.invalidate();
      utils.hands.getById.invalidate({ id: handId });
      utils.leaks.getTop.invalidate();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const linkLeak = trpc.hands.linkLeak.useMutation({
    onSuccess: () => {
      utils.hands.getLeaks.invalidate({ handId });
    },
  });

  const unlinkLeak = trpc.hands.unlinkLeak.useMutation({
    onSuccess: () => {
      utils.hands.getLeaks.invalidate({ handId });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update hand details
    await updateHand.mutateAsync({
      id: handId,
      reviewed: formData.reviewed,
      mistakeStreet:
        formData.mistakeStreet && formData.mistakeStreet !== "NONE"
          ? (formData.mistakeStreet as any)
          : undefined,
      mistakeSeverity: parseInt(formData.mistakeSeverity),
    });

    // Update leak links
    const currentLeakIds = handLeaks?.map((l) => l.id) || [];
    const toAdd = formData.selectedLeakIds.filter((id) => !currentLeakIds.includes(id));
    const toRemove = currentLeakIds.filter((id) => !formData.selectedLeakIds.includes(id));

    for (const leakId of toAdd) {
      await linkLeak.mutateAsync({ handId, leakId });
    }

    for (const leakId of toRemove) {
      await unlinkLeak.mutateAsync({ handId, leakId });
    }
  };

  const toggleLeak = (leakId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedLeakIds: prev.selectedLeakIds.includes(leakId)
        ? prev.selectedLeakIds.filter((id) => id !== leakId)
        : [...prev.selectedLeakIds, leakId],
    }));
  };

  if (!hand) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Edit Hand</DialogTitle>
          <DialogDescription>
            {hand.heroHand} • {hand.heroPosition}
          </DialogDescription>
        </DialogHeader>

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
            <Label>Mistake Street</Label>
            <Select
              value={formData.mistakeStreet}
              onValueChange={(value) => setFormData({ ...formData, mistakeStreet: value })}
            >
              <SelectTrigger>
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

          {/* Mistake Severity */}
          <div className="space-y-2">
            <Label>Mistake Severity</Label>
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

          {/* Linked Leaks */}
          <div className="space-y-2">
            <Label>Linked Leaks</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.03] p-3">
              {allLeaks && allLeaks.length > 0 ? (
                allLeaks.map((leak) => (
                  <div key={leak.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`leak-${leak.id}`}
                      checked={formData.selectedLeakIds.includes(leak.id)}
                      onCheckedChange={() => toggleLeak(leak.id)}
                    />
                    <Label htmlFor={`leak-${leak.id}`} className="cursor-pointer text-sm">
                      {leak.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No leaks available</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateHand.isPending}>
              {updateHand.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
