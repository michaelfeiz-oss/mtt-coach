import {
  displayPositionLabel,
  type SpotGroup,
} from "./strategy";

export interface StrategyTheoryContext {
  spotGroup: SpotGroup;
  stackDepth: number;
  heroPosition: string;
  villainPosition?: string | null;
}

export interface StrategyTheorySection {
  key:
    | "coreIdea"
    | "rangeShape"
    | "why"
    | "mistakes"
    | "exploit"
    | "trainingCue";
  title: string;
  body: string;
  accent?: boolean;
}

function stackBand(stackDepth: number) {
  if (stackDepth <= 15) {
    return {
      label: "shallow",
      compression:
        "At 15bb, stack-off pressure trims passive branches and makes blocker-driven jams matter more.",
    };
  }

  if (stackDepth <= 25) {
    return {
      label: "mid",
      compression:
        "At 20-25bb, the range still needs coverage, but many fringe continues are already losing too much realization.",
    };
  }

  return {
    label: "deep",
    compression:
      "At 40bb, the range can keep more suited coverage and lower pairs because postflop realization still matters.",
  };
}

function icmOverlay(spotGroup: SpotGroup, heroPosition: string): string {
  if (spotGroup === "RFI") {
    return `Under bubble or final-table ICM, ${displayPositionLabel(heroPosition)} should trim the marginal offsuit opens first and keep the clean blocker-heavy continues.`;
  }

  if (spotGroup === "VS_3BET") {
    return "ICM punishes marginal continue-versus-3-bet decisions hardest, so the first trims come from close calls before the premiums.";
  }

  return "If bubble or final-table pressure is high, tighten the weakest continue hands first and let the covered stacks take the marginal risks.";
}

function pkoOverlay(spotGroup: SpotGroup): string {
  if (spotGroup === "VS_3BET") {
    return "In PKOs, bounty value can reopen some blocker jams and thinner stack-offs when you cover the target.";
  }

  if (spotGroup === "BVB") {
    return "PKO pressure widens some blind-versus-blind attacks because bounty equity and fold equity stack on top of each other.";
  }

  return "In PKOs, bounty value tends to re-expand the aggressive branches before it meaningfully widens passive flats.";
}

function buildCoreIdea(context: StrategyTheoryContext): string {
  const hero = displayPositionLabel(context.heroPosition);
  const villain = context.villainPosition
    ? displayPositionLabel(context.villainPosition)
    : null;

  switch (context.spotGroup) {
    case "RFI":
      return `${hero} is building a profitable opening range, not just a playable one. The job is to pressure the blinds while still surviving the stronger ranges left behind you.`;
    case "VS_UTG_RFI":
      return `${hero} is responding to one of the strongest opening ranges in the tree, so every continue must survive domination pressure as well as postflop realization.`;
    case "VS_MP_RFI":
      return `${hero} is attacking a middle-position open that is still value-dense, but already wide enough that the best blocker hands and strong suited coverage can fight back.`;
    case "VS_LP_RFI":
      return `${hero} is defending versus a wider late-position open from ${villain}. That wider opener range lets you continue more often, especially when price or position improves realization.`;
    case "VS_3BET":
      return `${hero} is facing a 3-bet from ${villain}. This node is mostly about stack commitment: decide quickly which hands want to jam, which can call cleanly, and which should just exit.`;
    case "BVB":
      return "Blind-versus-blind ranges are the widest in the preflop tree, but they are not chaos. Position, stack depth, and who owns the initiative still decide how aggressive the branch should be.";
  }
}

function buildRangeShape(context: StrategyTheoryContext): string {
  const stack = stackBand(context.stackDepth);
  const hero = displayPositionLabel(context.heroPosition);

  switch (context.spotGroup) {
    case "RFI":
      return `${hero} keeps a high-card and pair core, then adds suited coverage as position improves. ${stack.compression}`;
    case "VS_UTG_RFI":
      return `The continue range stays linear and disciplined: pairs, suited aces, strong broadways, and the best suited playability. ${stack.compression}`;
    case "VS_MP_RFI":
      return `This range is still value-aware, but it can carry a little more suited connectivity and blocker aggression than the UTG-defense branch. ${stack.compression}`;
    case "VS_LP_RFI":
      return "Versus late opens, the range widens around suited aces, pairs, broadways, and the best suited connectors. The big blind carries the widest call region because price and closing action matter.";
    case "VS_3BET":
      return `The shape is polarized by stack depth: shallow stacks compress toward jam-or-fold, while 40bb keeps a tighter call bucket around pairs, suited broadways, and the cleanest suited wheel blockers.`;
    case "BVB":
      return "The blind-versus-blind range is intentionally wide, with more middling suited hands, wheel blockers, and lower pairs than most other nodes. The split between raise, limp, check, and jam changes fast as stacks shorten.";
  }
}

