import { expandedWeeks } from "./curriculumWeeks5-12";

/*
 * 12-Week Poker MTT Study Curriculumm
 * 
 * Structure:
 * - 3 blocks of 4 weeks each
 * - Each week has 7 days (Mon-Sun) with specific study types
 * - Each day contains multiple drills with tools, reps, and success metrics
 * - Config-driven, no database tables - keeps it simple and maintainable
 */

export type StudyType =
  | "RANGE_TRAINING"
  | "HAND_REVIEW"
  | "ICM"
  | "EXPLOIT_LAB"
  | "DEEP_DIVE"
  | "MENTAL_GAME"
  | "LIGHT_REVIEW";

export interface Drill {
  drillId: string;
  title: string;
  primaryTool: string;
  tools?: string[];
  reps?: string;
  instructions: string;
  successMetric?: string;
}

export interface StudyProgramDay {
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Monday, 7=Sunday
  planSlot: string;
  studyType: StudyType;
  focusTitle: string;
  focusDescription: string;
  drills: Drill[];
}

export interface StudyProgramWeek {
  weekIndex: number; // 0-11
  weekNumber: number; // 1-12
  themeCode: string;
  themeTitle: string;
  themeDescription: string;
  days: StudyProgramDay[];
}

export interface StudyProgramBlock {
  blockNumber: 1 | 2 | 3;
  title: string;
  goal: string;
  weeks: StudyProgramWeek[];
}

