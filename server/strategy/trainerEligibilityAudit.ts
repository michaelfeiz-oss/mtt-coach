import {
  getPriorityDrillPack,
  PRIORITY_DRILL_PACKS,
  resolveAllPriorityDrillPacks,
  type DrillPackSpotLike,
} from "../../shared/drillPacks";
import {
  getStrategyChartTrustMetadata,
  isTrainerAllowedStrategyChart,
  isStudyVisibleStrategyChart,
  type StrategyCellMapSource,
  type StrategyChartTrustMetadata,
} from "../../shared/sourceTruth";
import {
  ALL_HANDS,
  SPOT_DEFINITIONS,
  STACK_DEPTHS,
  type SpotDefinition,
  type SpotGroup,
} from "../../shared/strategy";
import { formatStrategyChartTitle } from "../../shared/strategyPresentation";
import { getSourceChart } from "./sourceChartData.generated";
import { SEED_CHARTS, type SeedChart } from "./seedData";

const FULL_MATRIX_CELL_COUNT = ALL_HANDS.length;

export const HIGH_RISK_HANDS = [
  "AA",
  "KK",
  "QQ",
  "JJ",
  "TT",
  "99",
  "88",
  "77",
  "66",
  "55",
  "44",
  "33",
  "22",
  "AKs",
  "AQs",
  "AJs",
  "ATs",
  "A9s",
  "A8s",
  "A7s",
  "A6s",
  "A5s",
  "A4s",
  "A3s",
  "A2s",
  "AKo",
  "AQo",
  "AJo",
  "ATo",
  "A9o",
  "A8o",
  "A7o",
  "A6o",
  "A5o",
  "A4o",
  "A3o",
  "A2o",
  "KQs",
  "KJs",
  "KTs",
  "K9s",
  "KQo",
  "KJo",
  "KTo",
  "QJs",
  "QTs",
  "Q9s",
  "QJo",
  "QTo",
  "JTs",
  "J9s",
  "JTo",
  "T9s",
  "98s",
  "87s",
  "76s",
  "65s",
  "54s",
] as const;

export interface FullChartInventoryRow {
  chartId: string;
  stack: number;
  family: SpotGroup;
  heroPosition: string;
  villainPosition: string;
  playerCount: number;
  anteType: string;
  sourceStatus: string;
  sourceFile: string;
  sourceReference: string;
  sourceChartName: string;
  trainerAllowed: boolean;
  manuallyApprovedForTraining: boolean;
  appearsInViewer: boolean;
  appearsInTrainer: boolean;
  appearsInDrillPack: boolean;
  appearsInWeakSpotEngine: boolean;
  cellCount: number;
  nonFoldCellCount: number;
  sourceMappedCellCount: number;
  generatedCellCount: number;
  missingCellCount: number;
  notesConfidence: string;
  passFail: "PASS" | "FAIL";
  reason: string;
}

export interface ChartCellAuditRow {
  chartId: string;
  stack: number;
  family: SpotGroup;
  heroPosition: string;
  villainPosition: string;
  hand: string;
  appAction: string;
  sourceAction: string;
  sourceStatus: string;
  sourceFile: string;
  sourceReference: string;
  cellSource: StrategyCellMapSource | "n_a";
  matchYesNo: "yes" | "no" | "n_a";
  isHighRiskHand: boolean;
  changedYesNo: "yes" | "no" | "n_a";
  reason: string;
}

export interface TrainerEligibilityAuditSummary {
  totalCharts: number;
  appearsInViewerCount: number;
  trainerAllowedCount: number;
  blockedCount: number;
  sourceBackedCount: number;
  simplifiedCount: number;
  proxyCount: number;
  unsupportedCount: number;
  manuallyApprovedCount: number;
  needsHumanReviewCount: number;
  failedInventoryCount: number;
  exactSourceGapCount: number;
}

interface CatalogSpot {
  syntheticId: number;
  chartId: string;
  stackDepth: number;
  spotDefinition: SpotDefinition;
  title: string;
  trust: StrategyChartTrustMetadata;
  seedChart: SeedChart | null;
  sourceChart: ReturnType<typeof getSourceChart>;
}

const EXACT_FACING_THREE_BET_HEROES = new Set([
  "UTG",
  "UTG1",
  "MP",
  "HJ",
  "CO",
  "BTN",
]);

function buildChartId(stackDepth: number, spotKey: string) {
  return `${stackDepth}:${spotKey}`;
}

