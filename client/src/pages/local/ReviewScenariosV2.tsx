import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  getReviewScenarioSummary,
  listReviewScenarios,
  updateReviewScenarioOwnerDecision,
} from "@/local-study/api";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";
import {
  REVIEW_SCENARIO_OWNER_DECISIONS,
  type ReviewScenarioOwnerDecision,
  type StrategyReviewScenario,
  type StrategyReviewSummary,
} from "@shared/strategy-review-scenarios";

const ALL = "all";

function unique(values: string[]) {
  return Array.from(new Set(values)).filter(Boolean).sort();
}

function Chip({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "amber" | "green" | "red" | "purple" }) {
  const classes = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-300 bg-amber-50 text-amber-900",
    green: "border-emerald-300 bg-emerald-50 text-emerald-800",
    red: "border-red-300 bg-red-50 text-red-800",
    purple: "border-purple-300 bg-purple-50 text-purple-800",
  };
  return <span className={`rounded-full border px-2 py-1 text-[0.68rem] font-black ${classes[tone]}`}>{children}</span>;
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase text-slate-500">
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold normal-case text-slate-950"
      >
        <option value={ALL}>All</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCards({ summary }: { summary: StrategyReviewSummary | null }) {
  const cards = [
    ["Scenarios", summary?.total ?? "-"],
    ["Linked charts", summary?.linkedChartCount ?? "-"],
    ["Source required", summary?.sourceRequiredCount ?? "-"],
    ["Facing 3-bet stubs", summary?.facing3betCount ?? "-"],
  ];
  return (
    <section className="grid gap-2 sm:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
      ))}
    </section>
  );
}

