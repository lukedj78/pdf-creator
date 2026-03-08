import { Polar } from "@polar-sh/sdk"

const isProd = process.env.NODE_ENV === "production"

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: isProd ? "production" : "sandbox",
})

export async function checkAiCredits(userId: string): Promise<{
  allowed: boolean
  consumed: number
  credited: number
  balance: number
}> {
  const meterId = process.env.POLAR_AI_METER_ID

  // If no meter configured (dev/testing), allow all
  if (!meterId) {
    return { allowed: true, consumed: 0, credited: 0, balance: -999 }
  }

  try {
    const meters = await polar.customerMeters.list({
      externalCustomerId: userId,
      meterId,
    })

    const meter = meters.result.items[0]
    if (!meter) {
      // No meter record yet — likely first use, allow
      return { allowed: true, consumed: 0, credited: 0, balance: -1 }
    }

    return {
      allowed: meter.balance < 0,
      consumed: meter.consumedUnits,
      credited: meter.creditedUnits,
      balance: meter.balance,
    }
  } catch {
    // Polar unavailable — fail open in dev, fail closed in prod
    if (!isProd) {
      return { allowed: true, consumed: 0, credited: 0, balance: -999 }
    }
    throw new Error("Unable to verify AI credits. Please try again.")
  }
}

export async function trackAiUsage(opts: {
  userId: string
  organizationId: string
  type: "chat" | "editor" | "import" | "remix"
  totalTokens?: number
  model?: string
}): Promise<void> {
  // Skip if no access token configured (dev/testing)
  if (!process.env.POLAR_ACCESS_TOKEN) return

  try {
    await polar.events.ingest({
      events: [
        {
          name: "ai_generation",
          externalCustomerId: opts.userId,
          metadata: {
            type: opts.type,
            organizationId: opts.organizationId,
            totalTokens: opts.totalTokens ?? 0,
            model: opts.model ?? "claude-sonnet-4",
          },
        },
      ],
    })
  } catch (err) {
    // Don't fail the request if tracking fails
    console.error("[polar] Failed to track AI usage:", err)
  }
}
