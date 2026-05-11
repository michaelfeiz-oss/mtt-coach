/**
 * generate-range-audit.mjs
 * Generates server/strategy/audits/full_range_truth_audit_<date>.csv
 * and docs/FULL_RANGE_TRUTH_AUDIT.md from the current source-truth logic.
 *
 * Run: node scripts/generate-range-audit.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Inline the source-truth logic (mirrors shared/sourceTruth.ts) ─────────────

const SOURCE_BACKED_MAIN_STACKS = [15, 25, 40];
const SIMPLIFIED_POPULATION_3BET_STACKS = [25, 40];
const SIMPLIFIED_VS_3BET_FAMILIES = ["OOP_VS_IP_3BET", "IP_VS_SB_3BET", "IP_VS_BB_3BET"];
const SOURCE_BACKED_3BET_HEROES = new Set(["UTG", "UTG1", "MP", "HJ", "CO", "BTN"]);

function isSourceBackedMainStack(s) { return SOURCE_BACKED_MAIN_STACKS.includes(s); }
function isSimplifiedPopulationThreeBetStack(s) { return SIMPLIFIED_POPULATION_3BET_STACKS.includes(s); }
function supportsFacingThreeBetHero(pos) { return SOURCE_BACKED_3BET_HEROES.has(pos); }

function getStrategySourceStatus(chart) {
  if (!isSourceBackedMainStack(chart.stackDepth)) return "unsupported";
  switch (chart.spotGroup) {
    case "RFI":
    case "VS_UTG_RFI":
    case "VS_MP_RFI":
    case "VS_LP_RFI":
      return "source_backed";
    case "VS_3BET":
      if (!supportsFacingThreeBetHero(chart.heroPosition)) return "unsupported";
      if (chart.stackDepth === 15) return "source_backed";
      return isSimplifiedPopulationThreeBetStack(chart.stackDepth)
        ? "simplified_population"
        : "unsupported";
    case "BVB":
      return "proxy";
    default:
      return "unsupported";
  }
}

function getStrategySourceLabel(chart) {
  switch (getStrategySourceStatus(chart)) {
    case "source_backed": return "Exact PDF Chart";
    case "proxy": return "Structured Proxy";
    case "simplified_population": return "Simplified Population";
    case "unsupported": return "Unsupported";
  }
}

function isSourceSupportedStrategyChart(chart) {
  return getStrategySourceStatus(chart) !== "unsupported";
}

// ── Spot definitions (mirrors shared/strategy.ts) ─────────────────────────────

const STACK_DEPTHS = [15, 25, 40];

const RFI_HERO_POSITIONS = ["UTG", "UTG1", "MP", "HJ", "CO", "BTN", "SB"];
const VS_UTG_HERO_POSITIONS = ["UTG1", "MP", "HJ", "CO", "BTN", "SB", "BB"];
const VS_MP_HERO_POSITIONS = ["HJ", "CO", "BTN", "SB", "BB"];
const VS_LP_RFI_COMBINATIONS = [
  { heroPosition: "BTN", villainPosition: "CO" },
  { heroPosition: "SB", villainPosition: "CO" },
  { heroPosition: "BB", villainPosition: "CO" },
  { heroPosition: "SB", villainPosition: "BTN" },
  { heroPosition: "BB", villainPosition: "BTN" },
];
const THREE_BET_REACTION_COMBINATIONS = [
  { heroPosition: "UTG", villainPosition: "UTG1" },
  { heroPosition: "UTG", villainPosition: "MP" },
  { heroPosition: "UTG", villainPosition: "HJ" },
  { heroPosition: "UTG", villainPosition: "CO" },
  { heroPosition: "UTG", villainPosition: "BTN" },
  { heroPosition: "UTG", villainPosition: "SB" },
  { heroPosition: "UTG", villainPosition: "BB" },
  { heroPosition: "UTG1", villainPosition: "MP" },
  { heroPosition: "UTG1", villainPosition: "HJ" },
  { heroPosition: "UTG1", villainPosition: "CO" },
  { heroPosition: "UTG1", villainPosition: "BTN" },
  { heroPosition: "UTG1", villainPosition: "SB" },
  { heroPosition: "UTG1", villainPosition: "BB" },
  { heroPosition: "MP", villainPosition: "HJ" },
  { heroPosition: "MP", villainPosition: "CO" },
  { heroPosition: "MP", villainPosition: "BTN" },
  { heroPosition: "MP", villainPosition: "SB" },
  { heroPosition: "MP", villainPosition: "BB" },
  { heroPosition: "HJ", villainPosition: "CO" },
  { heroPosition: "HJ", villainPosition: "BTN" },
  { heroPosition: "HJ", villainPosition: "SB" },
  { heroPosition: "HJ", villainPosition: "BB" },
  { heroPosition: "CO", villainPosition: "BTN" },
  { heroPosition: "CO", villainPosition: "SB" },
  { heroPosition: "CO", villainPosition: "BB" },
  { heroPosition: "BTN", villainPosition: "SB" },
  { heroPosition: "BTN", villainPosition: "BB" },
  { heroPosition: "SB", villainPosition: "BB" },
];

const SPOT_DEFINITIONS = [
  ...RFI_HERO_POSITIONS.map(heroPosition => ({
    key: `${heroPosition}_RFI`,
    label: `${heroPosition} RFI`,
    group: "RFI",
    heroPosition,
    villainPosition: null,
  })),
  ...VS_UTG_HERO_POSITIONS.map(heroPosition => ({
    key: `${heroPosition}_vs_UTG`,
    label: `${heroPosition} vs UTG`,
    group: "VS_UTG_RFI",
    heroPosition,
    villainPosition: "UTG",
  })),
  ...VS_MP_HERO_POSITIONS.map(heroPosition => ({
    key: `${heroPosition}_vs_MP`,
    label: `${heroPosition} vs MP`,
    group: "VS_MP_RFI",
    heroPosition,
    villainPosition: "MP",
  })),
  ...VS_LP_RFI_COMBINATIONS.map(({ heroPosition, villainPosition }) => ({
    key: `${heroPosition}_vs_${villainPosition}`,
    label: `${heroPosition} vs ${villainPosition}`,
    group: "VS_LP_RFI",
    heroPosition,
    villainPosition,
  })),
  ...THREE_BET_REACTION_COMBINATIONS.map(({ heroPosition, villainPosition }) => ({
    key: `${heroPosition}_vs_${villainPosition}_3bet`,
    label: `${heroPosition} vs ${villainPosition} 3-Bet`,
    group: "VS_3BET",
    heroPosition,
    villainPosition,
  })),
  { key: "SB_vs_BB_limp", label: "SB vs BB (limp)", group: "BVB", heroPosition: "SB", villainPosition: "BB" },
  { key: "BB_vs_SB_limp", label: "BB vs SB (limp)", group: "BVB", heroPosition: "BB", villainPosition: "SB" },
];

// ── Build audit rows ──────────────────────────────────────────────────────────

const rows = [];
for (const stackDepth of STACK_DEPTHS) {
  for (const def of SPOT_DEFINITIONS) {
    const chart = {
      stackDepth,
      spotGroup: def.group,
      heroPosition: def.heroPosition,
      villainPosition: def.villainPosition,
      spotKey: def.key,
    };
    const status = getStrategySourceStatus(chart);
    const label = getStrategySourceLabel(chart);
    const seeded = isSourceSupportedStrategyChart(chart);
    rows.push({
      stackDepth,
      spotGroup: def.group,
      spotKey: def.key,
      heroPosition: def.heroPosition,
      villainPosition: def.villainPosition ?? "",
      label: def.label,
      sourceStatus: status,
      sourceLabel: label,
      seededInTrainer: seeded ? "YES" : "NO",
      notes: status === "unsupported"
        ? (def.group === "VS_3BET" && stackDepth === 15 && !supportsFacingThreeBetHero(def.heroPosition)
            ? "Excluded: hero position not in source-backed set for 15bb VS_3BET"
            : "Excluded: no source mapping at this stack depth")
        : status === "simplified_population"
          ? "Simplified population model — not exact PDF chart"
          : status === "proxy"
            ? "Structured proxy branch for BvB decisions"
            : "Exact PDF chart — source-backed",
    });
  }
}

// ── Write CSV ─────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const csvPath = join(ROOT, "server/strategy/audits", `full_range_truth_audit_${today}.csv`);
const csvHeader = "stackDepth,spotGroup,spotKey,heroPosition,villainPosition,label,sourceStatus,sourceLabel,seededInTrainer,notes";
const csvRows = rows.map(r =>
  [r.stackDepth, r.spotGroup, r.spotKey, r.heroPosition, r.villainPosition,
   `"${r.label}"`, r.sourceStatus, `"${r.sourceLabel}"`, r.seededInTrainer, `"${r.notes}"`].join(",")
);
writeFileSync(csvPath, [csvHeader, ...csvRows].join("\n") + "\n");
console.log(`✓ CSV written: ${csvPath} (${rows.length} rows)`);

// ── Compute summary stats ─────────────────────────────────────────────────────

const total = rows.length;
const seeded = rows.filter(r => r.seededInTrainer === "YES").length;
const unsupported = rows.filter(r => r.sourceStatus === "unsupported").length;
const sourceBacked = rows.filter(r => r.sourceStatus === "source_backed").length;
const simplified = rows.filter(r => r.sourceStatus === "simplified_population").length;
const proxy = rows.filter(r => r.sourceStatus === "proxy").length;

const byGroup = {};
for (const g of ["RFI", "VS_UTG_RFI", "VS_MP_RFI", "VS_LP_RFI", "VS_3BET", "BVB"]) {
  byGroup[g] = {
    total: rows.filter(r => r.spotGroup === g).length,
    seeded: rows.filter(r => r.spotGroup === g && r.seededInTrainer === "YES").length,
    source_backed: rows.filter(r => r.spotGroup === g && r.sourceStatus === "source_backed").length,
    simplified_population: rows.filter(r => r.spotGroup === g && r.sourceStatus === "simplified_population").length,
    proxy: rows.filter(r => r.spotGroup === g && r.sourceStatus === "proxy").length,
    unsupported: rows.filter(r => r.spotGroup === g && r.sourceStatus === "unsupported").length,
  };
}

const unsupportedVs3bet15bb = rows.filter(r =>
  r.spotGroup === "VS_3BET" && r.stackDepth === 15 && r.seededInTrainer === "NO"
);

// ── Write Markdown doc ────────────────────────────────────────────────────────

const mdPath = join(ROOT, "docs/FULL_RANGE_TRUTH_AUDIT.md");
const md = `# Full Range Truth Audit
**Generated:** ${today}
**Commit:** ${process.env.GIT_COMMIT ?? "see git log"}

---

## Executive Summary

| Metric | Count |
|---|---|
| Total chart nodes (all stacks × all spots) | ${total} |
| Seeded in trainer (source-supported) | **${seeded}** |
| Excluded (unsupported) | ${unsupported} |
| Source-backed (Exact PDF Chart) | ${sourceBacked} |
| Simplified Population | ${simplified} |
| Structured Proxy (BvB) | ${proxy} |

---

## Coverage by Spot Group

| Spot Group | Total Nodes | Seeded | Source-Backed | Simplified Pop | Proxy | Unsupported |
|---|---|---|---|---|---|---|
${Object.entries(byGroup).map(([g, s]) =>
  `| ${g} | ${s.total} | ${s.seeded} | ${s.source_backed} | ${s.simplified_population} | ${s.proxy} | ${s.unsupported} |`
).join("\n")}

---

## Source Status Definitions

| Status | Meaning | UI Label |
|---|---|---|
| \`source_backed\` | Derived from exact GTO PDF charts at 15/25/40bb | "Exact PDF Chart" |
| \`simplified_population\` | Practical simplified model for 25/40bb VS_3BET spots — not exact PDF | "Simplified Population" |
| \`proxy\` | Structured proxy branch for BvB decisions | "Structured Proxy" |
| \`unsupported\` | No valid source mapping — excluded from trainer and weak spot suggestions | (not shown) |

---

## Unsupported 15bb VS_3BET Exclusions

The following ${unsupportedVs3bet15bb.length} chart nodes are excluded from the seeded active chart set at 15bb VS_3BET because the hero position is not in the source-backed set (UTG, UTG1, MP, HJ, CO, BTN):

| spotKey | heroPosition | villainPosition |
|---|---|---|
${unsupportedVs3bet15bb.map(r => `| ${r.spotKey} | ${r.heroPosition} | ${r.villainPosition} |`).join("\n")}

---

## Stack Depth Coverage

| Stack | Seeded | Unsupported |
|---|---|---|
${STACK_DEPTHS.map(s => {
  const sr = rows.filter(r => r.stackDepth === s);
  return `| ${s}bb | ${sr.filter(r => r.seededInTrainer === "YES").length} | ${sr.filter(r => r.seededInTrainer === "NO").length} |`;
}).join("\n")}

---

## Human Review Required

The following chart families require human review before being promoted to \`source_backed\`:

- **Simplified Population VS_3BET (25bb, 40bb):** ${simplified} nodes — practical simplified model, not exact PDF chart. Displayed with "Simplified Population" label in Range Viewer.
- **BvB Proxy (all stacks):** ${proxy} nodes — structured proxy branch. Displayed with "Structured Proxy" label.

---

## Audit CSV

Full row-level data: \`server/strategy/audits/full_range_truth_audit_${today}.csv\`

Columns: stackDepth, spotGroup, spotKey, heroPosition, villainPosition, label, sourceStatus, sourceLabel, seededInTrainer, notes
`;

writeFileSync(mdPath, md);
console.log(`✓ Markdown written: ${mdPath}`);
console.log(`\nSummary: ${seeded}/${total} nodes seeded | ${sourceBacked} source-backed | ${simplified} simplified | ${proxy} proxy | ${unsupported} excluded`);
