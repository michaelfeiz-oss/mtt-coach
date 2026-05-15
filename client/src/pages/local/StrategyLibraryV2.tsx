import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { listCharts } from "@/local-study/api";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
import { SPOT_TYPES, STACK_BUCKETS, POSITIONS, type StrategyChartRecord } from "@shared/strategy-v2/model";

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "reviewed"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "draft"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{status}</span>;
}

export default function StrategyLibraryV2() {
  const [charts, setCharts] = useState<StrategyChartRecord[]>([]);
  const [filters, setFilters] = useState({ stackBb: "all", spotType: "all", position: "all", status: "all" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCharts(filters)
      .then(result => {
        setCharts(result.charts);
        setError(null);
      })
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, [filters]);

  const approvedCount = useMemo(() => charts.filter(chart => chart.status === "approved").length, [charts]);

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Strategy Library"
        title="Preflop Charts"
        body={`${charts.length} charts loaded. ${approvedCount} approved. Missing/unseeded spots remain Not yet reviewed.`}
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
        <select className="rounded-xl border border-slate-200 p-3" value={filters.position} onChange={event => setFilters({ ...filters, position: event.target.value })}>
          <option value="all">Any hero</option>
          {POSITIONS.map(position => <option key={position} value={position}>{position}</option>)}
        </select>
        <select className="rounded-xl border border-slate-200 p-3" value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}>
          <option value="all">Any status</option>
          <option value="seed">Seed</option>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </section>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <section className="grid gap-3">
        {charts.map(chart => (
          <Link key={chart.nodeKey} href={`/strategy/chart/${chart.nodeKey}`}>
            <a className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-orange-300">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{chart.title}</h2>
                  <p className="mt-1 break-all text-xs text-slate-500">{chart.nodeKey}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {chart.stackBb}bb / {chart.spotType} / {chart.position}
                    {chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
                  </p>
                </div>
                <StatusBadge status={chart.status} />
              </div>
            </a>
          </Link>
        ))}
      </section>
    </LocalShell>
  );
}
