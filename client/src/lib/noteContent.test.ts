import { describe, expect, it } from "vitest";
import { deriveNoteTitle, stripNoteHtmlToText } from "@shared/noteContent";

describe("note content helpers", () => {
  it("derives a bounded title from long pasted notes", () => {
    const title = deriveNoteTitle(
      "Higher buy-ins: ".repeat(30) + "Only re-enter if you get 30bb+.",
      "Live note",
      120
    );

    expect(title.length).toBeLessThanOrEqual(120);
    expect(title).toMatch(/^Higher buy-ins:/);
  });

  it("turns simple rich text into readable plain text", () => {
    expect(
      stripNoteHtmlToText("<p><strong>25bb</strong></p><ul><li>Wait for calm re-entry</li></ul>")
    ).toBe("25bb\n- Wait for calm re-entry");
  });
});
