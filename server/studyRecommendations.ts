/**
 * Study Recommendation Engine
 * 
 * Analyzes leaks and progress to provide personalized study recommendations
 */

import { StudyType } from "./studyPlan";

export interface LeakData {
  id: number;
  name: string;
  category: string;
  handsLinkedCount: number;
  avgSeverity?: number;
}

export interface StudyRecommendation {
  type: StudyType;
  focusAreas: string[];
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface DailyFocus {
  primaryLeak: string | null;
  secondaryLeaks: string[];
  recommendations: StudyRecommendation[];
  weeklyGoal: string;
}

/**
 * Map leak categories to study types
 */
const LEAK_TO_STUDY_TYPE: Record<string, StudyType[]> = {
  PREFLOP: ["RANGE_TRAINING", "EXPLOIT_LAB"],
  POSTFLOP: ["RANGE_TRAINING", "DEEP_DIVE", "HAND_REVIEW"],
  ICM: ["ICM", "DEEP_DIVE"],
  MENTAL: ["MENTAL_GAME"],
  EXPLOIT: ["EXPLOIT_LAB", "HAND_REVIEW"],
};

/**
 * Generate specific focus areas based on leak name and category
 */
function generateFocusAreas(leak: LeakData): string[] {
  const { name, category } = leak;
  const areas: string[] = [];

  // Generate specific actionable focus areas based on leak patterns
  if (name.toLowerCase().includes("bb") || name.toLowerCase().includes("big blind")) {
    areas.push("BB defense ranges vs different positions");
    areas.push("BB 3bet and call frequencies");
    areas.push("BB postflop play in single-raised pots");
  } else if (name.toLowerCase().includes("3bet") || name.toLowerCase().includes("3-bet")) {
    areas.push("3bet sizing and frequency by position");
    areas.push("Playing 3bet pots in and out of position");
    areas.push("4bet and fold ranges");
  } else if (name.toLowerCase().includes("turn")) {
    areas.push("Turn barrel frequency and sizing");
    areas.push("Turn check-back ranges");
    areas.push("Turn defense vs aggression");
  } else if (name.toLowerCase().includes("river")) {
    areas.push("River value bet sizing");
    areas.push("River bluff frequency");
    areas.push("River call/fold decisions");
  } else if (name.toLowerCase().includes("cbet") || name.toLowerCase().includes("c-bet")) {
    areas.push("Flop continuation bet frequency");
    areas.push("Board texture analysis");
    areas.push("Range advantage recognition");
  }

  // Category-based fallbacks
  if (areas.length === 0) {
    switch (category) {
      case "PREFLOP":
        areas.push("Opening ranges by position");
        areas.push("3bet and call ranges");
        areas.push("Preflop sizing");
        break;
      case "POSTFLOP":
        areas.push("Flop strategy and board reading");
        areas.push("Turn and river play");
        areas.push("Bet sizing and frequency");
        break;
      case "ICM":
        areas.push("Short stack push/fold");
        areas.push("Final table bubble play");
        areas.push("ICM pressure spots");
        break;
      case "MENTAL":
        areas.push("Tilt recognition and control");
        areas.push("Focus and decision quality");
        areas.push("Emotional regulation");
        break;
      case "EXPLOIT":
        areas.push("Population tendencies");
        areas.push("Player type identification");
        areas.push("Exploitative adjustments");
        break;
    }
  }

  return areas.slice(0, 3); // Limit to top 3 focus areas
}

/**
 * Generate study recommendations for each study type based on top leaks
 */
export function generateStudyRecommendations(
  topLeaks: LeakData[],
  studyType: StudyType
): StudyRecommendation | null {
  if (topLeaks.length === 0) {
    return {
      type: studyType,
      focusAreas: getDefaultFocusAreas(studyType),
      reason: "Building fundamental skills across all areas",
      priority: "MEDIUM",
    };
  }

  // Find leaks relevant to this study type
  const relevantLeaks = topLeaks.filter((leak) => {
    const studyTypes = LEAK_TO_STUDY_TYPE[leak.category] || [];
    return studyTypes.includes(studyType);
  });

  if (relevantLeaks.length === 0) {
    return {
      type: studyType,
      focusAreas: getDefaultFocusAreas(studyType),
      reason: "Maintaining balanced skill development",
      priority: "LOW",
    };
  }

  // Use the most frequent leak
  const primaryLeak = relevantLeaks[0]!;
  const focusAreas = generateFocusAreas(primaryLeak);

  const priority = primaryLeak.handsLinkedCount >= 5 ? "HIGH" : 
                   primaryLeak.handsLinkedCount >= 3 ? "MEDIUM" : "LOW";

  return {
    type: studyType,
    focusAreas,
    reason: `Addressing your top leak: ${primaryLeak.name} (${primaryLeak.handsLinkedCount} hands this week)`,
    priority,
  };
}

/**
 * Get default focus areas when no leaks are available
 */
function getDefaultFocusAreas(studyType: StudyType): string[] {
  const defaults: Record<StudyType, string[]> = {
    RANGE_TRAINING: [
      "Opening ranges by position",
      "3bet and calling ranges",
      "Squeeze and cold call spots",
    ],
    HAND_REVIEW: [
      "Review recent tournament hands",
      "Identify decision points",
      "Compare with solver solutions",
    ],
    ICM: [
      "Short stack push/fold charts",
      "Final table bubble scenarios",
      "Re-shove ranges",
    ],
    EXPLOIT_LAB: [
      "Population tendencies at your stakes",
      "Recreational player patterns",
      "Regular player adjustments",
    ],
    DEEP_DIVE: [
      "Study one concept in depth",
      "Review theory and solver outputs",
      "Practice specific scenarios",
    ],
    MENTAL_GAME: [
      "Tilt triggers and responses",
      "Focus and concentration",
      "Decision quality under pressure",
    ],
    LIGHT_REVIEW: [
      "Review study notes",
      "Watch poker content",
      "Reflect on recent sessions",
    ],
  };

  return defaults[studyType] || [];
}

/**
 * Generate daily focus based on top leaks
 */
export function generateDailyFocus(topLeaks: LeakData[]): DailyFocus {
  if (topLeaks.length === 0) {
    return {
      primaryLeak: null,
      secondaryLeaks: [],
      recommendations: [],
      weeklyGoal: "Build fundamental skills and establish consistent study habits",
    };
  }

  const primaryLeak = topLeaks[0]!;
  const secondaryLeaks = topLeaks.slice(1, 3).map((l) => l.name);

  // Generate recommendations for all study types
  const studyTypes: StudyType[] = [
    "RANGE_TRAINING",
    "HAND_REVIEW",
    "ICM",
    "EXPLOIT_LAB",
    "DEEP_DIVE",
    "MENTAL_GAME",
    "LIGHT_REVIEW",
  ];

  const recommendations = studyTypes
    .map((type) => generateStudyRecommendations(topLeaks, type))
    .filter((r): r is StudyRecommendation => r !== null);

  const weeklyGoal = `Focus on ${primaryLeak.name} - appears in ${primaryLeak.handsLinkedCount} hands. Target: reduce frequency by 50% this week.`;

  return {
    primaryLeak: primaryLeak.name,
    secondaryLeaks,
    recommendations,
    weeklyGoal,
  };
}

/**
 * Get suggested Deep Dive topic based on top leak
 */
export function getSuggestedDeepDiveTopic(topLeaks: LeakData[]): string | null {
  if (topLeaks.length === 0) return null;

  const primaryLeak = topLeaks[0]!;
  const name = primaryLeak.name.toLowerCase();

  // Map leak names to deep dive topics
  if (name.includes("cbet") || name.includes("c-bet")) return "C-bet Frequency";
  if (name.includes("3bet") || name.includes("3-bet")) return "3bet Pots OOP";
  if (name.includes("check-raise") || name.includes("checkraise")) return "Check-raise";
  if (name.includes("bb") || name.includes("big blind")) return "BvB";
  if (name.includes("turn")) return "Turn Barrels";
  if (name.includes("river")) return "River Value/Bluff";
  if (name.includes("barrel")) return "Triple Barrels";
  if (name.includes("limp")) return "Limp Pots";

  // Default to category-based suggestion
  switch (primaryLeak.category) {
    case "PREFLOP":
      return "3bet Pots OOP";
    case "POSTFLOP":
      return "Turn Barrels";
    case "ICM":
      return "BvB"; // Heads-up and short-handed play
    default:
      return null;
  }
}
