import { SpotType } from "./SpotTypeSelector";
import { StreetAction, SizeBucket } from "./PlayerActionsForm";
import { VillainType, VillainRangeType } from "./VillainProfileForm";
import { HandResult } from "./OutcomeForm";
import type { PreflopScenarioId } from "@shared/preflopScenarios";
import {
  getCanonicalSpotId,
  getStrategyChartSelector,
  inferCanonicalSpotContextFromLog,
} from "@shared/spotIds";

/**
 * Map UI SpotType to database spotType enum
 */
export function mapUiSpotTypeToDb(
  uiSpotType: SpotType
): "SINGLE_RAISED_POT" | "3BET_POT" | "BVB" | "ICM_SPOT" | "LIMPED_POT" {
  switch (uiSpotType) {
    case "SINGLE_RAISED_POT_IP":
    case "SINGLE_RAISED_POT_OOP":
      return "SINGLE_RAISED_POT";
    case "THREE_BET_POT_IP":
    case "THREE_BET_POT_OOP":
    case "FOUR_BET_POT":
      return "3BET_POT";
    case "BLINDS_VS_BLIND":
      return "BVB";
    case "ICM_SPOT":
      return "ICM_SPOT";
    case "LIMPED_POT":
      return "LIMPED_POT";
  }
}

/**
 * Extract spot position (IP/OOP) from UI SpotType
 */
export function extractSpotPosition(
  uiSpotType: SpotType
): "IP" | "OOP" | undefined {
  if (uiSpotType.endsWith("_IP")) return "IP";
  if (uiSpotType.endsWith("_OOP")) return "OOP";
  return undefined;
}

/**
 * Extract spot subtype (e.g., "4BP") from UI SpotType
 */
export function extractSpotSubtype(uiSpotType: SpotType): string | undefined {
  if (uiSpotType === "FOUR_BET_POT") return "4BP";
  return undefined;
}

/**
 * Build board runout string from flop, turn, river cards
 */
export function buildBoardRunout(
  flopBoard: string,
  turnCard: string,
  riverCard: string
): string | undefined {
  let runout = flopBoard || "";
  if (turnCard) {
    const turnRank = turnCard[0];
    const turnSuitCode = parseInt(turnCard.substring(1));
    const turnSuit = String.fromCharCode(turnSuitCode);
    runout += turnRank + turnSuit;
  }
  if (riverCard) {
    const riverRank = riverCard[0];
    const riverSuitCode = parseInt(riverCard.substring(1));
    const riverSuit = String.fromCharCode(riverSuitCode);
    runout += riverRank + riverSuit;
  }
  return runout || undefined;
}

/**
 * Generate action summary string from StreetAction
 */
export function generateActionSummary(action: StreetAction | null): string {
  if (!action) return "";

  const parts: string[] = [];

  if (action.villainAction) {
    const villainPart = `Villain ${action.villainAction.type.toLowerCase()}${
      action.villainAction.sizeBucket
        ? ` ${action.villainAction.sizeBucket.toLowerCase()}`
        : ""
    }`;
    parts.push(villainPart);
  }

  if (action.heroAction) {
    const heroPart = `Hero ${action.heroAction.type.toLowerCase()}${
      action.heroAction.sizeBucket
        ? ` ${action.heroAction.sizeBucket.toLowerCase()}`
        : ""
    }`;
    parts.push(heroPart);
  }

  return parts.length > 0 ? `${action.street}: ${parts.join(", ")}` : "";
}

/**
 * Map EV loss slider value to mistakeSeverity (0-3)
 */
export function mapEvLossToSeverity(evLossBb: number): number {
  if (evLossBb <= 1) return 0;
  if (evLossBb <= 2.5) return 1;
  if (evLossBb <= 4) return 2;
  return 3;
}

/**
 * Derive hero decision from street action
 */
export function deriveHeroDecision(action: StreetAction | null): string | undefined {
  if (!action?.heroAction) return undefined;
  return action.heroAction.type;
}

/**
 * Build streetDataJson structure
 */
