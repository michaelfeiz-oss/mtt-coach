/**
 * shared/spotNotes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Notes engine for the MTT Coach strategy module.
 *
 * Design rules (from product spec):
 *  - One short paragraph max per field — no filler, no obvious generic advice
 *  - Must feel specific to: spot family, position, stack, node type
 *  - Use simplified population language for non-exact nodes
 *  - Notes must be shorter on mobile (accordion collapse handled in UI)
 *  - Source status is surfaced here so UI can badge correctly
 */

import { isBlind, isEarlyPosition, isLatePosition } from "./preflopTaxonomy";
import {
  buildCanonicalSpotLabel,
  canonicalSpotContextFromChart,
  getCanonicalSpotId,
  type CanonicalSpotContext,
  type ChartLikeSpotContext,
} from "./spotIds";
import { displayPositionLabel } from "./strategy";
import {
  getStrategySourceStatus,
  getSourceStatusLabel,
  type StrategySourceStatus,
} from "./sourceTruth";
import type { SpotGroup } from "./strategy";

// ─── Public interface ─────────────────────────────────────────────────────────

export interface StudySpotNote {
  spotId: string;
  title: string;
  /** Exact vs Simplified Population badge */
  sourceStatus: StrategySourceStatus;
  sourceLabel: string;
  /** One sentence — the main takeaway for this spot */
  coreIdea: string;
  /** What to do by default with the majority of hands in this spot */
  defaultLine: string;
  /** One specific adjustment vs a known population tendency */
  exploitLever: string;
  /** The single most common mistake in this spot */
  commonPunt: string;
  /** A concrete drill prompt for the trainer */
  drillCue: string;
  /** Optional — only for bubble/FT spots */
  stageAdjustment?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function h(context: CanonicalSpotContext) {
  return displayPositionLabel(context.heroPosition);
}

function v(context: CanonicalSpotContext) {
  return context.villainPosition
    ? displayPositionLabel(context.villainPosition)
    : "the field";
}

function stackNote(stackDepth: number): string {
  if (stackDepth <= 15) return "At 15bb, every decision is a commitment threshold — clean binary thinking beats feel.";
  if (stackDepth <= 25) return "At 25bb, dominated offsuit hands lose value fast once pressure arrives.";
  return "At 40bb, position and hand quality still outweigh curiosity.";
}

function sourceStatusForContext(context: CanonicalSpotContext): StrategySourceStatus {
  const spotGroupMap: Record<string, SpotGroup> = {
    OPEN_RFI: "RFI",
    DEFEND_VS_RFI: "VS_UTG_RFI",
    FACING_3BET: "VS_3BET",
    BLIND_VS_BLIND: "BVB",
  };
  const spotGroup = spotGroupMap[context.family] ?? "RFI";
  return getStrategySourceStatus({
    stackDepth: context.stackDepth,
    spotGroup,
    heroPosition: context.heroPosition,
    villainPosition: context.villainPosition,
  });
}

// ─── Note builders ────────────────────────────────────────────────────────────

function buildOpenRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = h(context);
  const early = isEarlyPosition(context.heroPosition);
  const late = isLatePosition(context.heroPosition);
  const blind = isBlind(context.heroPosition);
  const status = sourceStatusForContext(context);

  let coreIdea: string;
  let defaultLine: string;
  let exploitLever: string;
  let commonPunt: string;

