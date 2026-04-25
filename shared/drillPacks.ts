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
import type { Position } from "./strategy";

export const PRIORITY_DRILL_PACK_IDS = [
  "sub-premiums-vs-ep-pressure",
  "15-20bb-small-pair-decisions",
  "30bb-broadways-vs-limper",
  "40bb-weak-ax-discipline",
  "bb-co-btn-boundary-defense",
  "blind-vs-blind-execution",
  "facing-3bet-threshold-pack",
  "range-perimeter-pack",
] as const;
export type PriorityDrillPackId = (typeof PRIORITY_DRILL_PACK_IDS)[number];

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
  match: (spot: DrillPackSpotLike) => boolean;
}

export interface ResolvedPriorityDrillPack extends PriorityDrillPackDefinition {
  chartIds: number[];
  spotCount: number;
  supported: boolean;
}

const BROADWAY_LIMPER_MATCHER = (spot: DrillPackSpotLike) =>
  canonicalSpotContextFromChart(spot)?.family === "LIMP_ISO" &&
  [25].includes(spot.stackDepth);

export const PRIORITY_DRILL_PACKS: PriorityDrillPackDefinition[] = [
  {
    id: "sub-premiums-vs-ep-pressure",
    title: "Sub-premiums vs Early-Position Pressure",
    purpose: "Resolve 99-JJ and AQ-type pressure spots against stronger opens and 3-bets.",
    focusTags: ["15-40bb", "EP / MP pressure", "Sub-premiums"],
    focusHandCodes: ["99", "TT", "JJ", "AQs", "AQo", "AJs", "KQs"],
    relatedLeakFamilyIds: [
      "sub_premium_vs_pressure_mistakes",
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
    ],
    families: ["DEFEND_VS_RFI", "FACING_3BET"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          ["DEFEND_VS_RFI", "FACING_3BET"].includes(context.family) &&
          ["UTG", "MP"].includes(context.villainPosition ?? "")
      );
    },
  },
  {
    id: "15-20bb-small-pair-decisions",
    title: "15-20bb Small Pair Decisions",
    purpose: "Sharpen the 66-88 region in open, defend, and jam-heavy structures.",
    focusTags: ["15-20bb", "Pairs", "Thresholds"],
    focusHandCodes: ["66", "77", "88"],
    relatedLeakFamilyIds: ["small_pair_jam_errors"],
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          [15, 20].includes(context.stackDepth) &&
          ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"].includes(
            context.family
          )
      );
    },
  },
  {
    id: "30bb-broadways-vs-limper",
    title: "30bb Broadways vs Limper",
    purpose: "Study broadway selection after limps without inventing unsupported iso charts.",
    focusTags: ["25-30bb", "Limp / Iso", "Broadways"],
    focusHandCodes: ["KQs", "KQo", "QJs", "QJo", "JTs", "JTo"],
    relatedLeakFamilyIds: ["iso_vs_limper_selection_errors"],
    families: ["LIMP_ISO"],
    match: BROADWAY_LIMPER_MATCHER,
  },
  {
    id: "40bb-weak-ax-discipline",
    title: "40bb Weak Ax Discipline",
    purpose: "Keep A2-A9 from drifting into automatic continues at 40bb.",
    focusTags: ["40bb", "Weak Ax", "Discipline"],
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
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.stackDepth === 40 &&
          ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET"].includes(context.family)
      );
    },
  },
  {
    id: "bb-co-btn-boundary-defense",
    title: "BB vs CO / BTN Boundary Defense",
    purpose: "Drill the fold-versus-defend edge where offsuit junk and playable suiteds split.",
    focusTags: ["BB", "CO / BTN", "Boundary hands"],
    focusHandCodes: ["K9o", "QTo", "J9o", "J8s", "T7s", "97s", "A2s", "K6s"],
    relatedLeakFamilyIds: [
      "blind_defense_too_tight",
      "blind_defense_too_loose",
    ],
    families: ["DEFEND_VS_RFI"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          context.family === "DEFEND_VS_RFI" &&
          context.heroPosition === "BB" &&
          ["CO", "BTN"].includes(context.villainPosition ?? "")
      );
    },
  },
  {
    id: "blind-vs-blind-execution",
    title: "Blind vs Blind Execution",
    purpose: "Clean up small-blind initiative and big-blind response plans in the widest branch in the tree.",
    focusTags: ["BvB", "Execution", "SB / BB"],
    focusHandCodes: ["A5o", "K9o", "Q8s", "J7s", "76s", "55", "22"],
    relatedLeakFamilyIds: ["sb_vs_bb_incomplete_strategy"],
    families: ["BLIND_VS_BLIND"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context && context.family === "BLIND_VS_BLIND");
    },
  },
  {
    id: "facing-3bet-threshold-pack",
    title: "Facing 3-Bet Threshold Pack",
    purpose: "Separate jam, call, and fold branches in the nodes players guess at most often.",
    focusTags: ["3-Bets", "Thresholds", "Jam / Call / Fold"],
    focusHandCodes: ["77", "88", "99", "TT", "JJ", "AQs", "AQo", "A5s", "KQs"],
    relatedLeakFamilyIds: [
      "facing_3bet_overcalls",
      "facing_3bet_overfolds",
      "four_bet_jam_threshold_errors",
    ],
    families: ["FACING_3BET"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(context && context.family === "FACING_3BET");
    },
  },
  {
    id: "range-perimeter-pack",
    title: "Range Perimeter Pack",
    purpose: "Train the pure edge-of-range hands instead of memorizing only the obvious value region.",
    focusTags: ["Perimeter", "Boundary Hands", "Review"],
    focusHandCodes: [
      "A8o",
      "A5s",
      "KTo",
      "K9s",
      "QTo",
      "Q9s",
      "J9s",
      "T8s",
      "55",
      "44",
    ],
    relatedLeakFamilyIds: [
      "early_position_open_too_loose",
      "early_position_open_too_tight",
      "btn_steal_too_loose",
      "btn_steal_too_tight",
    ],
    families: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"],
    match: spot => {
      const context = canonicalSpotContextFromChart(spot);
      return Boolean(
        context &&
          ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "BLIND_VS_BLIND"].includes(
            context.family
          )
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
