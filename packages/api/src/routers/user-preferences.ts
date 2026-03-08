import { z } from "zod"
import { eq } from "drizzle-orm"
import { userPreferences } from "@workspace/db/schema"
import { router, protectedProcedure } from "../trpc"

export const userPreferencesRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [prefs] = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.session.user.id))
      .limit(1)

    return prefs ?? { emailNotifications: true, marketingEmails: false }
  }),

  update: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().optional(),
        marketingEmails: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.userId, ctx.session.user.id))
        .limit(1)

      if (existing) {
        const [updated] = await ctx.db
          .update(userPreferences)
          .set(input)
          .where(eq(userPreferences.id, existing.id))
          .returning()
        return updated
      }

      const [created] = await ctx.db
        .insert(userPreferences)
        .values({
          id: crypto.randomUUID(),
          userId: ctx.session.user.id,
          emailNotifications: input.emailNotifications ?? true,
          marketingEmails: input.marketingEmails ?? false,
        })
        .returning()

      return created
    }),
})