  if (early) {
    coreIdea = `${hero} opens a tight, value-dense range — the players left to act are many and your position is the worst at the table.`;
    defaultLine = `Raise your clear value hands and fold the dominated offsuit broadways. ${stackNote(context.stackDepth)}`;
    exploitLever = "If the table is passive and short-stacked, you can widen slightly with suited connectors, but do not open limp — take the lead or fold.";
    commonPunt = "Opening KJo, QTo, or A9o from UTG because they 'look playable' — they are dominated traps against the ranges that continue.";
  } else if (late) {
    coreIdea = `${hero} opens wide — position is your biggest asset and the blinds are forced to defend out of position.`;
    defaultLine = `Open all pairs, all suited aces, most suited broadways, and suited connectors down to 54s. Fold the weakest offsuit junk. ${stackNote(context.stackDepth)}`;
    exploitLever = "Against nit blinds, widen further and steal aggressively. Against aggressive re-shove blinds, tighten the bottom of your range.";
    commonPunt = "Limping in late position because the hand 'isn't strong enough to raise' — limp/calling is a dominated strategy at 15–40bb.";
  } else if (blind) {
    coreIdea = `SB opens into a single opponent with the worst post-flop position — raise strong hands, complete selectively, never limp/fold.`;
    defaultLine = `Raise your value hands and strong speculative hands. Complete suited connectors and small pairs cheaply. ${stackNote(context.stackDepth)}`;
    exploitLever = "Against a passive BB, widen your raise range and steal more. Against a squeeze-happy BB, tighten the bluff raises.";
    commonPunt = "Limping with hands strong enough to raise, then calling a raise out of position — you lose the initiative and the position edge at once.";
  } else {
    coreIdea = `${hero} sits in the middle bucket — open the hands that keep initiative and avoid domination.`;
    defaultLine = `Raise pairs, suited aces, suited broadways, and suited connectors. Fold the weakest offsuit hands. ${stackNote(context.stackDepth)}`;
    exploitLever = "Widen as the table tightens behind you. Tighten when aggressive 3-bettors are in the blinds.";
    commonPunt = "Opening offsuit hands that look like 'almost good' — A7o, K9o, QJo from HJ — and then facing a 3-bet with no clean plan.";
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea,
    defaultLine,
    exploitLever,
    commonPunt,
    drillCue: `Drill the fringe hands in this range — the ones just inside and just outside the open threshold. Those are the decisions that compound over a tournament.`,
  };
}

function buildDefendVsRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = h(context);
  const villain = v(context);
  const isBB = context.heroPosition === "BB";
  const isVsEP = isEarlyPosition(context.villainPosition);
  const isVsLP = isLatePosition(context.villainPosition);
  const status = sourceStatusForContext(context);

  let coreIdea: string;
  let defaultLine: string;
  let exploitLever: string;
  let commonPunt: string;

  if (isBB && isVsLP) {
    coreIdea = `BB vs ${villain} is your widest defend node — you close the action, get the best price, and have the most realization potential, but you play every flop out of position.`;
    defaultLine = `Defend suited hands, pairs, and connected broadways. Fold weak offsuit hands (K4o, Q7o, J5o) — the price doesn't justify the post-flop disadvantage. ${stackNote(context.stackDepth)}`;
    exploitLever = "Against a wide BTN/CO steal, add suited connectors and small pairs. Against a tight opener, tighten your defend range to hands that realize well.";
    commonPunt = "Defending every two cards because you're getting 2:1 — the price is good but dominated offsuit hands still lose money out of position.";
  } else if (isBB && isVsEP) {
    coreIdea = `BB vs ${villain} EP open — the opener's range is strong, so your continue range must be tighter than it looks.`;
    defaultLine = `Continue with pairs, suited aces, suited broadways, and strong suited connectors. Fold weak offsuit hands and dominated aces. ${stackNote(context.stackDepth)}`;
    exploitLever = "If the opener is a nit, tighten further. If they're opening wide from EP, add more suited hands but keep the offsuit trash folded.";
    commonPunt = "Defending A7o, K8o, or QTo vs a UTG open because they 'have an ace' or 'have a king' — dominated hands lose big pots.";
  } else {
    coreIdea = `${hero} vs ${villain} — respect opener strength first, then evaluate your hand's realization potential.`;
    defaultLine = `Continue with hands that realize well in position or have strong equity. Fold marginal offsuit hands out of position. ${stackNote(context.stackDepth)}`;
    exploitLever = "Later-position opens allow more defense; earlier-position opens demand more discipline. Adjust your continue range accordingly.";
    commonPunt = "Continuing with dominated offsuit broadways because they 'have two high cards' — they lose big pots and win small ones.";
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea,
    defaultLine,
    exploitLever,
    commonPunt,
    drillCue: `${h(context)} vs ${villain}: drill the boundary hands — the ones just inside and just outside your continue threshold. Those are where the real leaks live.`,
  };
}