function buildSeedChartMap() {
  return new Map(
    SEED_CHARTS.map(chart => [buildChartId(chart.stackDepth, chart.spotKey), chart])
  );
}

function buildCatalogSpots(): CatalogSpot[] {
  const seedChartMap = buildSeedChartMap();
  let syntheticId = 1;

  return STACK_DEPTHS.flatMap(stackDepth =>
    SPOT_DEFINITIONS.map(spotDefinition => {
      const chartLike = {
        id: syntheticId,
        stackDepth,
        spotGroup: spotDefinition.group,
        heroPosition: spotDefinition.heroPosition,
        villainPosition: spotDefinition.villainPosition,
        spotKey: spotDefinition.key,
      };
      const chartId = buildChartId(stackDepth, spotDefinition.key);
      const seedChart = seedChartMap.get(chartId) ?? null;

      return {
        syntheticId: syntheticId++,
        chartId,
        stackDepth,
        spotDefinition,
        title:
          seedChart?.title ??
          formatStrategyChartTitle({
            stackDepth,
            spotGroup: spotDefinition.group,
            heroPosition: spotDefinition.heroPosition,
            villainPosition: spotDefinition.villainPosition,
            spotKey: spotDefinition.key,
          }),
        trust: getStrategyChartTrustMetadata(chartLike),
        seedChart,
        sourceChart: getSourceChart(stackDepth, spotDefinition.key) ?? null,
      };
    })
  );
}

function buildStudyVisibleDrillPackSpots(spots: CatalogSpot[]): DrillPackSpotLike[] {
  return spots
    .filter(spot => isStudyVisibleStrategyChart({
      stackDepth: spot.stackDepth,
      spotGroup: spot.spotDefinition.group,
      heroPosition: spot.spotDefinition.heroPosition,
      villainPosition: spot.spotDefinition.villainPosition,
      spotKey: spot.spotDefinition.key,
    }))
    .map(spot => ({
      id: spot.syntheticId,
      title: spot.title,
      stackDepth: spot.stackDepth,
      spotGroup: spot.spotDefinition.group,
      heroPosition: spot.spotDefinition.heroPosition,
      villainPosition: spot.spotDefinition.villainPosition,
      spotKey: spot.spotDefinition.key,
    }));
}

function isExactSourceGapSpot(spot: CatalogSpot) {
  return (
    spot.stackDepth === 15 &&
    spot.spotDefinition.group === "VS_3BET" &&
    EXACT_FACING_THREE_BET_HEROES.has(spot.spotDefinition.heroPosition) &&
    spot.sourceChart === null
  );
}

function countNonFoldCells(chart: SeedChart | null) {
  return chart
    ? chart.actions.filter(action => action.primaryAction !== "FOLD").length
    : 0;
}

function countSourceMappedCells(sourceChart: ReturnType<typeof getSourceChart>) {
  return sourceChart?.actions.length ?? 0;
}

function buildInventoryReasons(input: {
  spot: CatalogSpot;
  appearsInTrainer: boolean;
  appearsInDrillPack: boolean;
  appearsInWeakSpotEngine: boolean;
}) {
  const reasons: string[] = [];
  const { spot, appearsInTrainer, appearsInDrillPack, appearsInWeakSpotEngine } =
    input;
  const { trust, seedChart, sourceChart } = spot;

  if (!trust.sourceStatus) {
    reasons.push("Missing sourceStatus.");
  }

  if (
    trust.sourceStatus === "source_backed" &&
    (!trust.sourceFile || !trust.sourceReference)
  ) {
    reasons.push("Source-backed chart is missing source file or source reference.");
  }

  if (trust.sourceStatus === "source_backed" && !sourceChart) {
    reasons.push("Source-backed chart has no imported source cell map.");
  }

  if (
    trust.trainerAllowed &&
    trust.sourceStatus !== "source_backed" &&
    !trust.manuallyApprovedForTraining
  ) {
    reasons.push("trainerAllowed is true without exact source backing or manual approval.");
  }

  if (!seedChart && isStudyVisibleStrategyChart({
    stackDepth: spot.stackDepth,
    spotGroup: spot.spotDefinition.group,
    heroPosition: spot.spotDefinition.heroPosition,
    villainPosition: spot.spotDefinition.villainPosition,
    spotKey: spot.spotDefinition.key,
  })) {
    reasons.push("Study-visible chart is missing a seeded matrix.");
  }

  if (!trust.trainerAllowed && appearsInTrainer) {
    reasons.push("Blocked chart appears in trainer.");
  }

  if (!trust.trainerAllowed && appearsInDrillPack) {
    reasons.push("Blocked chart appears in a trainer-startable drill pack.");
  }

  if (!trust.trainerAllowed && appearsInWeakSpotEngine) {
    reasons.push("Blocked chart appears in weak-spot recommendations.");
  }

  return reasons;
}

