import { describe, expect, it } from "vitest";
import {
  getRelatedPriorityDrillPacksForSpot,
  getPriorityDrillPack,
  PRIORITY_DRILL_PACKS,
  resolvePriorityDrillPack,
} from "../../shared/drillPacks";
import {
  getLeakFamily,
  LEAK_FAMILIES,
  suggestLeakFamilyFromTrainerMiss,
} from "../../shared/leakFamilies";
import {
  buildPushFoldSpotContext,
  expandPushFoldNotation,
  getPushFoldReference,
  getPushFoldTrainerPool,
} from "../../shared/pushFold";
import {
  canonicalSpotContextFromChart,
  getCanonicalSpotId,
  getStrategyChartSelector,
  inferCanonicalSpotContextFromLog,
} from "../../shared/spotIds";
import { getSpotNote } from "../../shared/spotNotes";

describe("preflop study intelligence layer", () => {
  it("builds canonical spot ids from chart data", () => {
    const context = canonicalSpotContextFromChart({
      stackDepth: 40,
      spotGroup: "VS_LP_RFI",
      heroPosition: "BB",
      villainPosition: "BTN",
    });

    expect(context).not.toBeNull();
    expect(getCanonicalSpotId(context!)).toBe(
      "DEFEND_VS_RFI|40|BB|BTN|9P|BBA"
    );
  });

  it("bridges logged hands back into strategy chart selectors", () => {
    const context = inferCanonicalSpotContextFromLog({
      scenarioId: "DEFEND_VS_RFI",
      effectiveStackBb: 24,
      heroPosition: "BB",
      openerPosition: "CO",
    });

    expect(context).not.toBeNull();
    expect(getStrategyChartSelector(context!)).toEqual({
      spotGroup: "VS_LP_RFI",
      spotKey: "BB_vs_CO",
    });
  });

  it("returns structured spot notes without unsupported stage adjustments", () => {
    const note = getSpotNote({
      family: "DEFEND_VS_RFI",
      stackDepth: 40,
      heroPosition: "BB",
      villainPosition: "BTN",
    });

    expect(note?.coreIdea).toContain("closing the action");
    expect(note?.commonPunt).toContain("offsuit junk");
    expect(note?.drillCue).toContain("BTN");
    expect(note?.stageAdjustment).toBeUndefined();
  });

  it("upgrades 25bb/40bb facing-3bet notes from unresolved to explicit simplified guidance", () => {
    const note25 = getSpotNote({
      family: "FACING_3BET",
      stackDepth: 25,
      heroPosition: "BTN",
      villainPosition: "BB",
    });
    const note40 = getSpotNote({
      family: "FACING_3BET",
      stackDepth: 40,
      heroPosition: "CO",
      villainPosition: "BTN",
    });

    expect(note25?.coreIdea).toContain("BB branch");
    expect(note25?.defaultLine).toContain("playable middle");
    expect(note40?.defaultLine).toContain("QQ+/AK");
    expect(note40?.commonPunt).toContain("speculative suited hands");
  });

  it("resolves the source-backed blind-defense drill pack against real spot coverage", () => {
    const pack = resolvePriorityDrillPack("bb-vs-sb-marginal-defense", [
      {
        id: 1,
        title: "BB vs SB",
        stackDepth: 25,
        spotGroup: "BVB",
        heroPosition: "BB",
        villainPosition: "SB",
      },
      {
        id: 2,
        title: "SB vs BB",
        stackDepth: 15,
        spotGroup: "BVB",
        heroPosition: "SB",
        villainPosition: "BB",
      },
    ]);

    expect(pack?.supported).toBe(true);
    expect(pack?.spotCount).toBe(1);
    expect(pack?.focusHandCodes).toContain("K9o");
  });

  it("maps trainer misses into canonical leak families", () => {
    const leakId = suggestLeakFamilyFromTrainerMiss({
      context: {
        family: "DEFEND_VS_RFI",
        stackDepth: 40,
        heroPosition: "BB",
        villainPosition: "BTN",
      },
      handCode: "K9o",
      selectedAction: "FOLD",
      correctAction: "CALL",
    });

    expect(getLeakFamily(leakId)?.label).toBe("Blind Defense Too Tight");
  });

  it("expands push/fold notation into canonical hand codes", () => {
    const expanded = expandPushFoldNotation("77+, A9s+, ATo+");

    expect(expanded).toContain("77");
    expect(expanded).toContain("A9s");
    expect(expanded).toContain("ATo");
    expect(expanded).toContain("AKo");
  });

  it("builds a push/fold trainer pool around the reference perimeter", () => {
    const reference = getPushFoldReference(8, "OPEN_SHOVE", "BTN");
    expect(reference).not.toBeNull();

    const trainerPool = getPushFoldTrainerPool(reference!);
    const poolCodes = trainerPool.map(action => action.handCode);

    expect(poolCodes).toContain("A2o");
    expect(poolCodes).toContain("K7s");
    expect(poolCodes).toContain("Q7s");
    expect(poolCodes).not.toContain("72o");
  });

  it("builds push/fold notes from the same canonical spot system", () => {
    const reference = getPushFoldReference(10, "BB_CALL_VS_BTN_SHOVE", "BB");
    expect(reference).not.toBeNull();

    const note = getSpotNote(buildPushFoldSpotContext(reference!, 10));
    expect(note?.title).toContain("Push / Fold");
    expect(note?.drillCue).toContain("threshold");
  });

  it("keeps unavailable packs visible as explicit coverage gaps", () => {
    const pack = getPriorityDrillPack("30bb-broadways-vs-limper");
    const resolved = resolvePriorityDrillPack(pack!.id, []);

    expect(resolved?.supported).toBe(false);
    expect(resolved?.spotCount).toBe(0);
  });

  it("keeps leak drill recommendations aligned with real pack ids", () => {
    const packIds = new Set(PRIORITY_DRILL_PACKS.map(pack => pack.id));

    for (const leak of LEAK_FAMILIES) {
      for (const packId of leak.relatedPackIds) {
        expect(packIds.has(packId)).toBe(true);
      }
    }
  });

  it("extends the facing-3bet threshold pack across the new 25bb and 40bb nodes", () => {
    const resolved = resolvePriorityDrillPack("facing-3bet-threshold-pack", [
      {
        id: 1,
        title: "CO vs BB 3-Bet @ 25bb",
        stackDepth: 25,
        spotGroup: "VS_3BET",
        heroPosition: "CO",
        villainPosition: "BB",
      },
      {
        id: 2,
        title: "BTN vs SB 3-Bet @ 40bb",
        stackDepth: 40,
        spotGroup: "VS_3BET",
        heroPosition: "BTN",
        villainPosition: "SB",
      },
    ]);

    expect(resolved?.supported).toBe(true);
    expect(resolved?.spotCount).toBe(2);
  });

  it("keeps EP drill packs out of non-EP late-position 3-bet spots", () => {
    const spot = {
      id: 1,
      title: "CO vs BB 3-Bet @ 40bb",
      stackDepth: 40,
      spotGroup: "VS_3BET" as const,
      heroPosition: "CO",
      villainPosition: "BB",
    };

    const packs = getRelatedPriorityDrillPacksForSpot(spot, [
      spot,
      {
        id: 2,
        title: "UTG vs CO 3-Bet @ 15bb",
        stackDepth: 15,
        spotGroup: "VS_3BET",
        heroPosition: "UTG",
        villainPosition: "CO",
      },
    ]);

    expect(packs.map(pack => pack.id)).not.toContain("sub-premiums-vs-ep-pressure");
  });

  it("keeps the EP pressure pack available when early-position pressure is actually involved", () => {
    const spot = {
      id: 1,
      title: "UTG vs CO 3-Bet @ 15bb",
      stackDepth: 15,
      spotGroup: "VS_3BET" as const,
      heroPosition: "UTG",
      villainPosition: "CO",
    };

    const packs = getRelatedPriorityDrillPacksForSpot(spot, [spot]);

    expect(packs.map(pack => pack.id)).toContain("sub-premiums-vs-ep-pressure");
  });
});
