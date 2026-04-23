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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QuickLogTournament() {
  const [open, setOpen] = useState(false);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    buyIn: "",
    reEntries: "0",
    finalPosition: "",
    prize: "0",
    notes: "",
  });

  const createTournament = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      toast.success("Tournament logged!");
      utils.weeks.getCurrent.invalidate();
      utils.dashboard.getStats.invalidate();
      utils.tournaments.getByWeek.invalidate();
      setOpen(false);
      // Reset form
      setFormData({
        buyIn: "",
        reEntries: "0",
        finalPosition: "",
        prize: "0",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to log tournament: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.buyIn || parseFloat(formData.buyIn) < 0) {
      toast.error("Please enter a valid buy-in amount");
      return;
    }

    createTournament.mutate({
      date: new Date(),
      buyIn: parseFloat(formData.buyIn),
      reEntries: parseInt(formData.reEntries) || 0,
      finalPosition: formData.finalPosition ? parseInt(formData.finalPosition) : undefined,
      prize: parseFloat(formData.prize) || 0,
      notesOverall: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 flex-1">
          <Trophy className="h-5 w-5" />
          Quick Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Log Tournament</DialogTitle>
          <DialogDescription>Capture tournament results in one pass.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Buy-in */}
          <div className="space-y-2">
            <Label htmlFor="quick-buyin">Buy-in ($) *</Label>
            <Input
              id="quick-buyin"
              type="number"
              min="0"
              step="0.01"
              placeholder="220"
              value={formData.buyIn}
              onChange={(e) => setFormData({ ...formData, buyIn: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Re-entries */}
          <div className="space-y-2">
            <Label htmlFor="quick-reentries">Re-entries</Label>
            <Input
              id="quick-reentries"
              type="number"
              min="0"
              value={formData.reEntries}
              onChange={(e) => setFormData({ ...formData, reEntries: e.target.value })}
            />
          </div>

          {/* Position & Prize */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quick-position">Position</Label>
              <Input
                id="quick-position"
                type="number"
                min="1"
                placeholder="8"
                value={formData.finalPosition}
                onChange={(e) => setFormData({ ...formData, finalPosition: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-prize">Prize ($)</Label>
              <Input
                id="quick-prize"
                type="number"
                min="0"
                step="0.01"
                placeholder="450"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="quick-notes">Notes (optional)</Label>
            <Textarea
              id="quick-notes"
              placeholder="Quick thoughts..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
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
            <Button type="submit" disabled={createTournament.isPending} className="flex-1">
              {createTournament.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
