export const ICM_TAGS = [
  "FINAL_TABLE",
  "ICM_PRESSURE",
  "SB_VS_BB",
  "BTN_VS_BLINDS",
  "SHORT_STACK",
  "MEDIUM_STACK",
  "BIG_STACK_ABUSE",
  "RESHOVE",
  "OPEN_JAM",
  "OPEN_RAISE",
  "LIMP_DEFENSE",
  "SQUEEZE",
] as const;

export type IcmTag = (typeof ICM_TAGS)[number];

export const ICM_TAG_LABELS: Record<IcmTag, string> = {
  FINAL_TABLE: "Final table",
  ICM_PRESSURE: "ICM pressure",
  SB_VS_BB: "SB vs BB",
  BTN_VS_BLINDS: "BTN vs blinds",
  SHORT_STACK: "Short stack",
  MEDIUM_STACK: "Medium stack",
  BIG_STACK_ABUSE: "Big stack abuse",
  RESHOVE: "Reshove",
  OPEN_JAM: "Open jam",
  OPEN_RAISE: "Open raise",
  LIMP_DEFENSE: "Limp defense",
  SQUEEZE: "Squeeze",
};

export const ICM_CATEGORIES = [
  "SB_PRESSURE",
  "BB_PRESSURE",
  "BTN_PRESSURE",
  "SHORT_STACK_JAM",
  "MEDIUM_STACK_OPEN",
  "BIG_STACK_ABUSE",
  "SQUEEZE_PRESSURE",
  "OVERVIEW",
] as const;

export type IcmCategory = (typeof ICM_CATEGORIES)[number];

export const ICM_CATEGORY_LABELS: Record<IcmCategory, string> = {
  SB_PRESSURE: "SB pressure",
  BB_PRESSURE: "BB pressure",
  BTN_PRESSURE: "BTN pressure",
  SHORT_STACK_JAM: "Short-stack jam pressure",
  MEDIUM_STACK_OPEN: "Medium-stack open pressure",
  BIG_STACK_ABUSE: "Big-stack abuse pressure",
  SQUEEZE_PRESSURE: "Squeeze pressure",
  OVERVIEW: "Overview",
};

const POSITION_ALIASES: Record<string, string> = {
  utg: "UTG",
  hj: "HJ",
  co: "CO",
  btn: "BTN",
  bu: "BTN",
  sb: "SB",
  bb: "BB",
};

const ACTION_HINTS: Record<string, string> = {
  r: "raise",
  l: "limp",
  ai: "all-in",
  squeeze: "squeeze",
  squeezing: "squeeze",
  blinds: "blinds",
};

export interface IcmStackEntry {
  position: string | null;
  stackBb: number;
  rawToken: string;
}

export interface IcmExtractionPreview {
  status: "not_attempted" | "metadata_only" | "parsed_preview";
  groupTitle?: string;
  tableHandCount?: number;
  weightedComboCount?: number;
  colorClassCounts?: Record<string, number>;
  linkedSpotCount?: number;
  notes?: string[];
}

export interface ParsedIcmFilename {
  packType: "ICM";
  playerCount: number;
  fileName: string;
  sourcePath: string;
  title: string;
  primaryCategory: IcmCategory;
  heroPosition: string | null;
  villainPosition: string | null;
  heroStackBb: number | null;
  villainStackBb: number | null;
  stacks: IcmStackEntry[];
  stackSummary: string;
  tags: IcmTag[];
  actionHint: string | null;
  rawTokens: string[];
}

export interface IcmSpotDto {
  id: number;
  packId: number;
  title: string;
  fileName: string;
  sourcePath: string;
  playerCount: number;
  primaryCategory: IcmCategory;
  heroPosition?: string | null;
  villainPosition?: string | null;
  heroStackBb?: number | null;
  villainStackBb?: number | null;
  stackSummary: IcmStackEntry[];
  stackSummaryText: string;
  tags: IcmTag[];
  actionHint?: string | null;
  rawMetadata?: ParsedIcmFilename | null;
  content?: IcmExtractionPreview | null;
  isCurated: boolean;
}

export interface IcmPackDto {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  spotCount: number;
  difficulty: "Advanced";
}

export interface IcmPackDetailDto extends IcmPackDto {
  spots: IcmSpotDto[];
  availableFilters: {
    playerCounts: number[];
    tags: IcmTag[];
    categories: IcmCategory[];
  };
}

export interface IcmSpotFilters {
  playerCount?: number;
  tag?: IcmTag;
  primaryCategory?: IcmCategory;
}

function normalizePosition(value: string | undefined): string | null {
  if (!value) return null;
  return POSITION_ALIASES[value.toLowerCase()] ?? null;
}

function parseStackToken(token: string): IcmStackEntry | null {
  const match = token.match(/^([a-z]+)?(\d+(?:\.\d+)?)bb$/i);
  if (!match) return null;

  return {
    position: normalizePosition(match[1]),
    stackBb: Number(match[2]),
    rawToken: token,
  };
}

