import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createEmptyCells } from "../../shared/strategy-v2/model";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtt-study-db-"));
process.env.LOCAL_DATA_DIR = tempDir;
process.env.LOCAL_SQLITE_PATH = path.join(tempDir, "test.sqlite");

let dbModule: typeof import("./db");
let seedImportModule: typeof import("./seedImport");
let reviewScenarioModule: typeof import("./reviewScenarios");

beforeAll(async () => {
  dbModule = await import("./db");
  seedImportModule = await import("./seedImport");
  reviewScenarioModule = await import("./reviewScenarios");
});

describe("local strategy database", () => {
  it("resolves seed, reviewed, and approved snapshots in order while ignoring drafts", () => {
    const seedCells = createEmptyCells("FOLD");
    seedCells.AA = "RAISE";
    dbModule.upsertSeedChart({
      nodeKey: "rfi_15bb_utg_bba",
      spotType: "rfi",
      stackBb: 15,
      position: "UTG",
      villainPosition: null,
      title: "UTG RFI @ 15bb",
      allowedActions: ["RAISE", "FOLD"],
      cells: seedCells,
    });

    expect(dbModule.resolveChart("rfi_15bb_utg_bba")?.source).toBe("seed");

    const draftCells = { ...seedCells, AA: "FOLD" };
    dbModule.saveDraft({
      nodeKey: "rfi_15bb_utg_bba",
      allowedActions: ["RAISE", "FOLD"],
      cells: draftCells,
    });
    expect(dbModule.resolveChart("rfi_15bb_utg_bba")?.snapshot?.cells.AA).toBe("RAISE");

    const reviewedCells = { ...seedCells, KK: "RAISE" };
    dbModule.createSnapshotFromCells({
      nodeKey: "rfi_15bb_utg_bba",
      status: "reviewed",
      allowedActions: ["RAISE", "FOLD"],
      cells: reviewedCells,
    });
    expect(dbModule.resolveChart("rfi_15bb_utg_bba")?.source).toBe("reviewed");
    expect(dbModule.resolveChart("rfi_15bb_utg_bba")?.snapshot?.cells.KK).toBe("RAISE");

    const approvedCells = { ...reviewedCells, QQ: "RAISE" };
    const approved = dbModule.createSnapshotFromCells({
      nodeKey: "rfi_15bb_utg_bba",
      status: "approved",
      allowedActions: ["RAISE", "FOLD"],
      cells: approvedCells,
    });
    const resolved = dbModule.resolveChart("rfi_15bb_utg_bba");
    expect(resolved?.source).toBe("approved");
    expect(resolved?.snapshot?.id).toBe(approved.id);
    expect(resolved?.snapshot?.cells.QQ).toBe("RAISE");
  });

  it("exports approved packs by nodeKey and protects approved charts from seed overwrite", () => {
    const pack = dbModule.exportApprovedPack();
    expect(pack.chartCount).toBe(1);
    expect(pack.charts[0].nodeKey).toBe("rfi_15bb_utg_bba");
    expect(Object.keys(pack.charts[0].cells)).toHaveLength(169);

    const overwrite = createEmptyCells("FOLD");
    const result = dbModule.upsertSeedChart({
      nodeKey: "rfi_15bb_utg_bba",
      spotType: "rfi",
      stackBb: 15,
      position: "UTG",
      villainPosition: null,
      title: "UTG RFI @ 15bb",
      allowedActions: ["FOLD"],
      cells: overwrite,
    });

    expect(result.skipped).toBe(true);
    expect(dbModule.resolveChart("rfi_15bb_utg_bba")?.snapshot?.cells.QQ).toBe("RAISE");
  });

  it("preserves CALL_JAM through seed import, snapshots, resolution, export, backup/restore, and trainer choices", () => {
    seedImportModule.importTypedSeedsIntoLocalDb();

    const nodeKey = "facing_jam_15bb_bb_vs_sb_bba";
    const seeded = dbModule.resolveChart(nodeKey);
    expect(seeded?.source).toBe("seed");
    expect(seeded?.snapshot?.allowedActions).toContain("CALL_JAM");
    expect(Object.values(seeded!.snapshot!.cells).filter(action => action === "CALL_JAM").length).toBeGreaterThan(0);

    const approved = dbModule.createSnapshotFromCells({
      nodeKey,
      status: "approved",
      allowedActions: seeded!.snapshot!.allowedActions,
      cells: seeded!.snapshot!.cells,
      notes: "CALL_JAM preservation regression.",
    });
    expect(approved.allowedActions).toContain("CALL_JAM");
    expect(dbModule.resolveChart(nodeKey)?.snapshot?.cells.AA).toBe("CALL_JAM");

    const approvedPack = dbModule.exportApprovedPack();
    const exportedChart = approvedPack.charts.find(chart => chart.nodeKey === nodeKey);
    expect(exportedChart?.allowedActions).toContain("CALL_JAM");
    expect(Object.values(exportedChart!.cells)).toContain("CALL_JAM");

    const backup = dbModule.exportFullBackup();
    dbModule.restoreFullBackup(backup);
    const restored = dbModule.resolveChart(nodeKey);
    expect(restored?.source).toBe("approved");
    expect(restored?.snapshot?.allowedActions).toContain("CALL_JAM");
    expect(Object.values(restored!.snapshot!.cells)).toContain("CALL_JAM");

    const trainer = dbModule.chooseTrainerQuestion({ stackBb: 15, spotType: "facing_jam" });
    expect(trainer?.allowedActions).toContain("CALL_JAM");
  });

  it("filters trainer hand pools without falling back to all hands", () => {
    const cells = createEmptyCells("FOLD");
    cells.AA = "RAISE";
    cells.AKs = "CALL";

    expect(dbModule.handsForTrainerPool(cells, "playable")).toEqual(["AA", "AKs"]);
    expect(dbModule.handsForTrainerPool(cells, "fold")).not.toContain("AA");
    expect(dbModule.handsForTrainerPool(cells, "fold")).not.toContain("AKs");
    expect(dbModule.handsForTrainerPool(cells, "fold")).toContain("62o");
    expect(dbModule.handsForTrainerPool(cells, "all")).toHaveLength(169);
  });

  it("imports population draft packs as seed only and skips approved charts", () => {
    const nodeKey = "population_draft_25bb_sb_vs_co_bba";
    const seedCells = createEmptyCells("FOLD");
    seedCells.AA = "JAM";

    const pack = {
      schemaVersion: 1 as const,
      kind: "mtt-study-population-draft-pack" as const,
      batch: "Test population draft",
      charts: [
        {
          nodeKey,
          title: "SB vs CO @ 25bb",
          stackBb: 25 as const,
          spotFamily: "facing_open_late" as const,
          heroPosition: "SB" as const,
          villainPosition: "CO" as const,
          allowedActions: ["JAM", "FOLD"] as const,
          sourceName: "test_population_rulebook",
          sourceType: "population_constructed",
          sourceNotes: "Population draft test.",
          reviewed: false as const,
          cells: seedCells,
        },
      ],
    };

    const imported = dbModule.importPopulationDraftPack(pack);
    expect(imported).toMatchObject({ imported: 1, skipped: 0, totalCharts: 1 });
    expect(dbModule.resolveChart(nodeKey)?.source).toBe("seed");
    expect(dbModule.resolveChart(nodeKey)?.chart.description).toContain("population_constructed");
    expect(dbModule.chooseTrainerQuestion({ nodeKey })).toBeNull();
    expect(dbModule.chooseTrainerQuestion({ nodeKey, chartSource: "include_population" })?.chart.nodeKey).toBe(nodeKey);
    expect(dbModule.buildAuditSummary().populationDrafts.some(chart => chart.nodeKey === nodeKey)).toBe(true);

    dbModule.createSnapshotFromCells({
      nodeKey,
      status: "approved",
      allowedActions: ["JAM", "FOLD"],
      cells: seedCells,
      notes: "Owner approved test chart.",
    });

    const overwriteCells = createEmptyCells("FOLD");
    const skipped = dbModule.importPopulationDraftPack({
      ...pack,
      charts: [{ ...pack.charts[0], allowedActions: ["FOLD"], cells: overwriteCells }],
    });
    expect(skipped).toMatchObject({ imported: 0, skipped: 1, totalCharts: 1 });
    expect(dbModule.resolveChart(nodeKey)?.source).toBe("approved");
    expect(dbModule.resolveChart(nodeKey)?.snapshot?.cells.AA).toBe("JAM");
  });

  it("uses the same resolved snapshot for library and trainer while ignoring drafts", () => {
    const nodeKey = "audit_70bb_btn_vs_hj_bba";
    const seedCells = createEmptyCells("FOLD");
    seedCells.A9s = "FOLD";
    seedCells.K9s = "CALL";

    dbModule.upsertSeedChart({
      nodeKey,
      spotType: "facing_open_middle",
      stackBb: 70,
      position: "BTN",
      villainPosition: "HJ",
      title: "BTN vs HJ @ 70bb",
      allowedActions: ["CALL", "FOLD"],
      cells: seedCells,
    });

    const seedLibraryResolved = dbModule.resolveChart(nodeKey);
    const seedTrainerQuestion = dbModule.chooseTrainerQuestion({ nodeKey, handPool: "all" });

    expect(seedLibraryResolved?.source).toBe("seed");
    expect(seedTrainerQuestion?.source).toBe("seed");
    expect(seedTrainerQuestion?.chart.nodeKey).toBe(nodeKey);
    expect(seedTrainerQuestion?.snapshot.cells).toEqual(seedLibraryResolved?.snapshot?.cells);
    expect(seedTrainerQuestion?.snapshot.cells.A9s).toBe("FOLD");
    expect(seedTrainerQuestion?.snapshot.cells.K9s).toBe("CALL");

    const draftCells = { ...seedCells, A9s: "CALL" };
    dbModule.saveDraft({
      nodeKey,
      allowedActions: ["CALL", "FOLD"],
      cells: draftCells,
    });

    expect(dbModule.resolveChart(nodeKey)?.snapshot?.cells.A9s).toBe("FOLD");
    expect(dbModule.chooseTrainerQuestion({ nodeKey, handPool: "all" })?.snapshot.cells.A9s).toBe("FOLD");

    const approvedCells = { ...seedCells, A9s: "CALL" };
    dbModule.createSnapshotFromCells({
      nodeKey,
      status: "approved",
      allowedActions: ["CALL", "FOLD"],
      cells: approvedCells,
      notes: "Approved source audit regression.",
    });

    const approvedLibraryResolved = dbModule.resolveChart(nodeKey);
    const approvedTrainerQuestion = dbModule.chooseTrainerQuestion({ nodeKey, handPool: "all" });
    expect(approvedLibraryResolved?.source).toBe("approved");
    expect(approvedTrainerQuestion?.source).toBe("approved");
    expect(approvedTrainerQuestion?.snapshot.cells).toEqual(approvedLibraryResolved?.snapshot?.cells);
    expect(approvedTrainerQuestion?.snapshot.cells.A9s).toBe("CALL");
    expect(approvedTrainerQuestion?.snapshot.cells.K9s).toBe("CALL");

    const capturedTrainerQuestion = dbModule.chooseTrainerQuestion({ nodeKey, handPool: "all" });
    const recorrectedCells = { ...approvedCells, A9s: "FOLD" };
    dbModule.createSnapshotFromCells({
      nodeKey,
      status: "approved",
      allowedActions: ["CALL", "FOLD"],
      cells: recorrectedCells,
      notes: "Later approval should not mutate an existing trainer question.",
    });

    expect(capturedTrainerQuestion?.snapshot.cells.A9s).toBe("CALL");
    expect(dbModule.resolveChart(nodeKey)?.snapshot?.cells.A9s).toBe("FOLD");
  });

  it("persists study notes and includes them in full backup/restore", () => {
    const created = dbModule.createStudyNote({
      title: "BB defence review",
      category: "Range Review",
      tags: ["bb", "defence", "25bb"],
      linkedNodeKey: "bb_vs_sb_open_15bb_bba",
      body: "- Check suited trash before approving charts.",
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.linkedNodeKey).toBe("bb_vs_sb_open_15bb_bba");
    expect(created.tags).toEqual(["bb", "defence", "25bb"]);

    const updated = dbModule.updateStudyNote(created.id, {
      title: "BB defence review updated",
      category: "Heuristic",
      tags: ["bb", "review"],
      linkedNodeKey: "bb_vs_sb_open_15bb_bba",
      body: "- Fold assumptions must come from reviewed data.",
    });

    expect(updated.title).toBe("BB defence review updated");
    expect(dbModule.listStudyNotes({ query: "Fold assumptions" })).toHaveLength(1);
    expect(dbModule.listStudyNotes({ category: "Heuristic" })).toHaveLength(1);

    const backup = dbModule.exportFullBackup() as any;
    expect(backup.studyNotes).toHaveLength(1);

    dbModule.restoreFullBackup(backup);
    const restored = dbModule.listStudyNotes({ query: "defence review updated" });
    expect(restored).toHaveLength(1);
    expect(restored[0].body).toContain("reviewed data");

    dbModule.deleteStudyNote(restored[0].id);
    expect(dbModule.listStudyNotes({ query: "defence review updated" })).toHaveLength(0);
  });

  it("imports review scenarios without mutating strategy chart tables", () => {
    const pack = reviewScenarioModule.loadReviewPack();
    const validation = reviewScenarioModule.validateReviewPack(pack);
    expect(validation.scenarioRecords).toBe(184);

    const before = dbModule.buildAuditSummary().counts;
    const result = dbModule.importReviewScenarioPack(pack);
    const secondResult = dbModule.importReviewScenarioPack(pack);
    const after = dbModule.buildAuditSummary().counts;

    expect(result.imported).toBe(184);
    expect(secondResult.imported).toBe(184);
    expect(after.charts).toBe(before.charts);
    expect(after.snapshots).toBe(before.snapshots);
    expect(after.drafts).toBe(before.drafts);
    expect(secondResult.chartTableCountsBefore).toEqual(secondResult.chartTableCountsAfter);

    const summary = dbModule.getReviewScenarioSummary();
    expect(summary.total).toBe(184);
    expect(summary.byFamily.facing_3bet).toBe(60);
    expect(summary.byVisibility.VISIBLE_DEFAULT).toBe(88);
    expect(summary.byVisibility.HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY).toBe(12);
    expect(summary.byVisibility.HIDDEN_DEFAULT_NOT_DRILLABLE).toBe(84);

    const facing3bet = dbModule.getReviewScenario("facing_3bet_25bb_utg_vs_hj_bba");
    expect(facing3bet?.rangeCellsStatus).toBe("NO_CHART_CELLS_IMPORTED");
    expect(facing3bet?.trainerDefaultVisibility).toBe("HIDDEN_DEFAULT_NOT_DRILLABLE");
    expect(facing3bet?.linkedChartExists).toBe(false);
    const facing3betRows = dbModule.listReviewScenarios({ spotFamily: "facing_3bet" });
    expect(facing3betRows).toHaveLength(60);
    expect(facing3betRows.every(row => row.trainerDefaultVisibility === "HIDDEN_DEFAULT_NOT_DRILLABLE")).toBe(true);
    expect(facing3betRows.every(row => !row.linkedChartExists)).toBe(true);
    expect(
      dbModule
        .listReviewScenarios({ rangeCellsStatus: "NO_CHART_CELLS_IMPORTED" })
        .every(row => row.trainerDefaultVisibility === "HIDDEN_DEFAULT_NOT_DRILLABLE")
    ).toBe(true);

    const populationDraft = dbModule.getReviewScenario("sb_first_in_25bb_bba");
    expect(populationDraft?.trainerDefaultVisibility).toBe("HIDDEN_DEFAULT_INCLUDE_POPULATION_ONLY");

    const beforeDecision = dbModule.buildAuditSummary().counts;
    const updated = dbModule.updateReviewScenarioOwnerDecision("sb_first_in_25bb_bba", {
      ownerDecision: "NEEDS_EDIT",
      ownerNotes: "Review small-pair thresholds.",
    });
    const afterDecision = dbModule.buildAuditSummary().counts;
    expect(updated.ownerDecision).toBe("NEEDS_EDIT");
    expect(updated.ownerNotes).toContain("small-pair");
    expect(afterDecision.charts).toBe(beforeDecision.charts);
    expect(afterDecision.snapshots).toBe(beforeDecision.snapshots);
    expect(afterDecision.drafts).toBe(beforeDecision.drafts);
    expect(
      (dbModule.exportFullBackup() as any).auditLog.some(
        (row: any) =>
          row.action_type === "review_scenario_owner_decision_changed" &&
          row.node_key === "sb_first_in_25bb_bba"
      )
    ).toBe(true);

    const qa = dbModule.getReviewScenarioQa();
    expect(qa.scenarioCount).toBe(184);
    expect(qa.emptyFieldCount).toBe(0);
    expect(qa.invalidFacing3betRows).toBe(0);
    expect(qa.sourceRequiredDrillableRows).toBe(0);
    expect(qa.populationDraftVisibilityErrors).toBe(0);
    expect(qa.strategyTruthTablesUnchanged).toBe(true);
    expect(qa.warnings).toEqual([]);

    const backup = dbModule.exportFullBackup() as any;
    expect(backup.reviewScenarios).toHaveLength(184);
    dbModule.restoreFullBackup(backup);
    expect(dbModule.getReviewScenarioSummary().total).toBe(184);
    expect(dbModule.getReviewScenario("sb_first_in_25bb_bba")?.ownerDecision).toBe("NEEDS_EDIT");
  });

  it("rejects malformed review scenario packs", () => {
    const pack = reviewScenarioModule.loadReviewPack();
    expect(() =>
      reviewScenarioModule.validateReviewPack({
        ...pack,
        scenario_records: [{ ...pack.scenario_records[0], display_name: "" }, ...pack.scenario_records.slice(1)],
      })
    ).toThrow(/blank required field display_name/);

    expect(() =>
      reviewScenarioModule.validateReviewPack({
        ...pack,
        scenario_records: [
          pack.scenario_records[0],
          { ...pack.scenario_records[1], node_key: pack.scenario_records[0].node_key },
          ...pack.scenario_records.slice(2),
        ],
      })
    ).toThrow(/Duplicate node_key/);

    expect(() =>
      reviewScenarioModule.validateReviewPack({
        ...pack,
        scenario_records: [
          pack.scenario_records[0],
          { ...pack.scenario_records[1], record_id: pack.scenario_records[0].record_id },
          ...pack.scenario_records.slice(2),
        ],
      })
    ).toThrow(/Duplicate record_id/);
  });
});
