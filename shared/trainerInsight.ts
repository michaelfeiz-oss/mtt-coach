import { parseHandClass } from "./preflop";
import { canonicalSpotContextFromChart, type ChartLikeSpotContext } from "./spotIds";
import type { StudySpotNote } from "./spotNotes";
import { ACTION_LABELS, displayPositionLabel, type Action } from "./strategy";

export interface TrainerSpotInsight {
  resultLine: string;
  why: string;
  rule: string;
  exploitAdjustment?: string;
  commonMistake?: string;
}

interface BuildTrainerSpotInsightInput {
  chart: ChartLikeSpotContext;
  handCode: string;
  selectedAction: Action;
  correctAction: Action;
  isCorrect: boolean;
  spotNote?: StudySpotNote | null;
}

const ACTION_PHRASES: Record<Action, string> = {
  FOLD: "a fold",
  RAISE: "a raise",
  CALL: "a call",
  THREE_BET: "a 3-bet",
  JAM: "a jam",
  LIMP: "a limp",
  CHECK: "a check",
};

function isSmallOrMediumPair(handCode: string) {
  const parsed = parseHandClass(handCode);
  if (!parsed || parsed.kind !== "pair") return false;
  return ["2", "3", "4", "5", "6", "7", "8", "9"].includes(parsed.firstRank);
}

function resultLine(
  handCode: string,
  selectedAction: Action,
  correctAction: Action,
  isCorrect: boolean
) {
  if (isCorrect) {
    return `Correct - ${handCode} is ${ACTION_PHRASES[correctAction]} here.`;
  }

  return `Incorrect - ${handCode} is ${ACTION_PHRASES[correctAction]} here, not ${ACTION_PHRASES[selectedAction]}.`;
}

function buildWhy(
  context: NonNullable<ReturnType<typeof canonicalSpotContextFromChart>>,
  handCode: string,
  correctAction: Action
) {
  const hero = displayPositionLabel(context.heroPosition);
  const villain = context.villainPosition
    ? displayPositionLabel(context.villainPosition)
    : "the field";
  const stack = `${context.stackDepth}bb`;
  const pair = isSmallOrMediumPair(handCode);
  const facingEarlyOpen =
    context.family === "DEFEND_VS_RFI" &&
    ["UTG", "UTG1", "MP"].includes(context.villainPosition ?? "");
  const facingLateOpen =
    context.family === "DEFEND_VS_RFI" &&
    ["CO", "BTN"].includes(context.villainPosition ?? "");
  const inPositionVsThreeBet =
    context.family === "FACING_3BET" &&
    ["SB", "BB"].includes(context.villainPosition ?? "");

  switch (context.family) {
    case "OPEN_RFI":
      if (correctAction === "RAISE") {
        return `${hero} is opening at ${stack}, and ${handCode} earns its place by keeping initiative without becoming dominated trash too often.`;
      }
      return `${hero} is opening at ${stack}, and ${handCode} falls below the profitable open line once stronger seats can keep pushing behind.`;

    case "DEFEND_VS_RFI":
      if (correctAction === "CALL" && pair) {
        return `${hero} versus ${villain} at ${stack} keeps ${handCode} as a continue because the pair has enough equity to call without becoming a forced jam.`;
      }
      if (correctAction === "CALL") {
        return `${hero} versus ${villain} at ${stack} keeps ${handCode} because it has enough equity and position or closing-action value to continue profitably.`;
      }
      if (correctAction === "FOLD" && facingEarlyOpen) {
        return `${hero} versus ${villain} at ${stack} is a strong-range spot, so ${handCode} does not keep enough clean equity to continue.`;
      }
      if (correctAction === "FOLD" && facingLateOpen) {
        return `${hero} versus ${villain} at ${stack} may defend wider overall, but ${handCode} is still too dominated to call profitably.`;
      }
      if (correctAction === "THREE_BET" || correctAction === "JAM" || correctAction === "RAISE") {
        return `${hero} versus ${villain} at ${stack} uses ${handCode} as a pressure hand because it gains more by denying equity now than by calling.`;
      }
      return `${hero} versus ${villain} at ${stack} pushes ${handCode} out because the spot is too strong for a weak continue.`;

    case "FACING_3BET":
      if (context.stackDepth <= 15) {
        return `${hero} versus ${villain} at 15bb leaves very little room to flat profitably, so ${handCode} belongs in the ${ACTION_LABELS[correctAction].toLowerCase()} bucket.`;
      }
      if (correctAction === "CALL" && pair) {
        return `${hero} versus ${villain} at ${stack} keeps ${handCode} as a call because the pair retains enough equity to continue without forcing a jam.`;
      }
      if (correctAction === "CALL") {
        return `${hero} versus ${villain} at ${stack}${inPositionVsThreeBet ? " keeps position," : ""} so ${handCode} has enough equity to continue without turning into a forced jam.`;
      }
      if (correctAction === "JAM") {
        return `${hero} versus ${villain} at ${stack} is shallow enough that ${handCode} clears the value-or-blocker jam threshold.`;
      }
      return `${hero} versus ${villain} at ${stack}${inPositionVsThreeBet ? " still" : ""} does not give ${handCode} enough equity to call or enough strength to stack off.`;

    case "BLIND_VS_BLIND":
      if (context.heroPosition === "SB" && correctAction === "LIMP") {
        return `SB versus BB at ${stack} keeps ${handCode} in the passive branch because it has enough playability to limp without becoming a profitable raise.`;
      }
      if (context.heroPosition === "SB" && (correctAction === "RAISE" || correctAction === "JAM")) {
        return `SB versus BB at ${stack} pushes ${handCode} into the aggressive branch because it gains more from pressure than from a passive complete.`;
      }
      if (context.heroPosition === "BB" && correctAction === "RAISE") {
        return `BB versus SB at ${stack} raises ${handCode} over the limp because the hand gains from pressure and denial more than from a passive check.`;
      }
      if (context.heroPosition === "BB" && correctAction === "CHECK") {
        return `BB versus SB at ${stack} checks ${handCode} because it realizes better in the passive branch than in a thin isolation raise.`;
      }
      return `${hero} versus ${villain} at ${stack} keeps ${handCode} out of the branch because it lacks the playability or pressure value the spot needs.`;

    case "THREE_BET":
      return `${hero} versus ${villain} at ${stack} wants ${handCode} in the aggressive bucket because it wins well with fold equity and still holds when called.`;

    case "LIMP_ISO":
      if (correctAction === "RAISE") {
        return `${hero} versus a limp at ${stack} uses ${handCode} as an isolation hand because it benefits from initiative and pressure now.`;
      }
      return `${hero} versus a limp at ${stack} keeps ${handCode} out because the hand builds a bigger pot without enough pressure value.`;

    case "FOUR_BET_JAM":
      return `${hero} versus ${villain} at ${stack} treats ${handCode} as a threshold stack-off hand, not just a hand that feels too pretty to fold.`;

    case "PUSH_FOLD":
      return `${hero} versus ${villain} at ${stack} is a threshold node, so ${handCode} is compared directly to the shove or call-off line instead of postflop playability.`;
  }
}

