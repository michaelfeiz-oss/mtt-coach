import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCircle2, Flame, Target, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActionLegend } from "@/components/strategy/ActionLegend";
import { RangeMatrix } from "@/components/strategy/RangeMatrix";
import { cn } from "@/lib/utils";
import { PUSH_FOLD_STACK_BUCKETS } from "@shared/preflopTaxonomy";
import {
  buildPushFoldActions,
  buildPushFoldSpotContext,
  getPushFoldReference,
  getPushFoldTrainerPool,
  pushFoldDecisionLabel,
  pushFoldSourceNote,
  type PushFoldModeKind,
} from "@shared/pushFold";
import { getSpotNote } from "@shared/spotNotes";
import type { Action, HandAction, Position } from "@shared/strategy";

const OPEN_SHOVE_POSITIONS: Position[] = ["UTG", "CO", "BTN", "SB"];
const CALL_OFF_POSITIONS: Position[] = ["BB"];

interface PushFoldQuestion {
  handCode: string;
  correctAction: Action;
}

interface RevealState {
  selectedAction: Action;
  correctAction: Action;
  handCode: string;
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function calcAccuracy(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function pushFoldActions(reference: ReturnType<typeof getPushFoldReference>) {
  return reference ? buildPushFoldActions(reference) : [];
}

function nextQuestionFromReference(
  reference: NonNullable<ReturnType<typeof getPushFoldReference>>
): PushFoldQuestion {
  const pool = getPushFoldTrainerPool(reference);
  const selected = randomItem(pool);
  return {
    handCode: selected.handCode,
    correctAction: selected.primaryAction,
  };
}

export default function PushFoldMode() {
  const [mode, setMode] = useState<PushFoldModeKind>("OPEN_SHOVE");
  const [stackDepth, setStackDepth] = useState<(typeof PUSH_FOLD_STACK_BUCKETS)[number]>(8);
  const [heroPosition, setHeroPosition] = useState<Position>("BTN");
  const [questionSeed, setQuestionSeed] = useState(0);
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 });

  const availablePositions =
    mode === "OPEN_SHOVE" ? OPEN_SHOVE_POSITIONS : CALL_OFF_POSITIONS;

  useEffect(() => {
    if (!availablePositions.includes(heroPosition)) {
      setHeroPosition(availablePositions[0]);
    }
  }, [availablePositions, heroPosition]);

  const reference = useMemo(
    () => getPushFoldReference(stackDepth, mode, heroPosition),
    [heroPosition, mode, stackDepth]
  );
  const actionMap = useMemo(() => pushFoldActions(reference), [reference]);
  const decisionLabel = pushFoldDecisionLabel(mode);
  const currentQuestion = useMemo(
    () => (reference ? nextQuestionFromReference(reference) : null),
    [questionSeed, reference]
  );
  const visibleActions = useMemo(
    () => (mode === "OPEN_SHOVE" ? (["JAM", "FOLD"] as Action[]) : (["CALL", "FOLD"] as Action[])),
    [mode]
  );
  const spotNote = reference
    ? getSpotNote(buildPushFoldSpotContext(reference, stackDepth))
    : null;
  const accuracy = calcAccuracy(stats.correct, stats.total);

  function resetQuestion() {
    setReveal(null);
    setQuestionSeed(seed => seed + 1);
  }

  function handleModeChange(nextMode: PushFoldModeKind) {
    setMode(nextMode);
    setReveal(null);
    setQuestionSeed(seed => seed + 1);
  }

  function handleAnswer(selectedAction: Action) {
    if (!currentQuestion) return;

    const isCorrect = selectedAction === currentQuestion.correctAction;
    setReveal({
      selectedAction,
      correctAction: currentQuestion.correctAction,
      handCode: currentQuestion.handCode,
    });
    setStats(previous => ({
      total: previous.total + 1,
      correct: previous.correct + (isCorrect ? 1 : 0),
      streak: isCorrect ? previous.streak + 1 : 0,
    }));
  }

