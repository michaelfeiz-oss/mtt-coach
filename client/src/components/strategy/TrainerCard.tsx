/**
 * client/src/components/strategy/TrainerCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Flashcard-style trainer component for range drilling.
 *
 * CODEX TASK: Implement the component body.
 *
 * Props:
 *   chartId       – ID of the chart being trained
 *   handCode      – The hand being quizzed (e.g. "AKs")
 *   spotLabel     – Human-readable spot label (e.g. "BTN RFI @ 20bb")
 *   onAnswer      – Callback with (selectedAction, isCorrect)
 *   onSkip        – Skip this hand
 *   isRevealed    – Whether the answer has been shown
 *   correctAction – The correct action (shown after reveal)
 *   className     – Optional CSS class
 *
 * UI flow:
 *   1. Show hand code prominently (e.g. "A♠K♠")
 *   2. Show spot context below (e.g. "BTN RFI @ 20bb")
 *   3. Show action buttons: FOLD, RAISE, CALL, THREE_BET, JAM, LIMP, CHECK
 *   4. On click: call onAnswer(action, isCorrect), reveal correct answer
 *   5. If correct: green flash; if wrong: red flash + show correct action
 *   6. "Next hand →" button appears after reveal
 *
 * Visual design:
 *   - Dark card background
 *   - Hand code in large font with suit colours (red for hearts/diamonds)
 *   - Action buttons in a 2-column grid
 *   - Correct action highlighted in green after reveal
 *   - Wrong selection highlighted in red after reveal
 */

import React, { useState } from "react";
import { ACTIONS, ACTION_LABELS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatHandWithSuits } from "./utils";

interface TrainerCardProps {
  chartId: number;
  handCode: string;
  spotLabel: string;
  correctAction: Action;
  choices?: Action[];
  onAnswer: (selectedAction: Action, isCorrect: boolean) => void;
  onSkip: () => void;
  className?: string;
}

export function TrainerCard({
  chartId,
  handCode,
  spotLabel,
  correctAction,
  choices = [...ACTIONS],
  onAnswer,
  onSkip,
  className = "",
}: TrainerCardProps) {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const isRevealed = selectedAction !== null;
  const answerChoices = choices.length > 0 ? choices : [...ACTIONS];

  function handleAnswer(action: Action) {
    if (isRevealed) return;
    const isCorrect = action === correctAction;
    setSelectedAction(action);
    onAnswer(action, isCorrect);
  }

  function handleNext() {
    setSelectedAction(null);
    onSkip();
  }

  return (
    <Card className={`bg-zinc-900 border-zinc-700 ${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Hand display */}
        <div className="text-center space-y-1">
          <div className="text-5xl font-bold tracking-tight text-white">
            {formatHandWithSuits(handCode)}
          </div>
          <p className="text-sm text-zinc-400">{spotLabel}</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {answerChoices.map(action => {
            let variant: "default" | "outline" | "destructive" = "outline";
            let extraClass = "";

            if (isRevealed) {
              if (action === correctAction) {
                extraClass = "border-green-500 bg-green-500/20 text-green-400";
              } else if (
                action === selectedAction &&
                action !== correctAction
              ) {
                extraClass = "border-red-500 bg-red-500/20 text-red-400";
              } else {
                extraClass = "opacity-40";
              }
            }

            return (
              <Button
                key={action}
                variant="outline"
                className={`h-10 text-sm font-semibold border-zinc-600 text-zinc-300 hover:bg-zinc-700 ${extraClass}`}
                onClick={() => handleAnswer(action)}
                disabled={isRevealed}
              >
                {ACTION_LABELS[action]}
              </Button>
            );
          })}
        </div>

        {/* Reveal / next */}
        {isRevealed && (
          <div className="space-y-3">
            <p
              className={`text-center text-sm font-medium ${selectedAction === correctAction ? "text-green-400" : "text-red-400"}`}
            >
              {selectedAction === correctAction
                ? "✓ Correct!"
                : `✗ Correct answer: ${ACTION_LABELS[correctAction]}`}
            </p>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleNext}
            >
              Next hand →
            </Button>
          </div>
        )}

        {/* Skip */}
        {!isRevealed && (
          <Button
            variant="ghost"
            className="w-full text-zinc-500 hover:text-zinc-300 text-xs"
            onClick={onSkip}
          >
            Skip
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default TrainerCard;
