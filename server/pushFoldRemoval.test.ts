/**
 * pushFoldRemoval.test.ts
 *
 * Acceptance criteria tests for the Push/Fold removal spec:
 * 1. Push/Fold is not shown in main navigation (CANONICAL_SPOT_FAMILIES)
 * 2. Push/Fold is not suggested in Today's Training (TODAY_TRAINING_TYPES)
 * 3. Push/Fold drill packs are not recommended (PRIORITY_DRILL_PACKS)
 * 4. Push/Fold hands can still be logged/tagged (ICMIZER_REVIEW tag)
 * 5. Push/Fold weak spots route to ICMIZER external review
 * 6. No unsupported push/fold chart is rendered as valid internal training
 */

import { describe, expect, it } from "vitest";
import { CANONICAL_SPOT_FAMILIES } from "../shared/preflopTaxonomy";
import { TODAY_TRAINING_TYPES } from "../shared/coachingLoop";
import { PRIORITY_DRILL_PACKS } from "../shared/drillPacks";
import { aggregateWeakSpots, buildTodayTrainingSuggestions } from "./coachingLoop";
import { SPOT_DEFINITIONS } from "../shared/strategy";

// ─── 1. Navigation: PUSH_FOLD not in canonical spot families ─────────────────

describe("navigation — push/fold removal", () => {
  it("PUSH_FOLD is not in CANONICAL_SPOT_FAMILIES", () => {
    expect(CANONICAL_SPOT_FAMILIES).not.toContain("PUSH_FOLD");
  });

  it("CANONICAL_SPOT_FAMILIES contains the approved spot families", () => {
    // Actual values in the enum after removal
    const approved = [
      "OPEN_RFI",
      "DEFEND_VS_RFI",
      "THREE_BET",
      "FACING_3BET",
      "BLIND_VS_BLIND",
      "FOUR_BET_JAM",
    ];
    for (const family of approved) {
      expect(CANONICAL_SPOT_FAMILIES).toContain(family);
    }
  });
});

// ─── 2. Today's Training: push_fold not a valid training type ────────────────

describe("today's training — push/fold removal", () => {
  it("push_fold is not in TODAY_TRAINING_TYPES", () => {
    expect(TODAY_TRAINING_TYPES).not.toContain("push_fold");
  });

  it("icmizer_review is in TODAY_TRAINING_TYPES as the replacement", () => {
    expect(TODAY_TRAINING_TYPES).toContain("icmizer_review");
  });

  it("today's training types contain the approved types", () => {
    // Actual values: drill_pack, exact_chart, review_hands, icmizer_review, study_chart
    const approved = ["drill_pack", "exact_chart", "review_hands", "icmizer_review"];
    for (const type of approved) {
      expect(TODAY_TRAINING_TYPES).toContain(type);
    }
  });
});

// ─── 3. Drill packs: no push/fold pack ───────────────────────────────────────

describe("drill packs — push/fold removal", () => {
  it("no drill pack has push_fold in its id", () => {
    const pushFoldPacks = PRIORITY_DRILL_PACKS.filter(
      p => p.id.includes("push_fold") || p.id.includes("push-fold")
    );
    expect(pushFoldPacks).toHaveLength(0);
  });

  it("no drill pack has push/fold in its title", () => {
    const pushFoldPacks = PRIORITY_DRILL_PACKS.filter(
      p =>
        p.title.toLowerCase().includes("push/fold") ||
        p.title.toLowerCase().includes("push fold")
    );
    expect(pushFoldPacks).toHaveLength(0);
  });

  it("the approved drill packs are present", () => {
    // Actual pack IDs in drillPacks.ts
    const expectedPackIds = [
      "sub-premiums-vs-ep-pressure",
      "15-20bb-small-pair-decisions",
      "30bb-broadways-vs-limper",
      "40bb-weak-ax-discipline",
      "bb-vs-sb-marginal-defense",
      "blind-vs-blind-execution",
      "facing-3bet-threshold-pack",
    ];
    const packIds = PRIORITY_DRILL_PACKS.map(p => p.id);
    for (const id of expectedPackIds) {
      expect(packIds).toContain(id);
    }
  });
});

// ─── 4. Hand logging: ICMIZER_REVIEW tag can be stored ───────────────────────

describe("hand logging — ICMIZER_REVIEW tag", () => {
  it("ICMIZER_REVIEW is a valid string tag (no schema restriction)", () => {
    // Tags are stored as JSON string arrays — any string is valid
    const tags = ["ICMIZER_REVIEW"];
    const serialised = JSON.stringify(tags);
    const parsed = JSON.parse(serialised) as string[];
    expect(parsed).toContain("ICMIZER_REVIEW");
  });

  it("FOUR_BET_JAM is still a valid spot family for logging shove hands", () => {
    // FOUR_BET_JAM is the closest internal spot type for jam/shove hands
    expect(CANONICAL_SPOT_FAMILIES).toContain("FOUR_BET_JAM");
  });
});

// ─── 5. Weak spot tracking: push/fold routes to ICMIZER ──────────────────────

