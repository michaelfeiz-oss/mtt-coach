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
import { Badge } from "@/components/ui/badge";
import { formatHandWithSuits } from "./utils";

interface TrainerCardProps {
  chartId: number;
  handCode: string;
  spotLabel: string;
  spotContext?: string;
  stackDepth?: number;
  heroPosition?: string;
  villainPosition?: string | null;
  correctAction: Action;
  explanation?: string | null;
  isPersisted?: boolean;
  choices?: Action[];
  onAnswer: (selectedAction: Action, isCorrect: boolean) => void;
  onSkip: () => void;
  className?: string;
}

export function TrainerCard({
  chartId,
  handCode,
  spotLabel,
  spotContext,
  stackDepth,
  heroPosition,
  villainPosition,
  correctAction,
  explanation,
  isPersisted = false,
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
    <Card
      data-chart-id={chartId}
      className={`bg-zinc-900 border-zinc-700 ${className}`}
    >
      <CardContent className="p-5 space-y-5 sm:p-6">
        {/* Hand display */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {stackDepth !== undefined && (
              <Badge className="bg-orange-500 text-white">{stackDepth}bb</Badge>
            )}
            {heroPosition && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-200">
                {heroPosition}
                {villainPosition ? ` vs ${villainPosition}` : ""}
              </Badge>
            )}
          </div>
          <div className="text-5xl font-bold tracking-tight text-white">
            {formatHandWithSuits(handCode)}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{spotLabel}</p>
            {spotContext && (
              <p className="mt-1 text-xs text-zinc-400">{spotContext}</p>
            )}
          </div>
          {!isPersisted && (
            <p className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400">
              Session stats are local until you log in.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {answerChoices.map(action => {
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
                className={`h-12 text-sm font-semibold border-zinc-600 text-zinc-300 hover:bg-zinc-700 ${extraClass}`}
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
          <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/80 p-3">
            <div className="text-center">
              <p
                className={`text-base font-bold ${selectedAction === correctAction ? "text-green-400" : "text-red-400"}`}
              >
                {selectedAction === correctAction ? "Correct" : "Incorrect"}
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                Correct action:{" "}
                <span className="font-semibold text-white">
                  {ACTION_LABELS[correctAction]}
                </span>
              </p>
              {explanation && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {explanation}
                </p>
              )}
            </div>
            <Button
              className="h-12 w-full bg-orange-500 text-base font-semibold text-white hover:bg-orange-600"
              onClick={handleNext}
            >
              Next Hand
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
