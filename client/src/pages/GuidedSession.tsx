import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function GuidedSession() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");

  const params = new URLSearchParams(search);
  const fromDate = params.get("date") ? new Date(params.get("date")!) : new Date();
  const { data: todayDrills } = trpc.studyPlan.getCurriculumToday.useQuery();

  const drills = todayDrills?.drills ?? [];
  const currentDrill = drills[currentDrillIndex];
  const isLastDrill = currentDrillIndex === drills.length - 1;
  const allCompleted = drills.length > 0 && completedDrills.length === drills.length;
  const progressPct = drills.length
    ? Math.round(((currentDrillIndex + 1) / drills.length) * 100)
    : 0;

  const dayLabel = useMemo(
    () =>
      fromDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [fromDate]
  );

  function handleCompleteDrill() {
    if (!currentDrill) return;
    if (!completedDrills.includes(currentDrill.drillId)) {
      setCompletedDrills(previous => [...previous, currentDrill.drillId]);
    }
    if (!isLastDrill) {
      setCurrentDrillIndex(previous => previous + 1);
    }
  }

  function handleFinishSession() {
    const nextParams = new URLSearchParams({
      fromPlan: "true",
      type: todayDrills?.studyType ?? "RANGE_TRAINING",
      date: fromDate.toISOString(),
      guided: "true",
      completedDrills: completedDrills.join(","),
      notes: sessionNotes.trim(),
    });
    setLocation(`/log-session?${nextParams.toString()}`);
  }

  if (!todayDrills || drills.length === 0 || !currentDrill) {
    return (
      <div className="app-shell min-h-screen text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
          <div className="container py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </header>
        <main className="container max-w-3xl py-6">
          <Card className="app-surface">
            <CardContent className="py-10 text-center text-muted-foreground">
              No guided drills are available right now.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="container max-w-3xl py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl space-y-4 py-6">
        <Card className="app-surface-elevated">
          <CardContent className="space-y-3 p-5">
            <p className="app-eyebrow">Guided Session</p>
            <h1 className="text-2xl font-black tracking-tight">Preflop Study Block</h1>
            <p className="text-sm text-muted-foreground">
              {todayDrills.focusTitle} - {dayLabel}
            </p>
            <div className="rounded-xl border border-border/80 bg-accent/50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Drill {currentDrillIndex + 1} of {drills.length}
                </span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{currentDrill.title}</CardTitle>
              </div>
              {completedDrills.includes(currentDrill.drillId) && (
                <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-300" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Target className="h-3.5 w-3.5" />
                  Primary Tool
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {currentDrill.primaryTool}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Duration
                </p>
                <p className="text-sm font-semibold text-foreground">{currentDrill.reps}</p>
              </div>
            </div>

            {currentDrill.tools && currentDrill.tools.length > 0 && (
              <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Tools</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {currentDrill.tools.map(tool => (
                    <span
                      key={tool}
                      className="rounded-full border border-border/80 bg-accent/60 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Instructions</p>
              <p className="mt-1 text-sm leading-relaxed text-secondary-foreground">
                {currentDrill.instructions}
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-accent/45 p-3">
              <p className="text-xs font-semibold text-muted-foreground">Success Metric</p>
              <p className="mt-1 text-sm font-semibold text-emerald-300">
                {currentDrill.successMetric}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="guided-notes"
                className="text-xs font-semibold text-muted-foreground"
              >
                Session Notes (optional)
              </label>
              <textarea
                id="guided-notes"
                value={sessionNotes}
                onChange={event => setSessionNotes(event.target.value)}
                className="min-h-20 w-full rounded-lg border border-border/80 bg-input/85 px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                placeholder="One quick note from this drill."
              />
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl"
                onClick={() =>
                  setCurrentDrillIndex(previous => Math.max(0, previous - 1))
                }
                disabled={currentDrillIndex === 0}
              >
                Previous
              </Button>
              <Button
                type="button"
                className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-[#FF8A1F]"
                onClick={handleCompleteDrill}
                disabled={completedDrills.includes(currentDrill.drillId)}
              >
                {completedDrills.includes(currentDrill.drillId)
                  ? "Completed ✓"
                  : isLastDrill
                    ? "Mark Complete"
                    : "Complete & Next"}
              </Button>
            </div>

            {allCompleted && (
              <Button
                type="button"
                className="h-10 w-full rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={handleFinishSession}
              >
                Finish Session and Log
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Drill Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {drills.map((drill, index) => {
              const isCurrent = index === currentDrillIndex;
              const isDone = completedDrills.includes(drill.drillId);
              return (
                <button
                  key={drill.drillId}
                  type="button"
                  onClick={() => setCurrentDrillIndex(index)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                    isCurrent
                      ? "border-primary/45 bg-primary/12 text-foreground"
                      : isDone
                        ? "border-emerald-400/30 bg-emerald-500/10 text-foreground"
                        : "border-border/80 bg-accent/45 text-secondary-foreground hover:bg-accent/65"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate">{drill.title}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
