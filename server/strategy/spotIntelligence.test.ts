import { describe, expect, it } from "vitest";
import {
  getPriorityDrillPack,
  resolvePriorityDrillPack,
} from "../../shared/drillPacks";
import { getLeakFamily, suggestLeakFamilyFromTrainerMiss } from "../../shared/leakFamilies";
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

  it("returns structured spot notes for boundary blind defense", () => {
    const note = getSpotNote({
      family: "DEFEND_VS_RFI",
      stackDepth: 40,
      heroPosition: "BB",
      villainPosition: "BTN",
    });

    expect(note?.coreIdea).toContain("realization");
    expect(note?.commonPunt).toContain("offsuit");
    expect(note?.drillCue).toContain("BTN");
  });

  it("resolves priority drill packs against real spot coverage", () => {
    const pack = resolvePriorityDrillPack("bb-co-btn-boundary-defense", [
      {
        id: 1,
        title: "BB vs CO",
        stackDepth: 25,
        spotGroup: "VS_LP_RFI",
        heroPosition: "BB",
        villainPosition: "CO",
      },
      {
        id: 2,
        title: "BB vs BTN",
        stackDepth: 40,
        spotGroup: "VS_LP_RFI",
        heroPosition: "BB",
        villainPosition: "BTN",
      },
    ]);

    expect(pack?.supported).toBe(true);
    expect(pack?.spotCount).toBe(2);
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
    expect(note?.drillCue).toContain("blockers");
  });

  it("keeps unavailable packs visible as explicit coverage gaps", () => {
    const pack = getPriorityDrillPack("30bb-broadways-vs-limper");
    const resolved = resolvePriorityDrillPack(pack!.id, []);

    expect(resolved?.supported).toBe(false);
    expect(resolved?.spotCount).toBe(0);
  });
});
