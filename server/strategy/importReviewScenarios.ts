import {
  getReviewScenarioSummary,
  importReviewScenarioPack,
} from "../local-study/db";
import { loadReviewPack } from "../local-study/reviewScenarios";

const result = importReviewScenarioPack(loadReviewPack());
const summary = getReviewScenarioSummary();

console.log("Review scenarios imported.");
console.log(JSON.stringify({ ...result, summary }, null, 2));
