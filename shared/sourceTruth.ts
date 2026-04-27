import type { Position, SpotGroup } from "./strategy";

export const SOURCE_BACKED_MAIN_STACKS = [15, 25, 40] as const;
export type SourceBackedMainStack = (typeof SOURCE_BACKED_MAIN_STACKS)[number];

/**
 * source_backed  — directly backed by a chart in the 15/25/40bb PDF files
 * simplified     — no exact PDF chart; uses population-derived principles
 * unsupported    — stack not covered at all
 */
export type StrategySourceStatus = "source_backed" | "simplified" | "unsupported";

/** @deprecated Use StrategySourceStatus — "proxy" is now "simplified" */
export type LegacyStrategySourceStatus =
  | StrategySourceStatus
  | "proxy";

export interface StrategyChartLike {
  stackDepth: number;
  spotGroup: SpotGroup;
  heroPosition: string;
  villainPosition?: string | null;
  spotKey?: string | null;
}

/**
 * EXACT COVERAGE MAP — derived directly from the three GTO PDF files.
 *
 * 15bb PDF (8 pages):
 *   RFI: all positions ✓
 *   VS_UTG_RFI / VS_MP_RFI / VS_LP_RFI: all hero positions ✓
 *   VS_3BET: all-in response trees for UTG–BTN RFI ✓
 *   BVB: SB RFI, BB vs SB Limp, BB vs SB All-In, SB Limp scenarios ✓
 *
 * 25bb PDF (6 pages):
 *   RFI: all positions ✓
 *   VS_UTG_RFI / VS_MP_RFI / VS_LP_RFI: all hero positions ✓
 *   BVB: SB RFI, BB vs SB Limp, BB vs SB Raise ✓
 *   VS_3BET: NOT in PDF → simplified
 *
 * 40bb PDF (6 pages):
 *   RFI: all positions ✓
 *   VS_UTG_RFI / VS_MP_RFI / VS_LP_RFI: all hero positions ✓
 *   BVB: SB RFI, BB vs SB Limp, BB vs SB Raise ✓
 *   VS_3BET: NOT in PDF → simplified
 */

/**
 * Positions that have exact 15bb VS_3BET all-in response charts.
 * Source: 15bb PDF pages 6-7 ("Facing 3-bets - From EP" and "Facing 3-bets - From MP/LP").
 * SB and BB are NOT included — blind positions do not appear in the facing-3bet pages.
 */
const EXACT_15BB_3BET_HEROES = new Set<Position>([
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
]);

export function isSourceBackedMainStack(
  stackDepth: number
): stackDepth is SourceBackedMainStack {
  return (SOURCE_BACKED_MAIN_STACKS as readonly number[]).includes(stackDepth);
}

export function getStrategySourceStatus(
  chart: StrategyChartLike
): StrategySourceStatus {
  if (!isSourceBackedMainStack(chart.stackDepth)) {
    return "unsupported";
  }

  switch (chart.spotGroup) {
    case "RFI":
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      // All three stacks have exact PDF coverage for these families
      return "source_backed";

    case "VS_3BET":
      // Blind heroes (SB/BB) are never in the facing-3bet pages at any stack.
      if (["SB", "BB"].includes(chart.heroPosition)) {
        return "unsupported";
      }
      // 15bb has exact all-in response charts (pages 6–7 of 15bb PDF).
      if (
        chart.stackDepth === 15 &&
        EXACT_15BB_3BET_HEROES.has(chart.heroPosition as Position)
      ) {
        return "source_backed";
      }
      // 25bb/40bb VS_3BET: not in PDFs — simplified population layer.
      if (chart.stackDepth === 25 || chart.stackDepth === 40) {
        return "simplified";
      }
      return "unsupported";

    case "BVB":
      // All three stacks have BvB coverage in the PDFs
      return "source_backed";
  }
}

export function isSourceSupportedStrategyChart(chart: StrategyChartLike) {
  return getStrategySourceStatus(chart) !== "unsupported";
}

/** Human-readable label for the source status badge */
export function getSourceStatusLabel(status: StrategySourceStatus): string {
  switch (status) {
    case "source_backed":
      return "Exact Chart";
    case "simplified":
      return "Simplified Population";
    case "unsupported":
      return "Not Covered";
  }
}

/** Short description shown in tooltips / notes headers */
export function getSourceStatusDescription(
  status: StrategySourceStatus,
  stackDepth?: number
): string {
  switch (status) {
    case "source_backed":
      return `Backed by the ${stackDepth ?? ""}bb GTO chart PDF. Actions are exact.`;
    case "simplified":
      return "No exact chart for this spot. Guidance is population-derived from principles — practical, not solver-exact.";
    case "unsupported":
      return "This stack depth is not covered by the source charts.";
  }
}

/** Badge colour class for the source status */
export function getSourceStatusBadgeClass(status: StrategySourceStatus): string {
  switch (status) {
    case "source_backed":
      return "bg-emerald-600 text-white";
    case "simplified":
      return "bg-amber-500 text-white";
    case "unsupported":
      return "bg-zinc-500 text-white";
  }
}
