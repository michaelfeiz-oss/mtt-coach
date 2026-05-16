import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getTrainerQuestion } from "@/local-study/api";
import { ChartGrid } from "@/local-study/ChartGrid";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
import { ACTION_LABELS, STACK_BUCKETS, SPOT_TYPES, type ActionToken } from "@shared/strategy-v2/model";

const HAND_POOL_OPTIONS = [
  { value: "playable", label: "Playable Only" },
  { value: "all", label: "All Hands" },
  { value: "fold", label: "Fold Practice" },
] as const;

export function trainerChartHref(nodeKey: string) {
  return `/strategy/chart/${nodeKey}`;
}

export function trainerEditorHref(nodeKey: string) {
  return `/strategy/editor/${nodeKey}`;
}

export default function TrainerV2() {
  const [filters, setFilters] = useState({ stackBb: "all", spotType: "all", handPool: "playable" });
  const [question, setQuestion] = useState<any>(null);
  const [selected, setSelected] = useState<ActionToken | null>(null);
  const [stats, setStats] = useState({ total: 0, correct: 0 });
  const [error, setError] = useState<string | null>(null);

  async function next() {
    setSelected(null);
    try {
      const result = await getTrainerQuestion(filters);
      setQuestion(result.question);
      setError(null);
    } catch (error) {
      setQuestion(null);
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    next();
  }, [filters.stackBb, filters.spotType, filters.handPool]);

  function choose(action: ActionToken) {
    if (!question || selected) return;
    setSelected(action);
    setStats(current => ({
      total: current.total + 1,
      correct: current.correct + (action === question.correctAction ? 1 : 0),
    }));
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
  const answeredCorrectly = selected !== null && selected === question?.correctAction;

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Basic Drills"
        title="Range Trainer"
        body="Choose an action for the shown hand. The trainer uses resolved chart snapshots and never drills a missing chart."
      />

      <section className="mb-4 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-4">
        <select className="rounded-xl border border-slate-200 p-3" value={filters.stackBb} onChange={event => setFilters({ ...filters, stackBb: event.target.value })}>
          <option value="all">Any stack</option>
          {STACK_BUCKETS.map(stack => <option key={stack} value={stack}>{stack}bb</option>)}
        </select>
        <select className="rounded-xl border border-slate-200 p-3" value={filters.spotType} onChange={event => setFilters({ ...filters, spotType: event.target.value })}>
          <option value="all">Any spot</option>
          {SPOT_TYPES.map(spot => <option key={spot} value={spot}>{spot}</option>)}
        </select>
        <label className="block">
          <span className="sr-only">Hand pool</span>
          <select
            className="w-full rounded-xl border border-slate-200 p-3 font-bold"
            value={filters.handPool}
            onChange={event => setFilters({ ...filters, handPool: event.target.value })}
          >
            {HAND_POOL_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="rounded-xl bg-slate-100 p-3 text-sm font-bold">
          {stats.correct}/{stats.total} correct / {accuracy}%
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{error}</div> : null}

      {question ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">{question.chart.title}</p>
          <div className="my-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-3xl font-black shadow-inner">
              {question.handCode}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {question.source} source / {HAND_POOL_OPTIONS.find(option => option.value === question.handPool)?.label ?? "Playable Only"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {question.allowedActions.map((action: ActionToken) => {
              const picked = selected === action;
              const correct = question.correctAction === action;
              return (
                <button
                  type="button"
                  key={action}
                  onClick={() => choose(action)}
                  className={`rounded-2xl border px-4 py-4 text-left font-bold ${
                    selected
                      ? correct
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : picked
                          ? "border-red-300 bg-red-50 text-red-800"
                          : "border-slate-200 bg-white"
                      : "border-slate-200 bg-white hover:border-orange-300"
                  }`}
                >
                  {ACTION_LABELS[action]}
                </button>
              );
            })}
          </div>
          {selected ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className={`text-sm font-black ${answeredCorrectly ? "text-emerald-700" : "text-red-700"}`}>
                    {answeredCorrectly ? "Correct" : "Review this one"}
                  </p>
                  <p className="text-slate-600">
                    Correct action: <strong>{ACTION_LABELS[question.correctAction as ActionToken]}</strong>
                    {" · "}
                    Your answer: <strong>{ACTION_LABELS[selected]}</strong>
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {question.source} source
                </span>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Review Chart</p>
                    <h2 className="truncate text-lg font-black">{question.chart.title}</h2>
                    <p className="text-sm text-slate-600">
                      {question.handCode}: {ACTION_LABELS[question.correctAction as ActionToken]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={trainerChartHref(question.chart.nodeKey)}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
                    >
                      Open Full Chart
                    </Link>
                    <Link
                      href={trainerEditorHref(question.chart.nodeKey)}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl bg-orange-600 px-3 text-sm font-bold text-white"
                    >
                      Edit Chart
                    </Link>
                  </div>
                </div>
                {question.snapshot ? (
                  <ChartGrid
                    cells={question.snapshot.cells}
                    allowedActions={question.snapshot.allowedActions}
                    density="compact"
                    wrap
                    fixedCellSizePx={36}
                    highlightedHand={question.handCode}
                    highlightTone={answeredCorrectly ? "correct" : "wrong"}
                  />
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                    The trainer question did not include a resolved chart snapshot, so no chart was rendered.
                  </div>
                )}
              </section>
            </div>
          ) : null}
          <button type="button" onClick={next} className="mt-4 w-full rounded-2xl bg-orange-600 px-4 py-4 font-bold text-white">
            Next Hand
          </button>
        </section>
      ) : null}
    </LocalShell>
  );
}
