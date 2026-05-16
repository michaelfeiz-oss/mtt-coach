import { describe, expect, it } from "vitest";
import { trainerChartHref, trainerEditorHref } from "../pages/local/TrainerV2";

describe("trainer chart navigation", () => {
  it("links review actions to the same nodeKey used by the question", () => {
    const nodeKey = "facing_jam_70bb_btn_vs_hj_bba";

    expect(trainerChartHref(nodeKey)).toBe(`/strategy/chart/${nodeKey}`);
    expect(trainerEditorHref(nodeKey)).toBe(`/strategy/editor/${nodeKey}`);
  });
});