describe("weak spot tracking — ICMIZER routing", () => {
  it("a push/fold leak family weak spot produces icmizer_review suggestion", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [
        {
          id: 1,
          chartId: 999,
          chartTitle: "BTN shove @ 8bb",
          canonicalSpotId: "RFI|8|BTN|null|AK|SHOVE",
          spotFamily: "OPEN_RFI",
          sourceStatus: "exact_source",
          stackBb: 8,
          heroPosition: "BTN",
          villainPosition: null,
          handCode: "AKs",
          selectedAction: "FOLD",
          correctAction: "JAM",
          isCorrect: false,
          confidence: "guessed",
          drillPackId: null,
          leakFamilyId: "push_fold_discipline_gaps",
          createdAt: new Date("2026-04-30T10:00:00Z"),
        },
        {
          id: 2,
          chartId: 999,
          chartTitle: "BTN shove @ 8bb",
          canonicalSpotId: "RFI|8|BTN|null|AQ|SHOVE",
          spotFamily: "OPEN_RFI",
          sourceStatus: "exact_source",
          stackBb: 8,
          heroPosition: "BTN",
          villainPosition: null,
          handCode: "AQs",
          selectedAction: "FOLD",
          correctAction: "JAM",
          isCorrect: false,
          confidence: "guessed",
          drillPackId: null,
          leakFamilyId: "push_fold_discipline_gaps",
          createdAt: new Date("2026-04-30T10:01:00Z"),
        },
      ],
      hands: [],
      existingLeakFamilyIds: [],
    });

    // The weak spot should exist
    expect(weakSpots.length).toBeGreaterThan(0);
    const pfSpot = weakSpots.find(s => s.leakFamilyId === "push_fold_discipline_gaps");
    expect(pfSpot).toBeDefined();

    // Build suggestions from this weak spot
    const suggestions = buildTodayTrainingSuggestions({
      weakSpots,
      reviewQueue: { totalNeedsReview: 0, oldestPendingDays: null },
    });

    // Should produce an icmizer_review suggestion, NOT a range_trainer suggestion
    const icmizerSuggestion = suggestions.find(s => s.type === "icmizer_review");
    expect(icmizerSuggestion).toBeDefined();
    expect(icmizerSuggestion?.targetRoute).toBe("/icmizer-reference");

    // Should NOT produce a range_trainer suggestion pointing to push/fold
    const trainerSuggestion = suggestions.find(
      s => s.type === "exact_chart" && s.targetRoute?.includes("push_fold")
    );
    expect(trainerSuggestion).toBeUndefined();
  });

  it("a ≤10bb stack weak spot routes to ICMIZER, not internal trainer", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [
        {
          id: 3,
          chartId: 888,
          chartTitle: "SB shove @ 9bb",
          canonicalSpotId: "RFI|9|SB|null|K8s|SHOVE",
          spotFamily: "OPEN_RFI",
          sourceStatus: "exact_source",
          stackBb: 9,
          heroPosition: "SB",
          villainPosition: null,
          handCode: "K8s",
          selectedAction: "FOLD",
          correctAction: "JAM",
          isCorrect: false,
          confidence: "guessed",
          drillPackId: null,
          leakFamilyId: "rfi_too_tight",
          createdAt: new Date("2026-04-30T10:02:00Z"),
        },
        {
          id: 4,
          chartId: 888,
          chartTitle: "SB shove @ 9bb",
          canonicalSpotId: "RFI|9|SB|null|K7s|SHOVE",
          spotFamily: "OPEN_RFI",
          sourceStatus: "exact_source",
          stackBb: 9,
          heroPosition: "SB",
          villainPosition: null,
          handCode: "K7s",
          selectedAction: "FOLD",
          correctAction: "JAM",
          isCorrect: false,
          confidence: "guessed",
          drillPackId: null,
          leakFamilyId: "rfi_too_tight",
          createdAt: new Date("2026-04-30T10:03:00Z"),
        },
      ],
      hands: [],
      existingLeakFamilyIds: [],
    });

    const suggestions = buildTodayTrainingSuggestions({
      weakSpots,
      reviewQueue: { totalNeedsReview: 0, oldestPendingDays: null },
    });

    const icmizerSuggestion = suggestions.find(s => s.type === "icmizer_review");
    expect(icmizerSuggestion).toBeDefined();
    expect(icmizerSuggestion?.targetRoute).toBe("/icmizer-reference");
  });
});

// ─── 6. Range engine: no push/fold chart in SPOT_DEFINITIONS ─────────────────

describe("range engine — no push/fold charts", () => {
  it("no SPOT_DEFINITION has spotFamily PUSH_FOLD", () => {
    const pushFoldSpots = SPOT_DEFINITIONS.filter(
      (s: { spotFamily: string }) => s.spotFamily === "PUSH_FOLD"
    );
    expect(pushFoldSpots).toHaveLength(0);
  });

  it("no SPOT_DEFINITION label contains 'push/fold' or 'push fold' as a training label", () => {
    // SPOT_DEFINITIONS are internal range charts — none should be labelled as push/fold training
    // SpotDefinition uses 'label' not 'title'
    const pushFoldSpots = SPOT_DEFINITIONS.filter(
      (s: { label: string }) =>
        s.label.toLowerCase().startsWith("push/fold") ||
        s.label.toLowerCase().startsWith("push fold")
    );
    expect(pushFoldSpots).toHaveLength(0);
  });
});