export function buildFullChartInventoryRows(): FullChartInventoryRow[] {
  const catalogSpots = buildCatalogSpots();
  const drillPackSpots = buildStudyVisibleDrillPackSpots(catalogSpots);
  const resolvedPacks = resolveAllPriorityDrillPacks(drillPackSpots);
  const trainerPackSpotIds = new Set(
    resolvedPacks.flatMap(pack => pack.trainerChartIds)
  );

  return catalogSpots.map(spot => {
    const appearsInViewer = isStudyVisibleStrategyChart({
      stackDepth: spot.stackDepth,
      spotGroup: spot.spotDefinition.group,
      heroPosition: spot.spotDefinition.heroPosition,
      villainPosition: spot.spotDefinition.villainPosition,
      spotKey: spot.spotDefinition.key,
    });
    const appearsInTrainer = spot.seedChart !== null && spot.trust.trainerAllowed;
    const appearsInDrillPack =
      appearsInViewer && trainerPackSpotIds.has(spot.syntheticId);
    const appearsInWeakSpotEngine = appearsInTrainer;
    const cellCount = spot.seedChart?.actions.length ?? 0;
    const sourceMappedCellCount = countSourceMappedCells(spot.sourceChart);
    const generatedCellCount =
      spot.trust.cellMapSource === "generated" || spot.trust.cellMapSource === "manual"
        ? cellCount
        : Math.max(0, cellCount - sourceMappedCellCount);
    const missingCellCount = Math.max(0, FULL_MATRIX_CELL_COUNT - cellCount);
    const reasons = buildInventoryReasons({
      spot,
      appearsInTrainer,
      appearsInDrillPack,
      appearsInWeakSpotEngine,
    });
    const exactSourceGap = isExactSourceGapSpot(spot);

    return {
      chartId: spot.chartId,
      stack: spot.stackDepth,
      family: spot.spotDefinition.group,
      heroPosition: spot.spotDefinition.heroPosition,
      villainPosition: spot.spotDefinition.villainPosition ?? "NONE",
      playerCount: spot.trust.playerCount,
      anteType: spot.trust.anteType,
      sourceStatus: spot.trust.sourceStatus,
      sourceFile: spot.trust.sourceFile ?? "",
      sourceReference: spot.trust.sourceReference ?? "",
      sourceChartName: spot.trust.sourceChartName ?? "",
      trainerAllowed: spot.trust.trainerAllowed,
      manuallyApprovedForTraining: spot.trust.manuallyApprovedForTraining,
      appearsInViewer,
      appearsInTrainer,
      appearsInDrillPack,
      appearsInWeakSpotEngine,
      cellCount,
      nonFoldCellCount: countNonFoldCells(spot.seedChart),
      sourceMappedCellCount,
      generatedCellCount,
      missingCellCount,
      notesConfidence: spot.trust.notesConfidence,
      passFail: reasons.length === 0 ? "PASS" : "FAIL",
      reason:
        reasons.length > 0
          ? reasons.join(" ")
          : exactSourceGap
            ? "Blocked pending exact 15bb facing-3bet source import."
            : "Passed trust and trainer eligibility checks.",
    };
  });
}

