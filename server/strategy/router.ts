/**
 * server/strategy/router.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * tRPC router for the MTT Strategy Module.
 * Wired into the main router in server/routers.ts as `strategy`.
 *
 * CODEX TASK:
 *   - All procedure stubs are defined with correct input/output types.
 *   - Implement the body of each procedure by calling service functions.
 *   - Use `protectedProcedure` for all endpoints (auth required).
 *   - Throw TRPCError({ code: "NOT_FOUND" }) when a resource is missing.
 *
 * Usage in client:
 *   trpc.strategy.listSpots.useQuery({ stackDepth: 20 })
 *   trpc.strategy.getChart.useQuery({ chartId: 1 })
 *   trpc.strategy.logAttempt.useMutation()
 *   trpc.strategy.getStats.useQuery()
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listAvailableSpots,
  getChartWithActions,
  getChartsBySpot,
  logTrainerAttempt,
  getTrainerStats,
  getRecentAttempts,
} from "./service";
import { SPOT_GROUPS, STACK_DEPTHS, ACTIONS } from "../../shared/strategy";

// ─── Input schemas ────────────────────────────────────────────────────────────

const ListSpotsInput = z.object({
  stackDepth: z.number().optional(),
  spotGroup: z.enum(SPOT_GROUPS).optional(),
});

const GetChartInput = z.object({
  chartId: z.number().int().positive(),
});

const GetChartBySpotInput = z.object({
  stackDepth: z.number().int(),
  spotGroup: z.enum(SPOT_GROUPS),
  spotKey: z.string(),
});

const LogAttemptInput = z.object({
  chartId: z.number().int().positive(),
  handCode: z.string().min(2).max(4),
  selectedAction: z.enum(ACTIONS),
  correctAction: z.enum(ACTIONS),
  isCorrect: z.boolean(),
});

const GetRecentAttemptsInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const strategyRouter = router({
  /**
   * List all available spots (distinct stack + group + key combos).
   * Optionally filter by stackDepth and/or spotGroup.
   *
   * CODEX TASK: Call listAvailableSpots(), then filter in-memory if inputs provided.
   */
  listSpots: protectedProcedure
    .input(ListSpotsInput)
    .query(async ({ input }) => {
      const spots = await listAvailableSpots();
      let filtered = spots;
      if (input.stackDepth !== undefined) {
        filtered = filtered.filter((s) => s.stackDepth === input.stackDepth);
      }
      if (input.spotGroup !== undefined) {
        filtered = filtered.filter((s) => s.spotGroup === input.spotGroup);
      }
      return filtered;
    }),

  /**
   * Get a single chart with all hand actions by chartId.
   *
   * CODEX TASK: Call getChartWithActions(chartId). Throw NOT_FOUND if null.
   */
  getChart: protectedProcedure
    .input(GetChartInput)
    .query(async ({ input }) => {
      const chart = await getChartWithActions(input.chartId);
      if (!chart) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chart not found" });
      }
      return chart;
    }),

  /**
   * Get charts for a specific spot (may return multiple charts for same spot).
   *
   * CODEX TASK: Call getChartsBySpot(stackDepth, spotGroup, spotKey).
   */
  getChartBySpot: protectedProcedure
    .input(GetChartBySpotInput)
    .query(async ({ input }) => {
      return getChartsBySpot(input.stackDepth, input.spotGroup, input.spotKey);
    }),

  /**
   * Log a trainer attempt for the current user.
   *
   * CODEX TASK: Call logTrainerAttempt({ userId: ctx.user.id, ...input }).
   */
  logAttempt: protectedProcedure
    .input(LogAttemptInput)
    .mutation(async ({ ctx, input }) => {
      await logTrainerAttempt({
        userId: ctx.user.id,
        chartId: input.chartId,
        handCode: input.handCode,
        selectedAction: input.selectedAction,
        correctAction: input.correctAction,
        isCorrect: input.isCorrect,
      });
      return { success: true };
    }),

  /**
   * Get trainer stats for the current user.
   *
   * CODEX TASK: Call getTrainerStats(ctx.user.id).
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      return getTrainerStats(ctx.user.id);
    }),

  /**
   * Get recent trainer attempts for the current user.
   *
   * CODEX TASK: Call getRecentAttempts(ctx.user.id, input.limit).
   */
  getRecentAttempts: protectedProcedure
    .input(GetRecentAttemptsInput)
    .query(async ({ ctx, input }) => {
      return getRecentAttempts(ctx.user.id, input.limit);
    }),
});
