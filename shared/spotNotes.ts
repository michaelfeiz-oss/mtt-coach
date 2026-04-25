import {
  CANONICAL_SPOT_FAMILY_LABELS,
  isBlind,
  isEarlyPosition,
  isLatePosition,
  type CanonicalSpotFamily,
} from "./preflopTaxonomy";
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

type SpotNoteOverride = Partial<Omit<StudySpotNote, "spotId" | "title">>;

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
    return "15bb is already a commitment-heavy node, so blocker value and clean stack-off candidates matter more than pure playability.";
  }

  if (stackDepth <= 20) {
    return "20bb still punishes thin flats and weak realization, so the perimeter should stay disciplined.";
  }

  if (stackDepth <= 25) {
    return "25bb can still carry some suited coverage, but it is not deep enough to justify dominated curiosity calls.";
  }

  return "40bb keeps the widest playability bucket, so the range can carry more suited coverage and lower pairs without becoming careless.";
}

function buildOpenRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const early = isEarlyPosition(context.heroPosition);
  const late = isLatePosition(context.heroPosition);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is building a profitable opening range, not just clicking playable hands. Open the hands that pressure the blinds and survive the stronger ranges still left to act.`,
    defaultLine: early
      ? `${hero} should stay value-dense and blocker-aware. ${stackTexture(
          context.stackDepth
        )}`
      : late
        ? `${hero} can widen around suited wheel aces, broadways, and connected coverage, but the weakest dominated offsuit trash still stays out. ${stackTexture(
            context.stackDepth
          )}`
        : `${hero} opens from a middle bucket: keep the pair and broadway core, then widen with the suited coverage that still realizes cleanly. ${stackTexture(
            context.stackDepth
          )}`,
    exploitLever:
      "If the blinds over-fold, steal wider before adding fragile offsuit opens. If players behind you 3-bet aggressively, trim the weakest offsuit hands first and keep the blocker-heavy continues.",
    commonPunt: early
      ? "Opening offsuit Ax and Kx too loosely from early seats. That leaks directly into domination and ugly fold-to-3-bet nodes."
      : "Treating late-position opens like automatic steals and forgetting that dominated offsuit fringes still lose money when they get played back at.",
    drillCue:
      "Before opening the fringe, ask whether the hand wins by raw equity, blocker value, or steal leverage. If the answer is none of the above, it is usually a fold.",
    stageAdjustment:
      "Bubble and final-table pressure trim the weakest offsuit opens first. Keep the clean blockers and pairs before you keep the dominated steals.",
  };
}

function buildDefendVsRfiNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);
  const bigBlindDefense =
    context.heroPosition === "BB" &&
    (context.villainPosition === "CO" || context.villainPosition === "BTN");

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} versus ${villain} is a realization problem. Continue hands must handle opener strength, price, and postflop playability at the same time.`,
    defaultLine: bigBlindDefense
      ? `${hero} gets the widest continue bucket in the tree here, but it is still a boundary-defense spot. Defend the suited and connected hands that realize well, then let the worst offsuit junk go. ${stackTexture(
          context.stackDepth
        )}`
      : `${hero} should defend around pairs, suited Ax, strong broadways, and the cleanest suited connectivity that survives the opener's stronger range. ${stackTexture(
          context.stackDepth
        )}`,
    exploitLever:
      "Versus over-stealers, widen active continues before you widen dominated calls. Versus nits or under-bluffing opens, trim the weak offsuit bluff-catchers and keep the equity-driven hands.",
    commonPunt: bigBlindDefense
      ? "Either over-folding the big blind because the hand looks ugly, or defending every offsuit wheel and king because the price feels cheap. The leak lives on the perimeter."
      : "Continuing too many dominated broadways and weak Ax when opener strength should already be forcing discipline.",
    drillCue: `From ${hero}, start with opener strength from ${villain}, then add your price, then ask whether the hand actually realizes. If all three checks are weak, do not force a continue.`,
    stageAdjustment:
      "ICM pressure tightens the weakest continue hands first, especially when you are covered and the opener still threatens your tournament life.",
  };
}

