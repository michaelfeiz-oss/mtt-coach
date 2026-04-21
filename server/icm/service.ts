import { and, asc, eq } from "drizzle-orm";
import { icmPacks, icmSpots, type IcmPack, type IcmSpot, type InsertIcmSpot } from "../../drizzle/schema";
import {
  ICM_CATEGORIES,
  ICM_TAGS,
  type IcmCategory,
  type IcmExtractionPreview,
  type IcmPackDetailDto,
  type IcmPackDto,
  type IcmSpotDto,
  type IcmSpotFilters,
  type IcmStackEntry,
  type IcmTag,
  type ParsedIcmFilename,
} from "../../shared/icm";
import { getDb } from "../db";
import {
  ICM_ESSENTIALS_PACK,
  getCuratedIcmPackSeed,
  getCuratedIcmSpotSeeds,
} from "./seedData";

type JsonRecord = Record<string, unknown>;

interface PersistIcmPackInput {
  slug: string;
  title: string;
  description?: string | null;
  spots: Array<Omit<IcmSpotDto, "id" | "packId">>;
}

const fallbackPack = getCuratedIcmPackSeed();
const fallbackSpots = getCuratedIcmSpotSeeds(fallbackPack.id);
const validTags = new Set<string>(ICM_TAGS);
const validCategories = new Set<string>(ICM_CATEGORIES);

function parseJson(value: string | null): unknown {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStackEntry(value: unknown): value is IcmStackEntry {
  if (!isJsonRecord(value)) return false;
  const position = value.position;
  const stackBb = value.stackBb;
  const rawToken = value.rawToken;

  return (
    (position === null || typeof position === "string") &&
    typeof stackBb === "number" &&
    typeof rawToken === "string"
  );
}

function parseStackSummary(value: string | null): IcmStackEntry[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isStackEntry);
}

function parseTags(value: string | null): IcmTag[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return ICM_TAGS.filter(tag => parsed.includes(tag));
}

function parseCategory(value: string): IcmCategory {
  return validCategories.has(value) ? (value as IcmCategory) : "OVERVIEW";
}

function parseRawMetadata(value: string | null): ParsedIcmFilename | null {
  const parsed = parseJson(value);
  return isJsonRecord(parsed) ? (parsed as unknown as ParsedIcmFilename) : null;
}

function parseContent(value: string | null): IcmExtractionPreview | null {
  const parsed = parseJson(value);
  return isJsonRecord(parsed) ? (parsed as unknown as IcmExtractionPreview) : null;
}

function stackSummaryText(stacks: IcmStackEntry[]): string {
  return stacks
    .map(stack => `${stack.position ?? "Unknown"} ${stack.stackBb}bb`)
    .join(" / ");
}

function mapPack(row: IcmPack, spotCount: number): IcmPackDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    isActive: row.isActive,
    spotCount,
    difficulty: "Advanced",
  };
}

function mapSpot(row: IcmSpot): IcmSpotDto {
  const stackSummary = parseStackSummary(row.stackSummaryJson);

  return {
    id: row.id,
    packId: row.packId,
    title: row.title,
    fileName: row.fileName,
    sourcePath: row.sourcePath,
    playerCount: row.playerCount,
    primaryCategory: parseCategory(row.primaryCategory),
    heroPosition: row.heroPosition,
    villainPosition: row.villainPosition,
    heroStackBb: row.heroStackBb,
    villainStackBb: row.villainStackBb,
    stackSummary,
    stackSummaryText: stackSummaryText(stackSummary),
    tags: parseTags(row.tagsJson),
    actionHint: row.actionHint,
    rawMetadata: parseRawMetadata(row.rawMetadataJson),
    content: parseContent(row.contentJson),
    isCurated: row.isCurated,
  };
}

function sortSpots(spots: IcmSpotDto[]): IcmSpotDto[] {
  return [...spots].sort(
    (a, b) =>
      a.playerCount - b.playerCount ||
      a.primaryCategory.localeCompare(b.primaryCategory) ||
      a.title.localeCompare(b.title)
  );
}

function applyFilters(spots: IcmSpotDto[], filters: IcmSpotFilters): IcmSpotDto[] {
  return spots.filter(spot => {
    if (filters.playerCount !== undefined && spot.playerCount !== filters.playerCount) {
      return false;
    }

    if (filters.primaryCategory !== undefined && spot.primaryCategory !== filters.primaryCategory) {
      return false;
    }

    if (filters.tag !== undefined && !spot.tags.includes(filters.tag)) {
      return false;
    }

    return true;
  });
}

function getAvailableFilters(spots: IcmSpotDto[]): IcmPackDetailDto["availableFilters"] {
  const playerCounts = Array.from(new Set(spots.map(spot => spot.playerCount))).sort((a, b) => a - b);
  const tags = ICM_TAGS.filter(tag => spots.some(spot => spot.tags.includes(tag)));
  const categories = ICM_CATEGORIES.filter(category =>
    spots.some(spot => spot.primaryCategory === category)
  );

  return { playerCounts, tags, categories };
}

