import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";
import {
  parseIcmFilename,
  type IcmExtractionPreview,
  type ParsedIcmFilename,
} from "../../shared/icm";

export interface IcmSourceFile {
  fileName: string;
  relativePath: string;
  html?: string;
}

export interface ImportedIcmSpotMetadata extends ParsedIcmFilename {
  extractionPreview: IcmExtractionPreview;
}

export interface IcmMetadataImport {
  generatedAt: string;
  sourcePath: string;
  sourceKind: "directory" | "zip";
  totalFiles: number;
  parsedFiles: number;
  spots: ImportedIcmSpotMetadata[];
}

interface ZipEntry {
  fileName: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

const HTML_FILE_PATTERN = /^ICM\d+.*\.html$/i;
const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

function normalizeRelativePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function isIcmHtmlFile(fileName: string): boolean {
  return HTML_FILE_PATTERN.test(path.basename(fileName));
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countMatches(source: string, pattern: RegExp): number {
  return Array.from(source.matchAll(pattern)).length;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  const minimumOffset = Math.max(0, buffer.length - 65_557);

  for (let index = buffer.length - 22; index >= minimumOffset; index -= 1) {
    if (buffer.readUInt32LE(index) === END_OF_CENTRAL_DIR_SIGNATURE) {
      return index;
    }
  }

  throw new Error("Unable to find zip central directory");
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_DIR_SIGNATURE) {
      throw new Error("Invalid zip central directory entry");
    }

    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer
      .subarray(cursor + 46, cursor + 46 + fileNameLength)
      .toString("utf8");

    entries.push({
      fileName: normalizeRelativePath(fileName),
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntryText(buffer: Buffer, entry: ZipEntry): string {
  const localOffset = entry.localHeaderOffset;

  if (buffer.readUInt32LE(localOffset) !== LOCAL_FILE_SIGNATURE) {
    throw new Error(`Invalid local zip header for ${entry.fileName}`);
  }

  const fileNameLength = buffer.readUInt16LE(localOffset + 26);
  const extraLength = buffer.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + fileNameLength + extraLength;
  const compressed = buffer.subarray(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed.toString("utf8");
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressed).toString("utf8");
  }

  throw new Error(`Unsupported zip compression method ${entry.compressionMethod} for ${entry.fileName}`);
}

async function readDirectoryFiles(rootPath: string): Promise<IcmSourceFile[]> {
  const files: IcmSourceFile[] = [];

  async function visit(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }

      if (!entry.isFile() || !isIcmHtmlFile(entry.name)) continue;

      const relativePath = normalizeRelativePath(path.relative(rootPath, fullPath));
      files.push({
        fileName: entry.name,
        relativePath,
        html: await readFile(fullPath, "utf8"),
      });
    }
  }

  await visit(rootPath);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

async function readZipFiles(zipPath: string): Promise<IcmSourceFile[]> {
  const buffer = await readFile(zipPath);
  const entries = readZipEntries(buffer).filter(entry => isIcmHtmlFile(entry.fileName));

  return entries
    .map(entry => ({
      fileName: path.basename(entry.fileName),
      relativePath: entry.fileName,
      html: readZipEntryText(buffer, entry),
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function listIcmSourceFiles(sourcePath: string): Promise<{
  sourceKind: "directory" | "zip";
  files: IcmSourceFile[];
}> {
  const sourceStats = await stat(sourcePath);

  if (sourceStats.isDirectory()) {
    return {
      sourceKind: "directory",
      files: await readDirectoryFiles(sourcePath),
    };
  }

  if (sourceStats.isFile() && sourcePath.toLowerCase().endsWith(".zip")) {
    return {
      sourceKind: "zip",
      files: await readZipFiles(sourcePath),
    };
  }

  throw new Error("ICM source must be a directory or .zip file");
}

export function extractIcmHtmlPreview(html: string): IcmExtractionPreview {
  const titleMatch = html.match(/id=["']selectedGroupTitle["'][^>]*>([\s\S]*?)<\/h6>/i);
  const colorClassCounts: Record<string, number> = {};

  for (const match of Array.from(html.matchAll(/mdl-color--([a-z0-9_-]+)/gi))) {
    const colorClass = match[1].toLowerCase();
    colorClassCounts[colorClass] = (colorClassCounts[colorClass] ?? 0) + 1;
  }

  const tableHandCount = countMatches(html, /\bid=["']cid_[A2-9TJQK]{2}[so]?["']/gi);
  const weightedComboCount = countMatches(html, /\bdata-weight=["'][^"']+["']/gi);
  const linkedSpotCount = countMatches(html, /\bclass=["'][^"']*\bmyButton2?\b[^"']*["']/gi);
  const notes: string[] = [];

  if (tableHandCount > 0) {
    notes.push("Detected hand-grid cells that may support future structured chart extraction.");
  }

  if (weightedComboCount > 0) {
    notes.push("Detected weighted combo markup; broader extraction should be possible after mapping color classes to actions.");
  }

  if (notes.length === 0) {
    notes.push("No consistent hand-grid markup detected in the preview pass.");
  }

  return {
    status: "parsed_preview",
    groupTitle: titleMatch ? stripTags(titleMatch[1]) : undefined,
    tableHandCount,
    weightedComboCount,
    colorClassCounts,
    linkedSpotCount,
    notes,
  };
}

export async function buildIcmMetadataFromSource(sourcePath: string): Promise<IcmMetadataImport> {
  const { sourceKind, files } = await listIcmSourceFiles(sourcePath);
  const spots = files
    .map(file => {
      const parsed = parseIcmFilename(file.fileName, file.relativePath);

      if (!parsed) return null;

      return {
        ...parsed,
        extractionPreview: file.html
          ? extractIcmHtmlPreview(file.html)
          : { status: "metadata_only" as const },
      };
    })
    .filter((spot): spot is ImportedIcmSpotMetadata => spot !== null);

  return {
    generatedAt: new Date().toISOString(),
    sourcePath: normalizeRelativePath(path.basename(sourcePath)),
    sourceKind,
    totalFiles: files.length,
    parsedFiles: spots.length,
    spots,
  };
}

export async function writeIcmMetadataJson(
  sourcePath: string,
  outputPath: string
): Promise<IcmMetadataImport> {
  const metadata = await buildIcmMetadataFromSource(sourcePath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  return metadata;
}