function buildFacing3BetNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = h(context);
  const villain = v(context);
  const is15bb = context.stackDepth === 15;
  const status = sourceStatusForContext(context);

  let coreIdea: string;
  let defaultLine: string;

  if (is15bb) {
    coreIdea = `${hero} facing a 3-bet at 15bb is a threshold test — the charts give exact all-in response ranges, so use them rather than feel.`;
    defaultLine = `Check the 15bb source chart for your exact position matchup. The decision is usually jam or fold — calling is rarely correct at this depth.`;
  } else {
    coreIdea = `${hero} facing a 3-bet at ${context.stackDepth}bb — no exact PDF chart exists for this node, so this is population-derived guidance.`;
    defaultLine = `Default: JJ+ and AKs are clear continues. QQ/JJ vs early-position 3-bets lean fold at 25bb unless stack depth supports a jam. 99–TT vs late-position 3-bets are usually fold. ${stackNote(context.stackDepth)}`;
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea,
    defaultLine,
    exploitLever: `Against a ${villain} 3-bet, consider their range width. Tight 3-bettors narrow your continue range; wide 3-bettors allow more jams with medium pairs.`,
    commonPunt: "Calling a 3-bet with 99–JJ out of position at 15–25bb — you're often dominated or flipping with no post-flop edge.",
    drillCue: `Drill the threshold hands — medium pairs (88–JJ) and AQo vs ${villain} 3-bets. These are the hands most players mishandle.`,
  };
}

function buildBlindVsBlindNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = h(context);
  const isSB = context.heroPosition === "SB";
  const status = sourceStatusForContext(context);

  let coreIdea: string;
  let defaultLine: string;
  let exploitLever: string;
  let commonPunt: string;

  if (isSB) {
    coreIdea = `SB vs BB is a wide raise-or-fold spot — you have position post-flop but pay the most to enter.`;
    defaultLine = `Raise your strong hands and fold the weakest offsuit junk. Complete selectively with suited connectors and small pairs if the BB is passive. ${stackNote(context.stackDepth)}`;
    exploitLever = "Against a passive BB, steal wider and complete more. Against an aggressive squeezer, tighten your complete range and raise strong.";
    commonPunt = "Limping too wide from SB and then facing a raise with hands that have no plan — either raise or fold, do not limp/call with marginal hands.";
  } else {
    coreIdea = `BB vs SB is your best defend node — you close the action and get position, but the SB's range is wide.`;
    defaultLine = `Defend most hands against a SB complete. Raise your strong hands for value. Fold only the absolute trash. ${stackNote(context.stackDepth)}`;
    exploitLever = "Against an aggressive SB raiser, tighten your call range and 3-bet your strong hands more. Against a passive SB, call wide and realize equity.";
    commonPunt = "Over-folding vs SB limps because the hand 'looks weak' — you're getting a free flop and closing the action.";
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea,
    defaultLine,
    exploitLever,
    commonPunt,
    drillCue: `Drill the marginal hands in blind vs blind — K9o, Q8s, J7s, T6s. These are the hands where population mistakes compound most.`,
  };
}

function buildPushFoldNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = h(context);
  const isBbCall = context.heroPosition === "BB";
  const status = sourceStatusForContext(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea: isBbCall
      ? `BB calling a shove is much tighter than the shover's range — this is a threshold node, not a hero-call spot.`
      : `${hero} short-stack shoves are threshold decisions — pairs, aces, and specific suited classes. Trust the documented cutoffs.`,
    defaultLine: `At ${context.stackDepth}bb, the decision is binary: shove or fold. Calling is almost never correct. Use the push/fold thresholds and don't deviate by feel.`,
    exploitLever: isBbCall
      ? "Against a wide BTN shover, widen your call range slightly. Against a tight EP shover, tighten significantly."
      : "Against passive blinds, widen your shove range. Against calling stations, tighten to cleaner value.",
    commonPunt: isBbCall
      ? "Calling off with A7o or K9o because 'the pot is big' — the pot size doesn't change your equity vs a tight shove range."
      : "Folding profitable shoves because the hand 'looks weak' — at ≤10bb, the math almost always supports the jam.",
    drillCue: `Drill the threshold shove hands — A2s–A5s, K9s, Q9s, 22–55. These are where short-stack discipline separates good from bad tournament players.`,
  };
}