function buildRule(
  context: NonNullable<ReturnType<typeof canonicalSpotContextFromChart>>,
  handCode: string
) {
  const pair = isSmallOrMediumPair(handCode);
  const facingEarlyOpen =
    context.family === "DEFEND_VS_RFI" &&
    ["UTG", "UTG1", "MP"].includes(context.villainPosition ?? "");
  const inPositionVsThreeBet =
    context.family === "FACING_3BET" &&
    ["SB", "BB"].includes(context.villainPosition ?? "");

  switch (context.family) {
    case "OPEN_RFI":
      return ["CO", "BTN", "SB"].includes(context.heroPosition)
        ? "Late opens widen through suited pressure, not random offsuit junk."
        : "Early opens compress the bottom of your range first.";

    case "DEFEND_VS_RFI":
      if (pair && facingEarlyOpen && context.stackDepth <= 15) {
        return "Versus early-position opens at shallow stacks, small pairs need clear jam value or they become folds.";
      }
      if (pair && context.stackDepth <= 25) {
        return "Small pairs at 15-25bb are stack-sensitive; do not auto-jam them and do not auto-fold them.";
      }
      if (facingEarlyOpen) {
        return "Versus early-position opens, trim dominated offsuit hands first.";
      }
      return "Late opens invite more defense, but dominated offsuit hands still fail first.";

    case "FACING_3BET":
      if (context.stackDepth <= 15) {
        return "At 15bb, this spot is mostly jam-or-fold.";
      }
      if (pair && context.stackDepth <= 25) {
        return "At 15-25bb, small pairs split between call, jam, and fold more than people think.";
      }
      if (context.stackDepth >= 40 && inPositionVsThreeBet) {
        return "At 40bb, position allows calls that would be folds out of position.";
      }
      if (inPositionVsThreeBet) {
        return "Position keeps more hands alive, but dominated offsuit hands still fail.";
      }
      return "Out of position, remove speculative calls before you remove real value continues.";

    case "BLIND_VS_BLIND":
      return context.heroPosition === "SB"
        ? "Cheap does not mean profitable; limp hands need a plan versus pressure."
        : "Punish weak limps with hands that gain from pressure, not with fragile vanity raises.";

    case "THREE_BET":
      return "3-bet hands should win by fold equity now and still hold value when called.";

    case "LIMP_ISO":
      return "Isolate with hands that improve by taking initiative, not just because the limper looks weak.";

    case "FOUR_BET_JAM":
      return "If the hand cannot explain its stack-off logic, it does not belong in the jam bucket.";

    case "PUSH_FOLD":
      return "Short stacks are threshold spots: compare the exact hand class to the line and move on.";
  }
}

export function buildTrainerSpotInsight({
  chart,
  handCode,
  selectedAction,
  correctAction,
  isCorrect,
  spotNote,
}: BuildTrainerSpotInsightInput): TrainerSpotInsight | null {
  const context = canonicalSpotContextFromChart(chart);
  if (!context) return null;

  return {
    resultLine: resultLine(handCode, selectedAction, correctAction, isCorrect),
    why: buildWhy(context, handCode, correctAction),
    rule: buildRule(context, handCode),
    exploitAdjustment: spotNote?.exploitLever,
    commonMistake: spotNote?.commonPunt,
  };
}