function buildWhy(context: StrategyTheoryContext): string {
  switch (context.spotGroup) {
    case "RFI":
      return "Open ranges work because initiative plus position lets you win pots without showdown, but only if the weakest dominated offsuit hands stay out of the mix.";
    case "VS_UTG_RFI":
      return "This spot works by respecting opener strength. If a hand cannot handle domination, poor realization, or a 4-bet response, it usually does not belong in the continue set.";
    case "VS_MP_RFI":
      return "The middle-position opener is wide enough to punish with blockers, but still strong enough that loose offsuit continues bleed equity. The profitable range lives in that balance.";
    case "VS_LP_RFI":
      return "Late-position opens work with more fold equity and weaker showdown quality. That is why blind defense, especially from BB, expands around hands that realize well against a wider range.";
    case "VS_3BET":
      return "Facing a 3-bet is a commitment problem. Some hands make money by denying equity immediately, some by continuing with robust playability, and everything dominated in the middle becomes expensive.";
    case "BVB":
      return "These spots play wider because the ranges are wide and the stacks interact quickly. The winning player still separates clean aggression from loose autopilot.";
  }
}

function buildMistakes(context: StrategyTheoryContext): string {
  switch (context.spotGroup) {
    case "RFI":
      return "The common leaks are over-opening dominated offsuit hands early, under-opening late-position steals, and missing the shallow-stack jam candidates that outperform min-raise folds.";
    case "VS_UTG_RFI":
      return "Players usually continue too many dominated broadways and weak Axo here. The second leak is 3-betting hands with blockers but poor all-in or call-down performance.";
    case "VS_MP_RFI":
      return "The big mistake is treating MP like a cutoff open. Another is defending hands that look pretty preflop but fold too often once pressure continues.";
    case "VS_LP_RFI":
      return "Most players either over-fold the blinds versus wide late opens or over-defend with offsuit trash that never realizes. The leak sits on the perimeter of the range, not the core.";
    case "VS_3BET":
      return "The expensive mistakes are flatting too wide at shallow stacks, over-jamming hands that call better at 40bb, and refusing to fold the offsuit bluff-catchers that look playable on paper.";
    case "BVB":
      return "Blind battles punish lazy defaults. Over-folding BB, raising too linear from SB, and blasting off with dominated offsuit junk are the usual leaks.";
  }
}

function buildExploit(context: StrategyTheoryContext): string {
  const overlay = `${icmOverlay(context.spotGroup, context.heroPosition)} ${pkoOverlay(
    context.spotGroup
  )}`;

  switch (context.spotGroup) {
    case "RFI":
      return `If the blinds under-defend, steal wider before you start adding fragile opens. ${overlay}`;
    case "VS_UTG_RFI":
      return `Against tight early-position pools, remove the thin continues first. Against openers who fold too much to 3-bets, shift the strongest blocker candidates into aggression. ${overlay}`;
    case "VS_MP_RFI":
      return `Versus population over-folds, keep the blocker-heavy 3-bets. Versus sticky callers, prefer hands that realize cleanly and trim the dominated offsuit continues. ${overlay}`;
    case "VS_LP_RFI":
      return `If the opener steals too wide and over-folds, widen your active defense first. If they barrel too well postflop, keep the continue range more equity-driven. ${overlay}`;
    case "VS_3BET":
      return `If the pool under-bluffs 3-bets, the easiest money comes from folding the bottom of the continue region. If they attack too wide from late position, restore the blocker jams and strongest flats. ${overlay}`;
    case "BVB":
      return `Versus passive blinds, lean into aggression. Versus players who fight hard postflop, keep the bottom of the range in lower-variance branches more often. ${overlay}`;
  }
}

function buildTrainingCue(context: StrategyTheoryContext): string {
  const hero = displayPositionLabel(context.heroPosition);
  const villain = context.villainPosition
    ? displayPositionLabel(context.villainPosition)
    : "the field behind you";

  switch (context.spotGroup) {
    case "RFI":
      return `From ${hero}, ask which hands win by initiative, blockers, or raw equity before you widen the fringe.`;
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return `From ${hero}, start with opener strength from ${villain}, then add your price and position. If a hand fails all three checks, it is usually a fold.`;
    case "VS_3BET":
      return `Facing the ${villain} 3-bet, classify the hand immediately: jam for fold equity, call for realization, or fold before sunk-cost logic takes over.`;
    case "BVB":
      return "In blind battles, separate hands that want to deny equity now from hands that prefer realizing cheaply before you click a button.";
  }
}

export function buildStrategyTheorySections(
  context: StrategyTheoryContext
): StrategyTheorySection[] {
  return [
    { key: "coreIdea", title: "Core Idea", body: buildCoreIdea(context) },
    { key: "rangeShape", title: "Range Shape", body: buildRangeShape(context) },
    { key: "why", title: "Why This Spot Works", body: buildWhy(context) },
    { key: "mistakes", title: "Common Mistakes", body: buildMistakes(context) },
    { key: "exploit", title: "Exploit Reminder", body: buildExploit(context) },
    {
      key: "trainingCue",
      title: "Training Cue",
      body: buildTrainingCue(context),
      accent: true,
    },
  ];
}
