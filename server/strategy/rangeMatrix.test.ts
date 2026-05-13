import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RangeMatrix, getMatrixCellDisplay } from "../../client/src/components/strategy/RangeMatrix";

describe("range matrix integrity rendering", () => {
  it("does not silently render a missing AJo cell as Fold in strict mode", () => {
    const markup = renderToStaticMarkup(
      React.createElement(RangeMatrix, {
        actions: {
          AA: {
            handCode: "AA",
            primaryAction: "RAISE",
          },
        },
        strictComplete: true,
        size: "sm",
        compact: true,
        readonly: true,
      })
    );

    expect(markup).toContain('aria-label="AJo Missing data (strict)"');
    expect(markup).toContain('data-missing="true"');
    expect(markup).not.toContain('aria-label="AJo Fold"');
  });

  it("marks missing cells as missing even outside strict mode", () => {
    const display = getMatrixCellDisplay(undefined, false);
    expect(display.isMissing).toBe(true);
    expect(display.label).toBe("Missing data");
    expect(display.primaryAction).toBeNull();
  });
});
