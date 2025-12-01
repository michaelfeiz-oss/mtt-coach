/**
 * 12-Week Study Plan Data Structure
 * Blocks 1-3 with weeks 1-12 and daily tasks
 */

export interface DailyTask {
  dayOfWeek: number; // 1-7
  studyType: "RANGE_TRAINING" | "HAND_REVIEW" | "ICM" | "EXPLOIT_LAB" | "DEEP_DIVE" | "MENTAL_GAME" | "LIGHT_REVIEW";
  title: string;
  description: string;
  tools: string[];
  focusPoints: string[];
  durationMinutes: number;
}

export interface WeekPlan {
  weekNumber: number;
  theme: string;
  focusAreas: string[];
  tasks: DailyTask[];
}

export interface BlockPlan {
  blockNumber: number;
  title: string;
  goal: string;
  weeks: WeekPlan[];
}

export const STUDY_PLAN_DATA: BlockPlan[] = [
  {
    blockNumber: 1,
    title: "Block 1 – Preflop & Single-Raised Pots",
    goal: "Stop bleeding chips in basic spots",
    weeks: [
      {
        weekNumber: 1,
        theme: "BTN & CO vs Blinds Fundamentals",
        focusAreas: ["BTN opens 40bb", "BB defence vs BTN", "CO opens 40bb", "Simple c-bets IP in SRP"],
        tasks: [
          {
            dayOfWeek: 1,
            studyType: "RANGE_TRAINING",
            title: "Range Training - BTN/CO Opens",
            description: "Practice opening ranges BTN & CO @ 40bb. Run drills in Preflop+ for accuracy >85%. Also cover BB defence vs BTN 2.2x and CO opens.",
            tools: ["Preflop+", "Upswing MTT MC"],
            focusPoints: ["BTN opens vs unknown field", "BB defend vs BTN - don't overfold suited broadways", "CO opens and BB defence vs CO"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 2,
            studyType: "HAND_REVIEW",
            title: "Hand Review - BTN/CO Spots",
            description: "Pull 5-8 hands from recent tournaments where you were BTN/CO or defended BB vs LP. Use PokerCruncher to estimate villain ranges and check equity. Run Postflopizer sims for interesting spots.",
            tools: ["PokerCruncher", "Postflopizer", "APT"],
            focusPoints: ["Tag leaks: BB_DEFENCE, BTN_OPEN_TOO_TIGHT, C_BET_TOO_OFTEN", "Set mistake street and severity 0-3", "Write 1-line lesson"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 3,
            studyType: "ICM",
            title: "ICM Basics - SB/BTN Shoves",
            description: "Load generic MTT structures in ICMizer. Focus on SB shove vs BB call ranges at 10-15bb and BTN shove vs blinds at 10-15bb. Goal: understand how wide these spots really are.",
            tools: ["ICMizer"],
            focusPoints: ["SB shove ranges at 10-15bb", "BTN shove ranges at 10-15bb", "Note which spots surprised you"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 4,
            studyType: "EXPLOIT_LAB",
            title: "Exploit Lab - Local Pool Reads",
            description: "Define 3 concrete exploit rules for CO/BTN vs blinds. Who overfolds BB? Who defends too wide? Watch 1 module from RYE or Bryan Paris on LP aggression.",
            tools: ["Beat The Fish", "Aggressive Edge", "RYE"],
            focusPoints: ["Define 3 exploit rules for your local pool", "Identify nitty regs vs stations", "Adjust c-betting strategy vs different player types"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 5,
            studyType: "DEEP_DIVE",
            title: "Deep Dive - C-bets IP in SRP",
            description: "Study flop play IP / c-betting in Upswing. Build ONE sim in Postflopizer: BTN vs BB, 40bb, A-high/low-disconnected/paired boards. Extract 3 bullet rules on c-bet frequency & sizing.",
            tools: ["Upswing MTT MC", "Postflopizer"],
            focusPoints: ["C-bet frequency by board texture", "C-bet sizing strategies", "When to check back vs c-bet"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 6,
            studyType: "MENTAL_GAME",
            title: "Mental Game - Discipline in BTN/BB",
            description: "Read mental game chapter about tilt/discipline. Note what typically tilts you in BTN/BB spots. Review the week's study sessions and top leaks. Write a short weekly summary.",
            tools: ["Tendler Book", "Your App"],
            focusPoints: ["Identify tilt triggers in BTN/BB spots", "Review weekly study sessions", "Consolidate leaks and build awareness"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 7,
            studyType: "LIGHT_REVIEW",
            title: "Light Review - Rest Day",
            description: "Scroll hands in the app. No heavy solver work. Maybe 10 mins of Preflop+ light drills in bed.",
            tools: ["Your App", "Preflop+"],
            focusPoints: ["Casual hand review", "Light drills for muscle memory"],
            durationMinutes: 15,
          },
        ],
      },
      {
        weekNumber: 2,
        theme: "EP/MP Opens & BB vs EP/MP",
        focusAreas: ["Tighten early position", "Defend properly vs EP/MP", "Under-3bet vs EP but not overfold"],
        tasks: [
          {
            dayOfWeek: 1,
            studyType: "RANGE_TRAINING",
            title: "Range Training - EP/MP Opens",
            description: "Preflop+ drills for EP (UTG/HJ) opens at 40bb and BB vs UTG/HJ at 40bb. Focus on under-3betting vs EP but not overfolding. Watch 1 Upswing module on EP ranges & exploit vs population.",
            tools: ["Preflop+", "Upswing MTT MC"],
            focusPoints: ["EP opens are tighter", "BB defence vs EP is tighter", "3-bet bluffing frequency vs EP"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 2,
            studyType: "HAND_REVIEW",
            title: "Hand Review - EP/MP Faces",
            description: "Pull 5-8 hands where you faced UTG/HJ opens and were in BB, SB or MP. Use PokerCruncher + Postflopizer if needed. Tag leaks: OVERFOLD_VS_EP, CALL_TOO_WIDE_VS_EP, etc.",
            tools: ["PokerCruncher", "Postflopizer"],
            focusPoints: ["Understand EP opener ranges", "Correct defence frequencies", "Avoid overfolding good hands"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 3,
            studyType: "ICM",
            title: "ICM - 3-bet Shove Stacks",
            description: "ICMizer: Spots with UTG/HJ open & you have 3-bet shove stack 15-20bb. Focus on 3-bet jam ranges (AQ, ATs, KQs, pairs etc.).",
            tools: ["ICMizer"],
            focusPoints: ["3-bet jam ranges with 15-20bb", "Understand equity thresholds", "Position matters in ICM"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 4,
            studyType: "EXPLOIT_LAB",
            title: "Exploit Lab - Tight EP Openers",
            description: "Use Aggressive Edge / RYE: How to exploit players who never 4-bet bluff from EP. Build rules like: Vs tight EP openers, overfold BB slightly but 3-bet bluff almost never.",
            tools: ["Aggressive Edge", "RYE"],
            focusPoints: ["Identify tight EP players", "Exploit their 4-bet bluff weakness", "Adjust 3-bet ranges accordingly"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 5,
            studyType: "DEEP_DIVE",
            title: "Deep Dive - EP vs BB SRP",
            description: "Upswing module on EP vs BB single-raised pots. Postflopizer: Sim UTG vs BB on middle/low boards. Find where BB should attack vs EP c-bets.",
            tools: ["Upswing MTT MC", "Postflopizer"],
            focusPoints: ["BB attack frequencies vs EP c-bets", "Board texture analysis", "Check-raise vs c-bet strategy"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 6,
            studyType: "MENTAL_GAME",
            title: "Mental Game - Respect vs Fear",
            description: "Are you scared of EP ranges? Over-respecting? Update app leaks: promote/demote leaks after this week. Review progress.",
            tools: ["Your App"],
            focusPoints: ["Identify fear-based decisions", "Build confidence in tight ranges", "Track leak improvements"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 7,
            studyType: "LIGHT_REVIEW",
            title: "Light Review - Warm-up Drills",
            description: "Quick Preflop+ warm-up, 10-15 minutes. Light drills for muscle memory.",
            tools: ["Preflop+"],
            focusPoints: ["Maintain drill accuracy", "Quick range review"],
            durationMinutes: 15,
          },
        ],
      },
      {
        weekNumber: 3,
        theme: "Flop Play IP in SRP",
        focusAreas: ["C-bets, checks, and bet sizing", "Board texture analysis", "Range advantage recognition"],
        tasks: [
          {
            dayOfWeek: 1,
            studyType: "RANGE_TRAINING",
            title: "Range Training - Flop Play IP",
            description: "Preflop+ drills on flop c-betting ranges by board texture. Focus on different board types: high-card, low-card, paired, connected, disconnected.",
            tools: ["Preflop+"],
            focusPoints: ["High-card boards: c-bet more", "Low-card boards: check more", "Paired boards: mixed strategy"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 2,
            studyType: "HAND_REVIEW",
            title: "Hand Review - Flop Decisions",
            description: "Pull hands where you made flop decisions IP in SRP. Review c-bet sizing, check-back decisions, and bet-fold patterns. Use Postflopizer to validate.",
            tools: ["PokerCruncher", "Postflopizer"],
            focusPoints: ["C-bet sizing appropriateness", "Check-back frequency", "Exploit player tendencies"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 3,
            studyType: "ICM",
            title: "ICM - Bubble Dynamics",
            description: "ICMizer: Study bubble spots with 8-12bb stacks. Focus on push/fold ranges and calling ranges from different positions.",
            tools: ["ICMizer"],
            focusPoints: ["Bubble push ranges", "Bubble call ranges", "ICM vs chip EV"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 4,
            studyType: "EXPLOIT_LAB",
            title: "Exploit Lab - Flop Tendencies",
            description: "Identify players who c-bet too much or too little on flops. Build specific rules: Vs aggressive c-bettors, check-raise more. Vs passive players, thin value bet.",
            tools: ["Your Notes", "RYE"],
            focusPoints: ["Identify c-bet patterns", "Adjust check-raise frequency", "Exploit passivity with thin value"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 5,
            studyType: "DEEP_DIVE",
            title: "Deep Dive - Board Texture Strategy",
            description: "Deep study of board textures and optimal play. Build 3 Postflopizer sims: A-high, K-high, and low boards. Extract c-bet frequencies and sizing.",
            tools: ["Postflopizer"],
            focusPoints: ["Board texture impact on strategy", "C-bet frequency by texture", "Sizing adjustments"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 6,
            studyType: "MENTAL_GAME",
            title: "Mental Game - Decision Confidence",
            description: "Reflect on flop decisions: Do you second-guess yourself? Build confidence through data. Review week's top leaks and track improvements.",
            tools: ["Your App"],
            focusPoints: ["Build decision confidence", "Trust your ranges", "Track leak fixes"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 7,
            studyType: "LIGHT_REVIEW",
            title: "Light Review - Casual Study",
            description: "Light review of the week. Maybe watch a short poker content piece or review notes.",
            tools: ["Your App"],
            focusPoints: ["Consolidate learning", "Rest and reflect"],
            durationMinutes: 15,
          },
        ],
      },
      {
        weekNumber: 4,
        theme: "Flop Play OOP in SRP + Turn Basics",
        focusAreas: ["OOP c-bet defence", "Turn strategy", "Bet sizing OOP"],
        tasks: [
          {
            dayOfWeek: 1,
            studyType: "RANGE_TRAINING",
            title: "Range Training - OOP Play",
            description: "Preflop+ drills on OOP play in SRP. Focus on c-bet defence frequencies and turn strategy. Practice check-call, check-raise, and fold decisions.",
            tools: ["Preflop+"],
            focusPoints: ["OOP c-bet defence ranges", "Check-raise frequencies", "Turn continuation"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 2,
            studyType: "HAND_REVIEW",
            title: "Hand Review - OOP Spots",
            description: "Pull hands where you played OOP in SRP. Review c-bet defence, turn decisions, and overall line consistency. Use Postflopizer for validation.",
            tools: ["PokerCruncher", "Postflopizer"],
            focusPoints: ["OOP defence appropriateness", "Turn decision quality", "Avoid overfolding"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 3,
            studyType: "ICM",
            title: "ICM - Short Stack Decisions",
            description: "ICMizer: Study 6-10bb stove spots. Focus on push/fold ranges and understanding when to shove vs fold.",
            tools: ["ICMizer"],
            focusPoints: ["6-10bb push ranges", "Fold equity calculations", "Chip EV vs ICM"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 4,
            studyType: "EXPLOIT_LAB",
            title: "Exploit Lab - OOP Adjustments",
            description: "Build rules for OOP play vs different player types. Vs aggressive players: check-raise more. Vs passive: thin value bet on turns.",
            tools: ["Your Notes", "RYE"],
            focusPoints: ["Exploit aggressive c-bettors OOP", "Exploit passive players", "Adjust turn strategy"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 5,
            studyType: "DEEP_DIVE",
            title: "Deep Dive - Turn Strategy",
            description: "Study turn play in detail. Build Postflopizer sims for common turn scenarios. Extract bet sizing and frequency data.",
            tools: ["Postflopizer"],
            focusPoints: ["Turn bet sizing", "Check-raise frequencies", "Bluff vs value balance"],
            durationMinutes: 60,
          },
          {
            dayOfWeek: 6,
            studyType: "MENTAL_GAME",
            title: "Mental Game - Block 1 Review",
            description: "Review Block 1 progress. What improved? What still needs work? Write a comprehensive summary of your growth.",
            tools: ["Your App"],
            focusPoints: ["Consolidate Block 1 learning", "Identify remaining leaks", "Plan Block 2 focus"],
            durationMinutes: 45,
          },
          {
            dayOfWeek: 7,
            studyType: "LIGHT_REVIEW",
            title: "Light Review - Rest Week",
            description: "Light review and rest. Prepare mentally for Block 2.",
            tools: ["Your App"],
            focusPoints: ["Consolidate learning", "Mental preparation"],
            durationMinutes: 15,
          },
        ],
      },
    ],
  },
];
