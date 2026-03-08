import { z } from "zod"
import { router, orgProcedure } from "../trpc"
import { getOrgPlan, PLAN_LIMITS, type PlanType } from "../lib/quota"
import { checkAiCredits } from "../lib/polar"
import { eq, and, sql, gte } from "drizzle-orm"
import { subscription, generations, templates, member } from "@workspace/db/schema"

export const billingRouter = router({
  /**
   * Get the current org's plan and usage summary
   */
  getUsage: orgProcedure.query(async ({ ctx }) => {
    const plan = await getOrgPlan(ctx.db, ctx.organizationId)
    const limits = PLAN_LIMITS[plan]

    // Count templates
    const [templateCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(eq(templates.organizationId, ctx.organizationId))

    // Count members
    const [memberCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(member)
      .where(eq(member.organizationId, ctx.organizationId))

    // Count exports this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [exportCount] = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(generations)
      .where(
        and(
          eq(generations.organizationId, ctx.organizationId),
          gte(generations.createdAt, startOfMonth),
        ),
      )

    // AI credits from Polar meter
    let aiUsage = { consumed: 0, credited: 0, balance: 0 }
    try {
      const credits = await checkAiCredits(ctx.session.user.id)
      aiUsage = {
        consumed: credits.consumed,
        credited: credits.credited,
        balance: credits.balance,
      }
    } catch {
      // Polar unavailable — show zeros
    }

    // Subscription info
    const [sub] = await ctx.db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.organizationId, ctx.organizationId),
          eq(subscription.status, "active"),
        ),
      )
      .limit(1)

    return {
      plan,
      limits: {
        exports: limits.exports === Infinity ? null : limits.exports,
        templates: limits.templates === Infinity ? null : limits.templates,
        members: limits.members === Infinity ? null : limits.members,
        aiCredits: limits.aiCredits === Infinity ? null : limits.aiCredits,
        webhooks: limits.webhooks,
        mcp: limits.mcp,
        creditPacks: limits.creditPacks,
      },
      usage: {
        exports: exportCount?.count ?? 0,
        templates: templateCount?.count ?? 0,
        members: memberCount?.count ?? 0,
        ai: aiUsage,
      },
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
          }
        : null,
    }
  }),

  /**
   * Get plan info without usage (lightweight)
   */
  getPlan: orgProcedure.query(async ({ ctx }) => {
    const plan = await getOrgPlan(ctx.db, ctx.organizationId)
    return { plan, limits: PLAN_LIMITS[plan] }
  }),
})