  return (
    <div className="app-shell min-h-[calc(100dvh-4rem)] overflow-x-hidden pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-foreground">
      <main className="mx-auto w-full max-w-4xl space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
        <header className="app-surface-elevated p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="app-eyebrow">Push / Fold Mode</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">
                Short-Stack Study
              </h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Short-stack push/fold thresholds for tournament play. Ranges are population-derived from standard principles — practical and consistent, not solver-exact.
          </p>
        </header>

        <section className="app-surface p-3 sm:p-4">
          <div className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Mode
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {([
                      ["OPEN_SHOVE", "Open Shove"],
                      ["BB_CALL_VS_BTN_SHOVE", "BB Call vs BTN"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleModeChange(value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                          mode === value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background/85 text-secondary-foreground hover:bg-accent/75"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Stack
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PUSH_FOLD_STACK_BUCKETS.map(stack => (
                      <button
                        key={stack}
                        type="button"
                        onClick={() => {
                          setStackDepth(stack);
                          resetQuestion();
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          stackDepth === stack
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background/85 text-secondary-foreground hover:bg-accent/75"
                        )}
                      >
                        {stack}bb
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Position
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {availablePositions.map(position => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => {
                          setHeroPosition(position);
                          resetQuestion();
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          heroPosition === position
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background/85 text-secondary-foreground hover:bg-accent/75"
                        )}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1rem] border border-border bg-background/78 p-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    BBA
                  </Badge>
                  <Badge variant="outline" className="rounded-full">
                    {reference?.stackSource ?? "Reference pending"}bb source
                  </Badge>
                  <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                    Simplified Population
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">
                  {reference
                    ? `${decisionLabel} from ${reference.heroPosition}${
                        reference.villainPosition
                          ? ` vs ${reference.villainPosition} shove`
                          : ""
                      }`
                    : "No supported push/fold reference"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {reference
                    ? `${reference.rangeText}. ${reference.tacticalNote}`
                    : "The current short-stack source only covers specific open-shove and BB call-off spots."}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {pushFoldSourceNote(stackDepth)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {reference && (
          <>
            <section className="app-surface p-3 sm:p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Push / Fold Chart
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {reference.rangeText}
                  </p>
                </div>
                <ActionLegend actions={visibleActions} />
              </div>

              <div className="rounded-[1rem] border border-border/80 bg-background/88 p-1 sm:p-1.5">
                <div className="md:hidden">
                  <RangeMatrix actions={actionMap} compact size="md" />
                </div>
                <div className="hidden md:block">
                  <RangeMatrix actions={actionMap} size="lg" />
                </div>
              </div>
            </section>

            {spotNote && (
              <section className="app-surface p-3 sm:p-4">
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Tactical Notes
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Short-stack reminders for this exact push/fold node.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    ["Core Idea", spotNote.coreIdea],
                    ["Default", spotNote.defaultLine],
                    ["Exploit Lever", spotNote.exploitLever],
                    ["Common Punt", spotNote.commonPunt],
                    ["Drill Cue", spotNote.drillCue],
                  ].map(([title, body]) => (
                    <div
                      key={title}
                      className="rounded-xl border border-border bg-background/78 px-3 py-2.5"
                    >
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        {title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                        {body}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="app-surface p-3 sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Push / Fold Drill
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Quick reps for the current short-stack reference.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-secondary-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {stats.correct}/{stats.total}
                  </span>
                  <span>{accuracy}% accuracy</span>
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-600" />
                    {stats.streak} streak
                  </span>
                </div>
              </div>

              {currentQuestion && (
                <div className="mt-4 rounded-[1rem] border border-border bg-background/78 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground">
                        Current hand
                      </p>
                      <p className="mt-1 font-mono text-3xl font-black tracking-tight text-foreground">
                        {currentQuestion.handCode}
                      </p>
                    </div>
                    <Badge className="rounded-full bg-primary text-primary-foreground">
                      {decisionLabel} / Fold
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      className="h-11 rounded-xl text-sm font-semibold"
                      onClick={() =>
                        handleAnswer(mode === "OPEN_SHOVE" ? "JAM" : "CALL")
                      }
                      disabled={Boolean(reveal)}
                    >
                      {decisionLabel}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 rounded-xl text-sm font-semibold"
                      onClick={() => handleAnswer("FOLD")}
                      disabled={Boolean(reveal)}
                    >
                      Fold
                    </Button>
                  </div>

                  {reveal && (
                    <div className="mt-4 rounded-xl border border-border bg-card p-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            reveal.selectedAction === reveal.correctAction
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {reveal.selectedAction === reveal.correctAction ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              reveal.selectedAction === reveal.correctAction
                                ? "text-emerald-700"
                                : "text-red-700"
                            )}
                          >
                            {reveal.selectedAction === reveal.correctAction
                              ? "Correct"
                              : "Incorrect"}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {reveal.handCode} is{" "}
                            <span className="font-semibold text-foreground">
                              {reveal.correctAction === "FOLD"
                                ? "outside"
                                : "inside"}
                            </span>{" "}
                            the current {reference.stackSource}bb {decisionLabel.toLowerCase()} reference.
                          </p>
                        </div>
                      </div>
                      <Button
                        className="mt-4 h-10 rounded-xl text-sm font-semibold"
                        onClick={resetQuestion}
                      >
                        Next Hand
                        <Target className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
