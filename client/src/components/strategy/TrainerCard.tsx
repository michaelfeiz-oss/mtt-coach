import React, { useEffect, useState } from "react";
import { ACTIONS, ACTION_LABELS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HandCards } from "@/components/cards/HandCards";
import { cn } from "@/lib/utils";

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
  showInlineResult?: boolean;
  compact?: boolean;
  showContextBadges?: boolean;
  showSpotText?: boolean;
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
  choices = [...ACTIONS],
  showInlineResult = true,
  compact = false,
  showContextBadges = true,
  showSpotText = true,
  onAnswer,
  onSkip,
  className = "",
}: TrainerCardProps) {
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const isRevealed = selectedAction !== null;
  const answerChoices = choices.length > 0 ? choices : [...ACTIONS];
  const answerGridClass =
    answerChoices.length === 1 ? "grid-cols-1" : "grid-cols-2";

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
    setSelectedAction(null);
  }, [chartId, handCode]);

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
      className={cn(
        "overflow-hidden rounded-[1.75rem] border-zinc-800/90 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_18rem),linear-gradient(180deg,#18181b_0%,#09090b_100%)] text-white shadow-2xl shadow-zinc-950/25",
        className
      )}
    >
      <CardContent
        className={cn(
          "space-y-5 p-5 sm:p-7",
          compact && "space-y-3 p-4 sm:p-5"
        )}
      >
        <div className={cn("space-y-4 text-center", compact && "space-y-3")}>
          {showContextBadges && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {stackDepth !== undefined && (
                <Badge className="rounded-full bg-orange-500 px-2.5 py-0.5 text-white shadow-sm shadow-orange-950/25">
                  {stackDepth}bb
                </Badge>
              )}
              {heroPosition && (
                <Badge
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-2.5 py-0.5 text-zinc-200"
                >
                  {heroPosition}
                  {villainPosition ? ` vs ${villainPosition}` : ""}
                </Badge>
              )}
            </div>
          )}

          <div
            className={cn(
              "rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-5 shadow-inner",
              compact && "rounded-[1.25rem] px-3 py-3"
            )}
          >
            <HandCards
              handCode={handCode}
              size={compact ? "md" : "lg"}
              showLabel
            />
            {showSpotText && (
              <p
                className={cn(
                  "mt-4 text-sm font-semibold text-zinc-100",
                  compact && "mt-3"
                )}
              >
                {spotLabel}
              </p>
            )}
            {showSpotText && spotContext && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {spotContext}
              </p>
            )}
          </div>
        </div>

        <div className={cn("grid gap-2", answerGridClass)}>
          {answerChoices.map((action, index) => {
            let extraClass = "";

            if (isRevealed) {
              if (action === correctAction) {
                extraClass =
                  "border-green-400/80 bg-green-500/20 text-green-200 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]";
              } else if (
                action === selectedAction &&
                action !== correctAction
              ) {
                extraClass =
                  "border-red-400/80 bg-red-500/20 text-red-200 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]";
              } else {
                extraClass = "opacity-45";
              }
            }

            return (
              <Button
                key={action}
                variant="outline"
                className={cn(
                  "h-11 rounded-2xl border-zinc-700/80 bg-zinc-900/75 px-3 text-xs font-bold text-zinc-100 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-zinc-800 active:translate-y-0 sm:h-12 sm:px-4 sm:text-sm",
                  compact && "h-10 rounded-xl sm:h-11",
                  "justify-between",
                  extraClass
                )}
                onClick={() => handleAnswer(action)}
                disabled={isRevealed}
              >
                <span className="min-w-0 truncate">
                  {ACTION_LABELS[action]}
                </span>
                <span className="ml-2 shrink-0 rounded-lg border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 sm:px-2 sm:text-[11px]">
                  {index + 1}
                </span>
              </Button>
            );
          })}
        </div>

        {isRevealed && showInlineResult && (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4">
            <div className="text-center">
              <p
                className={cn(
                  "text-base font-bold",
                  selectedAction === correctAction
                    ? "text-green-300"
                    : "text-red-300"
                )}
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
              className="h-12 w-full rounded-2xl bg-orange-500 text-base font-bold text-white shadow-lg shadow-orange-950/25 hover:bg-orange-600"
              onClick={handleNext}
            >
              Next Hand
              <span className="ml-2 rounded-lg bg-white/15 px-2 py-0.5 text-xs">
                Enter
              </span>
            </Button>
          </div>
        )}

        {!isRevealed && (
          <Button
            variant="ghost"
            className="w-full rounded-2xl text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
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
