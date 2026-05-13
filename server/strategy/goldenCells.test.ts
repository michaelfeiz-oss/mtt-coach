import { describe, expect, it } from "vitest";
import { ACTIONS } from "../../shared/strategy";
import { SEED_CHARTS } from "./seedData";
import {
  GOLDEN_STRATEGY_CELLS,
  PENDING_GOLDEN_STRATEGY_CELLS,
} from "./goldenCells";

describe("strategy golden cells", () => {
  it("keeps verified golden cells aligned with seeded chart actions once owner evidence exists", () => {
    for (const goldenCell of GOLDEN_STRATEGY_CELLS) {
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

  it("tracks pending owner-review golden cells without blessing their actions yet", () => {
    expect(PENDING_GOLDEN_STRATEGY_CELLS.length).toBeGreaterThan(0);

    for (const pendingCell of PENDING_GOLDEN_STRATEGY_CELLS) {
      const chart = SEED_CHARTS.find(
        candidate =>
          candidate.stackDepth === pendingCell.stackDepth &&
          candidate.spotKey === pendingCell.spotKey
      );

      expect(chart, `${pendingCell.stackDepth}:${pendingCell.spotKey}`).toBeDefined();
      const action = chart?.actions.find(
        candidate => candidate.handCode === pendingCell.handCode
      );

      expect(action, `${pendingCell.stackDepth}:${pendingCell.spotKey}:${pendingCell.handCode}`).toBeDefined();
      expect(ACTIONS).toContain(action?.primaryAction);
      expect(pendingCell.status).toBe("pending_owner_review");
      expect(pendingCell.evidence).toContain("Pending owner");
    }
  });
});

