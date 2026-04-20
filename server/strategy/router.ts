import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getChartBySpotSelector,
  getChartWithActions,
  getChartsBySpot,
  getRecentAttempts,
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

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export const strategyRouter = router({
  listSpots: protectedProcedure.input(ListSpotsInput).query(({ input }) => {
    return listAvailableSpots(input);
  }),

  getChart: protectedProcedure.input(GetChartInput).query(async ({ input }) => {
    const chart = await getChartWithActions(input.chartId);
    if (!chart) notFound("Chart not found");
    return chart;
  }),

  getChartsBySpot: protectedProcedure
    .input(GetChartBySpotInput)
    .query(({ input }) => {
      return getChartsBySpot(input.stackDepth, input.spotGroup, input.spotKey);
    }),

  getChartBySpot: protectedProcedure
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

  getTrainerSpot: protectedProcedure
    .input(GetTrainerSpotInput)
    .query(async ({ input }) => {
      const spot = await getTrainerSpot(input);
      if (!spot) notFound("No trainable hands found for these filters");
      return spot;
    }),

  submitTrainerAttempt: protectedProcedure
    .input(SubmitAttemptInput)
    .mutation(async ({ ctx, input }) => {
      const result = await submitTrainerAttempt(ctx.user.id, input);
      if (!result) notFound("Trainer hand not found");
      return result;
    }),

  logAttempt: protectedProcedure
    .input(LogAttemptInput)
    .mutation(async ({ ctx, input }) => {
      const result = await submitTrainerAttempt(ctx.user.id, {
        chartId: input.chartId,
        handCode: input.handCode,
        selectedAction: input.selectedAction,
      });

      if (!result) notFound("Trainer hand not found");
      return result;
    }),

  getStats: protectedProcedure.query(({ ctx }) => {
    return getTrainerStats(ctx.user.id);
  }),

  getRecentAttempts: protectedProcedure
    .input(GetRecentAttemptsInput)
    .query(({ ctx, input }) => {
      return getRecentAttempts(ctx.user.id, input.limit);
    }),
});
