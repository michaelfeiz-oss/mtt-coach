import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserProfile(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        timezone: z.string().optional(),
        goals: z.object({
          weeklyStudyHours: z.number().optional(),
          weeklySessions: z.number().optional(),
          weeklyTournaments: z.number().optional(),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updates: any = {};
        if (input.timezone) updates.timezone = input.timezone;
        if (input.goals) updates.goalsJson = JSON.stringify(input.goals);
        
        await db.updateUserProfile(ctx.user.id, updates);
        return { success: true };
      }),
  }),

  // Weeks
  weeks: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserWeeks(ctx.user.id, input?.limit);
      }),
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      return db.getCurrentWeek(ctx.user.id, ctx.user.timezone);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getWeekById(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        summaryNotes: z.string().optional(),
        score: z.number().min(0).max(10).optional(),
        targetStudyHours: z.number().optional(),
        targetSessions: z.number().optional(),
        targetTournaments: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateWeek(id, updates);
        return { success: true };
      }),
  }),

  // Study sessions
  studySessions: router({
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        type: z.enum(['RANGE_TRAINING', 'HAND_REVIEW', 'ICM', 'EXPLOIT_LAB', 'DEEP_DIVE', 'MENTAL_GAME', 'LIGHT_REVIEW']),
        durationMinutes: z.number().min(1),
        resourceUsed: z.string().optional(),
        handsReviewedCount: z.number().default(0),
        drillsCompletedCount: z.number().default(0),
        accuracyPercent: z.number().min(0).max(100).optional(),
        keyTakeaways: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-assign to week
        const week = await db.getOrCreateWeekForDate(ctx.user.id, input.date, ctx.user.timezone);
        
        return db.createStudySession({
          userId: ctx.user.id,
          weekId: week.id,
          ...input,
        });
      }),
    getByWeek: protectedProcedure
      .input(z.object({ weekId: z.number() }))
      .query(async ({ input }) => {
        return db.getStudySessionsByWeek(input.weekId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getStudySessionById(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(['RANGE_TRAINING', 'HAND_REVIEW', 'ICM', 'EXPLOIT_LAB', 'DEEP_DIVE', 'MENTAL_GAME', 'LIGHT_REVIEW']).optional(),
        durationMinutes: z.number().min(1).optional(),
        resourceUsed: z.string().optional(),
        handsReviewedCount: z.number().optional(),
        drillsCompletedCount: z.number().optional(),
        accuracyPercent: z.number().min(0).max(100).optional(),
        keyTakeaways: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateStudySession(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStudySession(input.id);
        return { success: true };
      }),
  }),

  // Tournaments
  tournaments: router({
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        venue: z.string().optional(),
        name: z.string().optional(),
        buyIn: z.number().min(0),
        startingStack: z.number().optional(),
        fieldSize: z.number().optional(),
        reEntries: z.number().default(0),
        finalPosition: z.number().optional(),
        prize: z.number().default(0),
        stageReached: z.enum(['EARLY', 'MID', 'LATE', 'FT']).optional(),
        selfRating: z.number().min(0).max(10).optional(),
        mentalRating: z.number().min(0).max(10).optional(),
        notesOverall: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Auto-assign to week
        const week = await db.getOrCreateWeekForDate(ctx.user.id, input.date, ctx.user.timezone);
        
        // Calculate net result
        const netResult = input.prize - (input.buyIn * (input.reEntries + 1));
        
        return db.createTournament({
          userId: ctx.user.id,
          weekId: week.id,
          netResult,
          ...input,
        });
      }),
    getByWeek: protectedProcedure
      .input(z.object({ weekId: z.number() }))
      .query(async ({ input }) => {
        return db.getTournamentsByWeek(input.weekId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTournamentById(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        venue: z.string().optional(),
        name: z.string().optional(),
        buyIn: z.number().min(0).optional(),
        startingStack: z.number().optional(),
        fieldSize: z.number().optional(),
        reEntries: z.number().optional(),
        finalPosition: z.number().optional(),
        prize: z.number().optional(),
        stageReached: z.enum(['EARLY', 'MID', 'LATE', 'FT']).optional(),
        selfRating: z.number().min(0).max(10).optional(),
        mentalRating: z.number().min(0).max(10).optional(),
        notesOverall: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        
        // Recalculate net result if relevant fields changed
        if (updates.prize !== undefined || updates.buyIn !== undefined || updates.reEntries !== undefined) {
          const tournament = await db.getTournamentById(id);
          if (tournament) {
            const prize = updates.prize ?? tournament.prize;
            const buyIn = updates.buyIn ?? tournament.buyIn;
            const reEntries = updates.reEntries ?? tournament.reEntries;
            (updates as any).netResult = prize - (buyIn * (reEntries + 1));
          }
        }
        
        await db.updateTournament(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTournament(input.id);
        return { success: true };
      }),
  }),

  // Hands
  hands: router({
    create: protectedProcedure
      .input(z.object({
        tournamentId: z.number().optional(),
        studySessionId: z.number().optional(),
        heroPosition: z.string().optional(),
        heroHand: z.string().optional(),
        boardRunout: z.string().optional(),
        effectiveStackBb: z.number().optional(),
        spr: z.number().optional(),
        streetData: z.any().optional(),
        spotType: z.enum(['SINGLE_RAISED_POT', '3BET_POT', 'BvB', 'ICM_SPOT', 'LIMPED_POT']).optional(),
        heroDecisionPreflop: z.string().optional(),
        heroDecisionFlop: z.string().optional(),
        heroDecisionTurn: z.string().optional(),
        heroDecisionRiver: z.string().optional(),
        reviewed: z.boolean().default(false),
        evalSource: z.enum(['SOLVER', 'COACH', 'SELF']).optional(),
        mistakeStreet: z.enum(['PREFLOP', 'FLOP', 'TURN', 'RIVER']).optional(),
        mistakeSeverity: z.number().min(0).max(3).default(0),
        evDiffBb: z.number().optional(),
        tags: z.array(z.string()).optional(),
        lesson: z.string().optional(),
        leakIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { leakIds, streetData, tags, ...handData } = input;
        
        const hand = await db.createHand({
          userId: ctx.user.id,
          streetDataJson: streetData ? JSON.stringify(streetData) : undefined,
          tagsJson: tags ? JSON.stringify(tags) : undefined,
          ...handData,
        });
        
        // Link to leaks if provided
        if (leakIds && leakIds.length > 0) {
          for (const leakId of leakIds) {
            await db.linkHandToLeak(hand.id, leakId);
          }
        }
        
        return hand;
      }),
    getByTournament: protectedProcedure
      .input(z.object({ tournamentId: z.number() }))
      .query(async ({ input }) => {
        return db.getHandsByTournament(input.tournamentId);
      }),
    getByUser: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getHandsByUser(ctx.user.id, input?.limit);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const hand = await db.getHandById(input.id);
        if (!hand) return null;
        
        // Parse JSON fields
        return {
          ...hand,
          streetData: hand.streetDataJson ? JSON.parse(hand.streetDataJson) : null,
          tags: hand.tagsJson ? JSON.parse(hand.tagsJson) : [],
        };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        heroPosition: z.string().optional(),
        heroHand: z.string().optional(),
        boardRunout: z.string().optional(),
        effectiveStackBb: z.number().optional(),
        spr: z.number().optional(),
        streetData: z.any().optional(),
        spotType: z.enum(['SINGLE_RAISED_POT', '3BET_POT', 'BvB', 'ICM_SPOT', 'LIMPED_POT']).optional(),
        heroDecisionPreflop: z.string().optional(),
        heroDecisionFlop: z.string().optional(),
        heroDecisionTurn: z.string().optional(),
        heroDecisionRiver: z.string().optional(),
        reviewed: z.boolean().optional(),
        evalSource: z.enum(['SOLVER', 'COACH', 'SELF']).optional(),
        mistakeStreet: z.enum(['PREFLOP', 'FLOP', 'TURN', 'RIVER']).optional(),
        mistakeSeverity: z.number().min(0).max(3).optional(),
        evDiffBb: z.number().optional(),
        tags: z.array(z.string()).optional(),
        lesson: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, streetData, tags, ...updates } = input;
        
        const dbUpdates: any = updates;
        if (streetData !== undefined) dbUpdates.streetDataJson = JSON.stringify(streetData);
        if (tags !== undefined) dbUpdates.tagsJson = JSON.stringify(tags);
        
        await db.updateHand(id, dbUpdates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHand(input.id);
        return { success: true };
      }),
    linkLeak: protectedProcedure
      .input(z.object({ handId: z.number(), leakId: z.number() }))
      .mutation(async ({ input }) => {
        await db.linkHandToLeak(input.handId, input.leakId);
        return { success: true };
      }),
    unlinkLeak: protectedProcedure
      .input(z.object({ handId: z.number(), leakId: z.number() }))
      .mutation(async ({ input }) => {
        await db.unlinkHandFromLeak(input.handId, input.leakId);
        return { success: true };
      }),
    getLeaks: protectedProcedure
      .input(z.object({ handId: z.number() }))
      .query(async ({ input }) => {
        return db.getLeaksForHand(input.handId);
      }),
  }),

  // Leaks
  leaks: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(['PREFLOP', 'POSTFLOP', 'ICM', 'MENTAL', 'EXPLOIT']),
        description: z.string().optional(),
        status: z.enum(['ACTIVE', 'IMPROVING', 'FIXED']).default('ACTIVE'),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createLeak({
          userId: ctx.user.id,
          ...input,
        });
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLeaks(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLeakById(input.id);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.enum(['PREFLOP', 'POSTFLOP', 'ICM', 'MENTAL', 'EXPLOIT']).optional(),
        description: z.string().optional(),
        status: z.enum(['ACTIVE', 'IMPROVING', 'FIXED']).optional(),
        lastSeenAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateLeak(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLeak(input.id);
        return { success: true };
      }),
    getTop: protectedProcedure
      .input(z.object({ limit: z.number().default(5) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getTopLeaks(ctx.user.id, input?.limit);
      }),
  }),

  // Dashboard
  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({ weekId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getDashboardStats(ctx.user.id, input.weekId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
