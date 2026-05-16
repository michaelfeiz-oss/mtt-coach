import fs from "fs";
import path from "path";
import {
  ACTION_TOKENS,
  ALL_HANDS,
  SPOT_TYPES,
  STACK_BUCKETS,
  POSITIONS,
  type ActionToken,
} from "../../shared/strategy-v2/model";

const DEFAULT_TEMPLATE_ROOT = path.resolve(
  process.cwd(),
  "server",
  "strategy",
  "source-pack-templates"
);

const VALID_ACTIONS = new Set<string>(ACTION_TOKENS);
const VALID_HANDS = new Set<string>(ALL_HANDS);
const VALID_SPOT_TYPES = new Set<string>(SPOT_TYPES);
const VALID_STACKS = new Set<number>(STACK_BUCKETS);
const VALID_POSITIONS = new Set<string>(POSITIONS);

type SourcePackTemplate = {
  schemaVersion: number;
  kind: string;
  batch: string;
  charts: SourcePackTemplateChart[];
};

type SourcePackTemplateChart = {
  nodeKey: string;
  stackBb: number;
  spotFamily: string;
  heroPosition: string;
  villainPosition: string | null;
  allowedActions: ActionToken[];
  sourceName: string;
  sourceType: string;
  sourceNotes: string;
  reviewed: boolean;
  cells: Record<string, string>;
};

function findTemplateFiles(root: string) {
  const files: string[] = [];

  function walk(directory: string) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith(".template.json")) {
        files.push(absolute);
      }
    }
  }

  if (fs.existsSync(root)) walk(root);
  return files.sort();
}

function validateChart(chart: SourcePackTemplateChart) {
  const issues: string[] = [];

  if (!chart.nodeKey?.trim()) issues.push("missing nodeKey");
  if (!VALID_STACKS.has(chart.stackBb)) issues.push(`invalid stackBb ${chart.stackBb}`);
  if (!VALID_SPOT_TYPES.has(chart.spotFamily)) issues.push(`invalid spotFamily ${chart.spotFamily}`);
  if (!VALID_POSITIONS.has(chart.heroPosition)) issues.push(`invalid heroPosition ${chart.heroPosition}`);
  if (chart.villainPosition !== null && !VALID_POSITIONS.has(chart.villainPosition)) {
    issues.push(`invalid villainPosition ${chart.villainPosition}`);
  }
  if (!Array.isArray(chart.allowedActions) || chart.allowedActions.length === 0) {
    issues.push("allowedActions is empty");
  } else {
    for (const action of chart.allowedActions) {
      if (!VALID_ACTIONS.has(action)) issues.push(`invalid allowedAction ${action}`);
    }
  }
  if (chart.reviewed !== false) issues.push("template reviewed must remain false until owner review");
  if (!chart.sourceName?.trim()) issues.push("sourceName is blank");
  if (!chart.sourceType?.trim()) issues.push("sourceType is blank");
  if (!chart.sourceNotes?.trim()) issues.push("sourceNotes is blank");

  const hands = Object.keys(chart.cells ?? {});
  const missingHands = ALL_HANDS.filter(hand => !(hand in (chart.cells ?? {})));
  const extraHands = hands.filter(hand => !VALID_HANDS.has(hand));
  const blankHands = ALL_HANDS.filter(hand => String(chart.cells?.[hand] ?? "").trim() === "");
  const invalidActions = ALL_HANDS.filter(hand => {
    const action = String(chart.cells?.[hand] ?? "").trim();
    return action.length > 0 && !VALID_ACTIONS.has(action);
  });
  const outsideAllowed = ALL_HANDS.filter(hand => {
    const action = String(chart.cells?.[hand] ?? "").trim();
    return action.length > 0 && VALID_ACTIONS.has(action) && !chart.allowedActions.includes(action as ActionToken);
  });

  if (hands.length !== 169) issues.push(`expected 169 cell keys, found ${hands.length}`);
  if (missingHands.length) issues.push(`missing hand keys: ${missingHands.join(", ")}`);
  if (extraHands.length) issues.push(`extra hand keys: ${extraHands.join(", ")}`);
  if (blankHands.length) issues.push(`blank action cells (${blankHands.length}): ${blankHands.join(", ")}`);
  if (invalidActions.length) {
    issues.push(
      `invalid action cells: ${invalidActions
        .map(hand => `${hand}=${chart.cells[hand]}`)
        .join(", ")}`
    );
  }
  if (outsideAllowed.length) {
    issues.push(
      `actions outside allowedActions: ${outsideAllowed
        .map(hand => `${hand}=${chart.cells[hand]}`)
        .join(", ")}`
    );
  }

  return issues;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_TEMPLATE_ROOT;
  const files = findTemplateFiles(root);
  if (files.length === 0) {
    console.error(`No *.template.json files found under ${root}`);
    process.exit(1);
  }

  let issueCount = 0;
  let chartCount = 0;

  for (const file of files) {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as SourcePackTemplate;
    if (parsed.schemaVersion !== 1) {
      console.error(`${file}: schemaVersion must be 1`);
      issueCount += 1;
    }
    if (parsed.kind !== "mtt-study-source-pack-template") {
      console.error(`${file}: kind must be mtt-study-source-pack-template`);
      issueCount += 1;
    }

    console.log(`\n${path.relative(process.cwd(), file)}`);
    for (const chart of parsed.charts ?? []) {
      chartCount += 1;
      const issues = validateChart(chart);
      if (issues.length === 0) {
        console.log(`  OK ${chart.nodeKey}`);
        continue;
      }

      issueCount += issues.length;
      console.log(`  NOT IMPORTABLE ${chart.nodeKey}`);
      for (const issue of issues) {
        console.log(`    - ${issue}`);
      }
    }
  }

  console.log(`\nChecked ${chartCount} template charts in ${files.length} files.`);
  if (issueCount > 0) {
    console.error(`${issueCount} template issue(s). Fill all placeholders before importing.`);
    process.exit(1);
  }
}

main();
