import type { Action } from "./strategy";
import type { CanonicalSpotContext } from "./spotIds";
import type { CanonicalSpotFamily } from "./preflopTaxonomy";

export const LEAK_FAMILY_IDS = [
  "blind_defense_too_tight",
  "blind_defense_too_loose",
  "weak_ax_overplay",
  "small_pair_jam_errors",
  "sub_premium_vs_pressure_mistakes",
  "btn_steal_too_tight",
  "btn_steal_too_loose",
  "sb_vs_bb_incomplete_strategy",
  "facing_3bet_overcalls",
  "facing_3bet_overfolds",
  "iso_vs_limper_selection_errors",
  "push_fold_discipline_gaps",
  "overcalling_multiway_junk",
  "early_position_open_too_loose",
  "early_position_open_too_tight",
  "four_bet_jam_threshold_errors",
] as const;
export type CanonicalLeakFamilyId = (typeof LEAK_FAMILY_IDS)[number];

export interface LeakFamilyDefinition {
  id: CanonicalLeakFamilyId;
  label: string;
  description: string;
  tags: string[];
  relatedPackIds: string[];
  relatedFamilies: CanonicalSpotFamily[];
  commonSymptoms: string[];
  drillRecommendation: string;
  severity: "low" | "medium" | "high";
  frequency: "watch" | "recurring" | "urgent";
  stageRelevance: string;
}

