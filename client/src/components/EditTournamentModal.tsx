import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BottomSheetModal } from "./BottomSheetModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  tournament?: any;
}

export function EditTournamentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  tournament,
}: EditTournamentModalProps) {
  const emptyForm = {
    buyIn: "",
    reEntries: "0",
    startingStack: "",
    finalPosition: "",
    prize: "",
    venue: "",
    notes: "",
  };
  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  // Populate form when tournament data is provided
  useEffect(() => {
    if (tournament && isOpen) {
      setFormData({
        buyIn: tournament.buyIn?.toString() || "",
        reEntries: tournament.reEntries?.toString() || "0",
        startingStack: tournament.startingStack?.toString() || "",
        finalPosition: tournament.finalPosition?.toString() || "",
        prize: tournament.prize?.toString() || "",
        venue: tournament.venue || "",
        notes: tournament.notesOverall || "",
      });
    }
  }, [tournament, isOpen]);

  const resetForm = () => {
    setFormData({ ...emptyForm });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.buyIn || !formData.finalPosition) {
      toast.error("Buy-in and final position are required.");
      return;
    }
    onSubmit(formData);
    resetForm();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Tournament"
      description="Update result details and notes for this session."
      eyebrow="Tournament Result"
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <div className="grid gap-3 rounded-xl border border-border/80 bg-accent/45 p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="buyIn">Buy-in ($) *</Label>
            <Input
              id="buyIn"
              type="number"
              placeholder="e.g., 100"
              value={formData.buyIn}
              onChange={e => setFormData({ ...formData, buyIn: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="finalPosition">Final Position *</Label>
            <Select
              value={formData.finalPosition}
              onValueChange={value => setFormData({ ...formData, finalPosition: value })}
            >
              <SelectTrigger id="finalPosition">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st Place</SelectItem>
                <SelectItem value="2nd">2nd Place</SelectItem>
                <SelectItem value="3rd">3rd Place</SelectItem>
                <SelectItem value="4th">4th Place</SelectItem>
                <SelectItem value="5th">5th Place</SelectItem>
                <SelectItem value="6th-10th">6th-10th</SelectItem>
                <SelectItem value="11th-20th">11th-20th</SelectItem>
                <SelectItem value="21st+">21st+</SelectItem>
                <SelectItem value="busted">Busted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reEntries">Re-entries</Label>
            <Input
              id="reEntries"
              type="number"
              placeholder="0"
              value={formData.reEntries}
              onChange={e => setFormData({ ...formData, reEntries: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingStack">Starting Stack (chips)</Label>
            <Input
              id="startingStack"
              type="number"
              placeholder="e.g., 5000"
              value={formData.startingStack}
              onChange={e => setFormData({ ...formData, startingStack: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prize">Prize ($)</Label>
            <Input
              id="prize"
              type="number"
              placeholder="e.g., 500"
              value={formData.prize}
              onChange={e => setFormData({ ...formData, prize: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              placeholder="e.g., Aria, PokerStars"
              value={formData.venue}
              onChange={e => setFormData({ ...formData, venue: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-border/80 bg-accent/45 p-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this tournament..."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-24"
          />
        </div>
      </div>
    </BottomSheetModal>
  );
}
