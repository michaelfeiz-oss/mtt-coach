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

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (isTyping) return;

      if (!isRevealed) {
        const index = Number(event.key) - 1;
        const action = Number.isInteger(index) ? answerChoices[index] : null;
        if (!action) return;

        event.preventDefault();
        handleAnswer(action);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerChoices, isRevealed]);

  return (
    <Card
      data-chart-id={chartId}
      className={`overflow-hidden border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20 ${className}`}
    >
      <CardContent className="space-y-6 p-5 sm:p-7">
        {/* Hand display */}
        <div className="space-y-4 text-center">
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
          <div className="mx-auto max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-400">
            {isPersisted
              ? "Your answers are saved to trainer history."
              : "Practice is available now; saved history requires login."}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {answerChoices.map((action, index) => {
            let extraClass = "";

            if (isRevealed) {
              if (action === correctAction) {
                extraClass =
                  "border-green-500 bg-green-500/20 text-green-300 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]";
              } else if (
                action === selectedAction &&
                action !== correctAction
              ) {
                extraClass =
                  "border-red-500 bg-red-500/20 text-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]";
              } else {
                extraClass = "opacity-40";
              }
            }

            return (
              <Button
                key={action}
                variant="outline"
                className={`h-14 justify-between border-zinc-700 bg-zinc-900/70 px-4 text-sm font-semibold text-zinc-200 hover:border-orange-400 hover:bg-zinc-800 ${extraClass}`}
                onClick={() => handleAnswer(action)}
                disabled={isRevealed}
              >
                <span>{ACTION_LABELS[action]}</span>
                <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                  {index + 1}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Reveal / next */}
        {isRevealed && (
          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4">
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
              <span className="ml-2 rounded-md bg-white/15 px-2 py-0.5 text-xs">
                Enter
              </span>
            </Button>
          </div>
        )}

        {/* Skip */}
        {!isRevealed && (
          <Button
            variant="ghost"
            className="w-full text-xs text-zinc-500 hover:text-zinc-300"
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
