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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StreetData {
  board: string;
  action: string;
  result?: string;
  notes?: string;
}

interface LogHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const STREETS = ["Preflop", "Flop", "Turn", "River"];

const ACTION_OPTIONS = {
  Preflop: [
    { label: "Fold", value: "fold" },
    { label: "Check", value: "check" },
    { label: "Call", value: "call" },
    { label: "Raise", value: "raise" },
    { label: "Shove", value: "shove" },
    { label: "Limp", value: "limp" },
  ],
  Flop: [
    { label: "Check", value: "check" },
    { label: "Bet", value: "bet" },
    { label: "Call", value: "call" },
    { label: "Raise", value: "raise" },
    { label: "Fold", value: "fold" },
    { label: "Check-Raise", value: "check_raise" },
    { label: "Shove", value: "shove" },
  ],
  Turn: [
    { label: "Check", value: "check" },
    { label: "Bet", value: "bet" },
    { label: "Call", value: "call" },
    { label: "Raise", value: "raise" },
    { label: "Fold", value: "fold" },
    { label: "Check-Raise", value: "check_raise" },
    { label: "Shove", value: "shove" },
  ],
  River: [
    { label: "Check", value: "check" },
    { label: "Bet", value: "bet" },
    { label: "Call", value: "call" },
    { label: "Raise", value: "raise" },
    { label: "Fold", value: "fold" },
    { label: "Check-Raise", value: "check_raise" },
  ],
};

export function LogHandModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: LogHandModalProps) {
  const [currentStreetIndex, setCurrentStreetIndex] = useState(0);
  const [formData, setFormData] = useState({
    position: "",
    stackSize: "",
    heroHand: "",
    streets: {
      Preflop: { board: "", action: "", result: "", notes: "" },
      Flop: { board: "", action: "", result: "", notes: "" },
      Turn: { board: "", action: "", result: "", notes: "" },
      River: { board: "", action: "", result: "", notes: "" },
    },
    overallNotes: "",
  });

  const currentStreet = STREETS[currentStreetIndex];
  const currentStreetData = formData.streets[currentStreet as keyof typeof formData.streets];

  const handleStreetChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      streets: {
        ...formData.streets,
        [currentStreet]: {
          ...currentStreetData,
          [field]: value,
        },
      },
    });
  };

  const handleSubmit = () => {
    if (!formData.position || !formData.stackSize) {
      alert("Please fill in Position and Stack Size");
      return;
    }

    // Check that at least preflop action is filled
    if (!formData.streets.Preflop.action) {
      alert("Please fill in at least the Preflop action");
      return;
    }

    // Build street data JSON
    const streetDataJson = {
      preflop: formData.streets.Preflop,
      flop: formData.streets.Flop.action ? formData.streets.Flop : null,
      turn: formData.streets.Turn.action ? formData.streets.Turn : null,
      river: formData.streets.River.action ? formData.streets.River : null,
    };

    onSubmit({
      position: formData.position,
      stackSize: parseFloat(formData.stackSize),
      heroHand: formData.heroHand,
      streetDataJson: JSON.stringify(streetDataJson),
      notes: formData.overallNotes,
    });

    // Reset form
    setFormData({
      position: "",
      stackSize: "",
      heroHand: "",
      streets: {
        Preflop: { board: "", action: "", result: "", notes: "" },
        Flop: { board: "", action: "", result: "", notes: "" },
        Turn: { board: "", action: "", result: "", notes: "" },
        River: { board: "", action: "", result: "", notes: "" },
      },
      overallNotes: "",
    });
    setCurrentStreetIndex(0);
  };

  const canGoNext = currentStreetIndex < STREETS.length - 1;
  const canGoPrev = currentStreetIndex > 0;

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
        {/* Top-level fields - only show on first street */}
        {currentStreetIndex === 0 && (
          <>
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

            {/* Hero Hand */}
            <div className="space-y-2">
              <Label htmlFor="heroHand">Your Hand</Label>
              <Input
                id="heroHand"
                placeholder="e.g., AK"
                value={formData.heroHand}
                onChange={(e) =>
                  setFormData({ ...formData, heroHand: e.target.value })
                }
              />
            </div>
          </>
        )}

        {/* Street Navigation */}
        <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStreetIndex(Math.max(0, currentStreetIndex - 1))}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <h3 className="font-semibold text-orange-900">{currentStreet}</h3>
            <p className="text-xs text-orange-700">
              {currentStreetIndex + 1} of {STREETS.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStreetIndex(Math.min(STREETS.length - 1, currentStreetIndex + 1))}
            disabled={!canGoNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Street-specific fields */}
        <div className="space-y-4">
          {/* Board */}
          <div className="space-y-2">
            <Label htmlFor="board">Board</Label>
            <Input
              id="board"
              placeholder={
                currentStreet === "Preflop"
                  ? "N/A"
                  : currentStreet === "Flop"
                    ? "e.g., AK2r"
                    : currentStreet === "Turn"
                      ? "e.g., AK2rJ"
                      : "e.g., AK2rJQ"
              }
              value={currentStreetData.board}
              onChange={(e) => handleStreetChange("board", e.target.value)}
              disabled={currentStreet === "Preflop"}
            />
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={currentStreetData.action}
              onValueChange={(value) => handleStreetChange("action", value)}
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS[currentStreet as keyof typeof ACTION_OPTIONS].map(
                  (option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <Label htmlFor="result">Result</Label>
            <Select
              value={currentStreetData.result}
              onValueChange={(value) => handleStreetChange("result", value)}
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

          {/* Street Notes */}
          <div className="space-y-2">
            <Label htmlFor="streetNotes">{currentStreet} Notes</Label>
            <Textarea
              id="streetNotes"
              placeholder={`Add notes about the ${currentStreet.toLowerCase()}...`}
              value={currentStreetData.notes}
              onChange={(e) => handleStreetChange("notes", e.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

        {/* Overall Notes - show on last street */}
        {currentStreetIndex === STREETS.length - 1 && (
          <div className="space-y-2">
            <Label htmlFor="overallNotes">Overall Hand Notes</Label>
            <Textarea
              id="overallNotes"
              placeholder="Add overall notes about this hand..."
              value={formData.overallNotes}
              onChange={(e) =>
                setFormData({ ...formData, overallNotes: e.target.value })
              }
              className="min-h-24"
            />
          </div>
        )}
      </div>
    </BottomSheetModal>
  );
}
