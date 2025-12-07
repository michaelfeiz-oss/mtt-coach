/**
 * 12-Week MTT Training Program
 * Drill templates and weekly structure
 */

export type DrillTemplate = "A" | "B" | "C" | "D" | "E" | "F";

export interface DrillTemplateConfig {
  name: string;
  tool: string;
  duration: string;
  steps: string[];
  deliverable: string;
}

export const DRILL_TEMPLATES: Record<DrillTemplate, DrillTemplateConfig> = {
  A: {
    name: "Preflop+ Day",
    tool: "Preflop+",
    duration: "30–45 minutes",
    steps: [
      "Do 20 randomized range recall drills",
      "Do 10 blind-defense drills",
      "Save 3 rules to your Notes",
    ],
    deliverable: "3 preflop heuristics",
  },
  B: {
    name: "Solver Day (Postflopizer)",
    tool: "Postflopizer",
    duration: "45 minutes",
    steps: [
      "Load 10 spots matching the weekly theme",
      "Compare solver strategy vs your instinct",
      "Write 3 heuristics",
    ],
    deliverable: "3 postflop rules",
  },
  C: {
    name: "ICMIZER Day",
    tool: "ICMIZER",
    duration: "30–45 minutes",
    steps: [
      "Solve 10 push/fold spots",
      "Solve 10 re-jam spots",
      "Solve 3 FT ICM spots",
      "Save rules",
    ],
    deliverable: "3 late-game rules",
  },
  D: {
    name: "Exploit Day (APT)",
    tool: "Advanced Poker Training",
    duration: "45–60 minutes",
    steps: [
      "Play 1 APT session",
      "Identify 2–3 population tendencies",
      "Write exploit rules",
    ],
    deliverable: "2–3 exploit rules",
  },
  E: {
    name: "Tournament Simulation Day",
    tool: "Advanced Poker Training",
    duration: "1 hour",
    steps: [
      "Play 1 MTT simulation",
      "Mark 3 hands",
      "Review them in MTT Coach",
    ],
    deliverable: "3 corrected hands",
  },
  F: {
    name: "Weekly Review",
    tool: "MTT Coach",
    duration: "20–30 minutes",
    steps: [
      "Review your week's notes",
      "Select 1 leak to fix",
      "Set next week's focus",
    ],
    deliverable: "1 main leak",
  },
};

export interface ProgramDay {
  day: string;
  title: string;
  tool: string;
  template: DrillTemplate;
  focus?: string;
}

export interface ProgramWeek {
  week: number;
  name: string;
  focus: string;
  days: ProgramDay[];
}

