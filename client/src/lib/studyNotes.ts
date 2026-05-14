export const STUDY_NOTES_STORAGE_KEY = "mtt.study.notes";

export const STUDY_NOTE_SECTIONS = [
  {
    key: "notes15bb",
    label: "15bb",
    title: "15bb Notes",
    helper: "Short-stack reminders, shove thresholds, and pool exploits.",
  },
  {
    key: "notes25bb",
    label: "25bb",
    title: "25bb Notes",
    helper: "Middle-stack spots, facing-RFI decisions, and boundary hands.",
  },
  {
    key: "notes40bb",
    label: "40bb",
    title: "40bb Notes",
    helper: "Deeper BBA spots, defend ranges, and postflop setup reminders.",
  },
  {
    key: "notes70bb",
    label: "70bb",
    title: "70bb Notes",
    helper: "Deep-stack ideas, live adjustments, and future review notes.",
  },
  {
    key: "generalNotes",
    label: "General",
    title: "General Notes",
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

const STARTER_NOTES: StudyNotesState = {
  notes15bb: [
    "- Treat 15bb spots as threshold decisions. Most mistakes come from adding curiosity flats where the tree is already compressed.",
    "- Use the exact cutoff, not hand vanity. Pretty offsuit broadways still become folds quickly at this stack.",
    "- In blind-vs-blind limp nodes, know your answer versus a raise before you complete.",
    "- Late-position opens widen through suited pressure and clean connectivity, not weak offsuit junk.",
  ].join("\n"),
  notes25bb: [
    "- At 25bb, dominated offsuit hands lose value fast once pressure arrives.",
    "- Facing a 3-bet: sort the hand into jam, disciplined call, or fold. Do not auto-flat just because it looks playable.",
    "- Versus opens, keep pairs, suited aces, strong broadways, and clean realization hands. Cut dominated broadways first.",
    "- Review boundary hands before autopilot: AJo, KQo, QJo, and medium pairs.",
  ].join("\n"),
  notes40bb: [
    "- At 40bb, position helps, but it does not rescue dominated fringe hands.",
    "- Versus 3-bets, separate stack-off hands, clean calls, and dominated folds before looking for creative continues.",
    "- In SB/BB limp battles, choose hands for playability, not because the price feels cheap.",
    "- Defend late opens with suited and connected hands that realize well; trim weak offsuit bluff-catchers first.",
  ].join("\n"),
  notes70bb: [
    "- Use this section for deeper-stack reminders that are not yet charted cleanly in the app.",
    "- Favor playability and nut potential over offsuit one-pair traps as stacks deepen.",
    "- Write down postflop plans here, not just preflop actions: c-bet textures, turn overfolds, river bluff-catchers.",
    "- If a spot changes a lot by player type or live read, note the adjustment explicitly.",
  ].join("\n"),
  generalNotes: [
    "- One bullet per line: hand or spot, what went wrong, and the correction.",
    "- Separate baseline strategy from exploit notes so they do not blur together.",
    "- If a miss keeps repeating, turn it into a short drill cue you can skim before a session.",
    "- Delete vague notes. Keep only reminders that change a real decision.",
  ].join("\n"),
};

export function createEmptyStudyNotes(): StudyNotesState {
  return {
    notes15bb: "",
    notes25bb: "",
    notes40bb: "",
    notes70bb: "",
    generalNotes: "",
  };
}

export function createStarterStudyNotes(): StudyNotesState {
  return { ...STARTER_NOTES };
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
  if (typeof window === "undefined") return createStarterStudyNotes();

  try {
    const raw = window.localStorage.getItem(STUDY_NOTES_STORAGE_KEY);
    if (!raw) return createStarterStudyNotes();
    return normalizeStudyNotes(JSON.parse(raw));
  } catch {
    return createStarterStudyNotes();
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
