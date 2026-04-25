import { describe, expect, it } from "vitest";
import { getChartViewerDensity } from "./chartLayout";

describe("getChartViewerDensity", () => {
  it("keeps the default desktop matrix footprint on taller viewports", () => {
    expect(getChartViewerDensity(980)).toEqual({
      condensed: false,
      tight: false,
      desktopMatrixMaxWidthRem: 41,
    });
  });

  it("switches to a condensed layout on common laptop-height viewports", () => {
    expect(getChartViewerDensity(880)).toEqual({
      condensed: true,
      tight: false,
      desktopMatrixMaxWidthRem: 39,
    });
  });

  it("tightens the chart further on short desktop viewports", () => {
    expect(getChartViewerDensity(760)).toEqual({
      condensed: true,
      tight: true,
      desktopMatrixMaxWidthRem: 37,
    });
  });
});
