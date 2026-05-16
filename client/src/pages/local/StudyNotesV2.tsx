import { Bold, List, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createStudyNote,
  deleteStudyNote,
  listStudyNotes,
  updateStudyNote,
  type StudyNoteRecord,
} from "@/local-study/api";
import { LocalShell } from "@/local-study/LocalShell";

const CATEGORIES = [
  "General",
  "Range Review",
  "Mistake",
  "Exploit",
  "Heuristic",
  "Mental Game",
  "Drill Reflection",
];

type NoteDraft = {
  title: string;
  category: string;
  tagsText: string;
  linkedNodeKey: string;
  body: string;
};

const EMPTY_DRAFT: NoteDraft = {
  title: "",
  category: "General",
  tagsText: "",
  linkedNodeKey: "",
  body: "",
};

function draftFromNote(note: StudyNoteRecord): NoteDraft {
  return {
    title: note.title,
    category: note.category ?? "General",
    tagsText: note.tags.join(", "),
    linkedNodeKey: note.linkedNodeKey ?? "",
    body: note.body,
  };
}

function payloadFromDraft(draft: NoteDraft) {
  return {
    title: draft.title,
    category: draft.category,
    tags: draft.tagsText
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean),
    linkedNodeKey: draft.linkedNodeKey.trim() || null,
    body: draft.body,
  };
}

function applyBoldToBody(body: string, start: number, end: number) {
  let formatStart = start;
  let formatEnd = end;

  if (start === end) {
    const lineStart = body.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIndex = body.indexOf("\n", start);
    const lineEnd = lineEndIndex === -1 ? body.length : lineEndIndex;
    const currentLine = body.slice(lineStart, lineEnd);
    if (currentLine.trim().length > 0) {
      formatStart = lineStart;
      formatEnd = lineEnd;
    }
  }

  const selected = body.slice(formatStart, formatEnd);
  const replacement = selected ? `**${selected}**` : "****";
  const cursorStart = selected ? formatStart : start + 2;
  const cursorEnd = selected ? formatStart + replacement.length : cursorStart;

  return {
    body: `${body.slice(0, formatStart)}${replacement}${body.slice(formatEnd)}`,
    selectionStart: cursorStart,
    selectionEnd: cursorEnd,
  };
}

