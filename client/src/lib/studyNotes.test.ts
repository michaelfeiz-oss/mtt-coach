import { describe, expect, it } from "vitest";
import {
  createEmptyStudyNotes,
  normalizeStudyNotes,
} from "./studyNotes";

describe("study notes storage helpers", () => {
  it("creates five empty note buckets", () => {
    expect(createEmptyStudyNotes()).toEqual({
      notes15bb: "",
      notes25bb: "",
      notes40bb: "",
      notes70bb: "",
      generalNotes: "",
    });
  });

  it("normalizes unknown values into empty note buckets", () => {
    expect(normalizeStudyNotes(null)).toEqual(createEmptyStudyNotes());
    expect(normalizeStudyNotes("notes")).toEqual(createEmptyStudyNotes());
  });

  it("keeps only the editable study note buckets and ignores everything else", () => {
    expect(
      normalizeStudyNotes({
        notes15bb: "- open tighter",
        notes25bb: "- review AJo",
        notes40bb: "- defend wider",
        notes70bb: "- deep stack reminders",
        generalNotes: "- watch pool trends",
        migratedSpotNotes: ["should", "not", "appear"],
      })
    ).toEqual({
      notes15bb: "- open tighter",
      notes25bb: "- review AJo",
      notes40bb: "- defend wider",
      notes70bb: "- deep stack reminders",
      generalNotes: "- watch pool trends",
    });
  });
});
