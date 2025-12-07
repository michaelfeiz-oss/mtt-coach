import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HandPicker } from "./HandPicker";
import { ActionBuilder } from "./ActionBuilder";
import { BoardPicker } from "./BoardPicker";
import { Stepper } from "./Stepper";
import { BoardDisplay } from "./BoardDisplay";
import { trpc } from "@/lib/trpc";

const POSITIONS = ["UTG", "UTG+1", "HJ", "CO", "BTN", "SB", "BB"];
const TABLE_SIZES = ["6-max", "8-max", "9-max", "10-max"];

interface LogHandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogHandModal({ isOpen, onClose }: LogHandModalProps) {
  const [street, setStreet] = useState(0);
  
  // Preflop state
  const [tableSize, setTableSize] = useState("");
  const [effectiveStack, setEffectiveStack] = useState("");
  const [heroPosition, setHeroPosition] = useState("");
  const [heroHand, setHeroHand] = useState("");
  const [preflopActions, setPreflopActions] = useState("");
  const [preflopNotes, setPreflopNotes] = useState("");
  const [villainPosition, setVillainPosition] = useState("");
  const [villainRange, setVillainRange] = useState("");
  
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
    setStreet(0);
    setTableSize("");
    setEffectiveStack("");
    setHeroPosition("");
    setHeroHand("");
    setPreflopActions("");
    setPreflopNotes("");
    setVillainPosition("");
    setVillainRange("");
    setFlopBoard("");
    setFlopActions("");
    setFlopNotes("");
    setTurnBoard("");
    setTurnActions("");
    setTurnNotes("");
    setRiverBoard("");
    setRiverActions("");
    setRiverNotes("");
    setOverallNotes("");
  };

  const handleSave = () => {
    if (!tableSize || !effectiveStack || !heroPosition || !heroHand || !preflopActions) {
      alert("Please fill in all required preflop fields");
      return;
    }

    const streetData = {
      preflop: {
        tableSize,
        effectiveStackBb: parseInt(effectiveStack),
        heroPosition,
        heroHand,
        actions: preflopActions,
        notes: preflopNotes,
        villainPosition: villainPosition || undefined,
        villainRange: villainRange || undefined,
      },
      flop: flopBoard
        ? {
            board: flopBoard,
            actions: flopActions,
            notes: flopNotes,
          }
        : undefined,
      turn: turnBoard
        ? {
            board: turnBoard,
            actions: turnActions,
            notes: turnNotes,
          }
        : undefined,
      river: riverBoard
        ? {
            board: riverBoard,
            actions: riverActions,
            notes: riverNotes,
          }
        : undefined,
      overallNotes: overallNotes || undefined,
    };

    createHand.mutate({
      heroPosition,
      heroHand,
      boardRunout: riverBoard || turnBoard || flopBoard || undefined,
      effectiveStackBb: parseInt(effectiveStack),
      streetDataJson: JSON.stringify(streetData),
      lesson: overallNotes,
    });
  };

  if (!isOpen) return null;

  const steps = [
    { label: "Preflop", description: "Starting hand & action" },
    { label: "Flop", description: "First 3 cards" },
    { label: "Turn", description: "4th card" },
    { label: "River", description: "Final card" },
  ];

  const handleNextStreet = () => {
    // Validate current street before moving
    if (street === 0) {
      if (!tableSize || !effectiveStack || !heroPosition || !heroHand || !preflopActions) {
        alert("Please fill in all required preflop fields");
        return;
      }
    }
    setStreet(Math.min(3, street + 1));
  };

  const handlePreviousStreet = () => {
    setStreet(Math.max(0, street - 1));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header with Stepper */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Log Hand</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ✕
            </button>
          </div>
          <Stepper
            currentStep={street}
            totalSteps={4}
            steps={steps}
          />
        </div>

        {/* Board Display */}
        {(flopBoard || turnBoard || riverBoard) && (
          <div className="px-6 pt-4 flex-shrink-0">
            <BoardDisplay
              flopBoard={flopBoard}
              turnBoard={turnBoard}
              riverBoard={riverBoard}
              currentStreet={street}
            />
          </div>
        )}

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {street === 0 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Preflop:</span> Enter table conditions, your hand, and action before the flop.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tableSize" className="text-sm font-medium">
                    Table Size <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="effectiveStack" className="text-sm font-medium">
                    Effective Stack (BB) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="effectiveStack"
                    type="number"
                    value={effectiveStack}
                    onChange={(e) => setEffectiveStack(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heroPosition" className="text-sm font-medium">
                    Your Position <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="heroHand" className="text-sm font-medium">
                    Your Hand <span className="text-red-500">*</span>
                  </Label>
                  <HandPicker value={heroHand} onChange={setHeroHand} />
                </div>
              </div>

              <div>
                <ActionBuilder
                  value={preflopActions}
                  onChange={setPreflopActions}
                  label="Preflop Action Sequence *"
                />
              </div>

              <div>
                <Label htmlFor="preflopNotes" className="text-sm font-medium">
                  Preflop Notes
                </Label>
                <Textarea
                  id="preflopNotes"
                  value={preflopNotes}
                  onChange={(e) => setPreflopNotes(e.target.value)}
                  placeholder="Add notes about the preflop action..."
                  className="min-h-20"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-4 text-gray-700">Villain Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="villainPosition" className="text-sm font-medium">
                      Villain Position
                    </Label>
                    <Select value={villainPosition} onValueChange={setVillainPosition}>
                      <SelectTrigger id="villainPosition">
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
                    <Label htmlFor="villainRange" className="text-sm font-medium">
                      Villain Range
                    </Label>
                    <Input
                      id="villainRange"
                      value={villainRange}
                      onChange={(e) => setVillainRange(e.target.value)}
                      placeholder="e.g., TT+, AK, AQ"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {street === 1 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Flop:</span> Enter the 3 community cards and action on the flop.
                </p>
              </div>

              <div>
                <BoardPicker
                  value={flopBoard}
                  onChange={setFlopBoard}
                  maxCards={3}
                  label="Flop Board"
                />
              </div>

              <div>
                <ActionBuilder
                  value={flopActions}
                  onChange={setFlopActions}
                  label="Flop Action Sequence"
                />
              </div>

              <div>
                <Label htmlFor="flopNotes" className="text-sm font-medium">
                  Flop Notes
                </Label>
                <Textarea
                  id="flopNotes"
                  value={flopNotes}
                  onChange={(e) => setFlopNotes(e.target.value)}
                  placeholder="Add notes about the flop action..."
                  className="min-h-20"
                />
              </div>
            </div>
          )}

          {street === 2 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Turn:</span> Enter the 4th community card and action on the turn.
                </p>
              </div>

              <div>
                <BoardPicker
                  value={turnBoard}
                  onChange={setTurnBoard}
                  maxCards={4}
                  label="Turn Board"
                />
              </div>

              <div>
                <ActionBuilder
                  value={turnActions}
                  onChange={setTurnActions}
                  label="Turn Action Sequence"
                />
              </div>

              <div>
                <Label htmlFor="turnNotes" className="text-sm font-medium">
                  Turn Notes
                </Label>
                <Textarea
                  id="turnNotes"
                  value={turnNotes}
                  onChange={(e) => setTurnNotes(e.target.value)}
                  placeholder="Add notes about the turn action..."
                  className="min-h-20"
                />
              </div>
            </div>
          )}

          {street === 3 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">River:</span> Enter the final card, action, and your overall analysis.
                </p>
              </div>

              <div>
                <BoardPicker
                  value={riverBoard}
                  onChange={setRiverBoard}
                  maxCards={5}
                  label="River Board"
                />
              </div>

              <div>
                <ActionBuilder
                  value={riverActions}
                  onChange={setRiverActions}
                  label="River Action Sequence"
                />
              </div>

              <div>
                <Label htmlFor="riverNotes" className="text-sm font-medium">
                  River Notes
                </Label>
                <Textarea
                  id="riverNotes"
                  value={riverNotes}
                  onChange={(e) => setRiverNotes(e.target.value)}
                  placeholder="Add notes about the river action..."
                  className="min-h-20"
                />
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="overallNotes" className="text-sm font-medium">
                  Overall Hand Analysis
                </Label>
                <Textarea
                  id="overallNotes"
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  placeholder="Summarize the hand, what you learned, and any mistakes..."
                  className="min-h-24"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Navigation */}
        <div className="border-t p-6 bg-gray-50 flex gap-3 justify-between flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreviousStreet}
              disabled={street === 0}
              className="min-w-24"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNextStreet}
              disabled={street === 3}
              className="min-w-24"
            >
              Next
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {street === 3 && (
              <Button
                onClick={handleSave}
                disabled={createHand.isPending || !tableSize || !effectiveStack || !heroPosition || !heroHand}
                className="bg-orange-500 hover:bg-orange-600 text-white min-w-32"
              >
                {createHand.isPending ? "Saving..." : "Save Hand"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