export const LEAK_FAMILIES: LeakFamilyDefinition[] = [
  {
    id: "blind_defense_too_tight",
    label: "Blind Defense Too Tight",
    description: "Folding too many profitable BB or SB continues against late-position pressure.",
    tags: ["Blind Defense", "Boundary Hands"],
    relatedPackIds: ["bb-vs-sb-marginal-defense", "blind-vs-blind-execution"],
    relatedFamilies: ["DEFEND_VS_RFI", "BLIND_VS_BLIND"],
    commonSymptoms: ["BB folds too often vs CO/BTN", "Missed suited and connected continues"],
    drillRecommendation: "Start with the BB vs CO / BTN Boundary Defense pack.",
    severity: "high",
    frequency: "recurring",
    stageRelevance: "Most expensive in daily volume because it repeats constantly.",
  },
  {
    id: "blind_defense_too_loose",
    label: "Blind Defense Too Loose",
    description: "Continuing with offsuit junk that never realizes well enough from the blinds.",
    tags: ["Blind Defense", "Discipline"],
    relatedPackIds: ["bb-vs-sb-marginal-defense", "blind-vs-blind-execution"],
    relatedFamilies: ["DEFEND_VS_RFI", "BLIND_VS_BLIND"],
    commonSymptoms: ["Calling offsuit trash from BB", "Over-defending Kx/Qx against strong opens"],
    drillRecommendation: "Use the BB vs CO / BTN Boundary Defense pack and watch the offsuit perimeter.",
    severity: "high",
    frequency: "recurring",
    stageRelevance: "Common when trying to 'not be exploitable' without checking realization.",
  },
  {
    id: "weak_ax_overplay",
    label: "Weak Ax Overplay",
    description: "Turning weak aces into automatic continues when stack depth or domination risk says no.",
    tags: ["Ax", "40bb"],
    relatedPackIds: ["40bb-weak-ax-discipline"],
    relatedFamilies: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET"],
    commonSymptoms: ["A2-A9 over-continued", "Weak Ax turned into thin 3-bets or calls"],
    drillRecommendation: "Run the 40bb Weak Ax Discipline pack until the fringe feels routine.",
    severity: "medium",
    frequency: "recurring",
    stageRelevance: "Shows up more at 25-40bb where weak aces look playable everywhere.",
  },
  {
    id: "small_pair_jam_errors",
    label: "Small Pair Jam Errors",
    description: "Missing or forcing jams with 66-88 when stack depth is doing most of the work.",
    tags: ["15-20bb", "Pairs"],
    relatedPackIds: ["15-20bb-small-pair-decisions"],
    relatedFamilies: ["OPEN_RFI", "DEFEND_VS_RFI", "FACING_3BET", "PUSH_FOLD"],
    commonSymptoms: ["Passing profitable re-jams", "Flatting pairs that should jam or fold"],
    drillRecommendation: "Use the 15-20bb Small Pair Decisions pack.",
    severity: "high",
    frequency: "urgent",
    stageRelevance: "High leverage whenever stacks shorten and pair equity changes fast.",
  },
  {
    id: "sub_premium_vs_pressure_mistakes",
    label: "Sub-Premium vs Pressure Mistakes",
    description: "Misplaying 99-JJ and AQ/AJ-type hands versus strong opens or 3-bets.",
    tags: ["99-JJ", "AQ"],
    relatedPackIds: ["sub-premiums-vs-ep-pressure", "facing-3bet-threshold-pack"],
    relatedFamilies: ["DEFEND_VS_RFI", "FACING_3BET"],
    commonSymptoms: ["Flatting too wide versus EP", "Folding clear continues under pressure"],
    drillRecommendation: "Run the Sub-premiums vs Early-Position Pressure pack first.",
    severity: "high",
    frequency: "urgent",
    stageRelevance: "Classic MTT leak because these hands feel too strong to misplay.",
  },
  {
    id: "btn_steal_too_tight",
    label: "BTN Steal Too Tight",
    description: "Leaving profitable late-position opens on the table.",
    tags: ["BTN", "Steal"],
    relatedPackIds: [],
    relatedFamilies: ["OPEN_RFI"],
    commonSymptoms: ["BTN folding suited trash that should open", "Missing easy steals"],
    drillRecommendation: "Review BTN RFI against the source-backed opening charts.",
    severity: "medium",
    frequency: "watch",
    stageRelevance: "Volume leak that quietly bleeds win-rate over time.",
  },
  {
    id: "btn_steal_too_loose",
    label: "BTN Steal Too Loose",
    description: "Opening hands from BTN that look fun but fail once blinds fight back.",
    tags: ["BTN", "Discipline"],
    relatedPackIds: [],
    relatedFamilies: ["OPEN_RFI"],
    commonSymptoms: ["Offsuit trash opened too often", "Fringe hands defended poorly after 3-bets"],
    drillRecommendation: "Review BTN RFI against the source-backed opening charts and trim dominated offsuit opens first.",
    severity: "medium",
    frequency: "recurring",
    stageRelevance: "Shows up when trying to widen steals without enough blocker or playability quality.",
  },
  {
    id: "sb_vs_bb_incomplete_strategy",
    label: "SB vs BB Incomplete Strategy",
    description: "Missing the structured mix between complete, raise, jam, and defend in blind battles.",
    tags: ["BvB", "Execution"],
    relatedPackIds: ["blind-vs-blind-execution"],
    relatedFamilies: ["BLIND_VS_BLIND"],
    commonSymptoms: ["Autopilot in blind battles", "No clear plan between limp/raise/jam"],
    drillRecommendation: "Use the Blind vs Blind Execution pack.",
    severity: "high",
    frequency: "recurring",
    stageRelevance: "Especially important once stacks shorten and BvB nodes speed up.",
  },
  {
    id: "facing_3bet_overcalls",
    label: "Facing 3-Bet Overcalls",
    description: "Continuing too passively versus 3-bets with hands that should mostly fold.",
    tags: ["3-Bet", "Overcalls"],
    relatedPackIds: ["facing-3bet-threshold-pack"],
    relatedFamilies: ["FACING_3BET"],
    commonSymptoms: ["Flatting dominated broadways", "Calling shallow when jam/fold should dominate"],
    drillRecommendation: "Use Facing 3-Bet Threshold Pack.",
    severity: "high",
    frequency: "urgent",
    stageRelevance: "Very costly under ICM because bad calls get punished immediately.",
  },
  {
    id: "facing_3bet_overfolds",
    label: "Facing 3-Bet Overfolds",
    description: "Folding too many hands that should continue as jams or strong flats.",
    tags: ["3-Bet", "Overfolds"],
    relatedPackIds: ["facing-3bet-threshold-pack", "sub-premiums-vs-ep-pressure"],
    relatedFamilies: ["FACING_3BET"],
    commonSymptoms: ["Giving up blocker jams", "Over-trimming strong suited broadways and pairs"],
    drillRecommendation: "Use Facing 3-Bet Threshold Pack and compare jam vs call thresholds.",
    severity: "medium",
    frequency: "recurring",
    stageRelevance: "Common after a player gets punished once and starts over-tightening.",
  },
  {
    id: "iso_vs_limper_selection_errors",
    label: "Iso vs Limper Sizing/Selection Errors",
    description: "Attacking limps with the wrong hands or wrong pressure profile.",
    tags: ["Limp / Iso"],
    relatedPackIds: ["30bb-broadways-vs-limper"],
    relatedFamilies: ["LIMP_ISO"],
    commonSymptoms: ["Over-isolating weak broadways", "No clear value-vs-realization plan"],
    drillRecommendation: "Use the 30bb Broadways vs Limper pack when limp/iso charts are available.",
    severity: "medium",
    frequency: "watch",
    stageRelevance: "Useful once limper coverage is added to the app.",
  },
  {
    id: "push_fold_discipline_gaps",
    label: "Push/Fold Discipline Gaps",
    description: "Missing profitable short-stack shoves or calling too wide versus them.",
    tags: ["Push/Fold", "<=10bb"],
    relatedPackIds: [],
    relatedFamilies: ["PUSH_FOLD"],
    commonSymptoms: ["Passing profitable jams", "Calling off too loose from the blind"],
    drillRecommendation: "Open Push/Fold Mode and drill the documented short-stack threshold directly.",
    severity: "high",
    frequency: "urgent",
    stageRelevance: "Highest leverage in late-stage tournaments and fast-structure spots.",
  },
  {
    id: "overcalling_multiway_junk",
    label: "Overcalling Multiway Junk",
    description: "Continuing with hands that only look playable because several players are in the pot.",
    tags: ["Discipline", "Defend"],
    relatedPackIds: [],
    relatedFamilies: ["DEFEND_VS_RFI"],
    commonSymptoms: ["Offsuit junk defended because price looks tempting", "Weak suited junk dragged into messy pots"],
    drillRecommendation: "Review the exact defend chart and remove the weakest realization hands first.",
    severity: "medium",
    frequency: "watch",
    stageRelevance: "Mostly a review leak, but it still shapes future ranges.",
  },
  {
    id: "early_position_open_too_loose",
    label: "Early Position Open Too Loose",
    description: "Opening too many dominated hands from UTG / UTG+1 / MP.",
    tags: ["EP", "Open"],
    relatedPackIds: [],
    relatedFamilies: ["OPEN_RFI"],
    commonSymptoms: ["Loose offsuit Ax opens", "Weak Kx/Qx opens from EP"],
    drillRecommendation: "Review the earliest source-backed RFI charts and remove dominated offsuit opens first.",
    severity: "high",
    frequency: "recurring",
    stageRelevance: "Quietly expensive because it poisons every downstream branch.",
  },
  {
    id: "early_position_open_too_tight",
    label: "Early Position Open Too Tight",
    description: "Over-trimming profitable EP opens and leaving EV on the table.",
    tags: ["EP", "Open"],
    relatedPackIds: [],
    relatedFamilies: ["OPEN_RFI"],
    commonSymptoms: ["Missing standard pair and suited broadway opens", "Too risk-averse from UTG/MP"],
    drillRecommendation: "Review the earliest source-backed RFI charts and add back the standard pair and broadway opens.",
    severity: "medium",
    frequency: "watch",
    stageRelevance: "Usually follows a stretch of punishing runouts or aggressive tables.",
  },
  {
    id: "four_bet_jam_threshold_errors",
    label: "4-Bet / Jam Threshold Errors",
    description: "Misjudging the exact stack-off threshold in high-pressure preflop spots.",
    tags: ["4-Bet", "Jam"],
    relatedPackIds: ["facing-3bet-threshold-pack"],
    relatedFamilies: ["FOUR_BET_JAM", "FACING_3BET"],
    commonSymptoms: ["Stacking off too light", "Passing profitable blocker jams"],
    drillRecommendation: "Use Facing 3-Bet Threshold Pack and Push/Fold Mode for the shortest stacks.",
    severity: "high",
    frequency: "watch",
    stageRelevance: "Shows up most under pressure, ICM, and late-position leveling wars.",
  },
];

