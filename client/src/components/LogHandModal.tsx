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

interface LogHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function LogHandModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: LogHandModalProps) {
  const [formData, setFormData] = useState({
    position: "",
    stackSize: "",
    board: "",
    action: "",
    result: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.position || !formData.stackSize || !formData.action) {
      alert("Please fill in required fields");
      return;
    }
    onSubmit(formData);
    setFormData({
      position: "",
      stackSize: "",
      board: "",
      action: "",
      result: "",
      notes: "",
    });
  };

  return (
    <BottomSheetModal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Hand"
      onSubmit={handleSubmit}
      submitLabel="Save Hand"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <Label htmlFor="position">Position *</Label>
          <Select
            value={formData.position}
            onValueChange={(value) =>
              setFormData({ ...formData, position: value })
            }
          >
            <SelectTrigger id="position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTG">UTG</SelectItem>
              <SelectItem value="UTG+1">UTG+1</SelectItem>
              <SelectItem value="MP">MP</SelectItem>
              <SelectItem value="HJ">HJ</SelectItem>
              <SelectItem value="CO">CO</SelectItem>
              <SelectItem value="BTN">BTN</SelectItem>
              <SelectItem value="SB">SB</SelectItem>
              <SelectItem value="BB">BB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stack Size */}
        <div className="space-y-2">
          <Label htmlFor="stackSize">Stack Size (BB) *</Label>
          <Input
            id="stackSize"
            type="number"
            placeholder="e.g., 25"
            value={formData.stackSize}
            onChange={(e) =>
              setFormData({ ...formData, stackSize: e.target.value })
            }
          />
        </div>

        {/* Board */}
        <div className="space-y-2">
          <Label htmlFor="board">Board</Label>
          <Input
            id="board"
            placeholder="e.g., AK2r"
            value={formData.board}
            onChange={(e) => setFormData({ ...formData, board: e.target.value })}
          />
        </div>

        {/* Action */}
        <div className="space-y-2">
          <Label htmlFor="action">Action *</Label>
          <Select
            value={formData.action}
            onValueChange={(value) =>
              setFormData({ ...formData, action: value })
            }
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fold">Fold</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="raise">Raise</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="bet">Bet</SelectItem>
              <SelectItem value="shove">Shove</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        <div className="space-y-2">
          <Label htmlFor="result">Result</Label>
          <Select
            value={formData.result}
            onValueChange={(value) =>
              setFormData({ ...formData, result: value })
            }
          >
            <SelectTrigger id="result">
              <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="folded">Folded</SelectItem>
              <SelectItem value="unclear">Unclear</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add notes about this hand..."
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="min-h-24"
          />
        </div>
      </div>
    </BottomSheetModal>
  );
}
