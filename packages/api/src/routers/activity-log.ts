import { z } from "zod"
import { eq, desc } from "drizzle-orm"
import { activityLog, user } from "@workspace/db/schema"
import { router, orgProcedure } from "../trpc"
import type { Database } from "@workspace/db"

export const activityLogRouter = router({
  list: orgProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50
      const offset = input?.offset ?? 0

      const logs = await ctx.db
        .select({
          id: activityLog.id,
          action: activityLog.action,
          targetType: activityLog.targetType,
          targetId: activityLog.targetId,
          metadata: activityLog.metadata,
          createdAt: activityLog.createdAt,
          actorName: user.name,
          actorEmail: user.email,
          actorImage: user.image,
        })
        .from(activityLog)
        .innerJoin(user, eq(activityLog.actorId, user.id))
        .where(eq(activityLog.organizationId, ctx.organizationId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .offset(offset)

      return logs
    }),
})

// Helper to record activity from other routers
export async function recordActivity(
  db: Database,
  params: {
    organizationId: string
    actorId: string
    action: string
    targetType?: string
    targetId?: string
    metadata?: Record<string, unknown>
  }
) {
  await db.insert(activityLog).values({
    id: crypto.randomUUID(),
    organizationId: params.organizationId,
    actorId: params.actorId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata,
  })
}
