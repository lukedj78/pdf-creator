/**
 * Sync event store — records template mutations so the web app
 * (and any other consumer) can poll for changes.
 *
 * Production: Upstash Redis sorted set (per org).
 * Dev (SKIP_RATE_LIMIT=true or no Redis env): no-op.
 */

let redis: { zadd: Function; zremrangebyrank: Function; expire: Function } | null = null
let attempted = false

const SYNC_TTL = 300 // 5 minutes
const MAX_EVENTS = 100

async function getRedis() {
  if (process.env.SKIP_RATE_LIMIT === "true") return null
  if (attempted) return redis

  attempted = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const { Redis } = await import("@upstash/redis")
  redis = new Redis({ url, token })
  return redis
}

/**
 * Record a sync event after a template mutation via REST API.
 * No-op if Redis is not available.
 */
export async function recordSyncEvent(
  orgId: string,
  templateId: string,
  action: string,
): Promise<void> {
  const r = await getRedis()
  if (!r) return

  const key = `sync:${orgId}`
  const timestamp = Date.now()
  const value = JSON.stringify({ templateId, action, timestamp })

  await r.zadd(key, { score: timestamp, member: value })
  await r.zremrangebyrank(key, 0, -(MAX_EVENTS + 1))
  await r.expire(key, SYNC_TTL)
}
