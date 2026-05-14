import type { Action } from "../../shared/preflopStrategy";

export interface VerifiedGoldenCell {
  stackDepth: number;
  spotKey: string;
  handCode: string;
  expectedAction: Action;
  note: string;
  reviewedBy: string;
  reviewedAt: string;
  evidence: string;
}

export interface PendingGoldenCell {
  stackDepth: number;
  spotKey: string;
  handCode: string;
  note: string;
  status: "pending_owner_review";
  evidence: string;
}

// Intentionally empty for the Manus review deployment pass. We have a complete
// 169-cell catalog and automated integrity coverage, but we do not yet have
// owner-verified action evidence to bless exact chart actions as final truth.
export const VERIFIED_GOLDEN_STRATEGY_CELLS: VerifiedGoldenCell[] = [];

export const PENDING_GOLDEN_STRATEGY_CELLS: PendingGoldenCell[] = [
  {
    stackDepth: 25,
    spotKey: "CO_vs_UTG",
    handCode: "AJo",
    note: "Recurring AJo regression spot. Verify after Manus DB reseed and deployed UI review.",
    status: "pending_owner_review",
    evidence: "Pending owner comparison against the 25bb source chart and deployed UI.",
  },
  {
    stackDepth: 25,
    spotKey: "HJ_vs_UTG",
    handCode: "AJo",
    note: "AJo versus UTG should be reviewed in the same post-deploy pass.",
    status: "pending_owner_review",
    evidence: "Pending owner comparison against the 25bb source chart and deployed UI.",
  },
  {
    stackDepth: 25,
    spotKey: "BTN_vs_UTG",
    handCode: "AJo",
    note: "Late-position AJo versus UTG remains a post-deploy review target.",
    status: "pending_owner_review",
    evidence: "Pending owner comparison against the 25bb source chart and deployed UI.",
  },
];

export const GOLDEN_STRATEGY_CELLS = VERIFIED_GOLDEN_STRATEGY_CELLS;
export const GOLDEN_CELLS = GOLDEN_STRATEGY_CELLS;
