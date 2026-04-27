/**
 * shared/drillPacks.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Priority drill packs aligned with Challenging Poker Situations (Tier 3 source)
 * and the 15/25/40bb GTO PDFs (Tier 1 source).
 *
 * Each pack is tagged as either:
 *   "exact_source"   — backed by a specific chart in the 15/25/40bb PDFs
 *   "simplified"     — population-derived from principles; no exact PDF chart
 *
 * Do NOT mix these invisibly. The UI must surface the tag on every pack card.
 */

import {
  CANONICAL_SPOT_FAMILY_LABELS,
  type CanonicalSpotFamily,
} from "./preflopTaxonomy";
import {
  canonicalSpotContextFromChart,
  getCanonicalSpotId,
  type ChartLikeSpotContext,
} from "./spotIds";
import type { CanonicalLeakFamilyId } from "./leakFamilies";

export const PRIORITY_DRILL_PACK_IDS = [
  "sub-premiums-vs-ep-pressure",
  "15-20bb-small-pair-decisions",
  "25bb-vs-3bet-decisions",
  "40bb-vs-3bet-decisions",
  "30bb-broadways-vs-limper",
  "40bb-weak-ax-discipline",
  "bb-vs-sb-marginal-defense",
  "blind-vs-blind-execution",
  "range-perimeter-pack",
] as const;
export type PriorityDrillPackId = (typeof PRIORITY_DRILL_PACK_IDS)[number];

/**
 * exact_source  — directly backed by a chart in the 15/25/40bb PDF files
 * simplified    — population-derived from principles; no exact PDF chart
 */
export type PriorityPackSourceStatus = "exact_source" | "simplified";

export interface DrillPackSpotLike extends ChartLikeSpotContext {
  id: number;
  title: string;
}

export interface PriorityDrillPackDefinition {
  id: PriorityDrillPackId;
  title: string;
  /** One-sentence purpose — shown on mobile in place of full description */
  purpose: string;
  /** Short description for desktop cards */
  description: string;
  focusTags: string[];
  focusHandCodes: string[];
  relatedLeakFamilyIds: CanonicalLeakFamilyId[];
  families: CanonicalSpotFamily[];
  /** Exact PDF chart or simplified population guidance */
  sourceStatus: PriorityPackSourceStatus;
  match: (spot: DrillPackSpotLike) => boolean;
}

export interface ResolvedPriorityDrillPack extends PriorityDrillPackDefinition {
  chartIds: number[];
  spotCount: number;
  supported: boolean;
}

