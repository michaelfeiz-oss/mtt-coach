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
  "30bb-broadways-vs-limper",
  "40bb-weak-ax-discipline",
  "bb-vs-sb-marginal-defense",
  "blind-vs-blind-execution",
  "facing-3bet-threshold-pack",
] as const;
export type PriorityDrillPackId = (typeof PRIORITY_DRILL_PACK_IDS)[number];

export type PriorityPackSourceStatus =
  | "source_backed"
  | "hybrid_supported"
  | "coverage_gap";

export interface DrillPackSpotLike extends ChartLikeSpotContext {
  id: number;
  title: string;
}

export interface PriorityDrillPackDefinition {
  id: PriorityDrillPackId;
  title: string;
  purpose: string;
  focusTags: string[];
  focusHandCodes: string[];
  relatedLeakFamilyIds: CanonicalLeakFamilyId[];
  families: CanonicalSpotFamily[];
  sourceStatus: PriorityPackSourceStatus;
  match: (spot: DrillPackSpotLike) => boolean;
}

export interface ResolvedPriorityDrillPack extends PriorityDrillPackDefinition {
  chartIds: number[];
  spotCount: number;
  supported: boolean;
}

const LIMPER_BROADWAY_MATCHER = (spot: DrillPackSpotLike) =>
  canonicalSpotContextFromChart(spot)?.family === "LIMP_ISO" &&
  [25].includes(spot.stackDepth);

export const PRIORITY_DRILL_PACKS: PriorityDrillPackDefinition[] = [
  {
    id: "sub-premiums-vs-ep-pressure",
    title: "Sub-premiums vs Early-Position Pressure",
    purpose:
      "Built from the challenging spot theme around 99-JJ and AQ-type hands facing stronger early-position pressure, then extended through the simplified 25bb/40bb facing-3-bet layer.",
    focusTags: ["Hybrid", "EP pressure", "99-JJ / AQ"],
    focusHandCodes: ["99", "TT", "JJ", "AQs", "AQo", "AJs", "KQs"],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
    ],
    families: ["DEFEND_VS_RFI", "FACING_3BET"],
    sourceStatus: "hybrid_supported",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          ((context.family === "DEFEND_VS_RFI" &&
            ["UTG", "MP"].includes(context.villainPosition ?? "")) ||
            (context.family === "FACING_3BET" &&
              [15, 25, 40].includes(context.stackDepth)))
      );
    },
  },
  {
    id: "15-20bb-small-pair-decisions",
    title: "15-20bb Small Pair Decisions",
    purpose:
      "Tracks the source theme around 66-88 in the shallow rejam zone. Exact chart support is currently anchored to the 15bb chart set.",
    focusTags: ["Source-backed", "15bb exact charts", "66-88"],
    focusHandCodes: ["66", "77", "88"],
    relatedLeakFamilyIds: ["small_pair_jam_errors"],
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"],
    sourceStatus: "source_backed",
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
    id: "30bb-broadways-vs-limper",
    title: "30bb Broadways vs Limper",
    purpose:
      "This challenging spot is explicitly in the source material, but exact main-chart limp/iso coverage is still unresolved in the current dataset.",
    focusTags: ["Coverage gap", "30bb theme", "Broadways vs limper"],
    focusHandCodes: ["KQs", "KQo", "QJs", "QJo", "JTs", "JTo"],
    relatedLeakFamilyIds: ["iso_vs_limper_selection_errors"],
    families: ["LIMP_ISO"],
    sourceStatus: "coverage_gap",
    match: LIMPER_BROADWAY_MATCHER,
  },
  {
    id: "40bb-weak-ax-discipline",
    title: "40bb Weak Ax Discipline",
    purpose:
      "Built from the source theme around A2-A9 in late-position, 40bb decision spots facing late-position pressure.",
    focusTags: ["Source-backed", "40bb", "Weak Ax"],
    focusHandCodes: [
      "A2s",
      "A3s",
      "A4s",
      "A5s",
      "A6s",
      "A7s",
      "A8s",
      "A9s",
      "A2o",
      "A3o",
      "A4o",
      "A5o",
      "A6o",
      "A7o",
      "A8o",
      "A9o",
    ],
    relatedLeakFamilyIds: ["weak_ax_overplay"],
    families: ["DEFEND_VS_RFI"],
    sourceStatus: "source_backed",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.stackDepth === 40 &&
          context.family === "DEFEND_VS_RFI" &&
          ["CO", "BTN"].includes(context.villainPosition ?? "")
      );
    },
  },
  {
    id: "bb-vs-sb-marginal-defense",
    title: "BB vs SB Marginal Defense",
    purpose:
      "Built from the source theme around K9/QT-type marginal big-blind decisions versus small-blind pressure.",
    focusTags: ["Source-backed", "BvB", "Marginal hands"],
    focusHandCodes: ["K9o", "QTo", "Q9o", "J9o", "K8s", "Q8s", "J8s", "T8s"],
    relatedLeakFamilyIds: [
      "blind_defense_too_tight",
      "blind_defense_too_loose",
    ],
    families: ["BLIND_VS_BLIND"],
    sourceStatus: "source_backed",
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
    purpose:
      "Keeps the dedicated blind-versus-blind source pages in one repeatable drill surface.",
    focusTags: ["Source-backed", "Blind vs blind", "Execution"],
    focusHandCodes: ["A5o", "K9o", "Q8s", "J7s", "76s", "55", "22"],
    relatedLeakFamilyIds: ["sb_vs_bb_incomplete_strategy"],
    families: ["BLIND_VS_BLIND"],
    sourceStatus: "source_backed",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context && context.family === "BLIND_VS_BLIND");
    },
  },
  {
    id: "facing-3bet-threshold-pack",
    title: "Facing 3-Bet Threshold Pack",
    purpose:
      "Combines the exact 15bb facing-3-bet pages with the simplified 25bb/40bb population upgrade so threshold hands can be drilled across the main stacks.",
    focusTags: ["Hybrid", "15bb exact", "25/40 simplified"],
    focusHandCodes: ["77", "88", "99", "TT", "JJ", "AQs", "AQo", "A5s", "KQs"],
    relatedLeakFamilyIds: [
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
      "four_bet_jam_threshold_errors",
    ],
    families: ["FACING_3BET"],
    sourceStatus: "hybrid_supported",
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.family === "FACING_3BET" &&
          [15, 25, 40].includes(context.stackDepth)
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
