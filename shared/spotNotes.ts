import { isEarlyPosition, isLatePosition } from "./preflopTaxonomy";
import {
  buildCanonicalSpotLabel,
  canonicalSpotContextFromChart,
  getCanonicalSpotId,
  type CanonicalSpotContext,
  type ChartLikeSpotContext,
} from "./spotIds";
import { displayPositionLabel } from "./strategy";

export interface StudySpotNote {
  spotId: string;
  title: string;
  coreIdea: string;
  defaultLine: string;
  exploitLever: string;
  commonPunt: string;
  drillCue: string;
  stageAdjustment?: string;
}

function heroText(context: CanonicalSpotContext) {
  return displayPositionLabel(context.heroPosition);
}

function villainText(context: CanonicalSpotContext) {
  return context.villainPosition
    ? displayPositionLabel(context.villainPosition)
    : "the field behind you";
}

function stackTexture(stackDepth: number) {
  if (stackDepth <= 15) {
    return "At 15bb, every mistake costs more because the tree is already compressed.";
  }

  if (stackDepth <= 25) {
    return "At 25bb, dominated offsuit hands lose value fast once pressure arrives.";
  }

  return "At 40bb, position helps, but hand quality still decides the fringe.";
}

function buildOpenRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const early = isEarlyPosition(context.heroPosition);
  const late = isLatePosition(context.heroPosition);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: early
      ? `${hero} is opening from the front of the table. This node is about value density, initiative, and avoiding dominated trash before the action reaches the tougher seats behind you.`
      : late
        ? `${hero} is opening from late position. The blinds are forced to defend out of position, so this node widens through pressure hands, not random offsuit curiosity.`
        : `${hero} is opening from the middle of the formation. The goal is to keep initiative with hands that still look healthy once the stronger late seats start pushing back.`,
    defaultLine: early
      ? `Open pairs, strong aces, suited broadways, and the cleaner suited connectors the chart allows. Fold the weakest offsuit aces and kings first. ${stackTexture(
          context.stackDepth
        )}`
      : late
        ? `Open the profitable pressure hands: pairs, suited aces, most suited broadways, and the connected hands that keep equity when called. Do not widen by adding weak offsuit junk. ${stackTexture(
            context.stackDepth
          )}`
        : `Keep the range practical: pairs, suited aces, broadways, and the better connected hands stay in; the dominated offsuit fringe stays out. ${stackTexture(
            context.stackDepth
          )}`,
    exploitLever: late
      ? `If the blinds overfold, lean into more steals with suited blockers and connected hands. If they 3-bet too much, trim the weakest offsuit opens before you trim your suited pressure hands.`
      : `If the table behind you is passive, keep printing with the standard open set. If aggressive players sit behind, trim the weakest offsuit edges rather than the hands that still keep blockers or playability.`,
    commonPunt: early
      ? "Opening dominated offsuit hands from the front because they look too pretty to fold."
      : "Treating late position like a license to open anything instead of widening through better blockers and cleaner playability.",
    drillCue:
      "Before you open the fringe, ask whether the hand wins by initiative, position, or blocker value. If it does none of them, let it go.",
  };
}

function buildDefendVsRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);
  const facingLateOpen =
    context.villainPosition === "CO" || context.villainPosition === "BTN";
  const closingAction =
    context.heroPosition === "BB" &&
    (context.villainPosition === "CO" || context.villainPosition === "BTN");
  const inPositionLateDefense =
    context.heroPosition === "BTN" && context.villainPosition === "CO";

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: closingAction
      ? `${hero} is closing the action versus a ${villain} open. This is the classic late-position blind-defense node: defend the hands that realize, not the hands that just look close.`
      : inPositionLateDefense
        ? `${hero} is in position versus a ${villain} open. This is a late-position continue node where strong calls and selective pressure beat loose curiosity flats.`
        : facingLateOpen
          ? `${hero} is defending against a late-position open from ${villain}. The opener is wider than EP/MP, but that does not make dominated offsuit hands magically profitable.`
          : `${hero} is facing a ${villain} open from the stronger part of the formation. This node is about disciplined continues, not refusing to fold because the hand has paint on it.`,
    defaultLine: closingAction
      ? `Defend the suited, connected, and stronger high-card hands that keep equity. Mix in the better offsuit broadways the chart allows, then fold the weakest junk without apology. ${stackTexture(
          context.stackDepth
        )}`
      : inPositionLateDefense
        ? `Continue with pairs, suited aces, suited broadways, and the stronger offsuit broadways that keep value in position. Drop the weak offsuit fringe first. ${stackTexture(
            context.stackDepth
          )}`
        : facingLateOpen
          ? `Late-position opens allow more defense, but keep it practical: pairs, suited aces, suited broadways, and clean realization hands stay in. Weak offsuit aces and dominated broadways are still folds often enough. ${stackTexture(
              context.stackDepth
            )}`
          : `${hero} is defending against a stronger ${villain} opening range. Continue with pairs, suited aces, strong broadways, and only the cleaner suited connectors the chart keeps. Fold the dominated offsuit hands before they create expensive one-pair problems. ${stackTexture(
              context.stackDepth
            )}`,
    exploitLever: closingAction
      ? `Against loose stealers, defend more of the suited and connected perimeter. Against tighter CO/BTN opens, trim the weakest offsuit continues before touching the hands that still realize.`
      : facingLateOpen
        ? `If the late-position opener is overfolding to pressure, let the stronger continue hands attack more often. If they are tighter than population, strip out the weakest offsuit calls first.`
        : `Against tight early opens, downgrade AQ/KQ and medium-strength hero calls before you downgrade the clear value continues. Against players who open wider than population, let back in the suited blockers and clean in-position hands first.`,
    commonPunt: closingAction
      ? "Calling offsuit junk from the big blind because closing the action feels cheap."
      : facingLateOpen
        ? "Convincing yourself that position alone rescues dominated offsuit broadways."
        : "Calling dominated broadways or weak aces because they feel too strong to fold versus an early open.",
    drillCue: closingAction
      ? `From ${hero} versus ${villain}, ask whether the hand keeps equity when the opener c-bets. If not, do not defend it just because the price looks tempting.`
      : `From ${hero} versus ${villain}, classify the hand quickly: clear continue, selective pressure hand, or dominated fold.`,
  };
}

