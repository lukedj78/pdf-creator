import { z } from "zod"
import { eq, and } from "drizzle-orm"
import crypto from "node:crypto"
import { webhooks } from "@workspace/db/schema"
import { router, orgProcedureWith } from "../trpc"

export const webhooksRouter = router({
  list: orgProcedureWith({ webhook: ["read"] }).query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(webhooks)
      .where(eq(webhooks.organizationId, ctx.organizationId))
    // Never expose the signing secret in list responses
    return rows.map(({ secret: _secret, ...rest }) => rest)
  }),

  create: orgProcedureWith({ webhook: ["create"] })
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [webhook] = await ctx.db
        .insert(webhooks)
        .values({
          url: input.url,
          events: input.events,
          secret: crypto.randomBytes(32).toString("hex"),
          organizationId: ctx.organizationId,
        })
        .returning()
      return webhook
    }),

  delete: orgProcedureWith({ webhook: ["delete"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(webhooks)
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),

  toggle: orgProcedureWith({ webhook: ["update"] })
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [webhook] = await ctx.db
        .update(webhooks)
        .set({ active: input.active })
        .where(
          and(
            eq(webhooks.id, input.id),
            eq(webhooks.organizationId, ctx.organizationId)
          )
        )
        .returning()
      return webhook
    }),
})
