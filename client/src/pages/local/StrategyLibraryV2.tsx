import { Edit3 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { getChart, listCharts } from "@/local-study/api";
import { ActionLegend, ChartGrid } from "@/local-study/ChartGrid";
import { LocalShell } from "@/local-study/LocalShell";
import {
  POSITIONS,
  SPOT_TYPES,
  STACK_BUCKETS,
  type Position,
  type ResolvedStrategyChart,
  type SpotType,
  type StrategyChartRecord,
} from "@shared/strategy-v2/model";

type FilterState = {
  stackBb: string;
  spotType: string;
  position: string;
  villainPosition: string;
  status: string;
};

const EMPTY_FILTERS: FilterState = {
  stackBb: "all",
  spotType: "all",
  position: "all",
  villainPosition: "all",
  status: "all",
};

const STATUS_OPTIONS = ["all", "seed", "draft", "reviewed", "approved", "not_yet_reviewed"] as const;

const SPOT_LABELS: Record<string, string> = {
  all: "Any spot",
  rfi: "RFI",
  facing_open_early: "Facing early open",
  facing_open_middle: "Facing middle open",
  facing_open_late: "Facing late open",
  facing_jam: "Facing jam",
  sb_first_in: "SB first in",
  bb_vs_sb_open: "BB vs SB open",
  bb_vs_sb_limp: "BB vs SB limp",
};

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  seed: "Seed",
  draft: "Draft",
  reviewed: "Reviewed",
  approved: "Approved",
  not_yet_reviewed: "Not yet reviewed",
};

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "reviewed"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : status === "draft"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-600";
  return <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${className}`}>{status}</span>;
}

function SourceBadge({ source }: { source: string }) {
  const className =
    source === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : source === "reviewed"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : source === "seed"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-amber-200 bg-amber-50 text-amber-800";
  return <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${className}`}>source: {source}</span>;
}

function chartMatchesFilters(chart: StrategyChartRecord, filters: FilterState) {
  if (filters.stackBb !== "all" && chart.stackBb !== Number(filters.stackBb)) return false;
  if (filters.spotType !== "all" && chart.spotType !== filters.spotType) return false;
  if (filters.position !== "all" && chart.position !== filters.position) return false;
  if (filters.villainPosition !== "all" && chart.villainPosition !== filters.villainPosition) return false;
  if (filters.status !== "all") {
    if (filters.status === "not_yet_reviewed") return false;
    if (chart.status !== filters.status) return false;
  }

  return true;
}

function hasOptionMatch(
  charts: StrategyChartRecord[],
  filters: FilterState,
  key: keyof FilterState,
  value: string
) {
  if (value === "all") return true;
  return charts.some(chart => chartMatchesFilters(chart, { ...filters, [key]: value }));
}

function parseFilters(search: string): { filters: FilterState; selectedNodeKey: string | null } {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    filters: {
      stackBb: params.get("stack") ?? EMPTY_FILTERS.stackBb,
      spotType: params.get("spot") ?? EMPTY_FILTERS.spotType,
      position: params.get("hero") ?? EMPTY_FILTERS.position,
      villainPosition: params.get("villain") ?? EMPTY_FILTERS.villainPosition,
      status: params.get("status") ?? EMPTY_FILTERS.status,
    },
    selectedNodeKey: params.get("chart"),
  };
}

function buildLibraryHref(filters: FilterState, selectedNodeKey?: string | null) {
  const params = new URLSearchParams();
  if (filters.stackBb !== "all") params.set("stack", filters.stackBb);
  if (filters.spotType !== "all") params.set("spot", filters.spotType);
  if (filters.position !== "all") params.set("hero", filters.position);
  if (filters.villainPosition !== "all") params.set("villain", filters.villainPosition);
  if (filters.status !== "all") params.set("status", filters.status);
  if (selectedNodeKey) params.set("chart", selectedNodeKey);
  const query = params.toString();
  return `/strategy/library${query ? `?${query}` : ""}`;
}

