import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ICM_CATEGORIES, ICM_TAGS } from "../../shared/icm";
import { publicProcedure, router } from "../_core/trpc";
import { getIcmPackBySlug, getIcmSpotById, listIcmPacks } from "./service";

const IcmPackInput = z.object({
  slug: z.string().min(1),
  playerCount: z.number().int().positive().optional(),
  tag: z.enum(ICM_TAGS).optional(),
  primaryCategory: z.enum(ICM_CATEGORIES).optional(),
});

const IcmSpotInput = z.object({
  spotId: z.number().int().positive(),
});

function notFound(message: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

export const icmRouter = router({
  listPacks: publicProcedure.query(() => {
    return listIcmPacks();
  }),

  getPack: publicProcedure.input(IcmPackInput).query(async ({ input }) => {
    const pack = await getIcmPackBySlug(input.slug, {
      playerCount: input.playerCount,
      tag: input.tag,
      primaryCategory: input.primaryCategory,
    });

    if (!pack) notFound("ICM pack not found");
    return pack;
  }),

  getSpot: publicProcedure.input(IcmSpotInput).query(async ({ input }) => {
    const spot = await getIcmSpotById(input.spotId);

    if (!spot) notFound("ICM spot not found");
    return spot;
  }),
});
