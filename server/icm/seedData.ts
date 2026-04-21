import {
  parseIcmFilename,
  type IcmExtractionPreview,
  type IcmPackDto,
  type IcmSpotDto,
} from "../../shared/icm";

export const ICM_ESSENTIALS_PACK: Omit<IcmPackDto, "spotCount"> = {
  id: 1,
  slug: "final-table-icm-essentials",
  title: "Final Table ICM Essentials",
  description: "High-value payout-pressure spots for advanced MTT study",
  isActive: true,
  difficulty: "Advanced",
};

interface CuratedIcmSpotDefinition {
  fileName: string;
  note: string;
}

export const CURATED_ICM_SPOT_DEFINITIONS: CuratedIcmSpotDefinition[] = [
  {
    fileName: "ICM4-bb22bb-sb18bb-r.html",
    note: "Four-handed blind battles punish loose continues; focus on which hands survive raise pressure.",
  },
  {
    fileName: "ICM4-bb22bb-sb18bb-l.html",
    note: "Limped blind-versus-blind pots often look cheap, but ICM still makes dominated continues costly.",
  },
  {
    fileName: "ICM4-sb18bb.html",
    note: "Short small-blind decisions swing quickly between open-jam pressure and protected folds.",
  },
  {
    fileName: "ICM4-btn30bb-blinds.html",
    note: "Button pressure is strongest when both blinds must protect ladder equity.",
  },
  {
    fileName: "ICM5-bb22bb-btn30bb-r.html",
    note: "Big blind defense versus button opens tightens when losing the pot threatens final-table leverage.",
  },
  {
    fileName: "ICM5-sb18bb-btn30bb.html",
    note: "Small blind flats are fragile under ICM; prefer hands that realize cleanly or apply pressure.",
  },
  {
    fileName: "ICM6-bb7bb-sb18bb-l.html",
    note: "Very short big blinds should watch for hands that become mandatory despite payout pressure.",
  },
  {
    fileName: "ICM6-btn30bb-blinds.html",
    note: "Button versus blinds is a repeat final-table spot; learn the hands that keep pressure without punt risk.",
  },
  {
    fileName: "ICM6-hj45bb-bb7bb.html",
    note: "Medium and big stacks can pressure short blind stacks, but offsuit trash still loses too much equity.",
  },
  {
    fileName: "ICM7-bb7bb-btn30bb.html",
    note: "Short big-blind defense is often forced by price, but not all suited hands are automatic.",
  },
  {
    fileName: "ICM7-sb18bb-btn30bb.html",
    note: "Small blind pressure against button action rewards blockers and hands that avoid dominated calls.",
  },
  {
    fileName: "ICM8-bb55bb-sb40bb.html",
    note: "Deep blind-versus-blind ICM spots reward controlled aggression over chip-EV autopilot.",
  },
  {
    fileName: "ICM8-bb55bb-sb40bb-l.html",
    note: "Facing a small-blind limp, deep big blinds can punish capped ranges without overextending.",
  },
  {
    fileName: "ICM8-btn80bb-bb55bb.html",
    note: "Big stacks can attack, but the value of preserving a dominant stack keeps bluffs selective.",
  },
  {
    fileName: "ICM9-bb55bb-btn80bb.html",
    note: "Big blind defense versus the table captain needs discipline around dominated broadways and weak offsuit hands.",
  },
  {
    fileName: "ICM9-bb55bb-squeeze.html",
    note: "Squeeze candidates should combine fold equity, blockers, and stack leverage rather than raw hand strength alone.",
  },
  {
    fileName: "ICM10-sb9bb.html",
    note: "Nine big blinds in the small blind creates high-pressure jam-or-fold decisions.",
  },
  {
    fileName: "ICM10-btn55bb-bb13bb.html",
    note: "Button opens into a short big blind should respect reshove leverage and payout pressure.",
  },
  {
    fileName: "ICM10-co11bb-btn55bb.html",
    note: "Short cutoff decisions around a covering button are heavily shaped by ladder risk.",
  },
  {
    fileName: "ICM10-utg50bb-hj25bb.html",
    note: "Early-position pressure remains selective because many players behind can apply ICM leverage.",
  },
];

function buildMetadataOnlyContent(note: string): IcmExtractionPreview {
  return {
    status: "metadata_only",
    notes: [note],
  };
}

export function getCuratedIcmSpotSeeds(packId = ICM_ESSENTIALS_PACK.id): IcmSpotDto[] {
  return CURATED_ICM_SPOT_DEFINITIONS.map((definition, index) => {
    const parsed = parseIcmFilename(definition.fileName);

    if (!parsed) {
      throw new Error(`Invalid curated ICM file name: ${definition.fileName}`);
    }

    return {
      id: index + 1,
      packId,
      title: parsed.title,
      fileName: parsed.fileName,
      sourcePath: parsed.sourcePath,
      playerCount: parsed.playerCount,
      primaryCategory: parsed.primaryCategory,
      heroPosition: parsed.heroPosition,
      villainPosition: parsed.villainPosition,
      heroStackBb: parsed.heroStackBb,
      villainStackBb: parsed.villainStackBb,
      stackSummary: parsed.stacks,
      stackSummaryText: parsed.stackSummary,
      tags: parsed.tags,
      actionHint: parsed.actionHint,
      rawMetadata: parsed,
      content: buildMetadataOnlyContent(definition.note),
      isCurated: true,
    };
  });
}

export function getCuratedIcmPackSeed(): IcmPackDto {
  return {
    ...ICM_ESSENTIALS_PACK,
    spotCount: CURATED_ICM_SPOT_DEFINITIONS.length,
  };
}
