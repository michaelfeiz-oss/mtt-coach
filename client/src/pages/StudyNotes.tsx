import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyStudyNotes,
  loadStudyNotes,
  saveStudyNotes,
  STUDY_NOTE_SECTIONS,
  type StudyNoteSectionKey,
  type StudyNotesState,
} from "@/lib/studyNotes";

const NOTE_PLACEHOLDER = [
  "- Key hand or spot reminder",
  "- Boundary hand I keep getting wrong",
  "- Short reflection to review later",
].join("\n");

export default function StudyNotes() {
  const [notes, setNotes] = useState<StudyNotesState>(createEmptyStudyNotes);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setNotes(loadStudyNotes());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveStudyNotes(notes);
  }, [isHydrated, notes]);

  function updateSection(key: StudyNoteSectionKey, value: string) {
    setNotes(previous => ({
      ...previous,
      [key]: value,
    }));
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="app-eyebrow mb-2">Study Notes</p>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Notes
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Keep your own bullet-point reminders here for future review.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/study">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-[var(--border-strong)] bg-card px-4 text-sm font-semibold text-secondary-foreground"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Study
              </Button>
            </Link>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-secondary p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Personal note space
            </p>
            <p className="mt-1 text-sm text-foreground">
              Use one bullet per line. These boxes start with a small starter pack from the existing study guidance, then stay fully yours to edit.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {STUDY_NOTE_SECTIONS.map(section => (
            <section
              key={section.key}
              className="app-surface p-4 sm:p-5"
            >
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {section.label}
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.helper}
                </p>
              </div>

              <div className="mt-4">
                <Textarea
                  value={notes[section.key]}
                  onChange={event => updateSection(section.key, event.target.value)}
                  placeholder={NOTE_PLACEHOLDER}
                  className="min-h-[15rem] rounded-xl bg-secondary/60 text-sm leading-6"
                />
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}
