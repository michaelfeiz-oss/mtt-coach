import { describe, expect, it } from "vitest";
import {
  aggregateWeakSpots,
  buildHandTrainingSuggestionModel,
  buildTodayTrainingSuggestions,
} from "./coachingLoop";
import { mapStackToStudyReferenceBucket } from "../shared/coachingLoop";

describe("training loop aggregation", () => {
  it("turns repeated misses into a weak spot", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [
        {
          id: 1,
          chartId: 25,
          chartTitle: "BB vs BTN @ 25bb",
          canonicalSpotId: "DEFEND_VS_RFI|25|BB|BTN|9P|BBA",
          spotFamily: "DEFEND_VS_RFI",
          sourceStatus: "exact_source",
          stackBb: 25,
          heroPosition: "BB",
          villainPosition: "BTN",
          handCode: "K9o",
          selectedAction: "FOLD",
          correctAction: "CALL",
          isCorrect: false,
          confidence: "knew_it",
          drillPackId: null,
          leakFamilyId: "blind_defense_too_tight",
          createdAt: new Date("2026-04-28T10:00:00Z"),
        },
        {
          id: 2,
          chartId: 25,
          chartTitle: "BB vs BTN @ 25bb",
          canonicalSpotId: "DEFEND_VS_RFI|25|BB|BTN|9P|BBA",
          spotFamily: "DEFEND_VS_RFI",
          sourceStatus: "exact_source",
          stackBb: 25,
          heroPosition: "BB",
          villainPosition: "BTN",
          handCode: "Q8s",
          selectedAction: "FOLD",
          correctAction: "CALL",
          isCorrect: false,
          confidence: "unsure",
          drillPackId: null,
          leakFamilyId: "blind_defense_too_tight",
          createdAt: new Date("2026-04-29T10:00:00Z"),
        },
      ],
      hands: [],
      now: new Date("2026-04-30T10:00:00Z"),
    });

    expect(weakSpots[0]?.label).toBe("BB vs BTN @ 25bb");
    expect(weakSpots[0]?.misses).toBe(2);
    expect(weakSpots[0]?.recentMissCount).toBe(2);
    expect(weakSpots[0]?.severityScore).toBeGreaterThanOrEqual(6);
  });

  it("treats guessed correct answers as a weak signal", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [
        {
          id: 1,
          chartId: 40,
          chartTitle: "CO vs BB 3-Bet @ 40bb",
          canonicalSpotId: "FACING_3BET|40|CO|BB|9P|BBA",
          spotFamily: "FACING_3BET",
          sourceStatus: "simplified_population",
          stackBb: 40,
          heroPosition: "CO",
          villainPosition: "BB",
          handCode: "A5s",
          selectedAction: "CALL",
          correctAction: "CALL",
          isCorrect: true,
          confidence: "guessed",
          drillPackId: null,
          leakFamilyId: null,
          createdAt: new Date("2026-04-30T09:00:00Z"),
        },
      ],
      hands: [],
      now: new Date("2026-04-30T10:00:00Z"),
    });

    expect(weakSpots[0]?.guessedCorrectCount).toBe(1);
    expect(weakSpots[0]?.severityScore).toBe(1);
  });

  it("lets older reviewed hand mistakes still contribute to weak spots", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [],
      hands: [
        {
          handId: 10,
          canonicalSpotId: "OPEN_RFI|40|BTN|NONE|9P|BBA",
          label: "BTN RFI @ 40bb",
          spotFamily: "OPEN_RFI",
          stackBb: 40,
          heroPosition: "BTN",
          villainPosition: null,
          handCode: "A7o",
          mistakeSeverity: 2,
          reviewed: true,
          createdAt: new Date("2026-03-01T10:00:00Z"),
          leakFamilyIds: ["weak_ax_overplay"],
          suggestedChartId: 75,
          suggestedChartTitle: "BTN RFI @ 40bb",
        },
      ],
      now: new Date("2026-04-30T10:00:00Z"),
    });

    expect(weakSpots[0]?.label).toBe("BTN RFI @ 40bb");
    expect(weakSpots[0]?.severityScore).toBeGreaterThan(0);
  });

  it("does not inflate weak spot severity for correct high-confidence reps", () => {
    const weakSpots = aggregateWeakSpots({
      attempts: [
        {
          id: 1,
          chartId: 15,
          chartTitle: "UTG RFI @ 15bb",
          canonicalSpotId: "OPEN_RFI|15|UTG|NONE|9P|BBA",
          spotFamily: "OPEN_RFI",
          sourceStatus: "exact_source",
          stackBb: 15,
          heroPosition: "UTG",
          villainPosition: null,
          handCode: "AQo",
          selectedAction: "RAISE",
          correctAction: "RAISE",
          isCorrect: true,
          confidence: "knew_it",
          drillPackId: null,
          leakFamilyId: null,
          createdAt: new Date("2026-04-30T09:00:00Z"),
        },
      ],
      hands: [],
      now: new Date("2026-04-30T10:00:00Z"),
    });

    expect(weakSpots[0]?.severityScore).toBe(0);
  });
});

