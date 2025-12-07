import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { SpotTypeSelector, type SpotType } from "./SpotTypeSelector";
import { HeroInfoForm } from "./HeroInfoForm";
import { BoardFormV2 } from "./BoardFormV2";
import { PlayerActionsForm, type StreetAction } from "./PlayerActionsForm";
import { VillainProfileForm, type VillainType, type VillainRangeType } from "./VillainProfileForm";
import { OutcomeForm, type HandResult } from "./OutcomeForm";
import { NotesForm } from "./NotesForm";
import { AccordionSection } from "./AccordionSection";
import { ContextForm, type GameType, type TournamentPhase } from "./ContextForm";
import {
  mapUiSpotTypeToDb,
  extractSpotPosition,
  extractSpotSubtype,
  buildBoardRunout,
  mapEvLossToSeverity,
  deriveHeroDecision,
  buildStreetDataJson,
  generateActionSummary,
  generateBoardSummary,
  generateVillainSummary,
  generateOutcomeSummary,
} from "./utils";

interface LogHandModalV2_1Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LogHandModalV2_1({ isOpen, onClose }: LogHandModalV2_1Props) {
  // Required fields (Essential section)
  const [spotType, setSpotType] = useState<SpotType | "">("");
  const [heroPosition, setHeroPosition] = useState("");
  const [heroHand, setHeroHand] = useState("");
  const [effectiveStackBb, setEffectiveStackBb] = useState("");

  // Board & Actions accordion
  const [flopBoard, setFlopBoard] = useState("");
  const [turnCard, setTurnCard] = useState("");
  const [riverCard, setRiverCard] = useState("");
  const [streetAction, setStreetAction] = useState<StreetAction | null>(null);

  // Villain & Context accordion
  const [villainType, setVillainType] = useState<VillainType | "">();
  const [villainRangeType, setVillainRangeType] = useState<VillainRangeType | "">();
  const [gameType, setGameType] = useState<GameType | "">();
  const [tournamentPhase, setTournamentPhase] = useState<TournamentPhase | "">();
  const [isPko, setIsPko] = useState(false);

