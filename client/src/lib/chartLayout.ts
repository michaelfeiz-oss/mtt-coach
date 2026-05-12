export interface ChartViewerDensity {
  condensed: boolean;
  tight: boolean;
  desktopMatrixMaxWidthRem: number;
}

export function getChartViewerDensity(
  viewportHeight?: number | null
): ChartViewerDensity {
  if (!viewportHeight || viewportHeight >= 940) {
    return {
      condensed: false,
      tight: false,
      desktopMatrixMaxWidthRem: 39,
    };
  }

  if (viewportHeight >= 820) {
    return {
      condensed: true,
      tight: false,
      desktopMatrixMaxWidthRem: 37.5,
    };
  }

  return {
    condensed: true,
    tight: true,
    desktopMatrixMaxWidthRem: 36,
  };
}
