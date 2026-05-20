import fs from "node:fs";
import path from "node:path";
import {
  REVIEW_SCENARIO_OWNER_DECISIONS,
  splitReviewList,
  type StrategyReviewPack,
  type StrategyReviewScenarioInput,
} from "../../shared/strategy-review-scenarios";

const REVIEW_PACK_FILE = "mtt_live_population_strategy_review_pack_2026-05-20.json";

const REVIEW_PACK_CANDIDATE_PATHS = [
  process.env.STRATEGY_REVIEW_PACK_PATH,
  path.resolve(process.cwd(), "server/strategy/review-packs", REVIEW_PACK_FILE),
  path.resolve(process.cwd(), "local-data/review-packs", REVIEW_PACK_FILE),
].filter(Boolean) as string[];

export const REVIEW_PACK_PATH =
  REVIEW_PACK_CANDIDATE_PATHS.find(candidate => fs.existsSync(candidate)) ??
  REVIEW_PACK_CANDIDATE_PATHS[0];

const REQUIRED_FIELDS: (keyof StrategyReviewScenarioInput)[] = [
  "record_id",
  "node_key",
  "display_name",
  "stack_bb",
  "spot_family",
  "hero_position",
  "villain_position",
  "player_count",
  "action_context",
  "allowed_actions",
  "app_status",
  "source_class",
  "source_confidence",
  "range_cells_status",
  "import_decision",
  "trainer_default_visibility",
  "owner_review_required",
  "approval_target",
  "population_strategy_summary",
  "latest_research_alignment",
  "simplified_live_rule",
  "risk_flags",
  "review_hand_focus",
  "codex_action",
  "codex_notes",
  "field_integrity",
  "created_date",
];

const EXPECTED_FAMILY_COUNTS: Record<string, number> = {
  rfi: 20,
  facing_open_early: 20,
  facing_open_middle: 16,
  facing_open_late: 20,
  bb_vs_sb_open: 4,
  sb_first_in: 4,
  bb_vs_sb_limp: 4,
  facing_jam: 24,
  facing_3bet: 60,
  facing_raise_call: 4,
  all_in_3bet: 4,
  all_in_4bet: 4,
};

const EXPECTED_VISIBILITY_COUNTS: Record<string, number> = {
  VISIBLE_DEFAULT: 88,
  HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY: 12,
  HIDDEN_DEFAULT_NOT_DRILLABLE: 84,
};

export function loadReviewPack(filePath = REVIEW_PACK_PATH): StrategyReviewPack {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as StrategyReviewPack;
}

function countBy(records: StrategyReviewScenarioInput[], field: keyof StrategyReviewScenarioInput) {
  return records.reduce<Record<string, number>>((counts, record) => {
    const key = String(record[field]);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function assertCounts(actual: Record<string, number>, expected: Record<string, number>, label: string) {
  for (const [key, count] of Object.entries(expected)) {
    if (actual[key] !== count) {
      throw new Error(`${label}: expected ${key}=${count}, got ${actual[key] ?? 0}`);
    }
  }
  const extras = Object.keys(actual).filter(key => !(key in expected));
  if (extras.length > 0) {
    throw new Error(`${label}: unexpected keys ${extras.join(", ")}`);
  }
}

export function validateReviewPack(pack: StrategyReviewPack) {
  if (!pack || !Array.isArray(pack.scenario_records)) {
    throw new Error("Review pack is missing scenario_records.");
  }
  if (pack.scenario_record_count !== pack.scenario_records.length) {
    throw new Error(
      `scenario_record_count mismatch: expected ${pack.scenario_record_count}, got ${pack.scenario_records.length}`
    );
  }
  if (pack.scenario_records.length !== 184) {
    throw new Error(`Expected 184 scenario records, got ${pack.scenario_records.length}.`);
  }

  const recordIds = new Set<string>();
  const nodeKeys = new Set<string>();

  for (let index = 0; index < pack.scenario_records.length; index += 1) {
    const record = pack.scenario_records[index];
    for (const field of REQUIRED_FIELDS) {
      const value = record[field];
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`Record ${index + 1} has blank required field ${field}.`);
      }
    }

    if (recordIds.has(record.record_id)) {
      throw new Error(`Duplicate record_id ${record.record_id}.`);
    }
    recordIds.add(record.record_id);

    if (nodeKeys.has(record.node_key)) {
      throw new Error(`Duplicate node_key ${record.node_key}.`);
    }
    nodeKeys.add(record.node_key);

    const allowedActions = splitReviewList(record.allowed_actions);
    if (allowedActions.length === 0) {
      throw new Error(`${record.node_key}: allowed_actions is empty.`);
    }

    if (record.spot_family === "facing_3bet") {
      if (record.range_cells_status !== "NO_CHART_CELLS_IMPORTED") {
        throw new Error(`${record.node_key}: facing_3bet must be NO_CHART_CELLS_IMPORTED.`);
      }
      if (record.trainer_default_visibility !== "HIDDEN_DEFAULT_NOT_DRILLABLE") {
        throw new Error(`${record.node_key}: facing_3bet must be HIDDEN_DEFAULT_NOT_DRILLABLE.`);
      }
    }

    if (
      record.app_status === "population_draft_seed" &&
      record.trainer_default_visibility !== "HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY"
    ) {
      throw new Error(`${record.node_key}: population_draft_seed must stay opt-in only.`);
    }

    if (
      record.range_cells_status === "NO_CHART_CELLS_IMPORTED" &&
      record.trainer_default_visibility !== "HIDDEN_DEFAULT_NOT_DRILLABLE"
    ) {
      throw new Error(`${record.node_key}: source-required rows must be hidden and non-drillable.`);
    }
  }

  const byFamily = countBy(pack.scenario_records, "spot_family");
  const byVisibility = countBy(pack.scenario_records, "trainer_default_visibility");
  assertCounts(byFamily, EXPECTED_FAMILY_COUNTS, "family counts");
  assertCounts(byVisibility, EXPECTED_VISIBILITY_COUNTS, "visibility counts");

  return {
    scenarioRecords: pack.scenario_records.length,
    byFamily,
    byVisibility,
    ownerDecisionDefaults: REVIEW_SCENARIO_OWNER_DECISIONS[0],
  };
}
