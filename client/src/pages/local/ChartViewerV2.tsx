import { useEffect, useState } from "react";
import { Edit3, Printer } from "lucide-react";
import { Link, useRoute } from "wouter";
import { getChart } from "@/local-study/api";
import { ActionLegend, ChartGrid } from "@/local-study/ChartGrid";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
import { isPopulationDraft, PopulationDraftBadge, ReviewBeforeApprovalBadge } from "@/local-study/provenance";
import type { ResolvedStrategyChart } from "@shared/strategy-v2/model";

export default function ChartViewerV2() {
  const [, params] = useRoute("/strategy/chart/:nodeKey");
  const nodeKey = params?.nodeKey ?? "";
  const [resolved, setResolved] = useState<ResolvedStrategyChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeKey) return;
    getChart(nodeKey)
      .then(result => {
        setResolved(result.resolved);
        setError(null);
      })
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, [nodeKey]);

  const chart = resolved?.chart;
  const snapshot = resolved?.snapshot;

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Chart Viewer"
        title={chart?.title ?? "Loading chart"}
        body={chart ? `${chart.nodeKey} / active source: ${resolved?.source ?? "missing"}` : undefined}
        action={
          chart ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-orange-200 hover:bg-orange-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <Link
                href={`/strategy/editor/${chart.nodeKey}`}
                className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200"
              >
                <Edit3 className="h-4 w-4" />
                Edit Chart
              </Link>
            </div>
          ) : null
        }
      />

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      {chart && !snapshot ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">Not yet reviewed</p>
          <p className="mt-1 text-sm">No seed, reviewed, or approved snapshot exists for this node.</p>
        </section>
      ) : null}

      {chart && snapshot ? (
        <section className="printable-chart min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="print-chart-title mb-3 hidden">
            <h2 className="text-2xl font-black tracking-tight">{chart.title}</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">{chart.nodeKey}</p>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">{chart.stackBb}bb</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{chart.spotType}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{chart.position}{chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{resolved.source}</span>
              {isPopulationDraft(resolved) ? <PopulationDraftBadge /> : null}
              {isPopulationDraft(resolved) ? <ReviewBeforeApprovalBadge /> : null}
            </div>
            <ActionLegend actions={snapshot.allowedActions} />
          </div>
          {resolved.source === "seed" ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {isPopulationDraft(resolved)
                ? "Population draft - review before approval. This is a constructed seed, not final truth."
                : "Seed baseline only. Review and approve before treating this as final truth."}
            </div>
          ) : null}
          <ChartGrid cells={snapshot.cells} allowedActions={snapshot.allowedActions} />
        </section>
      ) : null}
    </LocalShell>
  );
}