export const PROGRAM_12_WEEKS: ProgramWeek[] = [
  {
    week: 1,
    name: "Preflop Foundation",
    focus: "Master opening ranges and blind defense",
    days: [
      { day: "Monday", title: "Opening Ranges", tool: "Preflop+", template: "A" },
      { day: "Tuesday", title: "3-bet / 4-bet", tool: "Preflop+", template: "A" },
      { day: "Wednesday", title: "Blind Defense", tool: "Preflop+", template: "A" },
      { day: "Thursday", title: "Early Stage Exploits", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "SRP Solver Spots", tool: "Postflopizer", template: "B" },
    ],
  },
  {
    week: 2,
    name: "Flop Strategy",
    focus: "C-bet textures and multiway dynamics",
    days: [
      { day: "Monday", title: "C-bet Textures", tool: "Preflop+", template: "B" },
      { day: "Tuesday", title: "Turns After C-bet", tool: "Postflopizer", template: "B" },
      { day: "Wednesday", title: "Multiway Strategy", tool: "Postflopizer", template: "B" },
      { day: "Thursday", title: "Solver 10 Flops", tool: "Postflopizer", template: "B" },
      { day: "Friday", title: "APT Tournament", tool: "Advanced Poker Training", template: "E" },
    ],
  },
  {
    week: 3,
    name: "Aggression / Bluffing",
    focus: "Bluff combos and turn aggression",
    days: [
      { day: "Monday", title: "Bluff Combos", tool: "Postflopizer", template: "B" },
      { day: "Tuesday", title: "Turn Aggression", tool: "Postflopizer", template: "B" },
      { day: "Wednesday", title: "River Bluffs", tool: "Postflopizer", template: "B" },
      { day: "Thursday", title: "Scare-card Exploit", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "Review Bluffs", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 4,
    name: "Deep Stack Mastery",
    focus: "3-bet pots and deep stack play",
    days: [
      { day: "Monday", title: "3-bet Pots", tool: "Postflopizer", template: "B" },
      { day: "Tuesday", title: "APT Deep", tool: "Advanced Poker Training", template: "E" },
      { day: "Wednesday", title: "Preflop Refresh", tool: "Preflop+", template: "A" },
      { day: "Thursday", title: "IP vs OOP Solver", tool: "Postflopizer", template: "B" },
      { day: "Friday", title: "Aggression Tuning", tool: "Advanced Poker Training", template: "D" },
    ],
  },
  {
    week: 5,
    name: "ICM / Push-Fold",
    focus: "Late stage push/fold and ICM spots",
    days: [
      { day: "Monday", title: "10BB Push", tool: "ICMIZER", template: "C" },
      { day: "Tuesday", title: "15BB Re-jam", tool: "ICMIZER", template: "C" },
      { day: "Wednesday", title: "SB/BB ICM", tool: "ICMIZER", template: "C" },
      { day: "Thursday", title: "Bubble Exploits", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "FT Practice", tool: "Advanced Poker Training", template: "E" },
    ],
  },
  {
    week: 6,
    name: "Exploit Month",
    focus: "Population tendencies and exploits",
    days: [
      { day: "Monday", title: "Pattern Recognition 1", tool: "Advanced Poker Training", template: "D" },
      { day: "Tuesday", title: "Pattern Recognition 2", tool: "Advanced Poker Training", template: "D" },
      { day: "Wednesday", title: "Pattern Recognition 3", tool: "Advanced Poker Training", template: "D" },
      { day: "Thursday", title: "Pattern Recognition 4", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "Exploit Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 7,
    name: "Final Table Strategy",
    focus: "FT ICM and aggression patterns",
    days: [
      { day: "Monday", title: "FT ICM Spots", tool: "ICMIZER", template: "C" },
      { day: "Tuesday", title: "Chip Leader Play", tool: "Advanced Poker Training", template: "D" },
      { day: "Wednesday", title: "Short Stack Moves", tool: "ICMIZER", template: "C" },
      { day: "Thursday", title: "Bubble Play", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "FT Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 8,
    name: "Turn Play",
    focus: "Probe, barrel, raise, exploit",
    days: [
      { day: "Monday", title: "Turn Probes", tool: "Postflopizer", template: "B" },
      { day: "Tuesday", title: "Turn Barrels", tool: "Postflopizer", template: "B" },
      { day: "Wednesday", title: "Turn Raises", tool: "Postflopizer", template: "B" },
      { day: "Thursday", title: "Turn Exploits", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "Turn Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 9,
    name: "River Play",
    focus: "Thin value, hero calls, bluffs",
    days: [
      { day: "Monday", title: "Thin Value", tool: "Postflopizer", template: "B" },
      { day: "Tuesday", title: "Hero Calls", tool: "Postflopizer", template: "B" },
      { day: "Wednesday", title: "River Bluffs", tool: "Postflopizer", template: "B" },
      { day: "Thursday", title: "River Exploits", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "River Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 10,
    name: "Mid-Stage MTT",
    focus: "20–40BB solver and APT",
    days: [
      { day: "Monday", title: "20BB Strategy", tool: "ICMIZER", template: "C" },
      { day: "Tuesday", title: "30BB Strategy", tool: "ICMIZER", template: "C" },
      { day: "Wednesday", title: "40BB Strategy", tool: "Postflopizer", template: "B" },
      { day: "Thursday", title: "Mid-Stage Exploits", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "Mid-Stage Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 11,
    name: "Integration",
    focus: "Solver + exploit + APT daily",
    days: [
      { day: "Monday", title: "Solver Session", tool: "Postflopizer", template: "B" },
      { day: "Tuesday", title: "Exploit Session", tool: "Advanced Poker Training", template: "D" },
      { day: "Wednesday", title: "APT Session", tool: "Advanced Poker Training", template: "E" },
      { day: "Thursday", title: "Mixed Drills", tool: "Preflop+", template: "A" },
      { day: "Friday", title: "Integration Review", tool: "MTT Coach", template: "F" },
    ],
  },
  {
    week: 12,
    name: "Peak Performance",
    focus: "Full review and final drills",
    days: [
      { day: "Monday", title: "Preflop Review", tool: "Preflop+", template: "A" },
      { day: "Tuesday", title: "Postflop Review", tool: "Postflopizer", template: "B" },
      { day: "Wednesday", title: "ICM Review", tool: "ICMIZER", template: "C" },
      { day: "Thursday", title: "Exploit Review", tool: "Advanced Poker Training", template: "D" },
      { day: "Friday", title: "Final Review", tool: "MTT Coach", template: "F" },
    ],
  },
];

export function getProgramWeek(weekNumber: number): ProgramWeek | undefined {
  return PROGRAM_12_WEEKS.find((w) => w.week === weekNumber);
}

export function getCurrentProgramWeek(): ProgramWeek {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const weekNumber = (Math.floor(dayOfYear / 7) % 12) + 1;
  return getProgramWeek(weekNumber) || PROGRAM_12_WEEKS[0];
}