export function getLeakFamily(
  leakFamilyId: CanonicalLeakFamilyId | string | null | undefined
) {
  return LEAK_FAMILIES.find(leak => leak.id === leakFamilyId) ?? null;
}

export function findLeakFamilyByLabel(label: string | null | undefined) {
  if (!label) return null;
  const normalized = label.trim().toLowerCase();
  return (
    LEAK_FAMILIES.find(
      leak =>
        leak.label.trim().toLowerCase() === normalized ||
        leak.id.trim().toLowerCase() === normalized
    ) ?? null
  );
}

function isWeakAx(handCode: string) {
  return /^A[2-9][so]?$/.test(handCode);
}

function isSmallPair(handCode: string) {
  return ["66", "77", "88"].includes(handCode);
}

function isSubPremium(handCode: string) {
  return ["99", "TT", "JJ", "AQs", "AQo", "AJs"].includes(handCode);
}

export function suggestLeakFamilyFromTrainerMiss(input: {
  context: CanonicalSpotContext;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
}): CanonicalLeakFamilyId | null {
  const { context, handCode, selectedAction, correctAction } = input;

  if (context.family === "PUSH_FOLD" || context.stackDepth <= 10) {
    return "push_fold_discipline_gaps";
  }

  if (
    context.family === "DEFEND_VS_RFI" &&
    context.heroPosition === "BB" &&
    (context.villainPosition === "CO" || context.villainPosition === "BTN")
  ) {
    if (selectedAction === "FOLD" && correctAction !== "FOLD") {
      return "blind_defense_too_tight";
    }
    if (selectedAction !== "FOLD" && correctAction === "FOLD") {
      return "blind_defense_too_loose";
    }
  }

  if (context.family === "OPEN_RFI" && context.heroPosition === "BTN") {
    if (selectedAction === "FOLD" && correctAction !== "FOLD") {
      return "btn_steal_too_tight";
    }
    if (selectedAction !== "FOLD" && correctAction === "FOLD") {
      return "btn_steal_too_loose";
    }
  }

  if (
    context.family === "OPEN_RFI" &&
    ["UTG", "UTG1", "MP"].includes(context.heroPosition)
  ) {
    if (selectedAction !== "FOLD" && correctAction === "FOLD") {
      return "early_position_open_too_loose";
    }
    if (selectedAction === "FOLD" && correctAction !== "FOLD") {
      return "early_position_open_too_tight";
    }
  }

  if (context.family === "FACING_3BET") {
    if (selectedAction === "CALL" && correctAction === "FOLD") {
      return "facing_3bet_overcalls";
    }
    if (selectedAction === "FOLD" && correctAction !== "FOLD") {
      return "facing_3bet_overfolds";
    }
    if (isSubPremium(handCode)) {
      return "sub_premium_vs_pressure_mistakes";
    }
  }

  if (isSmallPair(handCode) && context.stackDepth <= 20) {
    return "small_pair_jam_errors";
  }

  if (context.stackDepth >= 40 && isWeakAx(handCode)) {
    return "weak_ax_overplay";
  }

  if (context.family === "BLIND_VS_BLIND") {
    return "sb_vs_bb_incomplete_strategy";
  }

  if (context.family === "LIMP_ISO") {
    return "iso_vs_limper_selection_errors";
  }

  if (
    context.family === "FOUR_BET_JAM" ||
    (context.family === "FACING_3BET" &&
      (correctAction === "JAM" || selectedAction === "JAM"))
  ) {
    return "four_bet_jam_threshold_errors";
  }

  return null;
}

export function suggestLeakFamilyFromHandLog(input: {
  context: CanonicalSpotContext;
  handCode: string;
}): CanonicalLeakFamilyId | null {
  const { context, handCode } = input;

  if (context.family === "PUSH_FOLD" || context.stackDepth <= 10) {
    return "push_fold_discipline_gaps";
  }

  if (
    context.family === "DEFEND_VS_RFI" &&
    context.heroPosition === "BB" &&
    (context.villainPosition === "CO" || context.villainPosition === "BTN")
  ) {
    return "blind_defense_too_tight";
  }

  if (context.family === "BLIND_VS_BLIND") {
    return "sb_vs_bb_incomplete_strategy";
  }

  if (isSmallPair(handCode) && context.stackDepth <= 20) {
    return "small_pair_jam_errors";
  }

  if (isSubPremium(handCode) && context.villainPosition) {
    return "sub_premium_vs_pressure_mistakes";
  }

  if (context.stackDepth >= 40 && isWeakAx(handCode)) {
    return "weak_ax_overplay";
  }

  return null;
}
