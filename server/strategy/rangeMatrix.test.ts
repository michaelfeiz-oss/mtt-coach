import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RangeMatrix, getMatrixCellDisplay } from "../../client/src/components/strategy/RangeMatrix";
import { compileNotationRows } from "../../shared/strategyNotation";

describe("range matrix integrity rendering", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws in non-production strict mode when reviewed cells are missing", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(() =>
      renderToStaticMarkup(
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
      )
    ).toThrow(/Missing reviewed strategy cell data/);
  });

  it("does not silently render a missing AJo cell as Fold in production strict mode", () => {
    vi.stubEnv("NODE_ENV", "production");

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

    expect(markup).toContain('aria-label="AJo missing action"');
    expect(markup).toContain('data-missing="true"');
    expect(markup).not.toContain('aria-label="AJo Fold"');
    expect(markup).toContain("Missing action data");
  });

  it("marks missing cells as missing even outside strict mode", () => {
    const display = getMatrixCellDisplay(undefined, false);
    expect(display.isMissing).toBe(true);
    expect(display.label).toBe("Missing");
    expect(display.primaryAction).toBeNull();
  });

  it("renders the grid from typed notation output rather than guessing cells", () => {
    const compiled = compileNotationRows([
      { action: "RAISE", rangeNotation: "AKs, AQs", priority: 500 },
      { action: "CALL", rangeNotation: "77", priority: 300 },
    ]);

    const actionMap = Object.fromEntries(
      compiled.actions.map(action => [action.handCode, action])
    );

    const markup = renderToStaticMarkup(
      React.createElement(RangeMatrix, {
        actions: actionMap,
        strictComplete: false,
        size: "sm",
        compact: true,
        readonly: true,
      })
    );

    expect(markup).toContain('aria-label="AKs Raise"');
    expect(markup).toContain('aria-label="AQs Raise"');
    expect(markup).toContain('aria-label="77 Call"');
    expect(markup).toContain('aria-label="AJo missing action"');
  });
});
