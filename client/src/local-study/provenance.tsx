import type { ResolvedStrategyChart } from "@shared/strategy-v2/model";

export function isPopulationDraftText(...values: Array<string | null | undefined>) {
  const text = values.filter(Boolean).join("\n").toLowerCase();
  return text.includes("population_constructed") || text.includes("population draft");
}

export function isPopulationDraft(resolved: ResolvedStrategyChart | null | undefined) {
  return isPopulationDraftText(
    resolved?.chart.description,
    resolved?.snapshot?.notes
  );
}

export function isPopulationDraftChart(chart: { description?: string | null } | null | undefined) {
  return isPopulationDraftText(chart?.description);
}

export function PopulationDraftBadge() {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800">
      Population draft
    </span>
  );
}

export function ReviewBeforeApprovalBadge() {
  return (
    <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[0.68rem] font-bold text-orange-800">
      Review before approval
    </span>
  );
}
