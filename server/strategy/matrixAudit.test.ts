import { describe, expect, it } from "vitest";
import type { SeedChart } from "./seedData";
import { buildMatrixDuplicateGroups } from "./matrixAudit";

function makeChart(overrides: Partial<SeedChart>): SeedChart {
  return {
    id: 1,
    version: "v1",
    stackBucket: 25,
    playerCount: 9,
    scenarioFamily: "facing_jam",
    heroPosition: "CO",
    villainPosition: "BB",
    villainGroup: null,
    title: "CO vs BB Jam @ 25bb",
    spotKey: "CO_vs_BB_jam",
    stackDepth: 25,
    spotGroup: "facing_jam",
    reviewed: false,
    sourceLabel: "Not Yet Reviewed",
    notesJson: null,
    actions: [
      { handCode: "AA", primaryAction: "CALL", weightPercent: 100 },
      { handCode: "AKs", primaryAction: "CALL", weightPercent: 100 },
    ],
    sourceStatus: "simplified_population",
    cellMapSource: "manual",
    dataVersion: "v1",
    reviewedBy: null,
    reviewedAt: null,
    sourceFile: null,
    sourcePanelLabel: null,
    notes: [],
    ...overrides,
  };
}

describe("matrix duplicate audit", () => {
  it("accepts matching simplified facing-jam duplicates within the same family", () => {
    const first = makeChart({});
    const second = makeChart({
      id: 2,
      title: "BTN vs BB Jam @ 25bb",
      heroPosition: "BTN",
      spotKey: "BTN_vs_BB_jam",
    });

    const duplicateGroups = buildMatrixDuplicateGroups([first, second]);

    expect(duplicateGroups).toHaveLength(1);
    expect(duplicateGroups[0]?.classification).toBe("accepted_simplified_family");
    expect(duplicateGroups[0]?.acceptable).toBe(true);
  });

  it("flags reviewed duplicate nodes for review instead of pretending they are distinct", () => {
    const first = makeChart({
      sourceStatus: "source_backed",
      cellMapSource: "reviewed",
      reviewed: true,
    });
    const second = makeChart({
      id: 2,
      title: "HJ vs CO Open @ 25bb",
      heroPosition: "HJ",
      villainPosition: "CO",
      spotGroup: "facing_open_late",
      scenarioFamily: "facing_open_late",
      spotKey: "HJ_vs_CO_open",
      sourceStatus: "source_backed",
      cellMapSource: "reviewed",
      reviewed: true,
    });

    const duplicateGroups = buildMatrixDuplicateGroups([first, second]);

    expect(duplicateGroups).toHaveLength(1);
    expect(duplicateGroups[0]?.classification).toBe("needs_review");
    expect(duplicateGroups[0]?.acceptable).toBe(false);
  });
});
