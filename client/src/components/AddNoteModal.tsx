import { useState } from "react";
import { toast } from "sonner";
import { BottomSheetModal } from "./BottomSheetModal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddNoteFormData) => void;
  isLoading?: boolean;
}

export interface AddNoteFormData {
  category: string;
  content: string;
}

export function AddNoteModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddNoteModalProps) {
  const [formData, setFormData] = useState({
    category: "",
    content: "",
  });

  const resetForm = () => {
    setFormData({
      category: "",
      content: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (!formData.content.trim()) {
      toast.error("Enter a note before saving.");
      return;
    }
    onSubmit(formData);
    resetForm();
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Note"
      description="Capture a quick preflop takeaway or reminder."
      eyebrow="Study Note"
      onSubmit={handleSubmit}
      submitLabel="Save Note"
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {/* Category */}
        <div className="space-y-2 rounded-xl border border-border bg-accent/65 p-3">
          <Label htmlFor="category" className="text-secondary-foreground">
            Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={value => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="observation">Observation</SelectItem>
              <SelectItem value="range-note">Range Note</SelectItem>
              <SelectItem value="spot-takeaway">Spot Takeaway</SelectItem>
              <SelectItem value="hand-review">Hand Review</SelectItem>
              <SelectItem value="trainer-reminder">Trainer Reminder</SelectItem>
              <SelectItem value="other-preflop">Other Preflop Note</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="space-y-2 rounded-xl border border-border bg-accent/65 p-3">
          <Label htmlFor="content" className="text-secondary-foreground">
            Note *
          </Label>
          <Textarea
            id="content"
            placeholder="Write a preflop takeaway or reminder."
            value={formData.content}
            onChange={e => setFormData({ ...formData, content: e.target.value })}
            className="min-h-28"
          />
          <div className="text-xs text-muted-foreground">
            {formData.content.length} characters
          </div>
        </div>
      </div>
    </BottomSheetModal>
  );
}
