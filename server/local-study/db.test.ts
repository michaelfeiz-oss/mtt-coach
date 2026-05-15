import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { createEmptyCells } from "../../shared/strategy-v2/model";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mtt-study-db-"));
process.env.LOCAL_DATA_DIR = tempDir;
process.env.LOCAL_SQLITE_PATH = path.join(tempDir, "test.sqlite");

let dbModule: typeof import("./db");

beforeAll(async () => {
  dbModule = await import("./db");
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
});