function buildFacing3BetNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const villain = villainText(context);

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} facing a 3-bet from ${villain} is mostly a commitment test. Split hands cleanly into jam, call, or fold before sunk-cost logic takes over.`,
    defaultLine:
      context.stackDepth <= 20
        ? `At ${context.stackDepth}bb, this node compresses toward jam-or-fold. Flatting should stay narrow and purposeful.`
        : `At ${context.stackDepth}bb, a real call bucket still exists, but it must be built from hands that realize well and do not get dominated too badly.`,
    exploitLever:
      "Population under-bluffs 3-bets more often than it over-bluffs them. Fold the bottom more readily by default, then restore blocker jams and strongest continues only when the opponent is clearly over-attacking.",
    commonPunt:
      "Calling too wide with hands that feel pretty preflop, over-jamming hands that prefer calling at 40bb, or over-folding the blocker hands that should continue at shallow depth.",
    drillCue:
      "Classify the hand immediately: stack-off hand, clean call, or fold. If the hand fits none of those buckets comfortably, folding is usually the best discipline.",
    stageAdjustment:
      "Bubble and final-table ICM punish marginal continues versus 3-bets hardest. Trim the thin calls before you trim the clear premiums.",
  };
}

function buildBlindVsBlindNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  const role =
    context.heroPosition === "SB"
      ? "SB wants a proactive mix of complete, raise, and jam branches."
      : "BB wants to defend around realization and deny-equity opportunities, not autopilot curiosity calls.";

  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${hero} is in the widest preflop branch in the game, but wide does not mean random. Structure still wins: know which hands want initiative and which want cheap realization.`,
    defaultLine: `${role} ${stackTexture(context.stackDepth)}`,
    exploitLever:
      "Versus passive blind opponents, attack harder and deny equity. Versus players who over-fight postflop, keep the bottom of the range in lower-variance branches more often.",
    commonPunt:
      "Blasting off with dominated offsuit trash, missing profitable completes from the small blind, or over-folding the big blind because the hand is uncomfortable rather than unprofitable.",
    drillCue:
      "In blind battles, decide whether the hand wins most by fold equity now or by realizing cheaply. Do not let both plans blur together.",
    stageAdjustment:
      "Blind-versus-blind aggression widens in PKOs and shrinks a touch in brutal ICM. Start by adjusting the weakest offsuit edges, not the core value region.",
  };
}

function buildThreeBetNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "The best 3-bet spots pressure capped opens with blockers and hands that perform well when stacks go in.",
    defaultLine:
      "Keep the range linear enough to realize equity when called, then layer in the strongest blocker candidates as the opener widens.",
    exploitLever:
      "If the opener folds too much, widen the blocker-heavy pressure first. If they continue aggressively, keep the 3-bet range stronger and more value-dense.",
    commonPunt:
      "3-betting hands that look clever but perform badly when called, especially dominated offsuit broadways with weak blocker quality.",
    drillCue:
      "Ask whether the hand is happy getting called or is at least happy denying equity immediately. If it is neither, it probably does not belong.",
  };
}

function buildLimpIsoNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "Iso spots win by punishing weak limp ranges with strong high-card value, clean broadways, and hands that realize initiative well.",
    defaultLine:
      "Attack limps with hands that can win the pot now or navigate a bloated SPR later. Trashy broadways and disconnected offsuit junk are where the money leaks out.",
    exploitLever:
      "Versus limp-fold populations, iso wider and simpler. Versus sticky limp-callers, tighten toward hands with clearer top-pair and nut-potential properties.",
    commonPunt:
      "Isolating because the limper looks weak while ignoring whether the hand actually benefits from initiative.",
    drillCue:
      "When the limper continues, will this hand still know what it is doing? If not, pass.",
  };
}

function buildFourBetJamNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "4-bet and jam thresholds are stack-commitment problems, not ego contests. Value, blocker quality, and how often the opener can actually fold decide the branch.",
    defaultLine:
      "Keep this range tight and purposeful. Premiums anchor it, then blocker-heavy candidates appear only when the stack depth and opponent tendencies justify them.",
    exploitLever:
      "Against under-bluffing pools, over-fold the bottom. Against aggressive late-position battles, restore the best blocker jams before you widen passive continues.",
    commonPunt:
      "Turning good bluff-catchers into punts or stacking off because the hand 'looked too strong to fold' without checking the actual threshold.",
    drillCue:
      "Ask whether the hand is earning folds, dominating the calling range, or neither. If it is neither, step away.",
  };
}

function buildPushFoldNote(context: CanonicalSpotContext): StudySpotNote {
  const hero = heroText(context);
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea:
      "Push/fold edges come from pot share, blocker leverage, and elimination pressure. Tiny errors compound fast because every chip is live equity.",
    defaultLine: `${hero} should treat the perimeter with respect here. At ${context.stackDepth}bb, the edge lives in knowing exactly which weak aces, pairs, and suited wheels are profitable enough to go with.`,
    exploitLever:
      "Big Blind Ante widens profitable shoves a touch because the dead money matters more. Calling ranges, especially from the blinds, still stay much tighter than shoving ranges.",
    commonPunt:
      "Passing profitable jams because the hand feels too weak, or hero-calling shoves with hands that are only close in chip EV but terrible in tournament life terms.",
    drillCue:
      "Do not ask if the hand is pretty. Ask whether the blockers, pot share, and stack depth make the jam or call profitable right now.",
  };
}

function buildGenericNote(context: CanonicalSpotContext): StudySpotNote {
  return {
    spotId: getCanonicalSpotId(context),
    title: buildCanonicalSpotLabel(context),
    coreIdea: `${CANONICAL_SPOT_FAMILY_LABELS[context.family]} is a structured preflop node. The profitable line comes from understanding stack pressure, initiative, and domination risk together.`,
    defaultLine: stackTexture(context.stackDepth),
    exploitLever:
      "Exploit with the weakest part of the range first. Keep the value core stable until population evidence clearly says otherwise.",
    commonPunt:
      "Treating the node as generic preflop and forgetting that position, stack depth, and who has initiative all change the perimeter dramatically.",
    drillCue:
      "Find the boundary hand and understand why it is in or out. That is where this node becomes useful study instead of chart memorization.",
  };
}

const SPOT_NOTE_OVERRIDES: Record<string, SpotNoteOverride> = {
  "DEFEND_VS_RFI|40|BB|BTN|9P|BBA": {
    commonPunt:
      "Folding too many playable suited hands because BTN feels aggressive, or defending every offsuit broadway because closing the action feels comforting. This node prints from precision, not stubbornness.",
    drillCue:
      "When BTN opens, start with the suited and connected continues you are happy realizing. Then ask whether the offsuit candidate is actually stronger than it looks.",
  },
  "DEFEND_VS_RFI|40|BB|CO|9P|BBA": {
    coreIdea:
      "BB versus CO is the classic boundary-defense node. You defend often, but the offsuit perimeter still needs discipline because CO's range is stronger than BTN's.",
  },
  "FACING_3BET|40|CO|BB|9P|BBA": {
    defaultLine:
      "At 40bb, CO versus BB 3-bet keeps a real call bucket around pairs, suited broadways, and the cleanest suited Ax blockers. Do not force middling offsuit hands into expensive continue branches.",
  },
  "BLIND_VS_BLIND|15|SB|BB|9P|BBA": {
    defaultLine:
      "At 15bb, SB versus BB is already commitment-heavy. Small edges move quickly between limp, jam, and raise-fold, so the weak offsuit perimeter cannot be played lazily.",
  },
};

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

  const spotId = getCanonicalSpotId(context);
  return {
    ...buildSpotNote(context),
    ...SPOT_NOTE_OVERRIDES[spotId],
  };
}
