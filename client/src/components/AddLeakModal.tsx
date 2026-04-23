import { useState } from "react";
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

interface AddLeakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddLeakFormData) => void;
  isLoading?: boolean;
}

export interface AddLeakFormData {
  leakType: string;
  frequency: string;
  context: string;
  impact: string;
  notes: string;
}

export function AddLeakModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddLeakModalProps) {
  const [formData, setFormData] = useState({
    leakType: "",
    frequency: "",
    context: "",
    impact: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.leakType || !formData.frequency) {
      alert("Please fill in required fields");
      return;
    }
    onSubmit(formData);
    setFormData({
      leakType: "",
      frequency: "",
      context: "",
      impact: "",
      notes: "",
    });
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Preflop Leak"
      description="Track recurring mistakes so they are easy to revisit in study."
      eyebrow="Leak Capture"
      onSubmit={handleSubmit}
      submitLabel="Save Leak"
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leakType">Leak Type *</Label>
            <Select
              value={formData.leakType}
              onValueChange={value => setFormData({ ...formData, leakType: value })}
            >
              <SelectTrigger id="leakType">
                <SelectValue placeholder="Select leak type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preflop-ranges">Preflop Ranges</SelectItem>
                <SelectItem value="blind-defense">Blind Defense</SelectItem>
                <SelectItem value="3bet-defense">3-Bet / 4-Bet</SelectItem>
                <SelectItem value="facing-3bet">Facing 3-Bet</SelectItem>
                <SelectItem value="jam-fold">Jam / Fold Thresholds</SelectItem>
                <SelectItem value="bvb">Blind vs Blind</SelectItem>
                <SelectItem value="other-preflop">Other Preflop Spot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select
              value={formData.frequency}
              onValueChange={value => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="How often?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rare">Rare (1-2 times)</SelectItem>
                <SelectItem value="occasional">Occasional (few times)</SelectItem>
                <SelectItem value="frequent">Frequent (regularly)</SelectItem>
                <SelectItem value="very-frequent">Very Frequent (often)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context</Label>
            <Select
              value={formData.context}
              onValueChange={value => setFormData({ ...formData, context: value })}
            >
              <SelectTrigger id="context">
                <SelectValue placeholder="When does it happen?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="early-stage">Early Stage</SelectItem>
                <SelectItem value="mid-stage">Mid Stage</SelectItem>
                <SelectItem value="bubble">Bubble</SelectItem>
                <SelectItem value="final-table">Final Table</SelectItem>
                <SelectItem value="all-stages">All Stages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact">Impact Level</Label>
            <Select
              value={formData.impact}
              onValueChange={value => setFormData({ ...formData, impact: value })}
            >
              <SelectTrigger id="impact">
                <SelectValue placeholder="How bad is it?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Impact</SelectItem>
                <SelectItem value="medium">Medium Impact</SelectItem>
                <SelectItem value="high">High Impact</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="One preflop takeaway or spot to train next."
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            className="min-h-24"
          />
        </div>
      </div>
    </BottomSheetModal>
  );
}
