import { stripNoteHtmlToText } from "@shared/noteContent";

const INLINE_TAGS = new Set(["STRONG", "B", "EM", "I", "U"]);
const BLOCK_TAGS = new Set(["P", "UL", "OL", "LI", "BR"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const children = Array.from(element.childNodes).map(sanitizeNode).join("");
  const tag = element.tagName;

  if (tag === "DIV" || /^H[1-6]$/.test(tag)) {
    return `<p>${children || "<br>"}</p>`;
  }

  if (tag === "SPAN") return children;
  if (tag === "B") return `<strong>${children}</strong>`;
  if (tag === "I") return `<em>${children}</em>`;
  if (INLINE_TAGS.has(tag)) return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
  if (tag === "BR") return "<br>";
  if (BLOCK_TAGS.has(tag)) return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;

  return children;
}

export function sanitizeNoteHtml(value: string) {
  if (typeof window === "undefined" || !value.trim()) return "";
  const document = new DOMParser().parseFromString(value, "text/html");
  return Array.from(document.body.childNodes).map(sanitizeNode).join("").trim();
}

export function plainTextToNoteHtml(value: string) {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
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
      listItems.push(escapeHtml(bullet[1] ?? ""));
      continue;
    }

    flushList();
    if (line.trim()) {
      blocks.push(`<p>${escapeHtml(line.trim())}</p>`);
    } else if (blocks.length > 0) {
      blocks.push("<p><br></p>");
    }
  }

  flushList();
  return blocks.join("");
}

export function normalizeNoteHtml(value: string) {
  if (!value.trim()) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeNoteHtml(value);
  return plainTextToNoteHtml(value);
}

export function getNotePlainText(value: string) {
  return stripNoteHtmlToText(value);
}
