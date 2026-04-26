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

function facingThreeBetBranch(context: CanonicalSpotContext) {
  if (context.villainPosition === "SB") {
    return "in position versus the small blind 3-bet";
  }

  if (context.villainPosition === "BB") {
    return "in position versus the big blind 3-bet";
  }

  return "out of position versus an in-position 3-bet";
}

function stackTexture(stackDepth: number) {
  if (stackDepth <= 15) {
    return "15bb is a commitment-heavy node. Clean thresholds matter more than speculative realization.";
  }

  if (stackDepth <= 25) {
    return "25bb still rewards disciplined realization. Dominated offsuit hands lose value quickly once pressure comes in.";
  }

  return "40bb keeps the widest playable bucket, but position and hand quality still matter more than curiosity.";
}

function buildOpenRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const early = isEarlyPosition(context.heroPosition);
  const late = isLatePosition(context.heroPosition);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} opens to take the lead with profitable hands, not to see flops with everything that looks playable. Position and starting-hand quality drive the chart.`,
    defaultLine: early
      ? `${hero} should stay tighter and more value-dense from the front of the table. ${stackTexture(
          context.stackDepth
        )}`
      : late
        ? `${hero} can widen later in position, but the source principles still prefer hands that keep initiative and avoid domination. ${stackTexture(
            context.stackDepth
          )}`
        : `${hero} sits in the middle bucket: open the hands that keep position and initiative working together, then let the weakest dominated offsuit hands go. ${stackTexture(
            context.stackDepth
          )}`,
    exploitLever:
      "Widen later than earlier, and keep following the core principle: take the lead or fold. If a hand is not strong enough to profit as an open, do not rescue it with a limp.",
    commonPunt: early
      ? "Opening too many dominated offsuit hands from early seats, then facing stronger ranges behind."
      : "Treating late position like a license to open anything instead of widening through better blockers, suited hands, and clearer playability.",
    drillCue:
      "Before you open the fringe, ask three things: do I have position, do I keep initiative, and does the hand stay profitable when played back at?",
  };
}

function buildDefendVsRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);
  const bigBlindDefense = context.heroPosition === "BB" && isLatePosition(context.villainPosition);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} versus ${villain} is a situation-dependent continue. The source principles matter here: hand value depends on position, opener strength, and clean realization.`,
    defaultLine: bigBlindDefense
      ? `${hero} gets the widest continue bucket here, but this is still a boundary spot. Defend the suited, connected, and stronger high-card hands that realize, then let the weakest offsuit junk go. ${stackTexture(
          context.stackDepth
        )}`
      : `${hero} should respect opener strength first, especially from earlier positions. Do not play marginal hands out of position to a raise just because they look playable in a vacuum. ${stackTexture(
          context.stackDepth
        )}`,
    exploitLever:
      "Start with opener position, then your price, then realization. Later-position opens allow more defense; earlier-position opens demand more discipline.",
    commonPunt: bigBlindDefense
      ? "Either over-folding because the hand feels ugly, or over-defending offsuit trash because closing the action feels cheap."
      : "Continuing with dominated offsuit broadways and weak aces when opener strength should already be pushing those hands out.",
    drillCue: `From ${hero} versus ${villain}, ask whether your hand wins by raw equity, by position, or by clean realization. If the answer is none of those, it is usually a fold.`,
  };
}

