import { ACTION_LABELS, RANKS, type Action } from "../../shared/preflopStrategy";
import { SEED_CHARTS } from "./seedData";

interface ConnectorGapFinding {
  stackDepth: number;
  spotKey: string;
  title: string;
  target: string;
  targetAction: string;
  neighborA: string;
  neighborAAction: string;
  neighborB: string;
  neighborBAction: string;
}

function actionFor(chart: (typeof SEED_CHARTS)[number], handCode: string): Action | "<missing>" {
  return chart.actions.find(action => action.handCode === handCode)?.primaryAction ?? "<missing>";
}

function labelForAction(action: Action | "<missing>") {
  return action === "<missing>" ? action : ACTION_LABELS[action];
}

function findConnectorBridgeGaps() {
  const findings: ConnectorGapFinding[] = [];

  for (const chart of SEED_CHARTS) {
    for (let index = 4; index < RANKS.length - 2; index += 1) {
      const high = RANKS[index];
      const low = RANKS[index + 1];
      const lower = RANKS[index + 2];

      const target = `${high}${low}s`;
      const neighborA = `${high}${lower}s`;
      const neighborB = `${low}${lower}s`;

      const targetAction = actionFor(chart, target);
      const neighborAAction = actionFor(chart, neighborA);
      const neighborBAction = actionFor(chart, neighborB);

      if (
        targetAction === "FOLD" &&
        neighborAAction !== "FOLD" &&
        neighborBAction !== "FOLD"
      ) {
        findings.push({
          stackDepth: chart.stackDepth,
          spotKey: chart.spotKey,
          title: chart.title,
          target,
          targetAction: labelForAction(targetAction),
          neighborA,
          neighborAAction: labelForAction(neighborAAction),
          neighborB,
          neighborBAction: labelForAction(neighborBAction),
        });
      }
    }
  }

  return findings;
}

async function main() {
  const findings = findConnectorBridgeGaps();

  if (findings.length === 0) {
    console.log("No connector bridge-gap anomalies found.");
    return;
  }

  console.table(findings);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
