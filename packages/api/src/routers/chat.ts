import { z } from "zod"
import { eq, and, desc, asc } from "drizzle-orm"
import { chatSessions, chatMessages } from "@workspace/db/schema"
import { router, orgProcedureWith } from "../trpc"

export const chatRouter = router({
  listSessions: orgProcedureWith({ chat: ["read"] }).query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.organizationId, ctx.organizationId))
      .orderBy(desc(chatSessions.createdAt))
  }),

  getMessages: orgProcedureWith({ chat: ["read"] })
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(asc(chatMessages.createdAt))
    }),

  createSession: orgProcedureWith({ chat: ["create"] })
    .input(z.object({ templateId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .insert(chatSessions)
        .values({
          templateId: input.templateId,
          organizationId: ctx.organizationId,
          createdBy: ctx.session.user.id,
        })
        .returning()
      return session
    }),

  getSession: orgProcedureWith({ chat: ["read"] })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [session] = await ctx.db
        .select()
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.organizationId, ctx.organizationId)
          )
        )
      return session ?? null
    }),

  updateSessionTemplate: orgProcedureWith({ chat: ["create"] })
    .input(z.object({
      id: z.string(),
      templateSchema: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(chatSessions)
        .set({ templateSchema: input.templateSchema })
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),

  deleteSession: orgProcedureWith({ chat: ["create"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(chatSessions)
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),
})