function facingThreeBetFamily(context: CanonicalSpotContext) {
  if (context.villainPosition === "SB") return "IP_VS_SB_3BET";
  if (context.villainPosition === "BB") return "IP_VS_BB_3BET";
  return "OOP_VS_IP_3BET";
}

function buildFacing3BetNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);
  const family = facingThreeBetFamily(context);

  if (context.stackDepth === 25) {
    if (family === "OOP_VS_IP_3BET") {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea: `${hero} opened and now faces a 3-bet from ${villain}. At 25bb this simplified population node compresses quickly into jam, disciplined call, or fold.`,
        defaultLine:
          "Jam the clean value-and-blocker spine first, then call only the pairs, suited aces, and sturdy suited broadways that realize well enough out of position. Fold the dominated offsuit broadways and weak aces.",
        exploitLever:
          "Against under-3-betting opponents, overfold the bottom and stop forcing AQ/99-JJ stack-offs. Against active late-position 3-bettors, let in more blocker jams and the best suited calls.",
        commonPunt:
          "Flatting broadway hands out of position that are too shallow to realize and too weak to jam.",
        drillCue:
          "Ask: is this a jam, a clean shallow call, or just a dominated fold?",
      };
    }

    if (family === "IP_VS_SB_3BET") {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea: `${hero} opened and the ${villain} 3-bet, leaving hero in position. This simplified population node keeps more hands alive because position still matters at 25bb.`,
        defaultLine:
          "Jam the strongest AQ+/AK and strong-pair bucket. Call the playable suited hands, medium pairs, and strong broadways that keep value in position. Fold dominated offsuit hands instead of rescuing them.",
        exploitLever:
          "Call wider versus aggressive small blinds. Tighten hard versus SBs who rarely 3-bet and whose value range dominates your fringe continues.",
        commonPunt:
          "Over-jamming hands that make more money as in-position calls, or over-calling offsuit hands that realize poorly.",
        drillCue:
          "Use position, but do not let position talk you into dominated hands.",
      };
    }

    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea: `${hero} opened and the ${villain} 3-bet. This simplified population BB branch keeps position, but applies more pressure than the SB branch.`,
      defaultLine:
        "Jam strong value and clean blockers, call the playable middle, and trim the weakest perimeter calls compared with the SB branch. Fold dominated offsuit broadways and weak aces first.",
      exploitLever:
        "Tighten against nit big blinds. Continue wider against BBs who attack steals too often and leave too much fold equity in the pot.",
      commonPunt:
        "Treating every suited hand as a profitable call just because hero has position.",
      drillCue:
        "Can this hand survive pressure and still realize? If not, fold it now.",
    };
  }

  if (context.stackDepth >= 40) {
    if (family === "OOP_VS_IP_3BET") {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea: `${hero} opened and now faces an in-position 3-bet from ${villain}. At 40bb this simplified population node is about tighter OOP discipline, not loose curiosity continues.`,
        defaultLine:
          "Stack off cleanly with QQ+/AK. Treat JJ, TT, 99, and AQ as conditional continues, then call only the suited hands and pairs that realize well enough out of position. Fold dominated offsuit broadways first.",
        exploitLever:
          "Against active late-position 3-bettors, keep more suited blockers and AQ-type hands alive. Against nits, downgrade AQ and medium pairs quickly.",
        commonPunt:
          "Calling speculative suited hands out of position because they look playable before the SPR pain starts.",
        drillCue:
          "If the hand cannot stack off or realize cleanly out of position, fold it.",
      };
    }

    if (family === "IP_VS_SB_3BET") {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea: `${hero} has position versus a ${villain} 3-bet. This is the widest 40bb simplified family because position keeps more calls profitable.`,
        defaultLine:
          "Stack off mainly with QQ+/AK. Call wider than the BB branch with suited broadways, strong suited aces, medium pairs, and the better connectors. Fold weak offsuit broadways and dominated Ax.",
        exploitLever:
          "Versus aggressive SBs, defend more often in position. Versus nit SBs, tighten AQ and the medium-pair bucket instead of auto-jamming them.",
        commonPunt:
          "Over-jamming hands that perform better as in-position calls and keep bluffs alive.",
        drillCue:
          "Ask whether position lets the hand realize before turning it into a jam.",
      };
    }

    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea: `${hero} opened and the ${villain} 3-bet. This simplified population BB branch separates stack-off hands, in-position calls, and dominated folds.`,
      defaultLine:
        "Stack off mainly with QQ+/AK. Call with strong suited broadways, strong suited aces, AQ-type hands, and pairs that still realize. Fold weak offsuit broadways and dominated Ax more often than versus SB.",
      exploitLever:
        "Versus tight BB 3-bettors, downgrade AQ and 99-JJ. Versus aggressive BBs, defend more suited broadways and strong suited aces.",
      commonPunt:
        "Calling too many offsuit broadways because they look high-card strong.",
      drillCue:
        "First classify the hand: stack-off, clean call, or dominated fold.",
    };
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is facing a 3-bet from ${villain} at 15bb. This is an exact threshold page from the chart pack, so treat it as a jam-or-fold test rather than a flatting contest.`,
    defaultLine:
      "At 15bb, most continues are direct jams and the fold line matters. Flatting is rarely the clean answer once stacks are this compressed.",
    exploitLever:
      "Against players who rarely 3-bet, do not invent marginal stack-offs. Against active players, protect the exact jam threshold instead of panic-folding the clear continues.",
    commonPunt:
      "Calling because the hand feels too strong to fold, even though the 15bb source page wants a binary jam-or-fold answer.",
    drillCue:
      "Read the 15bb threshold and decide: jam or fold. Do not blur it into a call.",
  };
}

function buildBlindVsBlindNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const isSmallBlindNode = context.heroPosition === "SB";

  if (isSmallBlindNode) {
    if (context.stackDepth <= 15) {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea:
          "At 15bb, SB limps create leverage but many hands are already commitment-sensitive.",
        defaultLine:
          "Raise or jam the value hands and strong blockers, complete the playable middle, and fold the weakest trash. Before limping, know the answer versus a BB raise.",
        exploitLever:
          "Versus passive BBs, complete a little more. Versus aggressive BBs, tighten the weakest limps and keep stronger trap hands in the range.",
        commonPunt:
          "Completing weak hands that cannot continue once the big blind applies pressure.",
        drillCue:
          "Before you limp, know what happens if the BB raises.",
      };
    }

    if (context.stackDepth <= 25) {
      return {
        spotId: getCanonicalSpotId(context),
        title: buildCanonicalSpotLabel(context),
        coreIdea:
          "At 25bb, SB can use a wider limp strategy, but weak offsuit hands still collapse fast once the pot gets contested.",
        defaultLine:
          "Complete suited and connective hands plus some medium strength, raise the value and pressure hands, and fold the worst offsuit trash. Cheap does not mean profitable.",
        exploitLever:
          "Versus overfolding BBs, raise more. Versus passive BBs, complete wider and let the playable middle realize.",
        commonPunt:
          "Limping too many weak offsuit hands just because the price looks small.",
        drillCue:
          "Cheap is not the same thing as profitable.",
      };
    }

    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea:
        "At 40bb, SB can complete more playable hands, but the hand still has to survive being out of position after the flop.",
      defaultLine:
        "Complete more suited and connected hands, raise value and strong pressure hands, and fold the one-pair traps that realize badly. Ask whether the hand has playability, not just a discount.",
      exploitLever:
        "Exploit passive BBs by completing more and raising value. Exploit overfolders by adding more pressure raises before you add more junk limps.",
      commonPunt:
        "Over-completing hands that make dominated one-pair hands postflop.",
      drillCue:
        "Does this hand have playability, or only a cheap entry price?",
    };
  }

  if (context.stackDepth <= 15) {
    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea:
        "BB versus a 15bb SB limp is a pressure-response node. Stacks are short enough that passive mistakes compound immediately.",
      defaultLine:
        "Raise or jam the value and pressure hands, check the playable middle, and fold the disconnected trash. Do not let cheap realization become an excuse for autopilot.",
      exploitLever:
        "Attack passive limpers more often. Tighten the weakest raises against limp-jam happy opponents who make life miserable for the fringe.",
      commonPunt:
        "Checking hands that should punish the limp, or raising junk that cannot continue once the SB fights back.",
      drillCue:
        "Decide first whether the hand wants pressure now or realization later.",
    };
  }

  if (context.stackDepth <= 25) {
    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea:
        "BB versus an SB limp at 25bb is about selecting the right pressure hands, not raising because every limp looks weak.",
      defaultLine:
        "Raise the value and denial hands, check the playable middle, and let the worst offsuit trash go. Good isolation hands and good check-backs are both part of the branch.",
      exploitLever:
        "Against passive SB limps, attack more often with your better pressure hands. Against tricky limp-raise players, protect the checking range and trim the weakest raises.",
      commonPunt:
        "Treating every broadway or king-high hand like an automatic raise over the limp.",
      drillCue:
        "If you raise, know why the hand benefits from building the pot now.",
    };
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "At 40bb, BB versus SB limp is a wider skill node: punish weak limps, but keep the checking range healthy enough to realize equity cleanly.",
    defaultLine:
      "Raise value and the best pressure hands, check the playable middle, and fold only the true trash. Position helps, but it does not rescue hands with no path to value.",
    exploitLever:
      "Attack passive limp ranges harder. Against limp-heavy opponents who continue too much, keep the raise bucket cleaner and let more middling hands realize through checks.",
    commonPunt:
      "Raising too many pretty-but-fragile hands because position feels safe.",
    drillCue:
      "Pressure the limp when the hand gains from it; otherwise take the cheap realization.",
  };
}

function buildThreeBetNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is taking the aggressive branch preflop. The hand should benefit from fold equity now and still look healthy when called.`,
    defaultLine:
      "Keep the value core first, then add only the blocker or playability hands that still make sense when action continues.",
    exploitLever:
      "If the opener overfolds, attack more with the clean blocker hands. If they continue too honestly, tighten the bluff bucket before touching the value core.",
    commonPunt:
      "3-betting hands that only look active preflop and fall apart the moment the opener continues.",
    drillCue:
      "Ask whether the hand benefits from fold equity now and still knows what to do when called.",
  };
}

function buildLimpIsoNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is deciding whether the limper should be punished or left alone. This is an initiative-and-selection node, not an ego node.`,
    defaultLine:
      "Use the stronger broadways, pairs, and suited pressure hands to isolate. Pass on the weak disconnected junk that only builds a bigger pot with a bad hand.",
    exploitLever:
      "Attack limpers who overfold or call too honestly. If the limper is sticky, keep the iso bucket cleaner and let the weaker hands go.",
    commonPunt:
      "Isolating because the limper looks weak without checking whether the hand actually benefits from initiative.",
    drillCue:
      "If the limper continues, will this hand still know what it is doing?",
  };
}

function buildFourBetJamNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "This is a high-pressure stack-off node. The hand should clear a real threshold, not just feel too strong to fold.",
    defaultLine:
      "Keep the range anchored to the cleanest value hands and the clearest blocker candidates. If the hand cannot explain its stack-off logic, it usually does not belong.",
    exploitLever:
      "Against players who under-bluff, overfold the thin stack-offs. Against players who pressure too widely, protect the clean blocker jams before you add thin hero calls.",
    commonPunt:
      "Treating a hand as too good to fold without proving that it actually clears the stack-off threshold.",
    drillCue:
      "If you cannot explain why the hand wants to stack off, do not force it to.",
  };
}

function buildPushFoldNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const isBbCall = context.heroPosition === "BB" && context.villainPosition === "BTN";
  const stackText =
    context.stackDepth <= 9
      ? "5-10bb threshold"
      : "10-15bb threshold";

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: isBbCall
      ? `${hero} calling versus a BTN shove is much tighter than the BTN jam range. This is a threshold node, not a hero-call invitation.`
      : `${hero} short-stack decisions are threshold decisions built from the documented shove classes, not from how playable the hand looks in a vacuum.`,
    defaultLine: `${stackText} applies here, so compare the exact hand class to the documented cutoff before you improvise.`,
    exploitLever:
      "Do not widen because the pot looks big. Short-stack edges come from respecting the line, not from guessing around it.",
    commonPunt: isBbCall
      ? "Calling off too wide because the pot is large, or passing clear calls because the hand feels uncomfortable."
      : "Passing profitable shoves because the hand looks weak, or forcing jams with hands that fall just below the line.",
    drillCue:
      "Read the threshold, identify the exact hand class, and decide.",
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
