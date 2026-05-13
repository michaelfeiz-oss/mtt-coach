import { validateReviewedStrategyCharts } from "../../shared/strategyDataValidation";
import { SEED_CHARTS, validateSeedCharts } from "./seedData";

const reviewed = validateReviewedStrategyCharts();
validateSeedCharts(SEED_CHARTS);

console.log(
  `Strategy data valid: ${reviewed.charts} reviewed charts, ${SEED_CHARTS.length} seeded charts.`
);