export const PRIORITY_DRILL_PACKS: PriorityDrillPackDefinition[] = [
  {
    id: "sub-premiums-vs-ep-pressure",
    title: "Sub-premiums vs EP Pressure",
    purpose: "99–JJ and AQ facing early-position opens and 3-bets.",
    description:
      "The most expensive recurring mistake in mid-stakes MTTs: calling or jamming with 99–JJ when the early-position range crushes you. Drill the exact 15bb all-in response charts and the 25/40bb population defaults.",
    focusTags: ["EP pressure", "99–JJ", "AQ"],
    focusHandCodes: ["99", "TT", "JJ", "AQs", "AQo", "AJs", "KQs"],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
    ],
    families: ["DEFEND_VS_RFI", "FACING_3BET"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          ((context.family === "DEFEND_VS_RFI" &&
            ["UTG", "UTG1", "MP"].includes(context.villainPosition ?? "")) ||
            (context.family === "FACING_3BET" && context.stackDepth === 15))
      );
    },
  },
  {
    id: "15-20bb-small-pair-decisions",
    title: "15–20bb Small Pair Decisions",
    purpose: "66–88 in the shallow rejam zone — jam or fold, never call.",
    description:
      "Small pairs at 15bb are jam-heavy but position-sensitive. 66–88 vs early-position opens should usually fold; vs late-position opens they often jam. The 15bb PDF gives exact thresholds — drill them.",
    focusTags: ["15bb exact", "66–88", "Rejam zone"],
    focusHandCodes: ["66", "77", "88"],
    relatedLeakFamilyIds: ["small_pair_jam_errors"],
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.stackDepth === 15 &&
          ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"].includes(
            context.family
          )
      );
    },
  },
  {
    id: "25bb-vs-3bet-decisions",
    title: "25bb vs 3-Bet Decisions",
    purpose: "Jam vs call vs fold when facing a 3-bet at 25bb — three families, one framework.",
    description:
      "No exact PDF chart exists for 25bb vs 3-bets. This pack uses simplified population defaults: jam 77+/AK/AQ/A5s-A4s, call pairs 22-66/suited aces/suited broadways/T9s-87s, fold the rest. Adjust by family: IP vs SB is widest, OOP is tightest.",
    focusTags: ["Simplified", "25bb", "vs 3-bet"],
    focusHandCodes: ["77", "88", "99", "AQs", "AQo", "AJs", "A5s", "A4s", "KQs", "T9s"],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
    ],
    families: ["FACING_3BET"],
    sourceStatus: "simplified" as PriorityPackSourceStatus,
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context?.family === "FACING_3BET" && spot.stackDepth === 25);
    },
  },
  {
    id: "40bb-vs-3bet-decisions",
    title: "40bb vs 3-Bet Decisions",
    purpose: "Stack-off spine at 40bb: QQ+/AK jam, JJ/TT/99 call, small pairs fold or call by position.",
    description:
      "No exact PDF chart exists for 40bb vs 3-bets. This pack uses simplified population defaults: jam QQ+/AK, call JJ/TT/99/AQs/AQo plus pairs and suited hands by family. IP vs SB is widest; OOP is tightest. JJ/TT are calls vs most 3-bets at this depth — do not jam them.",
    focusTags: ["Simplified", "40bb", "vs 3-bet"],
    focusHandCodes: ["QQ", "JJ", "TT", "99", "AKs", "AKo", "AQs", "AQo", "KQs", "88"],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
    ],
    families: ["FACING_3BET"],
    sourceStatus: "simplified" as PriorityPackSourceStatus,
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context?.family === "FACING_3BET" && spot.stackDepth === 40);
    },
  },
  {
    id: "30bb-broadways-vs-limper",
    title: "30bb Broadways vs Limper",
    purpose: "Iso sizing and hand selection when a limper enters the pot.",
    description:
      "Broadway hands around 30bb benefit from isolating limpers — but only with the right hands and the right sizing (4–5x + 1bb per limper). This pack is population-derived; no exact limp/iso chart exists in the PDFs.",
    focusTags: ["Simplified", "30bb", "Iso sizing"],
    focusHandCodes: ["KQs", "KQo", "QJs", "QJo", "JTs", "JTo", "AJo", "KJo"],
    relatedLeakFamilyIds: ["iso_vs_limper_selection_errors"],
    families: ["LIMP_ISO"],
    sourceStatus: "simplified",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context?.family === "LIMP_ISO" && [25, 40].includes(spot.stackDepth)
      );
    },
  },
  {
    id: "40bb-weak-ax-discipline",
    title: "40bb Weak Ax Discipline",
    purpose: "A2–A9 at 40bb: mostly fold vs EP; suited wheel aces are bluff candidates.",
    description:
      "Weak aces at 40bb are dominated traps vs early-position opens. A2s–A5s have blocker value as 3-bet bluffs in position; A6o–A9o vs UTG are usually folds. The 40bb PDF gives exact defend ranges — drill the boundary.",
    focusTags: ["40bb exact", "Weak Ax", "Discipline"],
    focusHandCodes: [
      "A2s", "A3s", "A4s", "A5s", "A6s", "A7s", "A8s", "A9s",
      "A2o", "A3o", "A4o", "A5o", "A6o", "A7o", "A8o", "A9o",
    ],
    relatedLeakFamilyIds: ["weak_ax_overplay"],
    families: ["DEFEND_VS_RFI"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.stackDepth === 40 &&
          context.family === "DEFEND_VS_RFI"
      );
    },
  },
  {
    id: "bb-vs-sb-marginal-defense",
    title: "BB Marginal Defense vs SB",
    purpose: "K9o, QTo, J8s — the hands that split the BB defend range.",
    description:
      "BB vs SB is the widest defend node but not a license to call everything. Marginal offsuit hands (K9o, Q8o) are close; marginal suited hands (K8s, J7s) usually defend. The BvB PDF pages give exact ranges for all three stacks.",
    focusTags: ["BvB exact", "Marginal hands", "BB defend"],
    focusHandCodes: ["K9o", "QTo", "Q9o", "J9o", "K8s", "Q8s", "J8s", "T8s", "97s"],
    relatedLeakFamilyIds: [
      "blind_defense_too_tight",
      "blind_defense_too_loose",
    ],
    families: ["BLIND_VS_BLIND"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.family === "BLIND_VS_BLIND" &&
          context.heroPosition === "BB"
      );
    },
  },
  {
    id: "blind-vs-blind-execution",
    title: "Blind vs Blind Execution",
    purpose: "SB open, BB defend, limp/raise, and all-in branches.",
    description:
      "BvB is the most complex preflop node — separate raise, limp, and all-in branches exist in all three PDFs. Drill the SB open range, BB defend vs raise, and the limp/jam thresholds as distinct decisions.",
    focusTags: ["BvB exact", "All stacks", "Execution"],
    focusHandCodes: ["A5o", "K9o", "Q8s", "J7s", "76s", "55", "22", "T8s"],
    relatedLeakFamilyIds: ["sb_vs_bb_incomplete_strategy"],
    families: ["BLIND_VS_BLIND"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context && context.family === "BLIND_VS_BLIND");
    },
  },
  {
    id: "range-perimeter-pack",
    title: "Range Perimeter Pack",
    purpose: "The hands just inside and just outside every open/defend threshold.",
    description:
      "The perimeter of a range is where population players leak the most chips. This pack targets the boundary hands across all positions and stacks — the ones that are correct in one spot and wrong in the next.",
    focusTags: ["All stacks", "Boundary hands", "High-frequency"],
    focusHandCodes: [
      "A9o", "KJo", "QJo", "JTo", "T9s", "98s", "87s", "76s",
      "A5s", "K9s", "Q9s", "J9s", "55", "44",
    ],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "blind_defense_too_loose",
      "btn_steal_too_tight",
    ],
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "BLIND_VS_BLIND"],
    sourceStatus: "exact_source",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          ["OPEN_RFI", "DEFEND_VS_RFI", "BLIND_VS_BLIND"].includes(context.family)
      );
    },
  },
];