function buildThreeBetNote(context: CanonicalSpotContext): StudySpotNote {
  const villain = v(context);
  const status = sourceStatusForContext(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea: `3-betting is a polarized play — strong value hands and strong blockers. Hands in between usually call or fold.`,
    defaultLine: `3-bet your premiums (QQ+, AKs) for value. Add blocker hands (A5s, A4s) as bluffs. Fold or call the middle.`,
    exploitLever: `Against a ${villain} who folds too much to 3-bets, widen your bluff range. Against a calling station, remove the bluffs and 3-bet value only.`,
    commonPunt: "3-betting hands that look active (KJs, QJs) but play badly when called — they are better as calls or folds than as 3-bet bluffs.",
    drillCue: `Drill the borderline 3-bet candidates — AQo, KQs, TT, JJ. These are the hands where population players make the most expensive mistakes.`,
  };
}

function buildLimpIsoNote(context: CanonicalSpotContext): StudySpotNote {
  const status = sourceStatusForContext(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea: `Isolating a limper is a position play — you want to take the lead with hands that benefit from initiative and fold equity.`,
    defaultLine: `Iso to 4–5x (plus 1bb per additional limper). Use strong broadways, suited aces, and pairs. Do not iso with hands that play poorly in a bloated pot.`,
    exploitLever: "Against a passive limper, iso wider. Against a limper who calls everything, tighten to hands that make strong pairs and have clear post-flop plans.",
    commonPunt: "Iso-raising to 3x — too small, gives the limper a profitable call. Size up to deny equity and take the pot more often.",
    drillCue: `Drill the iso sizing decision first: 4x vs 5x vs 6x. Then drill which hands to iso vs which to fold behind.`,
  };
}

function buildFourBetJamNote(context: CanonicalSpotContext): StudySpotNote {
  const status = sourceStatusForContext(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    sourceStatus: status,
    sourceLabel: getSourceStatusLabel(status),
    coreIdea: `4-bet/jam territory is narrow — premiums and strong blockers only. The source files do not provide a dedicated 4-bet tree, so stay conservative.`,
    defaultLine: `4-bet/jam with KK+, AKs. Add AQs and QQ as stack-depth allows. Everything else is usually a fold or a call.`,
    exploitLever: "Against a 3-bettor who folds to 4-bets, add AKo and JJ to your jam range. Against a calling station, remove the bluffs entirely.",
    commonPunt: "Treating a hand as 'too strong to fold' without checking whether it actually clears the stack-off threshold — ego is not a hand range.",
    drillCue: `Drill the decision with QQ and JJ facing a 3-bet at different stack depths. These are the highest-frequency 4-bet mistakes in mid-stakes MTTs.`,
  };
}

function buildSpotNote(context: CanonicalSpotContext): StudySpotNote {
  switch (context.family) {
    case "OPEN_RFI":
      return buildOpenRfiNote(context);
    case "DEFEND_VS_RFI":
      return buildDefendVsRfiNote(context);
    case "FACING_3BET":
      return buildFacing3BetNote(context);
    case "BLIND_VS_BLIND":
      return buildBlindVsBlindNote(context);
    case "THREE_BET":
      return buildThreeBetNote(context);
    case "LIMP_ISO":
      return buildLimpIsoNote(context);
    case "FOUR_BET_JAM":
      return buildFourBetJamNote(context);
    case "PUSH_FOLD":
      return buildPushFoldNote(context);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getSpotNote(
  contextOrChart: CanonicalSpotContext | ChartLikeSpotContext
): StudySpotNote | null {
  const context =
    "family" in contextOrChart
      ? contextOrChart
      : canonicalSpotContextFromChart(contextOrChart);

  if (!context) return null;
  return buildSpotNote(context);
}
