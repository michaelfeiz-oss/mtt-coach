import path from "node:path";
import { writeIcmMetadataJson } from "./metadata";

const DEFAULT_OUTPUT_PATH = path.resolve("shared/icm-data/metadata.json");

function getArgumentValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

async function main(): Promise<void> {
  const sourcePath = process.argv[2];

  if (!sourcePath || sourcePath === "--help" || sourcePath === "-h") {
    console.log("Usage: pnpm exec tsx server/icm/importIcmMetadata.ts <source-dir-or-zip> [--out output.json]");
    process.exitCode = 1;
    return;
  }

  const outputPath = path.resolve(getArgumentValue("--out") ?? DEFAULT_OUTPUT_PATH);
  const metadata = await writeIcmMetadataJson(path.resolve(sourcePath), outputPath);

  console.log(
    `Imported ${metadata.parsedFiles}/${metadata.totalFiles} ICM metadata files from ${metadata.sourceKind} source.`
  );
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