describe("today's training suggestions", () => {
  it("returns a starter plan when there is no study data", () => {
    const suggestions = buildTodayTrainingSuggestions({
      weakSpots: [],
      reviewQueue: {
        totalNeedsReview: 0,
        highSeverityCount: 0,
        topLeakFamilyId: null,
        topLeakLabel: null,
      },
    });

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]?.title).toContain("Open raises");
  });

  it("returns a weak-spot drill when misses exist", () => {
    const suggestions = buildTodayTrainingSuggestions({
      weakSpots: [
        {
          id: "spot:1",
          label: "BB vs BTN @ 25bb",
          spotFamily: "DEFEND_VS_RFI",
          canonicalSpotId: "DEFEND_VS_RFI|25|BB|BTN|9P|BBA",
          leakFamilyId: "blind_defense_too_tight",
          stackBb: 25,
          heroPosition: "BB",
          villainPosition: "BTN",
          attempts: 6,
          misses: 3,
          accuracy: 50,
          guessedCorrectCount: 1,
          recentMissCount: 2,
          severityScore: 9,
          lastSeenAt: "2026-04-30T10:00:00.000Z",
          suggestedDrillPackId: "bb-vs-sb-marginal-defense",
          suggestedChartId: 25,
          suggestedAction: "start_drill",
        },
      ],
      reviewQueue: {
        totalNeedsReview: 0,
        highSeverityCount: 0,
        topLeakFamilyId: null,
        topLeakLabel: null,
      },
    });

    expect(suggestions[0]?.targetRoute).toContain("packId");
    expect(suggestions[0]?.reason).toContain("accuracy");
  });

  it("returns a review queue task when hands need review", () => {
    const suggestions = buildTodayTrainingSuggestions({
      weakSpots: [],
      reviewQueue: {
        totalNeedsReview: 2,
        highSeverityCount: 1,
        topLeakFamilyId: "weak_ax_overplay",
        topLeakLabel: "Weak Ax Overplay",
      },
    });

    expect(suggestions[0]?.type).toBe("review_hands");
    expect(suggestions[0]?.targetRoute).toContain("reviewStatus=needs_review");
    expect(suggestions[0]?.targetRoute).toContain("leakFamily=weak_ax_overplay");
  });

  it("prioritizes the highest-severity low-accuracy weak spot first", () => {
    const suggestions = buildTodayTrainingSuggestions({
      weakSpots: [
        {
          id: "spot:strong",
          label: "BB vs BTN @ 25bb",
          spotFamily: "DEFEND_VS_RFI",
          canonicalSpotId: "DEFEND_VS_RFI|25|BB|BTN|9P|BBA",
          leakFamilyId: "blind_defense_too_tight",
          stackBb: 25,
          heroPosition: "BB",
          villainPosition: "BTN",
          attempts: 8,
          misses: 5,
          accuracy: 38,
          guessedCorrectCount: 1,
          recentMissCount: 3,
          severityScore: 14,
          lastSeenAt: "2026-04-30T10:00:00.000Z",
          suggestedDrillPackId: "bb-vs-sb-marginal-defense",
          suggestedChartId: 25,
          suggestedAction: "start_drill",
        },
        {
          id: "spot:lighter",
          label: "BTN RFI @ 40bb",
          spotFamily: "OPEN_RFI",
          canonicalSpotId: "OPEN_RFI|40|BTN|NONE|9P|BBA",
          leakFamilyId: null,
          stackBb: 40,
          heroPosition: "BTN",
          villainPosition: null,
          attempts: 10,
          misses: 2,
          accuracy: 80,
          guessedCorrectCount: 0,
          recentMissCount: 1,
          severityScore: 4,
          lastSeenAt: "2026-04-30T10:00:00.000Z",
          suggestedDrillPackId: null,
          suggestedChartId: 75,
          suggestedAction: "start_drill",
        },
      ],
      reviewQueue: {
        totalNeedsReview: 0,
        highSeverityCount: 0,
        topLeakFamilyId: null,
        topLeakLabel: null,
      },
    });

    expect(suggestions[0]?.title).toBe("BB vs SB Marginal Defense");
    expect(suggestions[0]?.reason).toContain("38% accuracy");
  });
});

