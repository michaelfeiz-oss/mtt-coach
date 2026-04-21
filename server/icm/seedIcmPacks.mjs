/**
 * One-shot seed script for the ICM Study Pack module.
 * Run with: node server/icm/seedIcmPacks.mjs [source-dir-or-zip]
 *
 * The script is idempotent by pack slug. Existing curated spots in the pack
 * are replaced so filename/parser fixes reach prod data cleanly.
 */

import { register } from "tsx/esm/api";

register();

function mergeContent(seedContent, previewContent) {
  if (!previewContent) return seedContent ?? null;

  const seedNotes = Array.isArray(seedContent?.notes) ? seedContent.notes : [];
  const previewNotes = Array.isArray(previewContent.notes) ? previewContent.notes : [];

  return {
    ...previewContent,
    notes: [...seedNotes, ...previewNotes],
  };
}

async function main() {
  const { ICM_ESSENTIALS_PACK, getCuratedIcmSpotSeeds } = await import("./seedData.ts");
  const { buildIcmMetadataFromSource } = await import("./metadata.ts");
  const { getDb } = await import("../db.ts");
  const { replaceIcmPack } = await import("./service.ts");

  const db = await getDb();
  if (!db) {
    console.error("Database not available. Set DATABASE_URL env var.");
    process.exit(1);
  }

  const sourcePath = process.argv[2] || process.env.ICM_SOURCE_PATH;
  const previewsByFile = new Map();

  if (sourcePath) {
    const metadata = await buildIcmMetadataFromSource(sourcePath);

    for (const spot of metadata.spots) {
      previewsByFile.set(spot.fileName, spot.extractionPreview);
    }

    console.log(`Parsed ${metadata.parsedFiles}/${metadata.totalFiles} source files for extraction previews.`);
  }

  const spots = getCuratedIcmSpotSeeds().map(({ id: _id, packId: _packId, ...spot }) => ({
    ...spot,
    content: mergeContent(spot.content, previewsByFile.get(spot.fileName)),
  }));

  const packId = await replaceIcmPack({
    slug: ICM_ESSENTIALS_PACK.slug,
    title: ICM_ESSENTIALS_PACK.title,
    description: ICM_ESSENTIALS_PACK.description,
    spots,
  });

  console.log(`Seeded "${ICM_ESSENTIALS_PACK.title}" (id=${packId}) with ${spots.length} curated spots.`);
  process.exit(0);
}

main().catch(error => {
  console.error("Seed failed:", error);
  process.exit(1);
});
