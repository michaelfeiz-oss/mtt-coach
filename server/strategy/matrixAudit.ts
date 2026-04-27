import { createHash } from "node:crypto";
import {
  getSimplifiedVsThreeBetFamily,
  getStrategySourceStatus,
  type StrategySourceStatus,
} from "../../shared/sourceTruth";
import type { SeedChart } from "./seedData";

export interface MatrixAuditChartEntry {
  id: string;
  title: string;
  stackDepth: number;
  spotGroup: SeedChart["spotGroup"];
  spotKey: string;
  heroPosition: string;
  villainPosition?: string;
  sourceStatus: StrategySourceStatus;
  simplifiedFamily: ReturnType<typeof getSimplifiedVsThreeBetFamily>;
}

export interface MatrixDuplicateGroup {
  signature: string;
  charts: MatrixAuditChartEntry[];
  classification:
    | "accepted_simplified_family"
    | "accepted_proxy_reuse"
    | "needs_review";
  acceptable: boolean;
  reason: string;
}

export function buildMatrixSignature(chart: SeedChart) {
  const signatureInput = chart.actions
    .map(action => `${action.handCode}:${action.primaryAction}`)
    .join("|");

  return createHash("sha1").update(signatureInput).digest("hex").slice(0, 12);
}

function mapChartEntry(chart: SeedChart): MatrixAuditChartEntry {
  return {
    id: `${chart.stackDepth}:${chart.spotKey}`,
    title: chart.title,
    stackDepth: chart.stackDepth,
    spotGroup: chart.spotGroup,
    spotKey: chart.spotKey,
    heroPosition: chart.heroPosition,
    villainPosition: chart.villainPosition,
    sourceStatus: getStrategySourceStatus({
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
      spotKey: chart.spotKey,
    }),
    simplifiedFamily: getSimplifiedVsThreeBetFamily({
      stackDepth: chart.stackDepth,
      spotGroup: chart.spotGroup,
      heroPosition: chart.heroPosition,
      villainPosition: chart.villainPosition,
      spotKey: chart.spotKey,
    }),
  };
}

function classifyDuplicateGroup(
  charts: MatrixAuditChartEntry[]
): MatrixDuplicateGroup["classification"] {
  const allSimplifiedFacingThreeBet = charts.every(
    chart =>
      chart.sourceStatus === "simplified_population" &&
      chart.spotGroup === "VS_3BET" &&
      chart.simplifiedFamily
  );

  if (allSimplifiedFacingThreeBet) {
    const families = new Set(charts.map(chart => chart.simplifiedFamily));
    if (families.size === 1) {
      return "accepted_simplified_family";
    }
  }

  const allProxy = charts.every(chart => chart.sourceStatus === "proxy");
  if (allProxy) {
    return "accepted_proxy_reuse";
  }

  return "needs_review";
}

function classificationReason(group: MatrixDuplicateGroup["classification"]) {
  switch (group) {
    case "accepted_simplified_family":
      return "Shared simplified VS_3BET family matrix.";
    case "accepted_proxy_reuse":
      return "Structured proxy reuse across the same BvB branch.";
    case "needs_review":
      return "Duplicate matrix still looks more precise than the source data proves.";
  }
}

export function buildMatrixDuplicateGroups(
  charts: SeedChart[]
): MatrixDuplicateGroup[] {
  const bySignature = new Map<string, MatrixAuditChartEntry[]>();

  for (const chart of charts) {
    const signature = buildMatrixSignature(chart);
    const bucket = bySignature.get(signature) ?? [];
    bucket.push(mapChartEntry(chart));
    bySignature.set(signature, bucket);
  }

  return Array.from(bySignature.entries())
    .filter(([, chartsForSignature]) => chartsForSignature.length > 1)
    .map(([signature, chartsForSignature]) => {
      const classification = classifyDuplicateGroup(chartsForSignature);
      return {
        signature,
        charts: chartsForSignature,
        classification,
        acceptable: classification !== "needs_review",
        reason: classificationReason(classification),
      };
    })
    .sort((left, right) => right.charts.length - left.charts.length);
}
