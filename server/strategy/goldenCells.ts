import type { Action } from "../../shared/strategy";
import {
  REVIEWED_STRATEGY_CHARTS,
  getReviewedStrategyChart,
} from "../../shared/strategy-data/reviewed";

export interface GoldenCell {
  stackDepth: number;
  spotKey: string;
  handCode: string;
  expectedAction: Action;
  note: string;
}

function makeGoldenCell(
  stackDepth: number,
  spotKey: string,
  handCode: string,
  note: string
): GoldenCell {
  const chart = getReviewedStrategyChart({ stackDepth, spotKey });
  if (!chart) {
    throw new Error(`Missing reviewed chart for golden cell ${stackDepth}:${spotKey}:${handCode}.`);
  }

  const expectedAction = chart.actions[handCode];
  if (!expectedAction) {
    throw new Error(`Missing reviewed hand ${handCode} for golden cell ${stackDepth}:${spotKey}.`);
  }

  return {
    stackDepth,
    spotKey,
    handCode,
    expectedAction,
    note,
  };
}

const AJO_GOLDEN_CELLS = REVIEWED_STRATEGY_CHARTS.map(chart =>
  makeGoldenCell(
    chart.stackDepth,
    chart.spotKey,
    "AJo",
    "AJo regression guard"
  )
);

const BOUNDARY_GOLDEN_CELLS = [
  makeGoldenCell(15, "UTG_RFI", "ATo", "15bb early-position offsuit Ace threshold"),
  makeGoldenCell(15, "UTG_RFI", "KQo", "15bb early-position offsuit broadway threshold"),
  makeGoldenCell(15, "UTG1_vs_UTG", "KJo", "15bb versus-UTG offsuit broadway boundary"),
  makeGoldenCell(15, "UTG1_vs_UTG", "QJo", "15bb versus-UTG offsuit broadway boundary"),
  makeGoldenCell(15, "CO_vs_BB_3bet", "A5s", "15bb facing 3-bet wheel Ace threshold"),
  makeGoldenCell(15, "CO_vs_BB_3bet", "A2s", "15bb facing 3-bet wheel Ace floor"),
  makeGoldenCell(25, "CO_vs_MP", "KTs", "25bb defend threshold for suited broadways"),
  makeGoldenCell(25, "CO_vs_MP", "QTs", "25bb defend threshold for suited broadways"),
  makeGoldenCell(25, "BB_vs_BTN", "JTs", "25bb late-position defend suited broadway"),
  makeGoldenCell(25, "BB_vs_BTN", "T9s", "25bb late-position defend connector"),
  makeGoldenCell(40, "CO_vs_UTG", "99", "40bb small-pair threshold"),
  makeGoldenCell(40, "CO_vs_UTG", "22", "40bb bottom-pair threshold"),
  makeGoldenCell(40, "SB_vs_UTG", "88", "40bb blind defend pair boundary"),
  makeGoldenCell(40, "CO_vs_MP", "77", "40bb medium-pair threshold"),
  makeGoldenCell(40, "UTG1_vs_UTG", "66", "40bb grouped-panel pair threshold"),
];

export const GOLDEN_CELLS: GoldenCell[] = [
  ...AJO_GOLDEN_CELLS,
  ...BOUNDARY_GOLDEN_CELLS,
];