function FilterButton({
  active,
  disabled,
  children,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-8 rounded-lg border px-2 text-sm font-bold transition ${
        active
          ? "border-orange-300 bg-orange-100 text-orange-800"
          : disabled
            ? "border-slate-100 bg-slate-50 text-slate-300"
            : "border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50"
      }`}
    >
      {children}
    </button>
  );
}

function MatchingChartSelect({
  charts,
  selectedNodeKey,
  onSelect,
}: {
  charts: StrategyChartRecord[];
  selectedNodeKey: string | null;
  onSelect: (nodeKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
      <label className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="matching-chart-select">
        {charts.length} matches
      </label>
      <select
        id="matching-chart-select"
        className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"
        value={selectedNodeKey ?? charts[0]?.nodeKey ?? ""}
        onChange={event => onSelect(event.target.value)}
      >
        {charts.map(chart => (
          <option key={chart.nodeKey} value={chart.nodeKey}>
            {chart.title} / {chart.stackBb}bb / {chart.position}{chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function CompactHeader({ chartsCount, approvedCount }: { chartsCount: number; approvedCount: number }) {
  return (
    <section className="mb-2 flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Strategy Library</p>
        <h1 className="text-xl font-black tracking-tight">Range Browser</h1>
      </div>
      <p className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">
        {chartsCount} charts • {approvedCount} approved
      </p>
    </section>
  );
}

function ChartPreview({
  resolved,
  loading,
  error,
}: {
  resolved: ResolvedStrategyChart | null;
  loading: boolean;
  error: string | null;
}) {
  const chart = resolved?.chart;
  const snapshot = resolved?.snapshot;

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-500 shadow-sm">
        Loading selected chart...
      </section>
    );
  }

  if (error) {
    return <section className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">{error}</section>;
  }

  if (!chart) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
        <p className="font-black">Not yet reviewed / not seeded</p>
        <p className="mt-1 text-sm">No existing chart matches this combination. Nothing is inferred or rendered as Fold.</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
        <p className="font-black">Not yet reviewed</p>
        <p className="mt-1 text-sm">This node exists, but no seed, reviewed, or approved snapshot is available.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[34.25rem] min-w-0 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <div className="mb-1.5 flex min-h-[4.75rem] flex-col gap-1.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="min-w-0 truncate text-lg font-black tracking-tight">{chart.title}</h2>
              <StatusBadge status={chart.status} />
              <SourceBadge source={resolved.source} />
            </div>
          </div>
          <Link
            href={`/strategy/editor/${chart.nodeKey}`}
            className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg shadow-orange-200"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Chart
          </Link>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1 text-[0.68rem] font-bold">
          <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-orange-800">{chart.stackBb}bb</span>
          <span className="max-w-[9rem] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">{SPOT_LABELS[chart.spotType] ?? chart.spotType}</span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700">
            {chart.position}{chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
          </span>
          <ActionLegend actions={snapshot.allowedActions} density="compact" />
        </div>
      </div>
      {resolved.source === "seed" ? (
        <div className="mb-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[0.68rem] font-bold text-amber-800">
          Seed baseline - review before final truth
        </div>
      ) : null}
      <ChartGrid cells={snapshot.cells} allowedActions={snapshot.allowedActions} density="compact" wrap fixedCellSizePx={38} />
    </section>
  );
}

export default function StrategyLibraryV2() {
  const [, navigate] = useLocation();
  const [charts, setCharts] = useState<StrategyChartRecord[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => parseFilters(window.location.search).filters);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(() => parseFilters(window.location.search).selectedNodeKey);
  const [resolved, setResolved] = useState<ResolvedStrategyChart | null>(null);
  const [loadingResolved, setLoadingResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    listCharts()
      .then(result => {
        setCharts(result.charts);
        setError(null);
      })
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, []);

  const filteredCharts = useMemo(
    () => charts.filter(chart => chartMatchesFilters(chart, filters)),
    [charts, filters]
  );

  const selectedChart = useMemo(() => {
    if (selectedNodeKey) {
      const selected = filteredCharts.find(chart => chart.nodeKey === selectedNodeKey);
      if (selected) return selected;
    }
    return filteredCharts[0] ?? null;
  }, [filteredCharts, selectedNodeKey]);

  useEffect(() => {
    if (!selectedChart) {
      setResolved(null);
      setChartError(null);
      return;
    }

    setLoadingResolved(true);
    getChart(selectedChart.nodeKey)
      .then(result => {
        setResolved(result.resolved);
        setChartError(null);
      })
      .catch(error => {
        setResolved(null);
        setChartError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => setLoadingResolved(false));
  }, [selectedChart]);

  useEffect(() => {
    const href = buildLibraryHref(filters, selectedChart?.nodeKey ?? selectedNodeKey);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (href !== currentHref) {
      navigate(href, { replace: true });
    }
  }, [filters, navigate, selectedChart?.nodeKey, selectedNodeKey]);

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters(current => ({ ...current, ...patch }));
    setSelectedNodeKey(null);
  };

  const selectNodeKey = (nodeKey: string) => {
    setSelectedNodeKey(nodeKey);
    navigate(buildLibraryHref(filters, nodeKey), { replace: true });
  };

  const stackOptions = Array.from(new Set([...STACK_BUCKETS, ...charts.map(chart => chart.stackBb)])).sort((a, b) => a - b);
  const spotOptions = Array.from(new Set([...SPOT_TYPES, ...charts.map(chart => chart.spotType)])) as SpotType[];
  const heroOptions = Array.from(new Set([...POSITIONS, ...charts.map(chart => chart.position)])) as Position[];
  const villainOptions = Array.from(
    new Set(charts.map(chart => chart.villainPosition).filter((position): position is Position => Boolean(position)))
  );
  const selectedSpotUsesVillain = filters.spotType === "all" || charts.some(chart => {
    if (filters.spotType !== "all" && chart.spotType !== filters.spotType) return false;
    return Boolean(chart.villainPosition);
  });

  const approvedCount = charts.filter(chart => chart.status === "approved").length;

  return (
    <LocalShell>
      <CompactHeader chartsCount={charts.length} approvedCount={approvedCount} />

      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <div className="grid gap-2.5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-2 lg:self-start">
          <section className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Stack size</p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                <FilterButton active={filters.stackBb === "all"} onClick={() => updateFilters({ stackBb: "all" })}>
                  Any
                </FilterButton>
                {stackOptions.map(stack => {
                  const value = String(stack);
                  const disabled = !hasOptionMatch(charts, filters, "stackBb", value);
                  return (
                    <FilterButton
                      key={stack}
                      active={filters.stackBb === value}
                      disabled={disabled}
                      onClick={() => updateFilters({ stackBb: value })}
                    >
                      {stack}bb
                    </FilterButton>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="range-browser-spot">
                Spot / scenario
              </label>
              <select
                id="range-browser-spot"
                className="mt-1 min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"
                value={filters.spotType}
                onChange={event => updateFilters({ spotType: event.target.value, villainPosition: "all" })}
              >
                <option value="all">Any spot</option>
                {spotOptions.map(spot => (
                  <option
                    key={spot}
                    value={spot}
                    disabled={!hasOptionMatch(charts, filters, "spotType", spot)}
                  >
                    {SPOT_LABELS[spot] ?? spot}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Hero position</p>
              <div className="mt-1 grid grid-cols-3 gap-1.5">
                <FilterButton active={filters.position === "all"} onClick={() => updateFilters({ position: "all" })}>
                  Any
                </FilterButton>
                {heroOptions.map(position => (
                  <FilterButton
                    key={position}
                    active={filters.position === position}
                    disabled={!hasOptionMatch(charts, filters, "position", position)}
                    onClick={() => updateFilters({ position })}
                  >
                    {position}
                  </FilterButton>
                ))}
              </div>
            </div>

            {selectedSpotUsesVillain && villainOptions.length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Villain / opponent</p>
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  <FilterButton
                    active={filters.villainPosition === "all"}
                    onClick={() => updateFilters({ villainPosition: "all" })}
                  >
                    Any
                  </FilterButton>
                  {villainOptions.map(position => (
                    <FilterButton
                      key={position}
                      active={filters.villainPosition === position}
                      disabled={!hasOptionMatch(charts, filters, "villainPosition", position)}
                      onClick={() => updateFilters({ villainPosition: position })}
                    >
                      {position}
                    </FilterButton>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="range-browser-status">
                Status
              </label>
              <select
                id="range-browser-status"
                className="mt-1 min-h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold"
                value={filters.status}
                onChange={event => updateFilters({ status: event.target.value })}
              >
                {STATUS_OPTIONS.map(status => (
                  <option
                    key={status}
                    value={status}
                    disabled={status !== "not_yet_reviewed" && !hasOptionMatch(charts, filters, "status", status)}
                  >
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-2">
          {filteredCharts.length > 1 ? (
            <MatchingChartSelect
              charts={filteredCharts}
              selectedNodeKey={selectedChart?.nodeKey ?? null}
              onSelect={selectNodeKey}
            />
          ) : null}

          {filteredCharts.length === 0 ? (
            <ChartPreview resolved={null} loading={false} error={null} />
          ) : (
            <ChartPreview resolved={resolved} loading={loadingResolved} error={chartError} />
          )}
        </section>
      </div>
    </LocalShell>
  );
}
