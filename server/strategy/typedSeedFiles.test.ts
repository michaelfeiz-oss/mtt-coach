import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadStrategySeedNodes,
  loadStrategySeedRows,
} from "./typedSeedFiles";

const tempDirs: string[] = [];

async function makeTempSeedBundle(files: Record<string, string>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "mtt-typed-seeds-"));
  tempDirs.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, "utf8");
  }

  return path.join(root, "manifest.json");
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(tempDir =>
      fs.rm(tempDir, { recursive: true, force: true })
    )
  );
});

describe("typed seed file loading", () => {
  it("loads CSV strategy rows from a manifest", async () => {
    const manifestPath = await makeTempSeedBundle({
      "manifest.json": JSON.stringify({
        version: "v1",
        files: [
          {
            path: "ranges.csv",
            stackBucket: 25,
            scenarioFamily: "facing_open_middle",
            reviewedRowsExpected: 1,
          },
        ],
      }),
      "ranges.csv": [
        "version,heroPosition,villainPosition,villainGroup,action,rangeNotation,frequencyBucket,priority,notes,reviewed",
        "population-v1,BTN,HJ,,CALL,\"AJs, KQs\",always,300,Continue the suited top-end,true",
      ].join("\n"),
    });

    const rows = await loadStrategySeedRows(manifestPath);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.scenarioFamily).toBe("facing_open_middle");
    expect(rows[0]?.heroPosition).toBe("BTN");
    expect(rows[0]?.villainPosition).toBe("HJ");
  });

  it("loads JSON strategy rows and groups them into nodes", async () => {
    const manifestPath = await makeTempSeedBundle({
      "manifest.json": JSON.stringify({
        version: "v1",
        files: [
          {
            path: "ranges.json",
          },
        ],
      }),
      "ranges.json": JSON.stringify({
        rows: [
          {
            version: "population-v1",
            stackBucket: 40,
            playerCount: 9,
            scenarioFamily: "rfi",
            heroPosition: "CO",
            action: "RAISE",
            rangeNotation: "AJs",
            priority: 500,
            reviewed: false,
          },
          {
            version: "population-v1",
            stackBucket: 40,
            playerCount: 9,
            scenarioFamily: "rfi",
            heroPosition: "CO",
            action: "CALL",
            rangeNotation: "KQs",
            priority: 300,
            reviewed: false,
          },
        ],
      }),
    });

    const nodes = await loadStrategySeedNodes(manifestPath);

    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.summary.spotKey).toBe("CO_rfi");
    expect(nodes[0]?.rows).toHaveLength(2);
  });

  it("supports v1b-style csv rows for facing_open_late and bb_vs_sb_open actions", async () => {
    const manifestPath = await makeTempSeedBundle({
      "manifest.json": JSON.stringify({
        version: "population-v1b",
        files: [
          {
            path: "late-open.csv",
            stackBucket: 25,
            scenarioFamily: "facing_open_late",
          },
          {
            path: "bvb.csv",
            stackBucket: 25,
            scenarioFamily: "bb_vs_sb_open",
          },
        ],
      }),
      "late-open.csv": [
        "version,heroPosition,villainPosition,villainGroup,action,rangeNotation,frequencyBucket,priority,notes,reviewed",
        "population-v1b,SB,BTN,,call,\"AJs, KQs\",mostly,300,Continue suited broadways,false",
        "population-v1b,SB,BTN,,three_bet,\"QQ+, AKs\",mostly,600,Value heavy 3-bet,false",
        "population-v1b,SB,BTN,,jam,\"55\",rare,800,Short-stack pressure,false",
        "population-v1b,SB,BTN,,fold,\"72o\",always,100,Clean fold,false",
      ].join("\n"),
      "bvb.csv": [
        "version,heroPosition,villainPosition,villainGroup,action,rangeNotation,frequencyBucket,priority,notes,reviewed",
        "population-v1b,BB,SB,,call,\"QJs\",mostly,300,Defend playable broadway,false",
        "population-v1b,BB,SB,,three_bet,\"AKs\",mostly,600,Value 3-bet,false",
        "population-v1b,BB,SB,,jam,\"22\",rare,800,Low-stack deny equity,false",
        "population-v1b,BB,SB,,fold,\"32o\",always,100,Bottom trash,false",
      ].join("\n"),
    });

    const nodes = await loadStrategySeedNodes(manifestPath);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.summary.scenarioFamily).toBe("facing_open_late");
    expect(nodes[0]?.summary.spotKey).toBe("SB_vs_BTN_open");
    expect(nodes[0]?.rows.map(row => row.action)).toEqual([
      "CALL",
      "THREE_BET",
      "JAM",
      "FOLD",
    ]);
    expect(nodes[1]?.summary.scenarioFamily).toBe("bb_vs_sb_open");
    expect(nodes[1]?.summary.spotKey).toBe("bb_vs_sb_open");
  });
});
