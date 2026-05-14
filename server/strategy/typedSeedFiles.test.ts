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
        files: ["ranges.csv"],
      }),
      "ranges.csv": [
        "version,stackBucket,playerCount,scenarioFamily,heroPosition,villainPosition,villainGroup,action,rangeNotation,priority,notes,reviewed",
        "population-v1,25,9,facing_open_middle,BTN,HJ,,CALL,\"AJs, KQs\",300,Continue the suited top-end,false",
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
        files: ["ranges.json"],
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
});
