import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const POSITIONS = ["BTN", "CO", "HJ", "LJ", "UTG", "UTG+1", "UTG+2", "SB", "BB"];
const STACK_PRESETS = ["10bb", "15bb", "20bb", "30bb", "40bb", "50bb", "75bb", "100bb"];

export function QuickAddHand() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    heroPosition: "",
    heroHand: "",
    boardRunout: "",
    effectiveStackBb: "",
    mistakeSeverity: "0",
  });

  const createHand = trpc.hands.create.useMutation({
    onSuccess: () => {
      toast.success("Hand added!");
      utils.hands.getByUser.invalidate();
      setOpen(false);
      // Reset form
      setFormData({
        heroPosition: "",
        heroHand: "",
        boardRunout: "",
        effectiveStackBb: "",
        mistakeSeverity: "0",
      });
    },
    onError: (error) => {
      toast.error(`Failed to add hand: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.heroHand) {
      toast.error("Please enter your hand");
      return;
    }

    createHand.mutate({
      heroPosition: formData.heroPosition || undefined,
      heroHand: formData.heroHand,
      boardRunout: formData.boardRunout || undefined,
      effectiveStackBb: formData.effectiveStackBb ? parseFloat(formData.effectiveStackBb) : undefined,
      mistakeSeverity: parseInt(formData.mistakeSeverity) || 0,
    });
  };

  const handleStackPreset = (preset: string) => {
    const value = preset.replace("bb", "");
    setFormData({ ...formData, effectiveStackBb: value });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Quick Add Hand
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Hand</DialogTitle>
          <DialogDescription>Log a hand for later review</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="quick-position">Position</Label>
            <Select value={formData.heroPosition} onValueChange={(v) => setFormData({ ...formData, heroPosition: v })}>
              <SelectTrigger id="quick-position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hero Hand */}
          <div className="space-y-2">
            <Label htmlFor="quick-hero-hand">Your Hand *</Label>
            <Input
              id="quick-hero-hand"
              placeholder="AKs, QQ, 76o"
              value={formData.heroHand}
              onChange={(e) => setFormData({ ...formData, heroHand: e.target.value.toUpperCase() })}
              required
              autoFocus
            />
          </div>

          {/* Board */}
          <div className="space-y-2">
            <Label htmlFor="quick-board">Board</Label>
            <Input
              id="quick-board"
              placeholder="Ah Kc 7d 2s 9h"
              value={formData.boardRunout}
              onChange={(e) => setFormData({ ...formData, boardRunout: e.target.value.toUpperCase() })}
            />
            <p className="text-xs text-slate-500">Enter cards separated by spaces</p>
          </div>

          {/* Stack Size */}
          <div className="space-y-2">
            <Label htmlFor="quick-stack">Effective Stack (BB)</Label>
            <Input
              id="quick-stack"
              type="number"
              min="0"
              step="0.1"
              placeholder="20"
              value={formData.effectiveStackBb}
              onChange={(e) => setFormData({ ...formData, effectiveStackBb: e.target.value })}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {STACK_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleStackPreset(preset)}
                >
                  {preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Mistake Severity */}
          <div className="space-y-2">
            <Label htmlFor="quick-severity">Mistake Severity (optional)</Label>
            <Select
              value={formData.mistakeSeverity}
              onValueChange={(v) => setFormData({ ...formData, mistakeSeverity: v })}
            >
              <SelectTrigger id="quick-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No mistake</SelectItem>
                <SelectItem value="1">Minor (1)</SelectItem>
                <SelectItem value="2">Moderate (2)</SelectItem>
                <SelectItem value="3">Major (3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createHand.isPending} className="flex-1">
              {createHand.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
