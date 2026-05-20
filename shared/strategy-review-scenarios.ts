export const REVIEW_SCENARIO_OWNER_DECISIONS = [
  "PENDING",
  "APPROVED_FOR_REVIEW_LAYER",
  "NEEDS_SOURCE",
  "NEEDS_EDIT",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ReviewScenarioOwnerDecision =
  (typeof REVIEW_SCENARIO_OWNER_DECISIONS)[number];

export interface StrategyReviewScenario {
  id: number;
  recordId: string;
  nodeKey: string;
  displayName: string;
  stackBb: number;
  spotFamily: string;
  heroPosition: string;
  villainPosition: string;
  playerCount: string;
  actionContext: string;
  allowedActions: string[];
  appStatus: string;
  sourceClass: string;
  sourceConfidence: string;
  rangeCellsStatus: string;
  importDecision: string;
  trainerDefaultVisibility: string;
  ownerReviewRequired: string;
  approvalTarget: string;
  populationStrategySummary: string;
  latestResearchAlignment: string;
  simplifiedLiveRule: string;
  riskFlags: string[];
  reviewHandFocus: string[];
  codexAction: string;
  codexNotes: string;
  fieldIntegrity: string;
  createdDate: string;
  ownerDecision: ReviewScenarioOwnerDecision;
  ownerNotes: string;
  updatedAt: string;
  linkedChartExists: boolean;
}

export interface StrategyReviewScenarioInput {
  record_id: string;
  node_key: string;
  display_name: string;
  stack_bb: string | number;
  spot_family: string;
  hero_position: string;
  villain_position: string;
  player_count: string;
  action_context: string;
  allowed_actions: string;
  app_status: string;
  source_class: string;
  source_confidence: string;
  range_cells_status: string;
  import_decision: string;
  trainer_default_visibility: string;
  owner_review_required: string;
  approval_target: string;
  population_strategy_summary: string;
  latest_research_alignment: string;
  simplified_live_rule: string;
  risk_flags: string;
  review_hand_focus: string;
  codex_action: string;
  codex_notes: string;
  field_integrity: string;
  created_date: string;
}

export interface StrategyReviewPack {
  pack_name: string;
  pack_date: string;
  purpose: string;
  repo_reference: string;
  safety_mode: string;
  field_integrity_rule: string;
  global_import_policy: string;
  global_population_principles: unknown[];
  scenario_record_count: number;
  scenario_records: StrategyReviewScenarioInput[];
}

export interface StrategyReviewSummary {
  total: number;
  byFamily: Record<string, number>;
  byVisibility: Record<string, number>;
  bySourceClass: Record<string, number>;
  byRangeCellsStatus: Record<string, number>;
  byOwnerDecision: Record<string, number>;
  linkedChartCount: number;
  sourceRequiredCount: number;
  facing3betCount: number;
}

export function splitReviewList(value: string) {
  return value
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}
