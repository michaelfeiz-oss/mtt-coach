import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NotesFormProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function NotesForm({ notes, onNotesChange }: NotesFormProps) {
  const maxLength = 300;
  const remaining = maxLength - notes.length;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">
        Notes (Optional)
      </h3>

      <div>
        <Label htmlFor="notes" className="text-sm font-medium">
          Hand Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value.slice(0, maxLength))}
          placeholder="Add any observations, lessons, or thoughts about this hand..."
          className="mt-2 resize-none"
          rows={3}
        />
        <p className={`text-xs mt-1 ${remaining < 50 ? "text-red-600" : "text-gray-500"}`}>
          {remaining} characters remaining
        </p>
      </div>
    </div>
  );
}
