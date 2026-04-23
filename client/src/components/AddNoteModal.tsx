import { useState } from "react";
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

  const handleSubmit = () => {
    if (!formData.content.trim()) {
      alert("Please enter a note");
      return;
    }
    onSubmit(formData);
    setFormData({
      category: "",
      content: "",
    });
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Note"
      onSubmit={handleSubmit}
      submitLabel="Save Note"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-zinc-200">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
          >
            <SelectTrigger
              id="category"
              className="border-white/10 bg-white/[0.05] text-zinc-100"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="border-zinc-800 bg-zinc-950 text-zinc-100">
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
        <div className="space-y-2">
          <Label htmlFor="content" className="text-zinc-200">Note *</Label>
          <Textarea
            id="content"
            placeholder="Write a preflop takeaway or reminder."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="min-h-32 border-white/10 bg-white/[0.05] text-zinc-100 placeholder:text-zinc-500"
          />
        </div>

        {/* Character count */}
        <div className="text-xs text-zinc-500">
          {formData.content.length} characters
        </div>
      </div>
    </BottomSheetModal>
  );
}
