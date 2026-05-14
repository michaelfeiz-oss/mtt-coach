import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createEmptyStudyNotes,
  createStarterStudyNotes,
  hasStudyNoteContent,
  loadStudyNotes,
  normalizeStudyNotes,
  saveStudyNotes,
  STUDY_NOTES_SEEDED_STORAGE_KEY,
  STUDY_NOTES_STORAGE_KEY,
} from "./studyNotes";

describe("study notes storage helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates five empty note buckets", () => {
    expect(createEmptyStudyNotes()).toEqual({
      notes15bb: "",
      notes25bb: "",
      notes40bb: "",
      notes70bb: "",
      generalNotes: "",
    });
  });

  it("creates starter notes without duplicated empty buckets", () => {
    expect(createStarterStudyNotes()).toEqual({
      notes15bb: expect.stringContaining("Treat 15bb spots as threshold decisions"),
      notes25bb: expect.stringContaining("At 25bb, dominated offsuit hands lose value fast once pressure arrives."),
      notes40bb: expect.stringContaining("At 40bb, position helps, but it does not rescue dominated fringe hands."),
      notes70bb: expect.stringContaining("Use this section for deeper-stack reminders that are not yet charted cleanly in the app."),
      generalNotes: expect.stringContaining("One bullet per line: hand or spot, what went wrong, and the correction."),
    });
  });

  it("detects whether note content is present", () => {
    expect(hasStudyNoteContent(createEmptyStudyNotes())).toBe(false);
    expect(
      hasStudyNoteContent({
        ...createEmptyStudyNotes(),
        notes25bb: "- review AJo boundary",
      })
    ).toBe(true);
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

  it("loads starter notes when no saved notes exist yet", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
      },
    });

    expect(loadStudyNotes()).toEqual(createStarterStudyNotes());
  });

  it("keeps saved notes once the user has edited them", () => {
    const savedNotes = {
      notes15bb: "- jam cutoff check",
      notes25bb: "",
      notes40bb: "",
      notes70bb: "",
      generalNotes: "- review this first",
    };

    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => JSON.stringify(savedNotes),
      },
    });

    expect(loadStudyNotes()).toEqual(savedNotes);
  });

  it("upgrades legacy all-empty saved notes into the starter pack once", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => {
          if (key === STUDY_NOTES_STORAGE_KEY) {
            return JSON.stringify(createEmptyStudyNotes());
          }

          return null;
        },
      },
    });

    expect(loadStudyNotes()).toEqual(createStarterStudyNotes());
  });

  it("respects intentionally cleared notes after the starter pack has been seeded", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => {
          if (key === STUDY_NOTES_STORAGE_KEY) {
            return JSON.stringify(createEmptyStudyNotes());
          }

          if (key === STUDY_NOTES_SEEDED_STORAGE_KEY) {
            return "true";
          }

          return null;
        },
      },
    });

    expect(loadStudyNotes()).toEqual(createEmptyStudyNotes());
  });

  it("marks notes as seeded when saving", () => {
    const storage = new Map<string, string>();

    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });

    saveStudyNotes(createStarterStudyNotes());

    expect(storage.get(STUDY_NOTES_STORAGE_KEY)).toBeTruthy();
    expect(storage.get(STUDY_NOTES_SEEDED_STORAGE_KEY)).toBe("true");
  });
});
