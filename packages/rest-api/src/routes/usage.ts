import { Hono } from "hono"
import { db } from "@workspace/db"
import { generations } from "@workspace/db/schema"
import { eq, and, gte, count } from "@workspace/db"
import { getUsage } from "../lib/rate-limit"
import { apiSuccess } from "../lib/response"
import type { ApiEnv } from "../middleware/api-key"

const usage = new Hono<ApiEnv>()

usage.get("/", async (c) => {
  const apiKey = c.get("apiKey")
  const rateLimitInfo = await getUsage(apiKey.keyId)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [genCount] = await db
    .select({ count: count() })
    .from(generations)
    .where(
      and(
        eq(generations.organizationId, apiKey.referenceId),
        gte(generations.createdAt, monthStart)
      )
    )

  return apiSuccess(c, {
    rateLimit: {
      limit: rateLimitInfo.limit,
      remaining: rateLimitInfo.remaining,
      window: "1h",
    },
    usage: {
      generationsThisMonth: genCount?.count ?? 0,
      periodStart: monthStart.toISOString(),
    },
  })
})

export default usage
