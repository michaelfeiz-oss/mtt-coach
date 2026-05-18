import { Bold, List } from "lucide-react";
import type { ClipboardEvent } from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  getNotePlainText,
  normalizeNoteHtml,
  plainTextToNoteHtml,
  sanitizeNoteHtml,
} from "@/lib/noteHtml";

interface RichTextNoteEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeightClassName?: string;
  id?: string;
}

export function RichTextNoteEditor({
  value,
  onChange,
  placeholder = "Write the note while it is fresh.",
  minHeightClassName = "min-h-32",
  id,
}: RichTextNoteEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const normalizedValue = normalizeNoteHtml(value);
  const isEmpty = getNotePlainText(normalizedValue).trim().length === 0;

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeNoteHtml(editor.innerHTML));
  }

  function runCommand(command: "bold" | "insertUnorderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
    emitChange();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const nextHtml = html ? sanitizeNoteHtml(html) : plainTextToNoteHtml(text);
    document.execCommand("insertHTML", false, nextHtml);
    emitChange();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => runCommand("bold")}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => runCommand("insertUnorderedList")}
          aria-label="Bulleted list"
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          className={`${minHeightClassName} rounded-xl border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5`}
          onInput={emitChange}
          onPaste={handlePaste}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
