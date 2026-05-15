import { ChevronLeft, ChevronRight, Edit3, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { getChart, listCharts } from "@/local-study/api";
import { ActionLegend, ChartGrid } from "@/local-study/ChartGrid";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
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
  search: string;
};

const EMPTY_FILTERS: FilterState = {
  stackBb: "all",
  spotType: "all",
  position: "all",
  villainPosition: "all",
  status: "all",
  search: "",
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
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{status}</span>;
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
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>source: {source}</span>;
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
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

  const query = normalizeQuery(filters.search);
  if (!query) return true;
  const searchable = [
    chart.nodeKey,
    chart.title,
    chart.spotType,
    chart.position,
    chart.villainPosition ?? "",
    `${chart.stackBb}bb`,
  ]
    .join(" ")
    .toLowerCase();
  return searchable.includes(query);
}

function hasOptionMatch(
  charts: StrategyChartRecord[],
  filters: FilterState,
  key: keyof FilterState,
  value: string
) {
  if (value === "all") return true;
  return charts.some(chart => chartMatchesFilters(chart, { ...filters, [key]: value, search: "" }));
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
      search: params.get("q") ?? EMPTY_FILTERS.search,
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
  if (filters.search.trim()) params.set("q", filters.search.trim());
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
      className={`min-h-10 rounded-xl border px-3 text-sm font-bold transition ${
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

function ChartMatchList({
  charts,
  selectedNodeKey,
  onSelect,
}: {
  charts: StrategyChartRecord[];
  selectedNodeKey: string | null;
  onSelect: (nodeKey: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black">{charts.length} matching charts</p>
        <p className="text-xs font-semibold text-slate-500">Choose one to preview</p>
      </div>
      <div className="grid max-h-72 gap-2 overflow-y-auto pr-1">
        {charts.map(chart => {
          const active = chart.nodeKey === selectedNodeKey;
          return (
            <button
              key={chart.nodeKey}
              type="button"
              onClick={() => onSelect(chart.nodeKey)}
              className={`rounded-xl border p-3 text-left transition ${
                active
                  ? "border-orange-300 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black">{chart.title}</span>
                <StatusBadge status={chart.status} />
              </div>
              <p className="mt-1 break-all font-mono text-[0.72rem] text-slate-500">{chart.nodeKey}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">
                {chart.stackBb}bb / {SPOT_LABELS[chart.spotType] ?? chart.spotType} / {chart.position}
                {chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
              </p>
            </button>
          );
        })}
      </div>
    </div>
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">
        Loading selected chart...
      </section>
    );
  }

  if (error) {
    return <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</section>;
  }

  if (!chart) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-black">Not yet reviewed / not seeded</p>
        <p className="mt-1 text-sm">No existing chart matches this combination. Nothing is inferred or rendered as Fold.</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="font-black">Not yet reviewed</p>
        <p className="mt-1 text-sm">This node exists, but no seed, reviewed, or approved snapshot is available.</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight">{chart.title}</h2>
            <StatusBadge status={chart.status} />
            <SourceBadge source={resolved.source} />
          </div>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">{chart.nodeKey}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">{chart.stackBb}bb</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{SPOT_LABELS[chart.spotType] ?? chart.spotType}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {chart.position}{chart.villainPosition ? ` vs ${chart.villainPosition}` : ""}
            </span>
          </div>
        </div>
        <Link
          href={`/strategy/editor/${chart.nodeKey}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200"
        >
          <Edit3 className="h-4 w-4" />
          Edit Chart
        </Link>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ActionLegend actions={snapshot.allowedActions} />
        {resolved.source === "seed" ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
            Seed baseline - review before final truth
          </span>
        ) : null}
      </div>
      <ChartGrid cells={snapshot.cells} allowedActions={snapshot.allowedActions} />
    </section>
  );
}

export default function StrategyLibraryV2() {
  const [location, navigate] = useLocation();
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
  }, [filters, location, navigate, selectedChart?.nodeKey, selectedNodeKey]);

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters(current => ({ ...current, ...patch }));
    setSelectedNodeKey(null);
  };

  const selectNodeKey = (nodeKey: string) => {
    setSelectedNodeKey(nodeKey);
    navigate(buildLibraryHref(filters, nodeKey), { replace: true });
  };

  const selectedIndex = selectedChart
    ? filteredCharts.findIndex(chart => chart.nodeKey === selectedChart.nodeKey)
    : -1;
  const previousChart = selectedIndex > 0 ? filteredCharts[selectedIndex - 1] : null;
  const nextChart = selectedIndex >= 0 && selectedIndex < filteredCharts.length - 1
    ? filteredCharts[selectedIndex + 1]
    : null;

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
      <PageHeader
        eyebrow="Strategy Library"
        title="Range Browser"
        body={`${charts.length} charts loaded. ${approvedCount} approved. Missing combinations stay Not yet reviewed.`}
      />

      {error ? <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500" htmlFor="range-browser-search">
              Search
            </label>
            <div className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="range-browser-search"
                value={filters.search}
                onChange={event => updateFilters({ search: event.target.value })}
                placeholder="bb vs sb, 15bb, rfi, btn"
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Stack size</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
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
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold"
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
              <div className="mt-2 grid grid-cols-3 gap-2">
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
                <div className="mt-2 grid grid-cols-3 gap-2">
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
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(status => (
                  <FilterButton
                    key={status}
                    active={filters.status === status}
                    disabled={status !== "not_yet_reviewed" && !hasOptionMatch(charts, filters, "status", status)}
                    onClick={() => updateFilters({ status })}
                  >
                    {STATUS_LABELS[status]}
                  </FilterButton>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current selection</p>
              <p className="mt-1 text-sm font-bold text-slate-700">
                {selectedChart ? selectedChart.nodeKey : "Not yet reviewed / not seeded"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!previousChart}
                onClick={() => previousChart && selectNodeKey(previousChart.nodeKey)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 disabled:text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                disabled={!nextChart}
                onClick={() => nextChart && selectNodeKey(nextChart.nodeKey)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 disabled:text-slate-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {filteredCharts.length > 1 ? (
            <ChartMatchList
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
