import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, List, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  body: string;
};

const EMPTY_DRAFT: NoteDraft = {
  title: "",
  category: "General",
  body: "",
};

function draftFromNote(note: StudyNoteRecord): NoteDraft {
  return {
    title: note.title,
    category: note.category ?? "General",
    body: note.body,
  };
}

function payloadFromDraft(draft: NoteDraft) {
  return {
    title: draft.title,
    category: draft.category,
    tags: [],
    linkedNodeKey: null,
    body: draft.body,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function applyInlineMarkdown(value: string) {
  return escapeHtml(value).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function plainTextToEditorHtml(body: string) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(`<ul>${listItems.map(item => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  }

  for (const line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      listItems.push(applyInlineMarkdown(bullet[1] ?? ""));
      continue;
    }

    flushList();
    if (line.trim().length === 0) {
      blocks.push("<p></p>");
    } else {
      blocks.push(`<p>${applyInlineMarkdown(line)}</p>`);
    }
  }

  flushList();
  return blocks.join("");
}

function normalizeBodyForEditor(body: string) {
  if (!body.trim()) return "";
  if (/<(?:p|ul|ol|li|strong|em|br|h[1-6])[\s>]/i.test(body)) return body;
  return plainTextToEditorHtml(body);
}

export default function StudyNotesV2() {
  const [notes, setNotes] = useState<StudyNoteRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editor = useEditor({
    extensions: [StarterKit],
    content: normalizeBodyForEditor(EMPTY_DRAFT.body),
    editorProps: {
      attributes: {
        "aria-label": "Body",
        class:
          "min-h-[22rem] rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-orange-300",
      },
    },
    onUpdate: ({ editor }) => {
      setDraft(current => ({ ...current, body: editor.getHTML() }));
    },
  });

  function updateDraftFromNote(noteDraft: NoteDraft) {
    const normalized = {
      ...noteDraft,
      body: normalizeBodyForEditor(noteDraft.body),
    };
    setDraft(normalized);
    editor?.commands.setContent(normalized.body, { emitUpdate: false });
  }

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(normalizeBodyForEditor(draft.body), { emitUpdate: false });
  }, [editor]);

  async function refresh(nextSelectedId = selectedId) {
    const result = await listStudyNotes();
    setNotes(result.notes);
    if (nextSelectedId !== "new") {
      const selected = result.notes.find(note => note.id === nextSelectedId);
      if (selected) updateDraftFromNote(draftFromNote(selected));
    }
  }

  useEffect(() => {
    listStudyNotes()
      .then(result => {
        setNotes(result.notes);
        if (selectedId === "new" && result.notes.length > 0) {
          const latestNote = result.notes[0];
          setSelectedId(latestNote.id);
          updateDraftFromNote(draftFromNote(latestNote));
          return;
        }

        if (selectedId !== "new") {
          const selected = result.notes.find(note => note.id === selectedId);
          if (selected) updateDraftFromNote(draftFromNote(selected));
        }
      })
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, []);

  const selectedNote = useMemo(
    () => notes.find(note => note.id === selectedId) ?? null,
    [notes, selectedId]
  );

  function selectNote(note: StudyNoteRecord) {
    setSelectedId(note.id);
    updateDraftFromNote(draftFromNote(note));
    setMessage(null);
    setError(null);
  }

  function startNewNote() {
    setSelectedId("new");
    updateDraftFromNote(EMPTY_DRAFT);
    setMessage(null);
    setError(null);
  }

  function chooseSavedNote(value: string) {
    if (value === "new") {
      startNewNote();
      return;
    }

    const note = notes.find(note => note.id === Number(value));
    if (note) selectNote(note);
  }

  async function saveNote() {
    setError(null);
    setMessage(null);
    try {
      if (selectedId === "new") {
        const result = await createStudyNote(payloadFromDraft(draft));
        setSelectedId(result.note.id);
        updateDraftFromNote(draftFromNote(result.note));
        await refresh(result.note.id);
        setMessage("Note created.");
      } else {
        const result = await updateStudyNote(selectedId, payloadFromDraft(draft));
        updateDraftFromNote(draftFromNote(result.note));
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
    updateDraftFromNote(EMPTY_DRAFT);
    await refresh("new");
    setMessage("Note deleted.");
  }

  function applyBoldFormat() {
    if (!editor) return;
    const { empty, $from } = editor.state.selection;

    if (empty && $from.parent.textContent.trim().length > 0) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: $from.start(), to: $from.end() })
        .setBold()
        .run();
      return;
    }

    const chain = editor.chain().focus();
    if (editor.isActive("bold")) {
      chain.unsetBold().run();
    } else {
      chain.setBold().run();
    }
  }

  return (
    <LocalShell>
      <section className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Study</p>
          <h1 className="text-2xl font-black tracking-tight">Study Notes</h1>
          <p className="mt-1 text-sm text-slate-600">Formatted reminders for MTT study, chart review, mistakes, and reflections.</p>
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

      <div>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-3 block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Saved notes{notes.length > 0 ? ` (${notes.length})` : ""}
            </span>
            <select
              value={selectedId === "new" ? "new" : String(selectedId)}
              onChange={event => chooseSavedNote(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-bold"
            >
              <option value="new">New unsaved note</option>
              {notes.map(note => (
                <option key={note.id} value={note.id}>
                  {note.title || "Untitled note"}
                </option>
              ))}
            </select>
          </label>

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

          <div className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Body</span>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={event => {
                    event.preventDefault();
                    applyBoldFormat();
                  }}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold ${
                    editor?.isActive("bold") ? "bg-white text-orange-700 shadow-sm" : "text-slate-700 hover:bg-white"
                  }`}
                  title="Bold selected text"
                >
                  <Bold className="h-3.5 w-3.5" />
                  Bold
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.preventDefault();
                    editor?.chain().focus().toggleBulletList().run();
                  }}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold ${
                    editor?.isActive("bulletList") ? "bg-white text-orange-700 shadow-sm" : "text-slate-700 hover:bg-white"
                  }`}
                  title="Toggle bullet list"
                >
                  <List className="h-3.5 w-3.5" />
                  Bullets
                </button>
              </div>
            </div>
            <div className="study-note-editor mt-1">
              <EditorContent editor={editor} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Select text, then use Bold or Bullets to apply real formatting.
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
