import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import {
  getChartBySpotSelector,
  getChartWithActions,
  getChartsBySpot,
  getHandStrategyRecommendation,
  getRecentAttempts,
  getTrainerProgress,
  getTrainerSpot,
  getTrainerStats,
  listAvailableSpots,
  submitTrainerAttempt,
} from "./service";
import { ACTIONS, SPOT_GROUPS, STACK_DEPTHS } from "../../shared/strategy";

const StackDepthInput = z
  .number()
  .int()
  .refine(depth => (STACK_DEPTHS as readonly number[]).includes(depth), {
    message: "Unsupported stack depth",
  });

const ListSpotsInput = z.object({
  stackDepth: StackDepthInput.optional(),
  spotGroup: z.enum(SPOT_GROUPS).optional(),
});

const GetChartInput = z.object({
  chartId: z.number().int().positive(),
});

const GetChartBySpotInput = z.object({
  stackDepth: StackDepthInput,
  spotGroup: z.enum(SPOT_GROUPS),
  spotKey: z.string().min(1),
});

const GetTrainerSpotInput = z.object({
  chartId: z.number().int().positive().optional(),
  stackDepth: StackDepthInput.optional(),
  spotGroup: z.enum(SPOT_GROUPS).optional(),
});

const SubmitAttemptInput = z.object({
  chartId: z.number().int().positive(),
  handCode: z.string().min(2).max(4),
  selectedAction: z.enum(ACTIONS),
});

const LogAttemptInput = SubmitAttemptInput.extend({
  correctAction: z.enum(ACTIONS),
  isCorrect: z.boolean(),
});

const GetRecentAttemptsInput = z.object({
  limit: z.number().int().min(1).max(200).default(50),
});

const GetHandRecommendationInput = z.object({
  handId: z.number().int().positive(),
});

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export const strategyRouter = router({
  // Public read-only queries — no login required
  listSpots: publicProcedure.input(ListSpotsInput).query(async ({ input }) => {
    const result = await listAvailableSpots(input);
    return result;
  }),

  getChart: publicProcedure.input(GetChartInput).query(async ({ input }) => {
    const chart = await getChartWithActions(input.chartId);
    if (!chart) notFound("Chart not found");
    return chart;
  }),

  getChartsBySpot: publicProcedure
    .input(GetChartBySpotInput)
    .query(({ input }) => {
      return getChartsBySpot(input.stackDepth, input.spotGroup, input.spotKey);
    }),

  getChartBySpot: publicProcedure
    .input(GetChartBySpotInput)
    .query(async ({ input }) => {
      const chart = await getChartBySpotSelector(
        input.stackDepth,
        input.spotGroup,
        input.spotKey
      );

      if (!chart) notFound("Chart not found for spot");
      return chart;
    }),

  getTrainerSpot: publicProcedure
    .input(GetTrainerSpotInput)
    .query(async ({ input }) => {
      const spot = await getTrainerSpot(input);
      if (!spot) notFound("No trainable hands found for these filters");
      return spot;
    }),

  // Trainer write operations — work without login; attempts are only persisted when authenticated
  submitTrainerAttempt: publicProcedure
    .input(SubmitAttemptInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? null;
      const result = await submitTrainerAttempt(userId, input);
      if (!result) notFound("Trainer hand not found");
      return result;
    }),

  logAttempt: publicProcedure
    .input(LogAttemptInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id ?? null;
      const result = await submitTrainerAttempt(userId, {
        chartId: input.chartId,
        handCode: input.handCode,
        selectedAction: input.selectedAction,
      });

      if (!result) notFound("Trainer hand not found");
      return result;
    }),

  // Stats and history — require login (user-specific data)
  getStats: protectedProcedure.query(({ ctx }) => {
    return getTrainerStats(ctx.user.id);
  }),

  getRecentAttempts: protectedProcedure
    .input(GetRecentAttemptsInput)
    .query(({ ctx, input }) => {
      return getRecentAttempts(ctx.user.id, input.limit);
    }),

  getProgress: protectedProcedure.query(({ ctx }) => {
    return getTrainerProgress(ctx.user.id);
  }),

  getHandRecommendation: publicProcedure
    .input(GetHandRecommendationInput)
    .query(({ input }) => {
      return getHandStrategyRecommendation(input.handId);
    }),
});
