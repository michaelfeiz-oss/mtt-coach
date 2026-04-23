import React, { useEffect, useState } from "react";
import { ACTIONS, ACTION_LABELS } from "../../../../shared/strategy";
import type { Action } from "../../../../shared/strategy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  embedded?: boolean;
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
  embedded = false,
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

  const content = (
    <>
      <div className={cn("space-y-2.5 text-center", compact && "space-y-2")}>
        {showContextBadges && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {stackDepth !== undefined && (
              <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-primary-foreground">
                {stackDepth}bb
              </Badge>
            )}
            {heroPosition && (
              <Badge
                variant="outline"
                className="rounded-full border-border bg-accent/80 px-2.5 py-0.5 text-secondary-foreground"
              >
                {heroPosition}
                {villainPosition ? ` vs ${villainPosition}` : ""}
              </Badge>
            )}
          </div>
        )}

        <div
          className={cn(
            "rounded-[1rem] border border-border bg-accent/75 px-3.5 py-3",
            compact && "px-3 py-2.5"
          )}
        >
          <HandCards handCode={handCode} size={compact ? "md" : "lg"} showLabel />
          {showSpotText && (
            <p
              className={cn(
                "mt-4 text-sm font-semibold text-foreground",
                compact && "mt-3"
              )}
            >
              {spotLabel}
            </p>
          )}
          {showSpotText && spotContext && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {spotContext}
            </p>
          )}
        </div>
      </div>

      <div className={cn("grid gap-1.5", answerGridClass)}>
        {answerChoices.map((action, index) => {
          let extraClass = "";

          if (isRevealed) {
            if (action === correctAction) {
              extraClass =
                "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.24)]";
            } else if (action === selectedAction && action !== correctAction) {
              extraClass =
                "border-red-300 bg-red-50 text-red-700 shadow-[0_0_0_1px_rgba(239,68,68,0.22)]";
            } else {
              extraClass = "opacity-45";
            }
          }

          return (
            <Button
              key={action}
              variant="outline"
              className={cn(
                "h-10 rounded-xl border-border/80 bg-input/78 px-3 text-xs font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:bg-input active:translate-y-0 sm:h-10 sm:px-4 sm:text-sm",
                compact && "h-9 sm:h-9",
                "justify-between",
                extraClass
              )}
              onClick={() => handleAnswer(action)}
              disabled={isRevealed}
            >
              <span className="min-w-0 truncate">{ACTION_LABELS[action]}</span>
              <span className="ml-2 shrink-0 rounded-lg border border-border/70 bg-accent/55 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:px-2 sm:text-[11px]">
                {index + 1}
              </span>
            </Button>
          );
        })}
      </div>

      {isRevealed && showInlineResult && (
        <div className="space-y-4 rounded-2xl border border-border bg-accent/70 p-4">
          <div className="text-center">
            <p
              className={cn(
                "text-base font-bold",
                selectedAction === correctAction ? "text-emerald-700" : "text-red-700"
              )}
            >
              {selectedAction === correctAction ? "Correct" : "Incorrect"}
            </p>
            <p className="mt-1 text-sm text-secondary-foreground">
              Correct action:{" "}
              <span className="font-semibold text-foreground">
                {ACTION_LABELS[correctAction]}
              </span>
            </p>
            {explanation && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {explanation}
              </p>
            )}
          </div>
          <Button
            className="h-11 w-full rounded-xl text-base font-semibold"
            onClick={handleNext}
          >
            Next Hand
            <span className="ml-2 rounded-lg bg-primary/15 px-2 py-0.5 text-xs">
              Enter
            </span>
          </Button>
        </div>
      )}

      {!isRevealed && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="h-7 rounded-lg px-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-secondary-foreground"
            onClick={onSkip}
          >
            Skip hand
          </Button>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div
        data-chart-id={chartId}
        className={cn(
          "space-y-3 text-foreground",
          compact && "space-y-2.5",
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      data-chart-id={chartId}
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 text-foreground shadow-[0_10px_28px_rgba(15,23,42,0.14)] sm:p-7",
        compact && "space-y-3 p-4 sm:p-5",
        className
      )}
    >
      <div className={cn("space-y-5", compact && "space-y-3")}>{content}</div>
    </div>
  );
}

export default TrainerCard;