export function buildChartCellAuditRows(): ChartCellAuditRow[] {
  const catalogSpots = buildCatalogSpots().filter(spot => spot.seedChart !== null);

  return catalogSpots.flatMap(spot => {
    const appActionMap = new Map(
      (spot.seedChart?.actions ?? []).map(action => [action.handCode, action.primaryAction])
    );
    const sourceActionMap = new Map(
      (spot.sourceChart?.actions ?? []).map(action => [action.handCode, action.primaryAction])
    );

    return HIGH_RISK_HANDS.map(hand => {
      const appAction = appActionMap.get(hand) ?? "";
      const sourceAction = sourceActionMap.get(hand) ?? "";
      let matchYesNo: "yes" | "no" | "n_a" = "n_a";
      let changedYesNo: "yes" | "no" | "n_a" = "n_a";
      let reason = "No exact source comparison available for this chart family.";

      if (spot.trust.sourceStatus === "source_backed") {
        if (sourceAction) {
          matchYesNo = appAction === sourceAction ? "yes" : "no";
          changedYesNo = matchYesNo === "no" ? "yes" : "no";
          reason =
            matchYesNo === "yes"
              ? "Exact imported source cell matches the app matrix."
              : "Source-backed cell does not match the imported exact chart.";
        } else {
          matchYesNo = "no";
          changedYesNo = "n_a";
          reason = "Source-backed chart is missing the imported source cell for this hand.";
        }
      } else if (spot.trust.sourceStatus === "proxy" && sourceAction) {
        matchYesNo = appAction === sourceAction ? "yes" : "no";
        changedYesNo = matchYesNo === "no" ? "yes" : "no";
        reason =
          matchYesNo === "yes"
            ? "Proxy study node currently matches the imported blind-versus-blind cell."
            : "Proxy study node differs from the imported blind-versus-blind cell.";
      } else if (spot.trust.sourceStatus === "simplified_population") {
        reason =
          "No exact source cell exists for this simplified population node. It remains study-only by default.";
      } else if (spot.trust.sourceStatus === "unsupported") {
        reason = "Unsupported node has no source-backed cell map.";
      }

      return {
        chartId: spot.chartId,
        stack: spot.stackDepth,
        family: spot.spotDefinition.group,
        heroPosition: spot.spotDefinition.heroPosition,
        villainPosition: spot.spotDefinition.villainPosition ?? "NONE",
        hand,
        appAction,
        sourceAction,
        sourceStatus: spot.trust.sourceStatus,
        sourceFile: spot.trust.sourceFile ?? "",
        sourceReference: spot.trust.sourceReference ?? "",
        cellSource: spot.trust.cellMapSource,
        matchYesNo,
        isHighRiskHand: true,
        changedYesNo,
        reason,
      };
    });
  });
}

export function summarizeTrainerEligibilityAudit(
  rows: FullChartInventoryRow[]
): TrainerEligibilityAuditSummary {
  return rows.reduce<TrainerEligibilityAuditSummary>(
    (summary, row) => {
      summary.totalCharts += 1;
      if (row.appearsInViewer) summary.appearsInViewerCount += 1;
      if (row.trainerAllowed) summary.trainerAllowedCount += 1;
      if (!row.trainerAllowed) summary.blockedCount += 1;
      if (row.manuallyApprovedForTraining) summary.manuallyApprovedCount += 1;
      if (row.passFail === "FAIL") summary.failedInventoryCount += 1;
      if (row.notesConfidence === "needs_review") summary.needsHumanReviewCount += 1;
      if (
        (row.sourceStatus === "source_backed" &&
          row.sourceMappedCellCount === 0) ||
        row.reason.includes("exact 15bb facing-3bet source import")
      ) {
        summary.exactSourceGapCount += 1;
      }

      switch (row.sourceStatus) {
        case "source_backed":
          summary.sourceBackedCount += 1;
          break;
        case "simplified_population":
          summary.simplifiedCount += 1;
          break;
        case "proxy":
          summary.proxyCount += 1;
          break;
        case "unsupported":
          summary.unsupportedCount += 1;
          break;
      }

      return summary;
    },
    {
      totalCharts: 0,
      appearsInViewerCount: 0,
      trainerAllowedCount: 0,
      blockedCount: 0,
      sourceBackedCount: 0,
      simplifiedCount: 0,
      proxyCount: 0,
      unsupportedCount: 0,
      manuallyApprovedCount: 0,
      needsHumanReviewCount: 0,
      failedInventoryCount: 0,
      exactSourceGapCount: 0,
    }
  );
}

export function listPacksTouchingBlockedCharts(rows: FullChartInventoryRow[]) {
  const blockedKeys = new Set(
    rows.filter(row => !row.trainerAllowed && row.appearsInViewer).map(row => row.chartId)
  );
  const catalogSpots = buildCatalogSpots();
  const drillPackSpots = buildStudyVisibleDrillPackSpots(catalogSpots);
  const chartIdBySyntheticId = new Map(
    catalogSpots.map(spot => [spot.syntheticId, spot.chartId])
  );

  return PRIORITY_DRILL_PACKS.flatMap(pack => {
    const touched = drillPackSpots
      .filter(spot => pack.match(spot))
      .filter(spot => blockedKeys.has(chartIdBySyntheticId.get(spot.id) ?? ""));

    if (touched.length === 0) return [];

    return [
      {
        packId: pack.id,
        title: getPriorityDrillPack(pack.id)?.title ?? pack.id,
        blockedSpotCount: touched.length,
      },
    ];
  });
}