function buildFacing3BetNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);
  const branch = facingThreeBetBranch(context);

  if (context.stackDepth === 25) {
    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea: `${hero} ${branch} at 25bb is a simplified population threshold node. The goal is to separate the jam spine from the stable call bucket instead of defending by feel.`,
      defaultLine:
        "This simplified population 25bb layer keeps OOP versus in-position 3-bets on a tighter jam spine, while in-position blind-defense branches let medium pairs, suited aces, and ATo-type hands survive as calls more often.",
      exploitLever:
        "Classify the branch first: OOP versus IP stays more commitment-heavy, while IP versus blind 3-bets keeps more room for disciplined flats.",
      commonPunt:
        "Turning medium pairs or pretty broadways into automatic jams when the simplified 25bb layer wants them in the call bucket instead.",
      drillCue:
        "At 25bb facing a 3-bet, decide whether the hand is a clear jam, a clean realization call, or a fold. Do not blur medium pairs and broadways together.",
    };
  }

  if (context.stackDepth >= 40) {
    return {
      spotId: getCanonicalSpotId(context),
      title: buildCanonicalSpotLabel(context),
      coreIdea: `${hero} ${branch} at 40bb is a disciplined stack-off test. The simplified population layer keeps QQ+ and AK at the center, then makes the rest earn their continue.`,
      defaultLine:
        "This simplified population 40bb layer keeps default stack-offs centered on QQ+ and AK. JJ, some medium pairs, and AQ-class hands live in the conditional call bucket more often than the default jam bucket.",
      exploitLever:
        "Respect the population baseline first: do not upgrade JJ, AQ, or broadway strength into automatic stack-offs unless the 3-bettor profile is clearly over-aggressive.",
      commonPunt:
        "Stacking off too lightly because the pot is already large, or collapsing the whole conditional bucket into one automatic jam rule.",
      drillCue:
        "At 40bb facing a 3-bet, ask whether this hand truly clears the default stack-off center or whether it belongs in the controlled call bucket instead.",
    };
  }

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} facing a 3-bet from ${villain} is a threshold test, not a spot to defend by feel.`,
    defaultLine:
      "The attached 15bb charts cover this pressure node directly, so use them to separate jam, continue, and fold thresholds cleanly.",
    exploitLever:
      "Respect stack pressure before ego. If the hand does not stack off cleanly or realize well enough, the disciplined line is to let it go.",
    commonPunt:
      "Calling because the hand looks pretty preflop, or jamming without checking whether the stack depth and source chart actually support it.",
    drillCue:
      "Classify the hand immediately: clear continue, clear jam, or clear fold. If it sits in the fog, default to discipline rather than curiosity.",
  };
}

function buildBlindVsBlindNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is in the widest preflop branch in the source bundle, but blind versus blind is still structured rather than random.`,
    defaultLine:
      "The source pages split blind battles into separate raise, limp, and all-in branches. Use this spot to stay organized, and verify the exact branch before treating any threshold as settled.",
    exploitLever:
      "Marginal blind hands such as K9 or QT need a clear plan. Do not auto-defend and do not auto-fold just because the branch is wide.",
    commonPunt:
      "Blurring together limp, raise, and shove branches until every hand becomes a guess instead of a structured blind battle decision.",
    drillCue:
      "In blind versus blind spots, decide first whether the hand wants initiative now or cheap realization later. Do not let both plans blur together.",
  };
}

function buildThreeBetNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "The attached source bundle is stronger on opens, defenses, and facing pressure than on a fully separate 3-bet construction tree.",
    defaultLine:
      "Use blocker value, stack pressure, and hand quality together. If the source chart for the exact branch is not present, treat thin 3-bet bluffs as unresolved.",
    exploitLever:
      "Keep the strongest value and blocker candidates first. Do not widen the bluff bucket ahead of the source-backed value core.",
    commonPunt:
      "3-betting hands that look active but perform badly when called or shoved on.",
    drillCue:
      "Ask whether the hand benefits from fold equity now and still makes sense when called. If not, it probably does not belong.",
  };
}

function buildLimpIsoNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "The source notes flag limper confrontations as a study theme, especially broadway hands around 30bb.",
    defaultLine:
      "Current exact limp/iso chart coverage is unresolved. Use this note as a reminder to separate hands that benefit from initiative from those that only look playable.",
    exploitLever:
      "Broadway hands improve when they can take the lead cleanly. Trashy disconnected hands do not become good just because a limp entered the pot first.",
    commonPunt:
      "Isolating because the limper looks weak without checking whether the hand actually benefits from building the pot.",
    drillCue:
      "If the limper continues, will this hand still know what it is doing? If not, pass.",
  };
}

function buildFourBetJamNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "The attached source files do not provide a dedicated 4-bet/jam chart tree, so threshold claims here should stay conservative.",
    defaultLine:
      "When the exact branch is not documented, lean on the cleanest value hands and strongest blocker candidates only.",
    exploitLever:
      "Avoid turning bluff-catchers into stack-off hands just because the pot is large.",
    commonPunt:
      "Treating a hand as too strong to fold without proving that it clears the stack-off threshold.",
    drillCue:
      "If you cannot explain why the hand wants to stack off, it probably does not.",
  };
}

function buildPushFoldNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const isBbCall = context.heroPosition === "BB" && context.villainPosition === "BTN";
  const stackText =
    context.stackDepth <= 9
      ? "5-10bb source threshold"
      : "10-15bb source threshold";

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: isBbCall
      ? `${hero} calling versus a BTN shove is much tighter than the BTN jam range. This is a threshold node, not a hero-call invitation.`
      : `${hero} short-stack jams are threshold decisions built from pairs, aces, and the specific suited or broadway classes listed in the source notes.`,
    defaultLine: `${stackText} applies here, so trust the documented thresholds before trusting intuition.`,
    exploitLever:
      "Do not widen because the hand looks close. Short-stack edges come from staying disciplined around the exact cutoffs.",
    commonPunt: isBbCall
      ? "Calling off too loosely because the pot looks large, or passing clear calls because the hand feels uncomfortable."
      : "Passing profitable shoves because the hand looks weak, or forcing jams with hands that fall just below the listed threshold.",
    drillCue:
      "Read the threshold, compare the exact hand class, and decide. Push/fold confidence comes from respecting the boundary, not from guessing near it.",
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
