import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";


const POSITIONS = ["UTG", "UTG+1", "HJ", "CO", "BTN", "SB", "BB"];
const TABLE_SIZES = ["6-max", "8-max", "9-max", "10-max"];

interface LogHandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogHandModal({ isOpen, onClose }: LogHandModalProps) {
  const [currentStreet, setCurrentStreet] = useState<"preflop" | "flop" | "turn" | "river">("preflop");
  
  // Preflop state
  const [tableSize, setTableSize] = useState("");
  const [effectiveStackBb, setEffectiveStackBb] = useState("");
  const [heroPosition, setHeroPosition] = useState("");
  const [heroHand, setHeroHand] = useState("");
  const [preflopActions, setPreflopActions] = useState("");
  const [preflopNotes, setPreflopNotes] = useState("");
  
  // Flop state
  const [flopBoard, setFlopBoard] = useState("");
  const [flopActions, setFlopActions] = useState("");
  const [flopNotes, setFlopNotes] = useState("");
  
  // Turn state
  const [turnBoard, setTurnBoard] = useState("");
  const [turnActions, setTurnActions] = useState("");
  const [turnNotes, setTurnNotes] = useState("");
  
  // River state
  const [riverBoard, setRiverBoard] = useState("");
  const [riverActions, setRiverActions] = useState("");
  const [riverNotes, setRiverNotes] = useState("");
  
  // Overall state
  const [villainPosition, setVillainPosition] = useState("");
  const [villainEstimatedRange, setVillainEstimatedRange] = useState("");
  const [overallNotes, setOverallNotes] = useState("");