export function getPriorityDrillPack(packId: string | null | undefined) {
  return PRIORITY_DRILL_PACKS.find(pack => pack.id === packId) ?? null;
}

export function resolvePriorityDrillPack(
  packId: PriorityDrillPackId,
  spots: DrillPackSpotLike[]
): ResolvedPriorityDrillPack | null {
  const pack = getPriorityDrillPack(packId);
  if (!pack) return null;

  const matchingSpots = spots.filter(spot => pack.match(spot));

  return {
    ...pack,
    chartIds: matchingSpots.map(spot => spot.id),
    spotCount: matchingSpots.length,
    supported: matchingSpots.length > 0,
  };
}

export function resolveAllPriorityDrillPacks(
  spots: DrillPackSpotLike[]
): ResolvedPriorityDrillPack[] {
  return PRIORITY_DRILL_PACKS.map(pack =>
    resolvePriorityDrillPack(pack.id, spots)
  ).filter((pack): pack is ResolvedPriorityDrillPack => Boolean(pack));
}

export function getRelatedPriorityDrillPacksForSpot(
  spot: DrillPackSpotLike,
  spots: DrillPackSpotLike[]
): ResolvedPriorityDrillPack[] {
  const context = canonicalSpotContextFromChart(spot);
  if (!context) return [];

  return resolveAllPriorityDrillPacks(spots)
    .filter(pack => pack.families.includes(context.family))
    .filter(pack => pack.chartIds.includes(spot.id) || pack.supported)
    .slice(0, 3);
}

export function buildPriorityPackSummary(pack: ResolvedPriorityDrillPack) {
  return `${pack.spotCount} spots · ${pack.families
    .map(family => CANONICAL_SPOT_FAMILY_LABELS[family])
    .join(", ")}`;
}

export function getCanonicalSpotIdsForPack(
  pack: ResolvedPriorityDrillPack,
  spots: DrillPackSpotLike[]
) {
  return spots
    .filter(spot => pack.chartIds.includes(spot.id))
    .map(spot => canonicalSpotContextFromChart(spot))
    .filter(Boolean)
    .map(context => getCanonicalSpotId(context!));
}

/** Human-readable badge label for the pack source status */
export function getDrillPackSourceLabel(status: PriorityPackSourceStatus): string {
  return status === "exact_source" ? "Exact Chart" : "Simplified Population";
}

/** Badge colour class for the pack source status */
export function getDrillPackSourceBadgeClass(status: PriorityPackSourceStatus): string {
  return status === "exact_source"
    ? "bg-emerald-600 text-white"
    : "bg-amber-500 text-white";
}