  // Outcome & Notes accordion
  const [result, setResult] = useState<HandResult | "">();
  const [evLossEstimateBb, setEvLossEstimateBb] = useState(0);
  const [notes, setNotes] = useState("");

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
    setSpotType("");
    setHeroPosition("");
    setHeroHand("");
    setEffectiveStackBb("");
    setFlopBoard("");
    setTurnCard("");
    setRiverCard("");
    setStreetAction(null);
    setVillainType("");
    setVillainRangeType("");
    setGameType("");
    setTournamentPhase("");
    setIsPko(false);
    setResult("");
    setEvLossEstimateBb(0);
    setNotes("");
  };

  const isValid = () => {
    return (
      spotType &&
      heroPosition &&
      heroHand &&
      effectiveStackBb &&
      parseInt(effectiveStackBb) > 0
    );
  };

  // Generate preview texts for collapsed accordions
  const boardActionPreview = generateBoardSummary(
    flopBoard,
    turnCard,
    riverCard,
    streetAction
  );
  const villainContextPreview = generateVillainSummary(
    villainType,
    villainRangeType,
    gameType,
    tournamentPhase,
    isPko
  );
  const outcomeNotesPreview = generateOutcomeSummary(result, evLossEstimateBb, notes);

  const handleSave = () => {
    if (!isValid()) {
      alert("Please fill in all required fields");
      return;
    }

    const boardRunout = buildBoardRunout(flopBoard, turnCard, riverCard);
    const dbSpotType = mapUiSpotTypeToDb(spotType as SpotType);
    const spotPosition = extractSpotPosition(spotType as SpotType);
    const spotSubtype = extractSpotSubtype(spotType as SpotType);

    const streetDataJson = buildStreetDataJson({
      spotType: spotType as SpotType,
      spotPosition,
      spotSubtype,
      heroPosition,
      heroHand,
      effectiveStackBb: parseInt(effectiveStackBb),
      flopBoard,
      turnCard,
      riverCard,
      streetAction,
      villainType,
      villainRangeType,
      result,
      evLossBb: evLossEstimateBb,
      notes,
    });

    // Add context to streetDataJson.meta
    if (streetDataJson.meta) {
      streetDataJson.meta.context = {
        gameType: gameType || undefined,
        tournamentPhase: tournamentPhase || undefined,
        isPko,
      };
    }

    const mistakeSeverity = evLossEstimateBb > 0 ? mapEvLossToSeverity(evLossEstimateBb) : undefined;
    const heroDecision = deriveHeroDecision(streetAction);

    createHand.mutate({
      heroPosition,
      heroHand,
      boardRunout,
      effectiveStackBb: parseInt(effectiveStackBb),
      spotType: dbSpotType,
      streetDataJson: JSON.stringify(streetDataJson),
      lesson: notes || undefined,
      mistakeSeverity,
      heroDecisionPreflop: streetAction?.street === "PREFLOP" ? heroDecision : undefined,
      heroDecisionFlop: streetAction?.street === "FLOP" ? heroDecision : undefined,
      heroDecisionTurn: streetAction?.street === "TURN" ? heroDecision : undefined,
      heroDecisionRiver: streetAction?.street === "RIVER" ? heroDecision : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Log Hand</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* ESSENTIAL SECTION - Always Open */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Essential Info</h3>

            {/* Spot Type */}
            <SpotTypeSelector value={spotType} onChange={setSpotType} />

            {/* Hero Info */}
            <HeroInfoForm
              heroPosition={heroPosition}
              onPositionChange={setHeroPosition}
              heroHand={heroHand}
              onHandChange={setHeroHand}
              effectiveStackBb={effectiveStackBb}
              onStackChange={setEffectiveStackBb}
            />
          </div>

          {/* ACCORDION 1: Board & Actions */}
          <AccordionSection
            title="Board & Actions"
            previewText={boardActionPreview}
            defaultOpen={false}
          >
            <BoardFormV2
              flopBoard={flopBoard}
              onFlopChange={setFlopBoard}
              turnCard={turnCard}
              onTurnChange={setTurnCard}
              riverCard={riverCard}
              onRiverChange={setRiverCard}
            />

            <PlayerActionsForm
              streetAction={streetAction}
              onChange={setStreetAction}
            />
          </AccordionSection>

          {/* ACCORDION 2: Villain & Context */}
          <AccordionSection
            title="Villain & Context"
            previewText={villainContextPreview}
            defaultOpen={false}
          >
            <VillainProfileForm
              villainType={villainType || ""}
              onVillainTypeChange={setVillainType}
              villainRangeType={villainRangeType || ""}
              onVillainRangeTypeChange={setVillainRangeType}
            />

            <ContextForm
              gameType={gameType || ""}
              onGameTypeChange={setGameType}
              tournamentPhase={tournamentPhase || ""}
              onTournamentPhaseChange={setTournamentPhase}
              isPko={isPko}
              onPkoChange={setIsPko}
            />
          </AccordionSection>

          {/* ACCORDION 3: Outcome & Notes */}
          <AccordionSection
            title="Outcome & Notes"
            previewText={outcomeNotesPreview}
            defaultOpen={false}
          >
            <OutcomeForm
              result={result || ""}
              onResultChange={setResult}
              evLossEstimateBb={evLossEstimateBb}
              onEvLossChange={setEvLossEstimateBb}
            />

            <NotesForm notes={notes} onNotesChange={setNotes} />
          </AccordionSection>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex-shrink-0 flex justify-between gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid() || createHand.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {createHand.isPending ? "Saving..." : "Save Hand"}
          </Button>
        </div>
      </div>
    </div>
  );
}
