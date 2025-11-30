/**
 * Study Plan Logic
 * 
 * Provides a structured 7-day weekly study program with rotating Deep Dive topics.
 */

export type StudyType =
  | "RANGE_TRAINING"
  | "HAND_REVIEW"
  | "ICM"
  | "EXPLOIT_LAB"
  | "DEEP_DIVE"
  | "MENTAL_GAME"
  | "LIGHT_REVIEW";

export type PlanSlot =
  | "DAY1_RANGE"
  | "DAY2_HAND_REVIEW"
  | "DAY3_ICM"
  | "DAY4_EXPLOIT"
  | "DAY5_DEEP_DIVE"
  | "DAY6_MENTAL"
  | "DAY7_LIGHT_REVIEW";

export interface StudyPlanDay {
  dayOfWeek: number; // 1 = Monday, 7 = Sunday
  date: Date;
  planSlot: PlanSlot;
  type: StudyType;
  label: string;
  description: string;
  completed: boolean;
}

const DEEP_DIVE_TOPICS = [
  "C-bet Frequency",
  "3bet Pots OOP",
  "Check-raise",
  "BvB",
  "Turn Barrels",
  "River Value/Bluff",
  "Triple Barrels",
  "Limp Pots",
];

const STUDY_PLAN_TEMPLATE: Omit<StudyPlanDay, "dayOfWeek" | "date" | "completed" | "description">[] = [
  {
    planSlot: "DAY1_RANGE",
    type: "RANGE_TRAINING",
    label: "Range Training",
  },
  {
    planSlot: "DAY2_HAND_REVIEW",
    type: "HAND_REVIEW",
    label: "Hand Review",
  },
  {
    planSlot: "DAY3_ICM",
    type: "ICM",
    label: "ICM",
  },
  {
    planSlot: "DAY4_EXPLOIT",
    type: "EXPLOIT_LAB",
    label: "Exploit Lab",
  },
  {
    planSlot: "DAY5_DEEP_DIVE",
    type: "DEEP_DIVE",
    label: "Deep Dive",
  },
  {
    planSlot: "DAY6_MENTAL",
    type: "MENTAL_GAME",
    label: "Mental Game",
  },
  {
    planSlot: "DAY7_LIGHT_REVIEW",
    type: "LIGHT_REVIEW",
    label: "Light Review",
  },
];

const STUDY_DESCRIPTIONS: Record<StudyType, string> = {
  RANGE_TRAINING: "Practice opening ranges, 3bet ranges, and calling ranges using your solver or range trainer.",
  HAND_REVIEW: "Review hands from recent tournaments. Focus on spots where you felt uncertain or made mistakes.",
  ICM: "Study ICM scenarios using ICMIZER. Practice final table situations and bubble play.",
  EXPLOIT_LAB: "Identify opponent tendencies and practice exploitative adjustments. Review population stats.",
  DEEP_DIVE: "Deep dive into a specific concept. This week's topic is determined by rotation.",
  MENTAL_GAME: "Work on mental game: tilt control, focus, decision fatigue, or read Tendler's book.",
  LIGHT_REVIEW: "Light review day: watch poker content, review notes, or catch up on missed study.",
};

/**
 * Get the week index for a given date (weeks since epoch)
 */
function getWeekIndex(date: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const epoch = new Date(1970, 0, 1); // Jan 1, 1970
  
  // Adjust to Monday-based week
  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  
  return Math.floor((monday.getTime() - epoch.getTime()) / msPerWeek);
}

/**
 * Get the rotating Deep Dive topic for a given week
 */
export function getDeepDiveTopic(date: Date): string {
  const weekIndex = getWeekIndex(date);
  const topicIndex = weekIndex % DEEP_DIVE_TOPICS.length;
  return DEEP_DIVE_TOPICS[topicIndex]!;
}

/**
 * Get the Monday of the week containing the given date
 */
function getWeekStart(date: Date): Date {
  const dayOfWeek = date.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Generate a 7-day study plan for the week containing the given date
 */
export function generateWeekPlan(date: Date, completedSlots: Set<string>): StudyPlanDay[] {
  const monday = getWeekStart(date);
  const deepDiveTopic = getDeepDiveTopic(monday);
  
  return STUDY_PLAN_TEMPLATE.map((template, index) => {
    const dayDate = new Date(monday);
    dayDate.setDate(dayDate.getDate() + index);
    
    const description =
      template.type === "DEEP_DIVE"
        ? `Deep dive into ${deepDiveTopic}. Study theory, review solver outputs, and practice scenarios.`
        : STUDY_DESCRIPTIONS[template.type];
    
    // Check if this day is completed
    const dateKey = dayDate.toISOString().split("T")[0]; // YYYY-MM-DD
    const slotKey = `${dateKey}_${template.planSlot}`;
    const completed = completedSlots.has(slotKey);
    
    return {
      dayOfWeek: index + 1, // 1 = Monday
      date: dayDate,
      planSlot: template.planSlot,
      type: template.type,
      label: template.label,
      description,
      completed,
    };
  });
}

/**
 * Get today's study plan
 */
export function getTodayPlan(today: Date, completedSlots: Set<string>): StudyPlanDay | null {
  const weekPlan = generateWeekPlan(today, completedSlots);
  const todayStr = today.toISOString().split("T")[0];
  
  return weekPlan.find((day) => {
    const dayStr = day.date.toISOString().split("T")[0];
    return dayStr === todayStr;
  }) || null;
}
