let rateLimiter: {
  limit: (identifier: string) => Promise<{ success: boolean; remaining: number }>
  getRemaining: (identifier: string) => Promise<{ remaining: number; reset: number; limit: number }>
} | null = null

async function getRateLimiter() {
  if (process.env.SKIP_RATE_LIMIT === "true") return null
  if (rateLimiter) return rateLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const { Ratelimit } = await import("@upstash/ratelimit")
  const { Redis } = await import("@upstash/redis")

  rateLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    analytics: true,
  })

  return rateLimiter
}

export async function rateLimit(identifier: string) {
  const limiter = await getRateLimiter()
  if (!limiter) return { success: true as const, remaining: -1, limit: -1 }

  const result = await limiter.limit(identifier)
  if (!result.success) {
    return { success: false as const, remaining: 0, limit: 100 }
  }
  return { success: true as const, remaining: result.remaining, limit: 100 }
}

export async function getUsage(identifier: string) {
  const limiter = await getRateLimiter()
  if (!limiter) return { limit: -1, remaining: -1 }
  const result = await limiter.getRemaining(identifier)
  return { limit: result.limit, remaining: result.remaining }
}
