import {
  loadStrategySeedNodesSync,
  loadStrategySeedRowsSync,
} from "./typedSeedFiles";
import { SEED_CHARTS, validateSeedCharts } from "./seedData";

const rows = loadStrategySeedRowsSync();
const nodes = loadStrategySeedNodesSync();
validateSeedCharts(SEED_CHARTS);

console.log(
  `Typed strategy data valid: ${rows.length} rows, ${nodes.length} nodes, ${SEED_CHARTS.length} compiled charts.`
);