function fallbackPackDetail(filters: IcmSpotFilters = {}): IcmPackDetailDto {
  const allSpots = sortSpots(fallbackSpots);
  const spots = applyFilters(allSpots, filters);

  return {
    ...fallbackPack,
    spots,
    availableFilters: getAvailableFilters(allSpots),
  };
}

function countSpotsByPack(spots: Pick<IcmSpot, "packId" | "isCurated">[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const spot of spots) {
    if (!spot.isCurated) continue;
    counts.set(spot.packId, (counts.get(spot.packId) ?? 0) + 1);
  }

  return counts;
}

function toInsertSpot(packId: number, spot: Omit<IcmSpotDto, "id" | "packId">): InsertIcmSpot {
  return {
    packId,
    title: spot.title,
    fileName: spot.fileName,
    sourcePath: spot.sourcePath,
    playerCount: spot.playerCount,
    primaryCategory: spot.primaryCategory,
    heroPosition: spot.heroPosition ?? null,
    villainPosition: spot.villainPosition ?? null,
    heroStackBb: spot.heroStackBb ?? null,
    villainStackBb: spot.villainStackBb ?? null,
    stackSummaryJson: JSON.stringify(spot.stackSummary),
    tagsJson: JSON.stringify(spot.tags.filter(tag => validTags.has(tag))),
    actionHint: spot.actionHint ?? null,
    rawMetadataJson: spot.rawMetadata ? JSON.stringify(spot.rawMetadata) : null,
    contentJson: spot.content ? JSON.stringify(spot.content) : null,
    isCurated: spot.isCurated,
  };
}

export async function listIcmPacks(): Promise<IcmPackDto[]> {
  const db = await getDb();
  if (!db) return [fallbackPack];

  const packs = await db
    .select()
    .from(icmPacks)
    .where(eq(icmPacks.isActive, true))
    .orderBy(asc(icmPacks.title));

  if (packs.length === 0) return [fallbackPack];

  const spotRows = await db
    .select({
      packId: icmSpots.packId,
      isCurated: icmSpots.isCurated,
    })
    .from(icmSpots);
  const counts = countSpotsByPack(spotRows);

  return packs.map(pack => mapPack(pack, counts.get(pack.id) ?? 0));
}

export async function getIcmPackBySlug(
  slug: string,
  filters: IcmSpotFilters = {}
): Promise<IcmPackDetailDto | null> {
  if (slug === ICM_ESSENTIALS_PACK.slug) {
    const db = await getDb();
    if (!db) return fallbackPackDetail(filters);
  }

  const db = await getDb();
  if (!db) return slug === ICM_ESSENTIALS_PACK.slug ? fallbackPackDetail(filters) : null;

  const [pack] = await db
    .select()
    .from(icmPacks)
    .where(and(eq(icmPacks.slug, slug), eq(icmPacks.isActive, true)))
    .limit(1);

  if (!pack) {
    return slug === ICM_ESSENTIALS_PACK.slug ? fallbackPackDetail(filters) : null;
  }

  const spotRows = await db
    .select()
    .from(icmSpots)
    .where(and(eq(icmSpots.packId, pack.id), eq(icmSpots.isCurated, true)))
    .orderBy(asc(icmSpots.playerCount), asc(icmSpots.primaryCategory), asc(icmSpots.title));

  if (spotRows.length === 0 && slug === ICM_ESSENTIALS_PACK.slug) {
    return fallbackPackDetail(filters);
  }

  const allSpots = sortSpots(spotRows.map(mapSpot));
  const spots = applyFilters(allSpots, filters);

  return {
    ...mapPack(pack, allSpots.length),
    spots,
    availableFilters: getAvailableFilters(allSpots),
  };
}

export async function getIcmSpotById(spotId: number): Promise<IcmSpotDto | null> {
  const db = await getDb();

  if (db) {
    const [row] = await db
      .select({
        spot: icmSpots,
      })
      .from(icmSpots)
      .innerJoin(icmPacks, eq(icmSpots.packId, icmPacks.id))
      .where(and(eq(icmSpots.id, spotId), eq(icmPacks.isActive, true)))
      .limit(1);

    if (row) return mapSpot(row.spot);
  }

  return fallbackSpots.find(spot => spot.id === spotId) ?? null;
}

export async function replaceIcmPack(input: PersistIcmPackInput): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existingPack] = await db
    .select()
    .from(icmPacks)
    .where(eq(icmPacks.slug, input.slug))
    .limit(1);

  let packId = existingPack?.id ?? null;

  if (existingPack) {
    await db
      .update(icmPacks)
      .set({
        title: input.title,
        description: input.description ?? null,
        isActive: true,
      })
      .where(eq(icmPacks.id, existingPack.id));
  } else {
    const [result] = await db.insert(icmPacks).values({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      isActive: true,
    });
    packId = result.insertId;
  }

  if (packId === null) {
    throw new Error("Unable to resolve ICM pack id");
  }

  await db.delete(icmSpots).where(eq(icmSpots.packId, packId));

  const rows = input.spots.map(spot => toInsertSpot(packId, spot));
  if (rows.length > 0) {
    await db.insert(icmSpots).values(rows);
  }

  return packId;
}
