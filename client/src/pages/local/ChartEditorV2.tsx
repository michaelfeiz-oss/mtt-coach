import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { approveChart, getChart, getHistory, markReviewed, revertChart, saveDraft } from "@/local-study/api";
import { ActionLegend, ChartGrid } from "@/local-study/ChartGrid";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
import {
  ACTION_LABELS,
  ACTION_TOKENS,
  type ActionToken,
  type ChartCells,
  type ResolvedStrategyChart,
  type StrategyChartSnapshot,
} from "@shared/strategy-v2/model";

export default function ChartEditorV2() {
  const [, params] = useRoute("/strategy/editor/:nodeKey");
  const nodeKey = params?.nodeKey ?? "";
  const [resolved, setResolved] = useState<ResolvedStrategyChart | null>(null);
  const [history, setHistory] = useState<StrategyChartSnapshot[]>([]);
  const [cells, setCells] = useState<ChartCells | null>(null);
  const [allowedActions, setAllowedActions] = useState<ActionToken[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionToken>("FOLD");
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [chartResult, historyResult] = await Promise.all([
      getChart(nodeKey),
      getHistory(nodeKey),
    ]);
    setResolved(chartResult.resolved);
    setHistory(historyResult.snapshots);
    const draft = historyResult.draft as any;
    const sourceCells = draft?.cells ?? chartResult.resolved.snapshot?.cells ?? null;
    const sourceAllowed = draft?.allowedActions ?? chartResult.resolved.snapshot?.allowedActions ?? [];
    setCells(sourceCells);
    setAllowedActions(sourceAllowed);
    setSelectedAction(sourceAllowed[0] ?? "FOLD");
    setNotes(draft?.notes ?? chartResult.resolved.snapshot?.notes ?? "");
  }

  useEffect(() => {
    if (!nodeKey) return;
    refresh().catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, [nodeKey]);

  const selectedSet = useMemo(() => new Set(selectedHands), [selectedHands]);

  function toggleHand(hand: string) {
    setSelectedHands(current =>
      current.includes(hand) ? current.filter(value => value !== hand) : [...current, hand]
    );
  }

  function applyAction() {
    if (!cells) return;
    setCells({
      ...cells,
      ...Object.fromEntries(selectedHands.map(hand => [hand, selectedAction])),
    });
    setSelectedHands([]);
  }

  async function runSave(kind: "draft" | "reviewed" | "approved") {
    if (!cells) return;
    const payload = { cells, allowedActions, notes };
    if (kind === "draft") await saveDraft(nodeKey, payload);
    if (kind === "reviewed") await markReviewed(nodeKey, payload);
    if (kind === "approved") await approveChart(nodeKey, payload);
    setMessage(
      kind === "draft"
        ? "Draft saved. Study mode is unchanged."
        : kind === "reviewed"
          ? "Reviewed snapshot created."
          : "Approved snapshot created and set active."
    );
    await refresh();
  }

  async function runRevert(snapshotId: number) {
    await revertChart(nodeKey, snapshotId);
    setMessage("Revert created a new approved snapshot.");
    await refresh();
  }

  const chart = resolved?.chart;

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Chart Editor"
        title={chart?.title ?? "Loading editor"}
        body={chart ? `${chart.nodeKey} / drafts do not affect study mode until reviewed or approved.` : undefined}
        action={chart ? <Link href={`/strategy/chart/${chart.nodeKey}`}><a className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold">View</a></Link> : null}
      />

      {error ? <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {message ? <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</div> : null}

      {chart && cells ? (
        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <ActionLegend actions={allowedActions} />
              <span className="text-sm text-slate-500">{selectedHands.length} selected</span>
            </div>
            <ChartGrid
              cells={cells}
              allowedActions={allowedActions}
              selectedHands={selectedHands}
              onToggleHand={toggleHand}
            />
          </div>

          <aside className="min-w-0 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-bold">Action Palette</p>
              <div className="mt-3 grid gap-2">
                {allowedActions.map(action => (
                  <button
                    type="button"
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm font-bold ${
                      selectedAction === action ? "border-orange-500 bg-orange-50" : "border-slate-200"
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={applyAction}
                disabled={selectedHands.length === 0}
                className="mt-3 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Apply to Selected
              </button>
              <button type="button" onClick={() => setSelectedHands([])} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                Clear Selection
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-bold">Allowed Actions</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {ACTION_TOKENS.map(action => (
                  <label key={action} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={allowedActions.includes(action)}
                      onChange={event => {
                        setAllowedActions(current =>
                          event.target.checked
                            ? [...current, action]
                            : current.filter(value => value !== action)
                        );
                      }}
                    />
                    {ACTION_LABELS[action]}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-bold">Review notes</label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm"
              />
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => runSave("draft")} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold">
                  Save Draft
                </button>
                <button type="button" onClick={() => runSave("reviewed")} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
                  Mark Reviewed
                </button>
                <button type="button" onClick={() => runSave("approved")} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                  Approve Chart
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-bold">History</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-auto">
                {history.map(snapshot => (
                  <div key={snapshot.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                    <p className="font-bold">v{snapshot.version} / {snapshot.status}</p>
                    <p className="break-all text-slate-500">{snapshot.checksum.slice(0, 16)}</p>
                    <button type="button" onClick={() => runRevert(snapshot.id)} className="mt-2 rounded-lg border border-slate-200 px-2 py-1 font-bold">
                      Revert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </LocalShell>
  );
}
