import { loadReviewPack, validateReviewPack } from "../local-study/reviewScenarios";

const result = validateReviewPack(loadReviewPack());

console.log("Review scenario pack valid.");
console.log(`scenario_records: ${result.scenarioRecords}`);
console.log("family counts:", JSON.stringify(result.byFamily));
console.log("visibility counts:", JSON.stringify(result.byVisibility));