function applyBulletsToBody(body: string, start: number, end: number) {
  const lineStart = body.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndIndex = body.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? body.length : lineEndIndex;
  const block = body.slice(lineStart, lineEnd);
  const replacement = block
    .split("\n")
    .map(line => {
      if (line.trim().length === 0) return "- ";
      if (/^\s*[-*]\s+/.test(line)) return line;
      return `- ${line}`;
    })
    .join("\n");

  return {
    body: `${body.slice(0, lineStart)}${replacement}${body.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + replacement.length,
  };
}

export default function StudyNotesV2() {
  const [notes, setNotes] = useState<StudyNoteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  async function refresh(nextSelectedId = selectedId) {
    const result = await listStudyNotes({
      query,
      category: categoryFilter,
    });
    setNotes(result.notes);
    if (nextSelectedId !== "new") {
      const selected = result.notes.find(note => note.id === nextSelectedId);
      if (selected) setDraft(draftFromNote(selected));
    }
  }

  useEffect(() => {
    listStudyNotes({ query, category: categoryFilter })
      .then(result => {
        setNotes(result.notes);
        if (selectedId !== "new") {
          const selected = result.notes.find(note => note.id === selectedId);
          if (selected) setDraft(draftFromNote(selected));
        }
      })
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, [query, categoryFilter]);

  const selectedNote = useMemo(
    () => notes.find(note => note.id === selectedId) ?? null,
    [notes, selectedId]
  );

  function selectNote(note: StudyNoteRecord) {
    setSelectedId(note.id);
    setDraft(draftFromNote(note));
    setMessage(null);
    setError(null);
  }

  function startNewNote() {
    setSelectedId("new");
    setDraft(EMPTY_DRAFT);
    setMessage(null);
    setError(null);
  }

  async function saveNote() {
    setError(null);
    setMessage(null);
    try {
      if (selectedId === "new") {
        const result = await createStudyNote(payloadFromDraft(draft));
        setSelectedId(result.note.id);
        setDraft(draftFromNote(result.note));
        await refresh(result.note.id);
        setMessage("Note created.");
      } else {
        const result = await updateStudyNote(selectedId, payloadFromDraft(draft));
        setDraft(draftFromNote(result.note));
        await refresh(result.note.id);
        setMessage("Note saved.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  async function removeNote() {
    if (selectedId === "new") return;
    const confirmed = window.confirm("Delete this study note?");
    if (!confirmed) return;
    await deleteStudyNote(selectedId);
    setSelectedId("new");
    setDraft(EMPTY_DRAFT);
    await refresh("new");
    setMessage("Note deleted.");
  }

  function applyBodyFormat(
    formatter: (body: string, start: number, end: number) => {
      body: string;
      selectionStart: number;
      selectionEnd: number;
    }
  ) {
    const textarea = bodyRef.current;
    const start = textarea?.selectionStart ?? draft.body.length;
    const end = textarea?.selectionEnd ?? draft.body.length;
    const next = formatter(draft.body, start, end);
    setDraft(current => ({ ...current, body: next.body }));
    window.setTimeout(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(next.selectionStart, next.selectionEnd);
    }, 0);
  }

  return (
    <LocalShell>
      <section className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Study</p>
          <h1 className="text-2xl font-black tracking-tight">Study Notes</h1>
          <p className="mt-1 text-sm text-slate-600">Plain text reminders for MTT study, chart review, mistakes, and reflections.</p>
        </div>
        <button
          type="button"
          onClick={startNewNote}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-lg shadow-orange-200"
        >
          <Plus className="h-4 w-4" />
          New Note
        </button>
      </section>

      <div className="grid gap-3 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-3 lg:self-start">
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search notes"
            className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-orange-300"
          />
          <select
            value={categoryFilter}
            onChange={event => setCategoryFilter(event.target.value)}
            className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-500">
                No notes yet.
              </div>
            ) : null}
            {notes.map(note => (
              <button
                key={note.id}
                type="button"
                onClick={() => selectNote(note)}
                className={`w-full rounded-xl border p-2.5 text-left transition ${
                  note.id === selectedId
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-white hover:border-orange-200"
                }`}
              >
                <p className="line-clamp-1 text-sm font-black">{note.title}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[0.68rem] font-bold text-slate-500">
                  <span>{note.category ?? "General"}</span>
                  {note.linkedNodeKey ? <span className="font-mono">{note.linkedNodeKey}</span> : null}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Title</span>
              <input
                value={draft.title}
                onChange={event => setDraft(current => ({ ...current, title: event.target.value }))}
                placeholder="Example: BB defence leaks at 25bb"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-orange-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Category</span>
              <select
                value={draft.category}
                onChange={event => setDraft(current => ({ ...current, category: event.target.value }))}
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Tags</span>
              <input
                value={draft.tagsText}
                onChange={event => setDraft(current => ({ ...current, tagsText: event.target.value }))}
                placeholder="comma, separated, tags"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-orange-300"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Linked chart nodeKey</span>
              <input
                value={draft.linkedNodeKey}
                onChange={event => setDraft(current => ({ ...current, linkedNodeKey: event.target.value }))}
                placeholder="bb_vs_sb_open_15bb_bba"
                className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none focus:border-orange-300"
              />
            </label>
          </div>

          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Body</span>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => applyBodyFormat(applyBoldToBody)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white"
                  title="Bold selected text"
                >
                  <Bold className="h-3.5 w-3.5" />
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => applyBodyFormat(applyBulletsToBody)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white"
                  title="Turn selected lines into bullets"
                >
                  <List className="h-3.5 w-3.5" />
                  Bullets
                </button>
              </div>
            </div>
            <textarea
              ref={bodyRef}
              aria-label="Body"
              value={draft.body}
              onChange={event => setDraft(current => ({ ...current, body: event.target.value }))}
              placeholder="- One reminder per line&#10;- Use **bold** for key rules&#10;- Link to a chart when useful"
              className="mt-1 min-h-[22rem] w-full resize-y rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-orange-300"
            />
            <p className="mt-1 text-xs text-slate-500">
              Uses simple markdown-style formatting: bullets with <span className="font-mono">-</span> and bold with <span className="font-mono">**text**</span>.
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-slate-500">
              {selectedNote ? `Last saved: ${new Date(selectedNote.updatedAt).toLocaleString()}` : "New unsaved note"}
            </div>
            <div className="flex gap-2">
              {selectedId !== "new" ? (
                <button
                  type="button"
                  onClick={removeNote}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
              <button
                type="button"
                onClick={saveNote}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-lg shadow-orange-200"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>

          {message ? <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
          {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
        </section>
      </div>
    </LocalShell>
  );
}