export function buildStreetDataJson({
  spotType,
  spotPosition,
  spotSubtype,
  scenarioId,
  heroPosition,
  openerPosition,
  heroHand,
  effectiveStackBb,
  flopBoard,
  turnCard,
  riverCard,
  streetAction,
  villainType,
  villainRangeType,
  result,
  evLossBb,
  notes,
}: {
  spotType: SpotType;
  spotPosition?: "IP" | "OOP";
  spotSubtype?: string;
  scenarioId?: PreflopScenarioId;
  heroPosition: string;
  openerPosition?: string;
  heroHand: string;
  effectiveStackBb: number;
  flopBoard?: string;
  turnCard?: string;
  riverCard?: string;
  streetAction?: StreetAction | null;
  villainType?: VillainType | "";
  villainRangeType?: VillainRangeType | "";
  result?: HandResult | "";
  evLossBb?: number;
  notes?: string;
}): Record<string, any> {
  const canonicalSpot =
    scenarioId && heroPosition
      ? inferCanonicalSpotContextFromLog({
          scenarioId,
          effectiveStackBb,
          heroPosition,
          openerPosition,
        })
      : null;
  const strategyChartSelector = canonicalSpot
    ? getStrategyChartSelector(canonicalSpot)
    : null;

  const boardTurn = turnCard
    ? turnCard[0] + String.fromCharCode(parseInt(turnCard.substring(1)))
    : null;
  const boardRiver = riverCard
    ? riverCard[0] + String.fromCharCode(parseInt(riverCard.substring(1)))
    : null;

  return {
    meta: {
      spotType,
      spotPosition,
      spotSubtype,
      villain:
        villainType || villainRangeType
          ? {
              type: villainType || undefined,
              rangeType: villainRangeType || undefined,
            }
          : undefined,
      keyStreet: streetAction?.street,
      result: result || undefined,
      evLossEstimateBb: evLossBb && evLossBb > 0 ? evLossBb : undefined,
      actionsSummary: generateActionSummary(streetAction || null),
      study: canonicalSpot
        ? {
            canonicalSpotId: getCanonicalSpotId(canonicalSpot),
            family: canonicalSpot.family,
            stackDepth: canonicalSpot.stackDepth,
            heroPosition: canonicalSpot.heroPosition,
            villainPosition: canonicalSpot.villainPosition ?? undefined,
            spotGroup: strategyChartSelector?.spotGroup,
            spotKey: strategyChartSelector?.spotKey,
          }
        : undefined,
    },
    board: {
      flop: flopBoard || null,
      turn: boardTurn,
      river: boardRiver,
    },
    preflop: {
      actions: streetAction?.street === "PREFLOP" ? generateActionSummary(streetAction) : null,
      openerPosition: openerPosition || null,
      villainPosition: openerPosition || null,
      notes: null,
    },
    flop: {
      actions: streetAction?.street === "FLOP" ? generateActionSummary(streetAction) : null,
      notes: null,
    },
    turn: {
      actions: streetAction?.street === "TURN" ? generateActionSummary(streetAction) : null,
      notes: null,
    },
    river: {
      actions: streetAction?.street === "RIVER" ? generateActionSummary(streetAction) : null,
      notes: null,
    },
    overallNotes: notes || null,
  };
}


/**
 * Generate board & action preview text for collapsed accordion
 */
export function generateBoardSummary(
  flopBoard: string,
  turnCard: string,
  riverCard: string,
  streetAction: StreetAction | null
): string {
  const parts: string[] = [];

  if (flopBoard) {
    parts.push(`Flop: ${flopBoard}`);
  }
  if (turnCard) {
    parts.push(`Turn: ${turnCard[0]}`);
  }
  if (riverCard) {
    parts.push(`River: ${riverCard[0]}`);
  }

  if (streetAction) {
    const actionStr = generateActionSummary(streetAction);
    if (actionStr) parts.push(actionStr);
  }

  return parts.length > 0 ? parts.join(", ") : "No board or actions";
}

/**
 * Generate villain & context preview text for collapsed accordion
 */
export function generateVillainSummary(
  villainType: VillainType | "" | undefined,
  villainRangeType: VillainRangeType | "" | undefined,
  gameType: string | undefined,
  tournamentPhase: string | undefined,
  isPko: boolean
): string {
  const parts: string[] = [];

  if (villainType) {
    parts.push(villainType);
  }
  if (villainRangeType) {
    parts.push(villainRangeType);
  }
  if (gameType) {
    parts.push(gameType);
  }
  if (tournamentPhase) {
    parts.push(tournamentPhase);
  }
  if (isPko) {
    parts.push("PKO");
  }

  return parts.length > 0 ? parts.join(", ") : "No villain or context info";
}

/**
 * Generate outcome & notes preview text for collapsed accordion
 */
export function generateOutcomeSummary(
  result: HandResult | "" | undefined,
  evLossBb: number,
  notes: string
): string {
  const parts: string[] = [];

  if (result) {
    parts.push(result);
  }
  if (evLossBb > 0) {
    parts.push(`EV loss ~${evLossBb}bb`);
  }
  if (notes) {
    parts.push(notes.substring(0, 30) + (notes.length > 30 ? "..." : ""));
  }

  return parts.length > 0 ? parts.join(", ") : "No outcome or notes";
}