function formatStack(entry: IcmStackEntry): string {
  return `${entry.position ?? "Unknown"} ${entry.stackBb}bb`;
}

function makeStackSummary(stacks: IcmStackEntry[]): string {
  return stacks.map(formatStack).join(" / ");
}

function getActionHint(tokens: string[]): string | null {
  for (const token of tokens) {
    const hint = ACTION_HINTS[token.toLowerCase()];
    if (hint) return hint;
  }
  return null;
}

function deriveCategory(
  stacks: IcmStackEntry[],
  actionHint: string | null
): IcmCategory {
  const positions = new Set(stacks.map(stack => stack.position).filter(Boolean));
  const hero = stacks.find(stack => stack.position)?.position ?? null;
  const heroStack = stacks.find(stack => stack.position)?.stackBb ?? null;
  const shortest = Math.min(...stacks.map(stack => stack.stackBb));

  if (actionHint === "squeeze") return "SQUEEZE_PRESSURE";
  if (hero === "BB") return "BB_PRESSURE";
  if (hero === "SB" || (positions.has("SB") && positions.has("BB"))) return "SB_PRESSURE";
  if (hero === "BTN" || actionHint === "blinds") return "BTN_PRESSURE";
  if (Number.isFinite(shortest) && shortest <= 15) return "SHORT_STACK_JAM";
  if (heroStack !== null && heroStack >= 50) return "BIG_STACK_ABUSE";
  if (stacks.length === 0) return "OVERVIEW";
  return "MEDIUM_STACK_OPEN";
}

function deriveTags(
  stacks: IcmStackEntry[],
  actionHint: string | null,
  category: IcmCategory
): IcmTag[] {
  const tags = new Set<IcmTag>(["FINAL_TABLE", "ICM_PRESSURE"]);
  const positions = new Set(stacks.map(stack => stack.position).filter(Boolean));
  const shortest = stacks.length > 0 ? Math.min(...stacks.map(stack => stack.stackBb)) : null;
  const biggest = stacks.length > 0 ? Math.max(...stacks.map(stack => stack.stackBb)) : null;

  if (positions.has("SB") && positions.has("BB")) tags.add("SB_VS_BB");
  if (positions.has("BTN") && (positions.has("SB") || positions.has("BB") || actionHint === "blinds")) {
    tags.add("BTN_VS_BLINDS");
  }
  if (shortest !== null && shortest <= 15) tags.add("SHORT_STACK");
  if (shortest !== null && shortest > 15 && shortest <= 35) tags.add("MEDIUM_STACK");
  if (biggest !== null && biggest >= 50) tags.add("BIG_STACK_ABUSE");
  if (actionHint === "raise") tags.add("RESHOVE");
  if (actionHint === "limp") tags.add("LIMP_DEFENSE");
  if (actionHint === "squeeze") tags.add("SQUEEZE");
  if (actionHint === "all-in") tags.add("OPEN_JAM");
  if (category === "MEDIUM_STACK_OPEN" || category === "BIG_STACK_ABUSE") tags.add("OPEN_RAISE");
  if (category === "SHORT_STACK_JAM") tags.add("OPEN_JAM");

  return ICM_TAGS.filter(tag => tags.has(tag));
}

function buildTitle(playerCount: number, stacks: IcmStackEntry[], actionHint: string | null): string {
  if (stacks.length === 0) return `ICM ${playerCount}-handed overview`;

  const [hero, villain] = stacks;
  const base = villain
    ? `${formatStack(hero)} vs ${formatStack(villain)}`
    : formatStack(hero);
  const hint = actionHint ? ` (${actionHint})` : "";

  return `${playerCount}-handed ICM: ${base}${hint}`;
}

export function parseIcmFilename(fileName: string, sourcePath = `db/${fileName}`): ParsedIcmFilename | null {
  const cleanFileName = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  const match = cleanFileName.match(/^ICM(\d+)(?:-([^.]+))?\.html$/i);
  if (!match) return null;

  const playerCount = Number(match[1]);
  const rawTokens = match[2] ? match[2].split("-").filter(Boolean) : [];
  const stacks = rawTokens.map(parseStackToken).filter((stack): stack is IcmStackEntry => stack !== null);
  const actionHint = getActionHint(rawTokens);
  const primaryCategory = deriveCategory(stacks, actionHint);
  const tags = deriveTags(stacks, actionHint, primaryCategory);
  const hero = stacks.find(stack => stack.position) ?? null;
  const villain = stacks.filter(stack => stack.position)[1] ?? null;

  return {
    packType: "ICM",
    playerCount,
    fileName: cleanFileName,
    sourcePath,
    title: buildTitle(playerCount, stacks, actionHint),
    primaryCategory,
    heroPosition: hero?.position ?? null,
    villainPosition: villain?.position ?? null,
    heroStackBb: hero?.stackBb ?? null,
    villainStackBb: villain?.stackBb ?? null,
    stacks,
    stackSummary: makeStackSummary(stacks),
    tags,
    actionHint,
    rawTokens,
  };
}
