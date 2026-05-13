export const STUDY_NOTES_STORAGE_KEY = "mtt.study.notes";

export const STUDY_NOTE_SECTIONS = [
  {
    key: "notes15bb",
    label: "15bb",
    helper: "Short-stack reminders, shove thresholds, and pool exploits.",
  },
  {
    key: "notes25bb",
    label: "25bb",
    helper: "Middle-stack spots, facing-RFI decisions, and boundary hands.",
  },
  {
    key: "notes40bb",
    label: "40bb",
    helper: "Deeper BBA spots, defend ranges, and postflop setup reminders.",
  },
  {
    key: "notes70bb",
    label: "70bb",
    helper: "Deep-stack ideas, live adjustments, and future review notes.",
  },
  {
    key: "generalNotes",
    label: "General Notes",
    helper: "Personal reminders, reflections, and hand-study takeaways.",
  },
] as const;

export type StudyNoteSectionKey = (typeof STUDY_NOTE_SECTIONS)[number]["key"];

export interface StudyNotesState {
  notes15bb: string;
  notes25bb: string;
  notes40bb: string;
  notes70bb: string;
  generalNotes: string;
}

export function createEmptyStudyNotes(): StudyNotesState {
  return {
    notes15bb: "",
    notes25bb: "",
    notes40bb: "",
    notes70bb: "",
    generalNotes: "",
  };
}

export function normalizeStudyNotes(value: unknown): StudyNotesState {
  const empty = createEmptyStudyNotes();
  if (!value || typeof value !== "object") return empty;

  const candidate = value as Record<string, unknown>;

  return {
    notes15bb:
      typeof candidate.notes15bb === "string" ? candidate.notes15bb : "",
    notes25bb:
      typeof candidate.notes25bb === "string" ? candidate.notes25bb : "",
    notes40bb:
      typeof candidate.notes40bb === "string" ? candidate.notes40bb : "",
    notes70bb:
      typeof candidate.notes70bb === "string" ? candidate.notes70bb : "",
    generalNotes:
      typeof candidate.generalNotes === "string" ? candidate.generalNotes : "",
  };
}

export function loadStudyNotes(): StudyNotesState {
  if (typeof window === "undefined") return createEmptyStudyNotes();

  try {
    const raw = window.localStorage.getItem(STUDY_NOTES_STORAGE_KEY);
    if (!raw) return createEmptyStudyNotes();
    return normalizeStudyNotes(JSON.parse(raw));
  } catch {
    return createEmptyStudyNotes();
  }
}

export function saveStudyNotes(notes: StudyNotesState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STUDY_NOTES_STORAGE_KEY,
      JSON.stringify(normalizeStudyNotes(notes))
    );
  } catch {
    // Personal study notes are convenience state only.
  }
}
