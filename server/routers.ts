import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateWeekPlan, getTodayPlan } from "./studyPlan";
import { getCompletedPlanSlots } from "./studyPlanDb";
import { generateDailyFocus, generateStudyRecommendations, getSuggestedDeepDiveTopic, type LeakData } from "./studyRecommendations";
import { STUDY_CURRICULUM, getProgramWeekForDate, getTodayDrillsForProgram } from "./curriculumConfig";
import { icmRouter } from "./icm/router";
import { strategyRouter } from "./strategy/router";
import { getLeakFamily } from "../shared/leakFamilies";

// Hardcoded user ID for single-user app
const HARDCODED_USER_ID = 1;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // User profile
  profile: router({
    get: publicProcedure.query(async () => {
      return db.getUserProfile(HARDCODED_USER_ID);
    }),
    update: publicProcedure
      .input(z.object({
        timezone: z.string().optional(),
        goals: z.object({
          weeklyStudyHours: z.number().optional(),
          weeklySessions: z.number().optional(),
          weeklyTournaments: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: any = {};
        if (input.timezone) updates.timezone = input.timezone;
        if (input.goals) updates.goalsJson = JSON.stringify(input.goals);
        
        await db.updateUserProfile(HARDCODED_USER_ID, updates);
        return { success: true };
      }),
  }),

  // Weeks
  weeks: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input }) => {
        return db.getUserWeeks(HARDCODED_USER_ID, input?.limit);
      }),
    getCurrent: publicProcedure.query(async () => {
      return db.getCurrentWeek(HARDCODED_USER_ID, 'Australia/Sydney');
    }),
  }),

  // Study Sessions
  studySessions: router({
    create: publicProcedure
      .input(z.object({
        date: z.date(),
        type: z.enum(['RANGE_TRAINING', 'HAND_REVIEW', 'ICM', 'EXPLOIT_LAB', 'DEEP_DIVE', 'MENTAL_GAME', 'LIGHT_REVIEW']),
        durationMinutes: z.number(),
        resourceUsed: z.string().optional(),
        handsReviewedCount: z.number().default(0),
        drillsCompletedCount: z.number().default(0),
        accuracyPercent: z.number().optional(),
        keyTakeaways: z.string().optional(),
        fromPlan: z.boolean().default(false),
        planSlot: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const week = await db.getOrCreateWeekForDate(HARDCODED_USER_ID, input.date, 'Australia/Sydney');
        
        return db.createStudySession({
          userId: HARDCODED_USER_ID,
          weekId: week.id,
          date: input.date,
          type: input.type,
          durationMinutes: input.durationMinutes,
          resourceUsed: input.resourceUsed,
          handsReviewedCount: input.handsReviewedCount,
          drillsCompletedCount: input.drillsCompletedCount,
          accuracyPercent: input.accuracyPercent,
          keyTakeaways: input.keyTakeaways,
          fromPlan: input.fromPlan,
          planSlot: input.planSlot,
        });
      }),
    getByWeek: publicProcedure
      .input(z.object({ weekId: z.number() }))
      .query(async ({ input }) => {
        return db.getTournamentsByWeek(input.weekId);
      }),
  }),

  // Tournaments
  tournaments: router({
    create: publicProcedure
      .input(z.object({
        date: z.date(),
        venue: z.string().optional(),
        name: z.string().optional(),
        buyIn: z.number(),
        startingStack: z.number().optional(),
        fieldSize: z.number().optional(),
        reEntries: z.number().default(0),
        finalPosition: z.number().optional(),
        prize: z.number().default(0),
        stageReached: z.enum(['EARLY', 'MID', 'LATE', 'FT']).optional(),
        selfRating: z.number().optional(),
        mentalRating: z.number().optional(),
        notesOverall: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const week = await db.getOrCreateWeekForDate(HARDCODED_USER_ID, input.date, 'Australia/Sydney');
        
        const netResult = input.prize - (input.buyIn * (1 + input.reEntries));
        
        return db.createTournament({
          userId: HARDCODED_USER_ID,
          weekId: week.id,
          date: input.date,
          venue: input.venue,
          name: input.name,
          buyIn: input.buyIn,
          startingStack: input.startingStack,
          fieldSize: input.fieldSize,
          reEntries: input.reEntries,
          finalPosition: input.finalPosition,
          prize: input.prize,
          netResult,
          stageReached: input.stageReached,
          selfRating: input.selfRating,
          mentalRating: input.mentalRating,
          notesOverall: input.notesOverall,
        });
      }),
    getByWeek: publicProcedure
      .input(z.object({ weekId: z.number(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return db.getTournamentsByWeek(input.weekId);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTournamentById(input.id);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        buyIn: z.number().optional(),
        reEntries: z.number().optional(),
        startingStack: z.number().optional(),
        finalPosition: z.number().optional(),
        prize: z.number().optional(),
        venue: z.string().optional(),
        notesOverall: z.string().optional(),
        netResult: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        if (updates.buyIn !== undefined || updates.reEntries !== undefined || updates.prize !== undefined) {
          const tournament = await db.getTournamentById(id);
          if (tournament) {
            const buyIn = updates.buyIn ?? tournament.buyIn;
            const reEntries = updates.reEntries ?? tournament.reEntries;
            const prize = updates.prize ?? tournament.prize;
            updates.netResult = prize - (buyIn * (1 + reEntries));
          }
        }
        await db.updateTournament(id, updates);
        return db.getTournamentById(id);
      }),
  }),

  // Hands
  hands: router({
    create: publicProcedure
      .input(z.object({
        position: z.string().optional(),
        stackSize: z.number().optional(),
        streetDataJson: z.string().optional(),
        notes: z.string().optional(),
        tournamentId: z.number().optional(),
        heroPosition: z.string().optional(),
        heroHand: z.string().optional(),
        boardRunout: z.string().optional(),
        effectiveStackBb: z.number().optional(),
        spr: z.number().optional(),
        spotType: z.enum(['SINGLE_RAISED_POT', '3BET_POT', 'BVB', 'ICM_SPOT', 'LIMPED_POT', 'RFI', 'DEFEND_VS_RFI', 'THREE_BET', 'FACING_3BET', 'LIMP_ISO', 'FOUR_BET_JAM', 'OTHER_PREFLOP']).optional(),
        heroDecisionPreflop: z.string().optional(),
        heroDecisionFlop: z.string().optional(),
        heroDecisionTurn: z.string().optional(),
        heroDecisionRiver: z.string().optional(),
        reviewed: z.boolean().default(false),
        mistakeStreet: z.enum(['PREFLOP', 'FLOP', 'TURN', 'RIVER']).optional(),
        mistakeSeverity: z.number().default(0),
        tags: z.array(z.string()).optional(),
        lesson: z.string().optional(),
        leakIds: z.array(z.number()).optional(),
        leakFamilyId: z.string().optional(),
        // New structured fields
        heroCard1: z.string().optional(),
        heroCard2: z.string().optional(),
        handClass: z.string().optional(),
        exactSuitsKnown: z.boolean().optional(),
        actualStackBB: z.number().optional(),
        openerPosition: z.string().optional(),
        villainPosition: z.string().optional(),
        villainType: z.string().optional(),
        rangeRead: z.string().optional(),
        tournamentStage: z.string().optional(),
        preflopDecision: z.string().optional(),
        actionsJson: z.string().optional(),
        boardJson: z.string().optional(),
        confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        reviewStatus: z.enum(['DRAFT', 'NEEDS_REVIEW', 'REVIEWED']).optional(),
      }))
      .mutation(async ({ input }) => {
        // Auto-derive tags from structured fields
        const autoTags: string[] = input.tags ? [...input.tags] : [];
        if (input.spotType === 'DEFEND_VS_RFI' || input.spotType === 'FACING_3BET') autoTags.push('BB_DEFENCE');
        if (input.spotType === 'RFI') autoTags.push('RFI');
        if (input.spotType === 'THREE_BET') autoTags.push('3BET');
        if (input.spotType === 'FACING_3BET') autoTags.push('FACING_3BET');
        if (input.actualStackBB && input.actualStackBB <= 15) autoTags.push('SHORT_STACK');
        if (input.mistakeStreet === 'PREFLOP') autoTags.push('PREFLOP_MISTAKE');
        const uniqueTags = Array.from(new Set(autoTags));

        const hand = await db.createHand({
          userId: HARDCODED_USER_ID,
          tournamentId: input.tournamentId,
          heroPosition: input.position || input.heroPosition,
          heroHand: input.handClass || input.heroHand,
          boardRunout: input.boardRunout,
          effectiveStackBb: input.actualStackBB || input.effectiveStackBb,
          spr: input.spr,
          spotType: input.spotType as any,
          heroDecisionPreflop: input.preflopDecision || input.heroDecisionPreflop,
          heroDecisionFlop: input.heroDecisionFlop,
          heroDecisionTurn: input.heroDecisionTurn,
          heroDecisionRiver: input.heroDecisionRiver,
          reviewed: input.reviewed,
          mistakeStreet: input.mistakeStreet,
          mistakeSeverity: input.mistakeSeverity,
          tagsJson: uniqueTags.length > 0 ? JSON.stringify(uniqueTags) : undefined,
          lesson: input.lesson,
          streetDataJson: input.streetDataJson,
          // New fields
          heroCard1: input.heroCard1,
          heroCard2: input.heroCard2,
          handClass: input.handClass,
          exactSuitsKnown: input.exactSuitsKnown ?? false,
          actualStackBB: input.actualStackBB,
          openerPosition: input.openerPosition,
          villainPosition: input.villainPosition,
          villainType: input.villainType,
          rangeRead: input.rangeRead,
          tournamentStage: input.tournamentStage,
          preflopDecision: input.preflopDecision,
          actionsJson: input.actionsJson,
          boardJson: input.boardJson,
          leakFamilyId: input.leakFamilyId,
          confidence: input.confidence,
          reviewStatus: input.reviewStatus ?? 'NEEDS_REVIEW',
        });

        // Link leaks if provided
        if (input.leakIds && input.leakIds.length > 0) {
          for (const leakId of input.leakIds) {
            await db.linkHandToLeak(hand.id, leakId);
          }
        }

        if (input.leakFamilyId) {
          const family = getLeakFamily(input.leakFamilyId);
          if (family) {
            const existingLeaks = await db.getUserLeaks(HARDCODED_USER_ID);
            const existingLeak = existingLeaks.find(
              leak =>
                leak.name.trim().toLowerCase() ===
                family.label.trim().toLowerCase()
            );

            const leakRecord =
              existingLeak ??
              (await db.createLeak({
                userId: HARDCODED_USER_ID,
                name: family.label,
                category: "PREFLOP",
                description: family.description,
                status: "ACTIVE",
              }));

            const alreadyLinked = input.leakIds?.includes(leakRecord.id);
            if (!alreadyLinked) {
              await db.linkHandToLeak(hand.id, leakRecord.id);
            }
          }
        }

        return hand;
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        reviewed: z.boolean().optional(),
        mistakeStreet: z.enum(['PREFLOP', 'FLOP', 'TURN', 'RIVER']).optional(),
        mistakeSeverity: z.number().optional(),
        tags: z.array(z.string()).optional(),
        lesson: z.string().optional(),
        // Review metadata fields
        leakFamilyId: z.string().optional(),
        confidence: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        reviewStatus: z.enum(['DRAFT', 'NEEDS_REVIEW', 'REVIEWED']).optional(),
        villainType: z.string().optional(),
        rangeRead: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: Record<string, unknown> = {};
        if (input.reviewed !== undefined) updates.reviewed = input.reviewed;
        if (input.mistakeStreet !== undefined) updates.mistakeStreet = input.mistakeStreet;
        if (input.mistakeSeverity !== undefined) updates.mistakeSeverity = input.mistakeSeverity;
        if (input.tags !== undefined) updates.tagsJson = JSON.stringify(input.tags);
        if (input.lesson !== undefined) updates.lesson = input.lesson;
        if (input.leakFamilyId !== undefined) updates.leakFamilyId = input.leakFamilyId || null;
        if (input.confidence !== undefined) updates.confidence = input.confidence;
        if (input.reviewStatus !== undefined) updates.reviewStatus = input.reviewStatus;
        if (input.villainType !== undefined) updates.villainType = input.villainType;
        if (input.rangeRead !== undefined) updates.rangeRead = input.rangeRead;
        // Sync reviewed flag with reviewStatus
        if (input.reviewStatus === 'REVIEWED') updates.reviewed = true;
        return db.updateHand(input.id, updates as any);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getHandById(input.id);
      }),
    getByUser: publicProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getHandsByUser(HARDCODED_USER_ID, input.limit);
      }),
    getLeaks: publicProcedure
      .input(z.object({ handId: z.number() }))
      .query(async ({ input }) => {
        return db.getLeaksForHand(input.handId);
      }),
    linkLeak: publicProcedure
      .input(z.object({ handId: z.number(), leakId: z.number() }))
      .mutation(async ({ input }) => {
        return db.linkHandToLeak(input.handId, input.leakId);
      }),
    unlinkLeak: publicProcedure
      .input(z.object({ handId: z.number(), leakId: z.number() }))
      .mutation(async ({ input }) => {
        return db.unlinkHandFromLeak(input.handId, input.leakId);
      }),
    getByTournament: publicProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return db.getHandsByTournament(input.tournamentId);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deleteHand(input.id);
      }),
  }),

  // Leaks
  leaks: router({
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(['PREFLOP', 'POSTFLOP', 'ICM', 'MENTAL', 'EXPLOIT']),
        description: z.string().optional(),
        status: z.enum(['ACTIVE', 'IMPROVING', 'FIXED']).default('ACTIVE'),
      }))
      .mutation(async ({ input }) => {
        return db.createLeak({
          userId: HARDCODED_USER_ID,
          name: input.name,
          category: input.category,
          description: input.description,
          status: input.status,
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.enum(['PREFLOP', 'POSTFLOP', 'ICM', 'MENTAL', 'EXPLOIT']).optional(),
        description: z.string().optional(),
        status: z.enum(['ACTIVE', 'IMPROVING', 'FIXED']).optional(),
      }))
      .mutation(async ({ input }) => {
        return db.updateLeak(input.id, {
          name: input.name,
          category: input.category,
          description: input.description,
          status: input.status,
        });
      }),
    list: publicProcedure.query(async () => {
      return db.getUserLeaks(HARDCODED_USER_ID);
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLeakById(input.id);
      }),
    getLinkedHands: publicProcedure
      .input(z.object({ leakId: z.number() }))
      .query(async ({ input }) => {
        return db.getHandsForLeak(input.leakId);
      }),
    getTop: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        return db.getTopLeaks(HARDCODED_USER_ID, input.limit);
      }),
  }),

  // Study Plan
  studyPlan: router({
    getDailyFocus: publicProcedure.query(async () => {
      // Get top leaks from current week
      const topLeaks = await db.getTopLeaks(HARDCODED_USER_ID, 5);
      
      // Transform to LeakData format
      const leakData: LeakData[] = topLeaks.map(leak => ({
        id: leak.id,
        name: leak.name,
        category: leak.category,
        handsLinkedCount: leak.handCount,
      }));
      
      // Generate daily focus
      const dailyFocus = generateDailyFocus(leakData);
      
      // Get suggested deep dive topic
      const suggestedTopic = getSuggestedDeepDiveTopic(leakData);
      
      return {
        ...dailyFocus,
        suggestedDeepDiveTopic: suggestedTopic,
      };
    }),
    getWeek: publicProcedure
      .input(z.object({ date: z.date().optional() }))
      .query(async ({ input }) => {
        const targetDate = input.date || new Date();
        
        // Get week boundaries
        const dayOfWeek = targetDate.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(targetDate);
        monday.setDate(monday.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        
        // Get completed slots for this week
        const completedSlots = await getCompletedPlanSlots(HARDCODED_USER_ID, monday, sunday);
        
        // Generate week plan
        const weekPlan = generateWeekPlan(targetDate, completedSlots);
        
        return {
          startDate: monday,
          endDate: sunday,
          days: weekPlan,
        };
      }),
    getToday: publicProcedure.query(async () => {
      const today = new Date();
      
      // Get week boundaries
      const dayOfWeek = today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(monday.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      // Get completed slots for this week
      const completedSlots = await getCompletedPlanSlots(HARDCODED_USER_ID, monday, sunday);
      
      // Get today's plan
      const todayPlan = getTodayPlan(today, completedSlots);
      
      return todayPlan;
    }),
    // 12-week curriculum endpoints
    getCurriculumWeek: publicProcedure
      .input(z.object({ date: z.date().optional() }))
      .query(({ input }) => {
        const targetDate = input.date || new Date();
        const programStartDate = new Date(2025, 0, 1);
        const week = getProgramWeekForDate(targetDate, programStartDate);
        return week || null;
      }),
    getCurriculumToday: publicProcedure.query(() => {
      const today = new Date();
      const programStartDate = new Date(2025, 0, 1);
      const drills = getTodayDrillsForProgram(today, programStartDate);
      return drills || null;
    }),
    getCurriculumBlock: publicProcedure
      .input(z.object({ blockNumber: z.number().min(1).max(3) }))
      .query(({ input }) => {
        const block = STUDY_CURRICULUM.find(b => b.blockNumber === input.blockNumber);
        return block || null;
      }),
    getAllCurriculum: publicProcedure.query(() => {
      return STUDY_CURRICULUM;
    }),
  }),

  // Strategy module
  strategy: strategyRouter,

  // ICM study packs
  icm: icmRouter,

  // Dashboard
  dashboard: router({
    getStats: publicProcedure
      .input(z.object({ weekId: z.number() }))
      .query(async ({ input }) => {
        return db.getDashboardStats(HARDCODED_USER_ID, input.weekId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