  const createHand = trpc.hands.create.useMutation({
    onSuccess: () => {
      resetForm();
      onClose();
    },
    onError: (error) => {
      alert(`Error saving hand: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTableSize("");
    setEffectiveStackBb("");
    setHeroPosition("");
    setHeroHand("");
    setPreflopActions("");
    setPreflopNotes("");
    setFlopBoard("");
    setFlopActions("");
    setFlopNotes("");
    setTurnBoard("");
    setTurnActions("");
    setTurnNotes("");
    setRiverBoard("");
    setRiverActions("");
    setRiverNotes("");
    setVillainPosition("");
    setVillainEstimatedRange("");
    setOverallNotes("");
    setCurrentStreet("preflop");
  };

  const handleSave = () => {
    // Validate required fields
    if (!tableSize || !effectiveStackBb || !heroPosition || !heroHand || !preflopActions) {
      alert("Please fill in table size, stack, position, hand, and preflop actions");
      return;
    }

    const streetData = {
      preflop: {
        street: "preflop",
        tableSize,
        effectiveStackBb: parseFloat(effectiveStackBb),
        heroPosition,
        heroHand,
        actions: preflopActions,
        notes: preflopNotes,
        villainPosition: villainPosition || undefined,
        villainEstimatedRange: villainEstimatedRange || undefined,
      },
      flop: flopBoard ? {
        street: "flop",
        board: flopBoard,
        actions: flopActions,
        notes: flopNotes,
      } : null,
      turn: turnBoard ? {
        street: "turn",
        board: turnBoard,
        actions: turnActions,
        notes: turnNotes,
      } : null,
      river: riverBoard ? {
        street: "river",
        board: riverBoard,
        actions: riverActions,
        notes: riverNotes,
      } : null,
    };

    createHand.mutate({
      heroPosition,
      heroHand,
      boardRunout: riverBoard || turnBoard || flopBoard || undefined,
      effectiveStackBb: parseFloat(effectiveStackBb),
      streetDataJson: JSON.stringify(streetData),
      lesson: overallNotes,

    });
  };

  if (!isOpen) return null;

  const streets = ["preflop", "flop", "turn", "river"] as const;
  const currentIndex = streets.indexOf(currentStreet);
  const isLastStreet = currentIndex === streets.length - 1;
  const isFirstStreet = currentIndex === 0;

  const handleNext = () => {
    if (!isLastStreet) {
      setCurrentStreet(streets[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (!isFirstStreet) {
      setCurrentStreet(streets[currentIndex - 1]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full max-h-[90vh] rounded-t-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Log Hand</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Street Navigation */}
          <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
            <button
              onClick={handlePrev}
              disabled={isFirstStreet}
              className="text-orange-600 disabled:text-gray-300 text-lg font-bold"
            >
              ←
            </button>
            <div className="text-center">
              <div className="font-semibold text-orange-600 capitalize">
                {currentStreet}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentIndex + 1} of {streets.length}
              </div>
            </div>
            <button
              onClick={handleNext}
              disabled={isLastStreet}
              className="text-orange-600 disabled:text-gray-300 text-lg font-bold"
            >
              →
            </button>
          </div>

          {/* Preflop Section */}
          {currentStreet === "preflop" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="tableSize">Table Size *</Label>
                <Select value={tableSize} onValueChange={setTableSize}>
                  <SelectTrigger id="tableSize">
                    <SelectValue placeholder="Select table size" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="effectiveStackBb">Effective Stack (BB) *</Label>
                <Input
                  id="effectiveStackBb"
                  type="number"
                  placeholder="e.g., 50"
                  value={effectiveStackBb}
                  onChange={(e) => setEffectiveStackBb(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="heroPosition">Your Position *</Label>
                <Select value={heroPosition} onValueChange={setHeroPosition}>
                  <SelectTrigger id="heroPosition">
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

              <div>
                <Label htmlFor="heroHand">Your Hand *</Label>
                <Input
                  id="heroHand"
                  placeholder="e.g., AhKh"
                  value={heroHand}
                  onChange={(e) => setHeroHand(e.target.value.toUpperCase())}
                  maxLength={4}
                />
              </div>

              <div>
                <Label htmlFor="preflopActions">Preflop Action Sequence *</Label>
                <Textarea
                  id="preflopActions"
                  placeholder="e.g., UTG folds, HJ raises 2.5x, CO calls, BTN folds, SB folds, BB 3-bets to 10x, HJ calls"
                  value={preflopActions}
                  onChange={(e) => setPreflopActions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="preflopNotes">Preflop Notes</Label>
                <Textarea
                  id="preflopNotes"
                  placeholder="Add notes about the preflop action..."
                  value={preflopNotes}
                  onChange={(e) => setPreflopNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="pt-2 border-t">
                <Label htmlFor="villainPosition">Villain Position</Label>
                <Select value={villainPosition} onValueChange={setVillainPosition}>
                  <SelectTrigger id="villainPosition">
                    <SelectValue placeholder="Select villain position" />
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

              <div>
                <Label htmlFor="villainRange">Villain Estimated Range</Label>
                <Input
                  id="villainRange"
                  placeholder="e.g., TT+, AK, AQ"
                  value={villainEstimatedRange}
                  onChange={(e) => setVillainEstimatedRange(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Flop Section */}
          {currentStreet === "flop" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="flopBoard">Flop Board</Label>
                <Input
                  id="flopBoard"
                  placeholder="e.g., QsJd2h"
                  value={flopBoard}
                  onChange={(e) => setFlopBoard(e.target.value.toLowerCase())}
                  maxLength={6}
                />
              </div>

              <div>
                <Label htmlFor="flopActions">Flop Action Sequence</Label>
                <Textarea
                  id="flopActions"
                  placeholder="e.g., Hero checks, Villain bets 3x, Hero calls"
                  value={flopActions}
                  onChange={(e) => setFlopActions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="flopNotes">Flop Notes</Label>
                <Textarea
                  id="flopNotes"
                  placeholder="Add notes about the flop action..."
                  value={flopNotes}
                  onChange={(e) => setFlopNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Turn Section */}
          {currentStreet === "turn" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="turnBoard">Turn Board</Label>
                <Input
                  id="turnBoard"
                  placeholder="e.g., QsJd2h7c"
                  value={turnBoard}
                  onChange={(e) => setTurnBoard(e.target.value.toLowerCase())}
                  maxLength={8}
                />
              </div>

              <div>
                <Label htmlFor="turnActions">Turn Action Sequence</Label>
                <Textarea
                  id="turnActions"
                  placeholder="e.g., Hero checks, Villain bets 5x, Hero raises to 15x, Villain calls"
                  value={turnActions}
                  onChange={(e) => setTurnActions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="turnNotes">Turn Notes</Label>
                <Textarea
                  id="turnNotes"
                  placeholder="Add notes about the turn action..."
                  value={turnNotes}
                  onChange={(e) => setTurnNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* River Section */}
          {currentStreet === "river" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="riverBoard">River Board</Label>
                <Input
                  id="riverBoard"
                  placeholder="e.g., QsJd2h7c3s"
                  value={riverBoard}
                  onChange={(e) => setRiverBoard(e.target.value.toLowerCase())}
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="riverActions">River Action Sequence</Label>
                <Textarea
                  id="riverActions"
                  placeholder="e.g., Hero bets 10x, Villain folds"
                  value={riverActions}
                  onChange={(e) => setRiverActions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="riverNotes">River Notes</Label>
                <Textarea
                  id="riverNotes"
                  placeholder="Add notes about the river action..."
                  value={riverNotes}
                  onChange={(e) => setRiverNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="pt-2 border-t">
                <Label htmlFor="overallNotes">Overall Hand Analysis</Label>
                <Textarea
                  id="overallNotes"
                  placeholder="Summarize the hand, what you learned, and any mistakes..."
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        <div className="flex gap-2 p-4 border-t border-border bg-white flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
            disabled={createHand.isPending}
          >
            {createHand.isPending ? "Saving..." : "Save Hand"}
          </Button>
        </div>
      </div>
    </div>
  );
}
