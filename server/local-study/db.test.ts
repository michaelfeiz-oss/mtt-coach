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

beforeAll(async () => {
  dbModule = await import("./db");
  seedImportModule = await import("./seedImport");
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
});