export default function ReviewScenariosV2() {
  const [scenarios, setScenarios] = useState<StrategyReviewScenario[]>([]);
  const [summary, setSummary] = useState<StrategyReviewSummary | null>(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    family: ALL,
    stack: ALL,
    status: ALL,
    sourceClass: ALL,
    rangeCellsStatus: ALL,
    trainerVisibility: ALL,
    ownerDecision: ALL,
  });

  async function refresh() {
    const [scenarioResult, summaryResult] = await Promise.all([
      listReviewScenarios({
        family: filters.family,
        stackBb: filters.stack,
        status: filters.status,
        sourceClass: filters.sourceClass,
        rangeCellsStatus: filters.rangeCellsStatus,
        trainerVisibility: filters.trainerVisibility,
        ownerDecision: filters.ownerDecision,
      }),
      getReviewScenarioSummary(),
    ]);
    setScenarios(scenarioResult.scenarios);
    setSummary(summaryResult.summary);
    setSelectedNodeKey(current =>
      current && scenarioResult.scenarios.some(scenario => scenario.nodeKey === current)
        ? current
        : scenarioResult.scenarios[0]?.nodeKey ?? null
    );
  }

  useEffect(() => {
    refresh().catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, [filters]);

  const selected = scenarios.find(scenario => scenario.nodeKey === selectedNodeKey) ?? scenarios[0];
  const options = useMemo(
    () => ({
      family: unique(scenarios.map(scenario => scenario.spotFamily)),
      stack: unique(scenarios.map(scenario => String(scenario.stackBb))),
      status: unique(scenarios.map(scenario => scenario.appStatus)),
      sourceClass: unique(scenarios.map(scenario => scenario.sourceClass)),
      rangeCellsStatus: unique(scenarios.map(scenario => scenario.rangeCellsStatus)),
      trainerVisibility: unique(scenarios.map(scenario => scenario.trainerDefaultVisibility)),
      ownerDecision: [...REVIEW_SCENARIO_OWNER_DECISIONS],
    }),
    [scenarios]
  );

  async function updateOwnerDecision(ownerDecision: ReviewScenarioOwnerDecision, ownerNotes: string) {
    if (!selected) return;
    await updateReviewScenarioOwnerDecision(selected.nodeKey, { ownerDecision, ownerNotes });
    await refresh();
  }

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Strategy Review"
        title="Scenario Review Layer"
        body="Review-only metadata. These records do not write chart cells, approve charts, or change trainer defaults."
      />

      {error ? <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      <SummaryCards summary={summary} />

      <section className="mt-3 grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <Select label="Family" value={filters.family} options={options.family} onChange={family => setFilters({ ...filters, family })} />
            <Select label="Stack" value={filters.stack} options={options.stack} onChange={stack => setFilters({ ...filters, stack })} />
            <Select label="Status" value={filters.status} options={options.status} onChange={status => setFilters({ ...filters, status })} />
            <Select label="Source" value={filters.sourceClass} options={options.sourceClass} onChange={sourceClass => setFilters({ ...filters, sourceClass })} />
            <Select label="Cells" value={filters.rangeCellsStatus} options={options.rangeCellsStatus} onChange={rangeCellsStatus => setFilters({ ...filters, rangeCellsStatus })} />
            <Select label="Trainer" value={filters.trainerVisibility} options={options.trainerVisibility} onChange={trainerVisibility => setFilters({ ...filters, trainerVisibility })} />
            <Select label="Owner" value={filters.ownerDecision} options={options.ownerDecision} onChange={ownerDecision => setFilters({ ...filters, ownerDecision })} />
          </div>

          <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {scenarios.map(scenario => (
              <button
                key={scenario.nodeKey}
                type="button"
                onClick={() => setSelectedNodeKey(scenario.nodeKey)}
                className={`w-full rounded-xl border p-3 text-left text-sm ${
                  selected?.nodeKey === scenario.nodeKey
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                }`}
              >
                <p className="truncate font-black">{scenario.displayName}</p>
                <p className="mt-1 truncate font-mono text-[0.68rem] text-slate-500">{scenario.nodeKey}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Chip>{scenario.stackBb}bb</Chip>
                  <Chip tone={scenario.rangeCellsStatus === "NO_CHART_CELLS_IMPORTED" ? "red" : "green"}>
                    {scenario.rangeCellsStatus}
                  </Chip>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">{selected.spotFamily}</p>
                  <h2 className="mt-1 text-2xl font-black">{selected.displayName}</h2>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">{selected.nodeKey}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.linkedChartExists ? (
                    <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black" href={`/strategy/chart/${selected.nodeKey}`}>
                      Linked Chart
                    </Link>
                  ) : null}
                  {selected.linkedChartExists ? (
                    <Link className="rounded-xl bg-orange-600 px-3 py-2 text-sm font-black text-white" href={`/strategy/editor/${selected.nodeKey}`}>
                      Edit Chart
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip>{selected.stackBb}bb</Chip>
                <Chip>{selected.heroPosition} vs {selected.villainPosition}</Chip>
                <Chip tone={selected.trainerDefaultVisibility === "VISIBLE_DEFAULT" ? "green" : "amber"}>
                  {selected.trainerDefaultVisibility}
                </Chip>
                <Chip tone={selected.rangeCellsStatus === "NO_CHART_CELLS_IMPORTED" ? "red" : "green"}>
                  {selected.rangeCellsStatus}
                </Chip>
                <Chip tone={selected.sourceClass.includes("quarantined") ? "red" : selected.sourceClass.includes("population") ? "amber" : "slate"}>
                  {selected.sourceClass}
                </Chip>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Simplified live rule</p>
                  <p className="mt-2 text-sm">{selected.simplifiedLiveRule}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-bold uppercase text-amber-800">Risk flags</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.riskFlags.map(flag => <Chip key={flag} tone={flag === "NO_MAJOR_CURRENT_FLAG" ? "green" : "amber"}>{flag}</Chip>)}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Population strategy summary</p>
                <p className="mt-2 text-sm leading-6">{selected.populationStrategySummary}</p>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Review hand focus</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.reviewHandFocus.map(hand => <Chip key={hand}>{hand}</Chip>)}
                </div>
              </div>

              <OwnerDecisionForm scenario={selected} onSave={updateOwnerDecision} />
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No review scenarios match these filters.
            </div>
          )}
        </section>
      </section>
    </LocalShell>
  );
}

function OwnerDecisionForm({
  scenario,
  onSave,
}: {
  scenario: StrategyReviewScenario;
  onSave: (ownerDecision: ReviewScenarioOwnerDecision, ownerNotes: string) => Promise<void>;
}) {
  const [decision, setDecision] = useState<ReviewScenarioOwnerDecision>(scenario.ownerDecision);
  const [notes, setNotes] = useState(scenario.ownerNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDecision(scenario.ownerDecision);
    setNotes(scenario.ownerNotes);
  }, [scenario.nodeKey, scenario.ownerDecision, scenario.ownerNotes]);

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">Owner decision</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-[18rem_minmax(0,1fr)_auto]">
        <select
          value={decision}
          onChange={event => setDecision(event.target.value as ReviewScenarioOwnerDecision)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold"
        >
          {REVIEW_SCENARIO_OWNER_DECISIONS.map(value => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <input
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Owner notes"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(decision, notes);
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </div>
  );
}
