import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HandPicker } from "./HandPicker";
import { ActionBuilder } from "./ActionBuilder";
import { BoardPicker } from "./BoardPicker";
import { trpc } from "@/lib/trpc";

const POSITIONS = ["UTG", "UTG+1", "HJ", "CO", "BTN", "SB", "BB"];
const TABLE_SIZES = ["6-max", "8-max", "9-max", "10-max"];

interface LogHandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogHandModal({ isOpen, onClose }: LogHandModalProps) {
  const [street, setStreet] = useState(0);
  const [tableSize, setTableSize] = useState("");
  const [effectiveStack, setEffectiveStack] = useState("");
  const [heroPosition, setHeroPosition] = useState("");
  const [heroHand, setHeroHand] = useState("");
  const [preflopActions, setPreflopActions] = useState("");
  const [preflopNotes, setPreflopNotes] = useState("");
  const [villainPosition, setVillainPosition] = useState("");
  const [villainRange, setVillainRange] = useState("");
  const [flopBoard, setFlopBoard] = useState("");
  const [flopActions, setFlopActions] = useState("");
  const [flopNotes, setFlopNotes] = useState("");
  const [turnBoard, setTurnBoard] = useState("");
  const [turnActions, setTurnActions] = useState("");
  const [turnNotes, setTurnNotes] = useState("");
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

  const streets = [
    { name: "Preflop", step: 0 },
    { name: "Flop", step: 1 },
    { name: "Turn", step: 2 },
    { name: "River", step: 3 },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-white w-full max-h-[90vh] rounded-t-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">Log Hand</h2>
            <p className="text-sm text-gray-500">
              {streets[street].name} - {street + 1} of {streets.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {street === 0 && (
            <>
              {/* Preflop Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Table Size *</Label>
                    <Select value={tableSize} onValueChange={setTableSize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                    <Label>Effective Stack (BB) *</Label>
                    <Input
                      type="number"
                      value={effectiveStack}
                      onChange={(e) => setEffectiveStack(e.target.value)}
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Position *</Label>
                    <Select value={heroPosition} onValueChange={setHeroPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                    <Label>Your Hand *</Label>
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
                  <Label>Preflop Notes</Label>
                  <Textarea
                    value={preflopNotes}
                    onChange={(e) => setPreflopNotes(e.target.value)}
                    placeholder="Add notes about the preflop action..."
                    className="min-h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <Label>Villain Position</Label>
                    <Select value={villainPosition} onValueChange={setVillainPosition}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
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
                    <Label>Villain Range</Label>
                    <Input
                      value={villainRange}
                      onChange={(e) => setVillainRange(e.target.value)}
                      placeholder="e.g., TT+, AK, AQ"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {street === 1 && (
            <>
              {/* Flop Section */}
              <div className="space-y-4">
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
                  <Label>Flop Notes</Label>
                  <Textarea
                    value={flopNotes}
                    onChange={(e) => setFlopNotes(e.target.value)}
                    placeholder="Add notes about the flop action..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </>
          )}

          {street === 2 && (
            <>
              {/* Turn Section */}
              <div className="space-y-4">
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
                  <Label>Turn Notes</Label>
                  <Textarea
                    value={turnNotes}
                    onChange={(e) => setTurnNotes(e.target.value)}
                    placeholder="Add notes about the turn action..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </>
          )}

          {street === 3 && (
            <>
              {/* River Section */}
              <div className="space-y-4">
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
                  <Label>River Notes</Label>
                  <Textarea
                    value={riverNotes}
                    onChange={(e) => setRiverNotes(e.target.value)}
                    placeholder="Add notes about the river action..."
                    className="min-h-20"
                  />
                </div>

                <div className="pt-2 border-t">
                  <Label>Overall Hand Analysis</Label>
                  <Textarea
                    value={overallNotes}
                    onChange={(e) => setOverallNotes(e.target.value)}
                    placeholder="Summarize the hand, what you learned, and any mistakes..."
                    className="min-h-24"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-white flex gap-2 justify-between sticky bottom-0">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStreet(Math.max(0, street - 1))}
              disabled={street === 0}
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setStreet(Math.min(3, street + 1))}
              disabled={street === 3}
            >
              Next →
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {street === 3 ? (
              <Button
                onClick={handleSave}
                disabled={createHand.isPending || !tableSize || !effectiveStack || !heroPosition || !heroHand}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {createHand.isPending ? "Saving..." : "Save Hand"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
