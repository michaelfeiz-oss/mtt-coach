import type { ResolvedStrategyChart } from "@shared/strategy-v2/model";

export function isPopulationDraft(resolved: ResolvedStrategyChart | null | undefined) {
  const text = [
    resolved?.chart.description,
    resolved?.snapshot?.notes,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  return text.includes("population_constructed") || text.includes("population draft");
}
