import { describe, expect, it } from "vitest";
import { ACTIONS } from "../../shared/strategy";
import { SEED_CHARTS } from "./seedData";
import { GOLDEN_CELLS } from "./goldenCells";

describe("strategy golden cells", () => {
  it("keeps the reviewed golden cells aligned with seeded chart actions", () => {
    for (const goldenCell of GOLDEN_CELLS) {
      const chart = SEED_CHARTS.find(
        candidate =>
          candidate.stackDepth === goldenCell.stackDepth &&
          candidate.spotKey === goldenCell.spotKey
      );

      expect(chart, `${goldenCell.stackDepth}:${goldenCell.spotKey}`).toBeDefined();
      const action = chart?.actions.find(
        candidate => candidate.handCode === goldenCell.handCode
      );

      expect(action, `${goldenCell.stackDepth}:${goldenCell.spotKey}:${goldenCell.handCode}`).toBeDefined();
      expect(ACTIONS).toContain(action?.primaryAction);
      expect(action?.primaryAction).toBe(goldenCell.expectedAction);
    }
  });
});