describe("hand study routing", () => {
  it("maps hand detail actions to an exact chart when available", () => {
    const suggestion = buildHandTrainingSuggestionModel({
      handId: 10,
      canonicalSpotId: "OPEN_RFI|15|BTN|NONE|9P|BBA",
      recommendation: {
        chart: {
          id: 75,
          title: "BTN RFI @ 15bb",
          stackDepth: 15,
          spotGroup: "RFI",
          spotKey: "BTN_RFI",
          heroPosition: "BTN",
          villainPosition: null,
        },
        handCode: "A5s",
        recommendedAction: "RAISE",
        reason: "Matched exactly.",
        confidence: "exact",
      },
      leakFamilyId: null,
    });

    expect(suggestion.drillRoute).toBeNull();
    expect(suggestion.chartRoute).toBe("/strategy/library?chartId=75");
    expect(suggestion.chartReferenceLabel).toBe("Imported study candidate");
  });

  it("labels nearest-chart fallbacks honestly", () => {
    const suggestion = buildHandTrainingSuggestionModel({
      handId: 11,
      canonicalSpotId: null,
      recommendation: {
        chart: {
          id: 88,
          title: "CO vs BB 3-Bet @ 40bb",
          stackDepth: 40,
          spotGroup: "VS_3BET",
          spotKey: "CO_vs_BB_3bet",
          heroPosition: "CO",
          villainPosition: "BB",
        },
        handCode: "AQo",
        recommendedAction: "CALL",
        reason: "Using nearest chart.",
        confidence: "nearest",
      },
      leakFamilyId: "sub_premium_vs_pressure_mistakes",
    });

    expect(suggestion.chartReferenceLabel).toBe("Nearest 40bb study reference");
  });

  it("falls back to a drill pack when no chart is available", () => {
    const suggestion = buildHandTrainingSuggestionModel({
      handId: 12,
      canonicalSpotId: null,
      recommendation: null,
      leakFamilyId: "small_pair_jam_errors",
    });

    expect(suggestion.drillRoute).toContain("packId=15-20bb-small-pair-decisions");
    expect(suggestion.chartRoute).toBeNull();
  });

  it("maps study reference buckets with explicit stack ranges", () => {
    expect(mapStackToStudyReferenceBucket(18)).toBe(15);
    expect(mapStackToStudyReferenceBucket(27)).toBe(25);
    expect(mapStackToStudyReferenceBucket(44)).toBe(40);
    expect(mapStackToStudyReferenceBucket(60)).toBe(40);
  });
});
