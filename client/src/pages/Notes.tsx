import { useEffect, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddNoteModal, type AddNoteFormData } from "@/components/AddNoteModal";
import { RichTextNoteEditor } from "@/components/RichTextNoteEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotePlainText, normalizeNoteHtml, sanitizeNoteHtml } from "@/lib/noteHtml";
import { trpc } from "@/lib/trpc";

function categoryLabel(category: string) {
  return category
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Notes() {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const utils = trpc.useUtils();

  const { data: notes = [], isLoading } = trpc.notes.list.useQuery({
    limit: 100,
  });

  const createNote = trpc.notes.create.useMutation({
    onSuccess: async () => {
      toast.success("Note saved");
      setShowAddNoteModal(false);
      await utils.notes.list.invalidate();
    },
    onError: error => toast.error(`Could not save note: ${error.message}`),
  });

  const updateNote = trpc.notes.update.useMutation({
    onSuccess: async () => {
      toast.success("Note updated");
      setEditingNoteId(null);
      setDraftContent("");
      await utils.notes.list.invalidate();
    },
    onError: error => toast.error(`Could not update note: ${error.message}`),
  });

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: async () => {
      toast.success("Note deleted");
      await utils.notes.list.invalidate();
    },
    onError: error => toast.error(`Could not delete note: ${error.message}`),
  });

  useEffect(() => {
    if (editingNoteId === null) return;
    const note = notes.find(item => item.id === editingNoteId);
    setDraftContent(note?.content ?? "");
  }, [editingNoteId, notes]);

  function handleCreateNote(data: AddNoteFormData) {
    createNote.mutate({
      category: data.category || "general",
      content: sanitizeNoteHtml(data.content),
    });
  }

  function handleSaveEdit(noteId: number) {
    const content = sanitizeNoteHtml(draftContent);
    if (!getNotePlainText(content).trim()) {
      toast.error("Note cannot be empty.");
      return;
    }
    updateNote.mutate({
      id: noteId,
      content,
    });
  }

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">Live Notes</p>
              <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Player reads, session reminders, and tournament takeaways.
              </p>
            </div>
            <Button
              className="h-11 rounded-xl px-4"
              onClick={() => setShowAddNoteModal(true)}
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </div>
        </header>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Saved Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading &&
              [1, 2, 3].map(index => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))}

            {!isLoading && notes.length === 0 && (
              <div className="app-empty-state p-5">
                No notes yet. Add quick notes during play and they will stay
                here.
              </div>
            )}

            {notes.map(note => {
              const isEditing = editingNoteId === note.id;
              return (
                <article
                  key={note.id}
                  className="rounded-xl border border-border bg-secondary/70 p-3.5"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full">
                        {categoryLabel(note.category)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full"
                        onClick={() =>
                          isEditing
                            ? handleSaveEdit(note.id)
                            : setEditingNoteId(note.id)
                        }
                        disabled={updateNote.isPending}
                      >
                        {isEditing ? "Save" : "Edit"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => deleteNote.mutate({ id: note.id })}
                        disabled={deleteNote.isPending}
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isEditing ? (
                    <RichTextNoteEditor
                      value={draftContent}
                      onChange={setDraftContent}
                      minHeightClassName="min-h-32"
                    />
                  ) : (
                    <div
                      className="text-sm leading-relaxed text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: normalizeNoteHtml(note.content),
                      }}
                    />
                  )}
                </article>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        onSubmit={handleCreateNote}
        isLoading={createNote.isPending}
      />
    </main>
  );
}