export const STUDY_CURRICULUM: StudyProgramBlock[] = [
  {
    blockNumber: 1,
    title: "Block 1: Preflop & Single-Raised Pots",
    goal: "Master opening ranges, BB defence, and SRP fundamentals at 40-30bb",
    weeks: [
      // WEEK 1: BTN/CO vs Blinds Fundamentals
      {
        weekIndex: 0,
        weekNumber: 1,
        themeCode: "BTN_CO_SRP",
        themeTitle: "BTN/CO vs Blinds Fundamentals",
        themeDescription:
          "Focus on opening ranges from late position and BB defence at 40–30bb.",
        days: [
          {
            dayOfWeek: 1,
            planSlot: "DAY1_RANGE",
            studyType: "RANGE_TRAINING",
            focusTitle: "BTN & CO Opening Ranges vs Blinds (40–30bb)",
            focusDescription:
              "Master late-position opening ranges and understand which hands to open.",
            drills: [
              {
                drillId: "W1D1_BTN_OPENS",
                title: "BTN Opening Ranges – 40bb",
                primaryTool: "Preflop+",
                tools: ["Preflop+", "Upswing MTT Masterclass"],
                reps: "50 hands",
                instructions:
                  "BTN open trainer @40bb in Preflop+. After each mistake, check Upswing BTN range. Note which categories you under-open.",
                successMetric: "Aim for 85%+ accuracy",
              },
              {
                drillId: "W1D1_CO_OPENS",
                title: "CO Opening Ranges – 40bb",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "40 hands",
                instructions: "CO open trainer @40bb. Focus on tight, profitable ranges.",
                successMetric: "80%+ accuracy",
              },
              {
                drillId: "W1D1_BB_DEF_LP",
                title: "BB Defence vs BTN/CO – 40bb",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "40 hands",
                instructions:
                  "Use BB vs BTN and BB vs CO defence trainer; focus on suited connectors/broadways and not overfolding.",
                successMetric: "Minimize mistakes on calling/folding decisions",
              },
            ],
          },
          {
            dayOfWeek: 2,
            planSlot: "DAY2_HAND_REVIEW",
            studyType: "HAND_REVIEW",
            focusTitle: "BTN/CO SRP as Aggressor",
            focusDescription:
              "Review tournament hands where you played BTN/CO in single-raised pots.",
            drills: [
              {
                drillId: "W1D2_HAND_REVIEW",
                title: "Review 5 BTN/CO SRP Hands",
                primaryTool: "Postflopizer",
                tools: ["App hands", "Postflopizer", "PokerCruncher"],
                reps: "5 hands",
                instructions:
                  "Review 5 hands from last tournament where hero was BTN/CO in SRP vs BB. For 3 of them: build a flop sim in Postflopizer (simple 2-street tree). Compare solver strategy vs your action. Tag leaks (OVER_CBET_IP, UNDER_CBET_IP, BAD_FLOP_SIZE).",
                successMetric: "Identify 2+ strategic mistakes",
              },
            ],
          },
          {
            dayOfWeek: 3,
            planSlot: "DAY3_ICM",
            studyType: "ICM",
            focusTitle: "Early ICM Habits – SB/BTN Shoves",
            focusDescription:
              "Study shove/call spots at 10-15bb with focus on SB and BTN.",
            drills: [
              {
                drillId: "W1D3_ICM_SHOVES",
                title: "SB/BTN Shove Spots at 10-15bb",
                primaryTool: "ICMizer",
                tools: ["ICMizer"],
                reps: "25 hands",
                instructions:
                  "15 hands: SB vs BB shove/call spots at 10–15bb on near-bubble stacks. 10 hands: BTN shove vs blinds at 10–15bb. Log surprising spots in notes.",
                successMetric: "Understand 80%+ of shove ranges",
              },
            ],
          },
          {
            dayOfWeek: 4,
            planSlot: "DAY4_EXPLOIT",
            studyType: "EXPLOIT_LAB",
            focusTitle: "Population Tendencies vs LP Open",
            focusDescription:
              "Identify live field leaks and develop specific exploit rules.",
            drills: [
              {
                drillId: "W1D4_EXPLOIT",
                title: "Identify 3 Live Field Leaks",
                primaryTool: "Hand2Note",
                tools: ["Hand2Note", "RaiseYourEdge videos"],
                reps: "3 leaks",
                instructions:
                  "Identify 3 live population leaks in your usual field related to BTN/CO. For each leak, define 1 exploit rule (e.g. 'Vs recs who overfold BB, add 10–15% more opens and c-bet more flops small.').",
                successMetric: "Write 3 clear exploit rules",
              },
            ],
          },
          {
            dayOfWeek: 5,
            planSlot: "DAY5_DEEP_DIVE",
            studyType: "DEEP_DIVE",
            focusTitle: "C-bet Frequency IP (BTN vs BB SRP)",
            focusDescription:
              "Deep study on flop c-betting strategy in position.",
            drills: [
              {
                drillId: "W1D5_CBET_IP",
                title: "C-bet Frequency Study + Sims",
                primaryTool: "Postflopizer",
                tools: ["Upswing MTT Masterclass", "Postflopizer"],
                reps: "20-30 mins + 3 sims",
                instructions:
                  "20–30 mins Upswing module(s) about flop c-betting IP. Then 3 Postflopizer flop sims: A-high dry board, low disconnected board, paired board. Extract 3 'rules' and write them in notes.",
                successMetric: "Extract 3 actionable c-betting rules",
              },
            ],
          },
          {
            dayOfWeek: 6,
            planSlot: "DAY6_MENTAL",
            studyType: "MENTAL_GAME",
            focusTitle: "Fear/Laziness with LP Aggression",
            focusDescription:
              "Mental game work on overcoming hesitation in aggressive spots.",
            drills: [
              {
                drillId: "W1D6_MENTAL",
                title: "Fear & Aggression Script",
                primaryTool: "Tendler",
                tools: ["Jared Tendler book", "Notes"],
                reps: "2 hands + 1 section",
                instructions:
                  "From last week's tournaments, write 2 hands where fear/laziness made you choose check/fold instead of a good bet. Read 1 Tendler section on fear or procrastination. Write a new mental script: 'When I feel X, I do Y instead.'",
                successMetric: "Create 1 actionable mental script",
              },
            ],
          },
          {
            dayOfWeek: 7,
            planSlot: "DAY7_LIGHT_REVIEW",
            studyType: "LIGHT_REVIEW",
            focusTitle: "Light BTN/CO Review",
            focusDescription: "Relaxed review of the week's content.",
            drills: [
              {
                drillId: "W1D7_LIGHT",
                title: "Relaxed BTN/CO Drilling + Reading",
                primaryTool: "Preflop+",
                tools: ["Preflop+", "YouTube", "Poker books"],
                reps: "10-15 mins",
                instructions:
                  "10–15 mins relaxed Preflop+ drills on BTN/CO. Light content: 1 short video or a few pages of a book. Optional: quick scroll through this week's study sessions and leaks.",
                successMetric: "Enjoy the content, no pressure",
              },
            ],
          },
        ],
      },

      // WEEK 2: EP/MP Opens & BB vs EP
      {
        weekIndex: 1,
        weekNumber: 2,
        themeCode: "EP_MP_DEFENSE",
        themeTitle: "EP/MP Opens & BB vs EP",
        themeDescription:
          "Tighten EP/MP opening ranges, disciplined BB defence vs strong ranges.",
        days: [
          {
            dayOfWeek: 1,
            planSlot: "DAY1_RANGE",
            studyType: "RANGE_TRAINING",
            focusTitle: "UTG/HJ Opening Ranges & BB Defence",
            focusDescription:
              "Master tight opening ranges from early position.",
            drills: [
              {
                drillId: "W2D1_EP_OPENS",
                title: "UTG/HJ Opening Ranges – 40bb",
                primaryTool: "Preflop+",
                tools: ["Preflop+", "Upswing MTT Masterclass"],
                reps: "60 hands",
                instructions:
                  "UTG/HJ open trainer @40bb. Focus on tight, strong ranges. After mistakes, review Upswing EP ranges.",
                successMetric: "85%+ accuracy",
              },
              {
                drillId: "W2D1_BB_VS_EP",
                title: "BB vs UTG/HJ – 40bb",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "50 hands",
                instructions:
                  "BB defence vs strong EP opens. Focus on not overfolding premium hands.",
                successMetric: "80%+ accuracy",
              },
            ],
          },
          {
            dayOfWeek: 2,
            planSlot: "DAY2_HAND_REVIEW",
            studyType: "HAND_REVIEW",
            focusTitle: "Hands vs EP Opens",
            focusDescription:
              "Review tournament hands where you faced EP opens.",
            drills: [
              {
                drillId: "W2D2_HAND_REVIEW",
                title: "Review 5 Hands vs EP",
                primaryTool: "Postflopizer",
                tools: ["App hands", "Postflopizer"],
                reps: "5 hands",
                instructions:
                  "Review 5 hands vs EP opens. Run 2–3 in Postflopizer. Tag leaks (OVERFOLD_VS_EP, CALL_TOO_WIDE_VS_EP).",
                successMetric: "Identify 2+ leaks",
              },
            ],
          },
          {
            dayOfWeek: 3,
            planSlot: "DAY3_ICM",
            studyType: "ICM",
            focusTitle: "3-bet Shove Spots vs EP",
            focusDescription:
              "Study 3-bet shove spots from blinds vs strong EP ranges.",
            drills: [
              {
                drillId: "W2D3_ICM_3BET",
                title: "3-bet Shove Spots at 15-20bb",
                primaryTool: "ICMizer",
                tools: ["ICMizer"],
                reps: "20 hands",
                instructions:
                  "ICMZ 3-bet shove spots from blinds vs EP at 15–20bb. Focus on understanding when to 3-bet vs tight opens.",
                successMetric: "Understand 80%+ of 3-bet ranges",
              },
            ],
          },
          {
            dayOfWeek: 4,
            planSlot: "DAY4_EXPLOIT",
            studyType: "EXPLOIT_LAB",
            focusTitle: "Strong EP Ranges & Exploits",
            focusDescription:
              "Learn to exploit tight EP players.",
            drills: [
              {
                drillId: "W2D4_EXPLOIT",
                title: "EP Exploit Rules",
                primaryTool: "RaiseYourEdge",
                tools: ["RaiseYourEdge videos", "Notes"],
                reps: "3 rules",
                instructions:
                  "RYE concepts about strong EP ranges. Rules like 'do not bluff 3-bet vs nitty EP; almost never hero vs 4-bet'. Write 3 exploit rules.",
                successMetric: "Create 3 clear exploit rules",
              },
            ],
          },
          {
            dayOfWeek: 5,
            planSlot: "DAY5_DEEP_DIVE",
            studyType: "DEEP_DIVE",
            focusTitle: "EP vs BB SRP Strategy",
            focusDescription:
              "Deep study on post-flop play in EP vs BB single-raised pots.",
            drills: [
              {
                drillId: "W2D5_EP_SRP",
                title: "EP vs BB SRP Deep Dive",
                primaryTool: "Postflopizer",
                tools: ["Upswing MTT Masterclass", "Postflopizer"],
                reps: "20-30 mins + 3 sims",
                instructions:
                  "Upswing + Postflopizer on EP vs BB SRP (board-specific aggression). Run 3 sims on different board textures.",
                successMetric: "Extract 3 strategic principles",
              },
            ],
          },
          {
            dayOfWeek: 6,
            planSlot: "DAY6_MENTAL",
            studyType: "MENTAL_GAME",
            focusTitle: "Over-respecting Strong Ranges",
            focusDescription:
              "Mental game on not folding too much vs strong players.",
            drills: [
              {
                drillId: "W2D6_MENTAL",
                title: "Confidence vs Strong Players",
                primaryTool: "Tendler",
                tools: ["Jared Tendler book", "Notes"],
                reps: "2 hands + reflection",
                instructions:
                  "Write 2 hands where you over-folded vs a strong EP player. Read 1 Tendler section on confidence. Write a script for maintaining composure.",
                successMetric: "Create 1 confidence script",
              },
            ],
          },
          {
            dayOfWeek: 7,
            planSlot: "DAY7_LIGHT_REVIEW",
            studyType: "LIGHT_REVIEW",
            focusTitle: "Light EP Review",
            focusDescription: "Relaxed review of the week.",
            drills: [
              {
                drillId: "W2D7_LIGHT",
                title: "Relaxed EP Drilling",
                primaryTool: "Preflop+",
                tools: ["Preflop+", "YouTube"],
                reps: "10-15 mins",
                instructions:
                  "10–15 mins relaxed Preflop+ drills on EP. Light video or reading.",
                successMetric: "Enjoy the content",
              },
            ],
          },
        ],
      },

      // WEEK 3 & 4 outlines (to be expanded)
      {
        weekIndex: 2,
        weekNumber: 3,
        themeCode: "FLOP_IP_SRP",
        themeTitle: "Flop Play IP in SRP (BTN/CO vs BB)",
        themeDescription:
          "Master flop strategy when in position in single-raised pots.",
        days: [
          {
            dayOfWeek: 1,
            planSlot: "DAY1_RANGE",
            studyType: "RANGE_TRAINING",
            focusTitle: "Flop C-bet Ranges IP",
            focusDescription: "Study when and how to c-bet from position.",
            drills: [
              {
                drillId: "W3D1_CBET",
                title: "C-bet Trainer – Multiple Textures",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "50 hands",
                instructions:
                  "Flop c-bet trainer in Preflop+. Focus on different board textures (dry, connected, paired).",
                successMetric: "80%+ accuracy",
              },
            ],
          },
          {
            dayOfWeek: 2,
            planSlot: "DAY2_HAND_REVIEW",
            studyType: "HAND_REVIEW",
            focusTitle: "Flop Play Review",
            focusDescription: "Review flop decisions from tournaments.",
            drills: [
              {
                drillId: "W3D2_FLOP_REVIEW",
                title: "Review Flop Decisions",
                primaryTool: "Postflopizer",
                tools: ["App hands", "Postflopizer"],
                reps: "5 hands",
                instructions:
                  "Review 5 flop decisions. Run 3 in Postflopizer sims.",
                successMetric: "Identify flop leaks",
              },
            ],
          },
          {
            dayOfWeek: 3,
            planSlot: "DAY3_ICM",
            studyType: "ICM",
            focusTitle: "Mid-Stack ICM",
            focusDescription: "Study ICM at 20-30bb stacks.",
            drills: [
              {
                drillId: "W3D3_ICM_MID",
                title: "Mid-Stack Shove Spots",
                primaryTool: "ICMizer",
                tools: ["ICMizer"],
                reps: "20 hands",
                instructions:
                  "ICMZ mid-stack (20-30bb) shove/fold spots.",
                successMetric: "Understand 80%+ of ranges",
              },
            ],
          },
          {
            dayOfWeek: 4,
            planSlot: "DAY4_EXPLOIT",
            studyType: "EXPLOIT_LAB",
            focusTitle: "Exploiting Flop Tendencies",
            focusDescription: "Develop exploits for common flop mistakes.",
            drills: [
              {
                drillId: "W3D4_EXPLOIT",
                title: "Flop Exploit Rules",
                primaryTool: "Hand2Note",
                tools: ["Hand2Note"],
                reps: "3 rules",
                instructions:
                  "Identify 3 flop exploits vs your regular opponents.",
                successMetric: "Write 3 exploit rules",
              },
            ],
          },
          {
            dayOfWeek: 5,
            planSlot: "DAY5_DEEP_DIVE",
            studyType: "DEEP_DIVE",
            focusTitle: "Turn Play IP",
            focusDescription: "Deep study on turn strategy in position.",
            drills: [
              {
                drillId: "W3D5_TURN",
                title: "Turn Play Deep Dive",
                primaryTool: "Postflopizer",
                tools: ["Upswing MTT Masterclass", "Postflopizer"],
                reps: "20-30 mins + 3 sims",
                instructions:
                  "Study turn play in position. Run 3 Postflopizer sims.",
                successMetric: "Extract 3 turn principles",
              },
            ],
          },
          {
            dayOfWeek: 6,
            planSlot: "DAY6_MENTAL",
            studyType: "MENTAL_GAME",
            focusTitle: "Patience in Position",
            focusDescription: "Mental game on playing patiently when in position.",
            drills: [
              {
                drillId: "W3D6_MENTAL",
                title: "Patience Script",
                primaryTool: "Tendler",
                tools: ["Jared Tendler book"],
                reps: "reflection",
                instructions:
                  "Write 2 hands where impatience cost you. Create a patience script.",
                successMetric: "Create 1 patience script",
              },
            ],
          },
          {
            dayOfWeek: 7,
            planSlot: "DAY7_LIGHT_REVIEW",
            studyType: "LIGHT_REVIEW",
            focusTitle: "Light Flop Review",
            focusDescription: "Relaxed review of the week.",
            drills: [
              {
                drillId: "W3D7_LIGHT",
                title: "Relaxed Flop Drilling",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "10-15 mins",
                instructions: "Light Preflop+ drilling.",
                successMetric: "Enjoy the content",
              },
            ],
          },
        ],
      },

      {
        weekIndex: 3,
        weekNumber: 4,
        themeCode: "FLOP_OOP_TURN",
        themeTitle: "Flop Play OOP + Basic Turn Play",
        themeDescription:
          "Master out-of-position flop strategy and introduction to turn play.",
        days: [
          {
            dayOfWeek: 1,
            planSlot: "DAY1_RANGE",
            studyType: "RANGE_TRAINING",
            focusTitle: "Check-Raise Ranges OOP",
            focusDescription: "Study check-raise strategy out of position.",
            drills: [
              {
                drillId: "W4D1_CHECK_RAISE",
                title: "Check-Raise Trainer",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "40 hands",
                instructions:
                  "Check-raise trainer OOP. Focus on balance and frequency.",
                successMetric: "80%+ accuracy",
              },
            ],
          },
          {
            dayOfWeek: 2,
            planSlot: "DAY2_HAND_REVIEW",
            studyType: "HAND_REVIEW",
            focusTitle: "OOP Check-Raise Hands",
            focusDescription: "Review check-raise decisions from tournaments.",
            drills: [
              {
                drillId: "W4D2_REVIEW",
                title: "Review Check-Raise Hands",
                primaryTool: "Postflopizer",
                tools: ["App hands", "Postflopizer"],
                reps: "5 hands",
                instructions:
                  "Review 5 check-raise hands. Run 3 in Postflopizer.",
                successMetric: "Identify OOP leaks",
              },
            ],
          },
          {
            dayOfWeek: 3,
            planSlot: "DAY3_ICM",
            studyType: "ICM",
            focusTitle: "Short-Stack ICM",
            focusDescription: "Study ICM at 10-15bb stacks.",
            drills: [
              {
                drillId: "W4D3_ICM_SHORT",
                title: "Short-Stack Shove Spots",
                primaryTool: "ICMizer",
                tools: ["ICMizer"],
                reps: "25 hands",
                instructions:
                  "ICMZ short-stack (10-15bb) shove/fold spots.",
                successMetric: "Understand 85%+ of ranges",
              },
            ],
          },
          {
            dayOfWeek: 4,
            planSlot: "DAY4_EXPLOIT",
            studyType: "EXPLOIT_LAB",
            focusTitle: "Exploiting OOP Tendencies",
            focusDescription: "Develop exploits for OOP mistakes.",
            drills: [
              {
                drillId: "W4D4_EXPLOIT",
                title: "OOP Exploit Rules",
                primaryTool: "Hand2Note",
                tools: ["Hand2Note"],
                reps: "3 rules",
                instructions:
                  "Identify 3 OOP exploits vs your opponents.",
                successMetric: "Write 3 exploit rules",
              },
            ],
          },
          {
            dayOfWeek: 5,
            planSlot: "DAY5_DEEP_DIVE",
            studyType: "DEEP_DIVE",
            focusTitle: "River Play Fundamentals",
            focusDescription: "Introduction to river strategy.",
            drills: [
              {
                drillId: "W4D5_RIVER",
                title: "River Play Intro",
                primaryTool: "Postflopizer",
                tools: ["Upswing MTT Masterclass", "Postflopizer"],
                reps: "20-30 mins + 3 sims",
                instructions:
                  "Study river value/bluff fundamentals. Run 3 Postflopizer sims.",
                successMetric: "Extract 3 river principles",
              },
            ],
          },
          {
            dayOfWeek: 6,
            planSlot: "DAY6_MENTAL",
            studyType: "MENTAL_GAME",
            focusTitle: "Confidence OOP",
            focusDescription: "Mental game on playing confidently out of position.",
            drills: [
              {
                drillId: "W4D6_MENTAL",
                title: "OOP Confidence Script",
                primaryTool: "Tendler",
                tools: ["Jared Tendler book"],
                reps: "reflection",
                instructions:
                  "Write 2 hands where lack of confidence hurt OOP. Create a confidence script.",
                successMetric: "Create 1 OOP confidence script",
              },
            ],
          },
          {
            dayOfWeek: 7,
            planSlot: "DAY7_LIGHT_REVIEW",
            studyType: "LIGHT_REVIEW",
            focusTitle: "Light OOP Review",
            focusDescription: "Relaxed review of Block 1.",
            drills: [
              {
                drillId: "W4D7_LIGHT",
                title: "Relaxed OOP Drilling",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "10-15 mins",
                instructions:
                  "Light drilling. Reflect on Block 1 progress.",
                successMetric: "Enjoy the content",
              },
            ],
          },
        ],
      },
    ],
  },

  // BLOCK 2 & 3 placeholders (to be expanded)
  {
    blockNumber: 2,
    title: "Block 2: 3-Bet Pots & Aggression",
    goal: "Master 3-bet pot dynamics and aggressive play",
    weeks: [
      {
        weekIndex: 4,
        weekNumber: 5,
        themeCode: "3BET_IP",
        themeTitle: "3-Bet Pots IP (Hero as 3-bettor)",
        themeDescription: "Master in-position play as the 3-bettor.",
        days: [
          {
            dayOfWeek: 1,
            planSlot: "DAY1_RANGE",
            studyType: "RANGE_TRAINING",
            focusTitle: "3-bet Ranges IP",
            focusDescription: "Study 3-bet ranges from position.",
            drills: [
              {
                drillId: "W5D1_3BET",
                title: "3-bet Trainer IP",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "50 hands",
                instructions:
                  "3-bet trainer IP. Focus on balance and frequency.",
                successMetric: "85%+ accuracy",
              },
            ],
          },
          {
            dayOfWeek: 2,
            planSlot: "DAY2_HAND_REVIEW",
            studyType: "HAND_REVIEW",
            focusTitle: "3-Bet Pot Hands",
            focusDescription: "Review 3-bet pot hands from tournaments.",
            drills: [
              {
                drillId: "W5D2_REVIEW",
                title: "Review 3-Bet Pots",
                primaryTool: "Postflopizer",
                tools: ["App hands", "Postflopizer"],
                reps: "5 hands",
                instructions:
                  "Review 5 3-bet pot hands. Run 3 in Postflopizer.",
                successMetric: "Identify 3-bet leaks",
              },
            ],
          },
          {
            dayOfWeek: 3,
            planSlot: "DAY3_ICM",
            studyType: "ICM",
            focusTitle: "3-Bet Shove Spots",
            focusDescription: "Study 3-bet shove spots.",
            drills: [
              {
                drillId: "W5D3_ICM_3BET",
                title: "3-Bet Shove Spots",
                primaryTool: "ICMizer",
                tools: ["ICMizer"],
                reps: "20 hands",
                instructions:
                  "ICMZ 3-bet shove spots at various stack depths.",
                successMetric: "Understand 80%+ of ranges",
              },
            ],
          },
          {
            dayOfWeek: 4,
            planSlot: "DAY4_EXPLOIT",
            studyType: "EXPLOIT_LAB",
            focusTitle: "3-Bet Pot Exploits",
            focusDescription: "Develop exploits for 3-bet pot mistakes.",
            drills: [
              {
                drillId: "W5D4_EXPLOIT",
                title: "3-Bet Exploit Rules",
                primaryTool: "Hand2Note",
                tools: ["Hand2Note"],
                reps: "3 rules",
                instructions:
                  "Identify 3 3-bet pot exploits.",
                successMetric: "Write 3 exploit rules",
              },
            ],
          },
          {
            dayOfWeek: 5,
            planSlot: "DAY5_DEEP_DIVE",
            studyType: "DEEP_DIVE",
            focusTitle: "3-Bet Pot Flop Strategy",
            focusDescription: "Deep study on 3-bet pot flop play.",
            drills: [
              {
                drillId: "W5D5_3BET_FLOP",
                title: "3-Bet Pot Flop Deep Dive",
                primaryTool: "Postflopizer",
                tools: ["Upswing MTT Masterclass", "Postflopizer"],
                reps: "20-30 mins + 3 sims",
                instructions:
                  "Study 3-bet pot flop strategy. Run 3 Postflopizer sims.",
                successMetric: "Extract 3 flop principles",
              },
            ],
          },
          {
            dayOfWeek: 6,
            planSlot: "DAY6_MENTAL",
            studyType: "MENTAL_GAME",
            focusTitle: "Aggression Confidence",
            focusDescription: "Mental game on playing aggressively.",
            drills: [
              {
                drillId: "W5D6_MENTAL",
                title: "Aggression Script",
                primaryTool: "Tendler",
                tools: ["Jared Tendler book"],
                reps: "reflection",
                instructions:
                  "Write 2 hands where you played too passively. Create an aggression script.",
                successMetric: "Create 1 aggression script",
              },
            ],
          },
          {
            dayOfWeek: 7,
            planSlot: "DAY7_LIGHT_REVIEW",
            studyType: "LIGHT_REVIEW",
            focusTitle: "Light 3-Bet Review",
            focusDescription: "Relaxed review of the week.",
            drills: [
              {
                drillId: "W5D7_LIGHT",
                title: "Relaxed 3-Bet Drilling",
                primaryTool: "Preflop+",
                tools: ["Preflop+"],
                reps: "10-15 mins",
                instructions: "Light drilling.",
                successMetric: "Enjoy the content",
              },
            ],
          },
        ],
      },
      // Weeks 5-8 with full details from expandedWeeks
      expandedWeeks[0], // Week 5: 3-Bet Pots IP
      expandedWeeks[1], // Week 6: 3-Bet Pots OOP
      expandedWeeks[2], // Week 7: Turn Barreling
      expandedWeeks[3], // Week 8: River Value/Bluff
    ],
  },

  {
    blockNumber: 3,
    title: "Block 3: ICM, Endgame & Live Exploits",
    goal: "Master bubble play, final table strategy, and live field exploits",
    weeks: [
      expandedWeeks[4], // Week 9: Bubble ICM
      expandedWeeks[5], // Week 10: Final Table
      expandedWeeks[6], // Week 11: Live Exploits
      expandedWeeks[7], // Week 12: Consolidation
    ],
  },
];

/**
 * Cycle Logic: Map calendar week to program week
 * 12-week repeating cycle
 */
export function getProgramWeekForDate(date: Date, studyProgramStartDate: Date): StudyProgramWeek | null {
  const daysDiff = Math.floor((date.getTime() - studyProgramStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksDiff = Math.floor(daysDiff / 7);
  const cycleWeekIndex = weeksDiff % 12; // 12-week cycle

  for (const block of STUDY_CURRICULUM) {
    for (const week of block.weeks) {
      if (week.weekIndex === cycleWeekIndex) {
        return week;
      }
    }
  }

  return null;
}

/**
 * Get today's drill details
 */
export function getTodayDrillsForProgram(
  date: Date,
  studyProgramStartDate: Date
): StudyProgramDay | null {
  const week = getProgramWeekForDate(date, studyProgramStartDate);
  if (!week) return null;

  const dayOfWeek = date.getDay();
  const programDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday (0) to 7

  const day = week.days.find((d) => d.dayOfWeek === programDayOfWeek);
  return day || null;
}
