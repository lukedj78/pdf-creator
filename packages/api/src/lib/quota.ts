import { TRPCError } from "@trpc/server"
import { eq, and, gte, sql } from "drizzle-orm"
import { subscription } from "@workspace/db/schema"
import type { Database } from "@workspace/db"

export const PLAN_LIMITS = {
  free: {
    exports: 100,
    templates: 3,
    members: 1,
    aiCredits: 10,
    webhooks: false,
    mcp: false,
    creditPacks: false,
  },
  pro: {
    exports: 5_000,
    templates: Infinity,
    members: 5,
    aiCredits: 500,
    webhooks: true,
    mcp: true,
    creditPacks: true,
  },
  enterprise: {
    exports: Infinity,
    templates: Infinity,
    members: Infinity,
    aiCredits: Infinity,
    webhooks: true,
    mcp: true,
    creditPacks: false,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export async function getOrgPlan(
  db: Database,
  organizationId: string,
): Promise<PlanType> {
  const [sub] = await db
    .select({ plan: subscription.plan })
    .from(subscription)
    .where(
      and(
        eq(subscription.organizationId, organizationId),
        eq(subscription.status, "active"),
      ),
    )
    .limit(1)

  return (sub?.plan as PlanType) ?? "free"
}

export function assertFeatureAccess(
  plan: PlanType,
  feature: "webhooks" | "mcp" | "creditPacks",
): void {
  if (!PLAN_LIMITS[plan][feature]) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${feature} requires a paid plan. Upgrade to Pro.`,
    })
  }
}
