/**
 * Sync event store — records template mutations for real-time polling.
 *
 * Production: Upstash Redis sorted set (per org, scored by timestamp).
 * Dev (SKIP_RATE_LIMIT=true or no Redis env): no-op (client falls back to refetchInterval).
 */

import { Redis } from "@upstash/redis"

export type SyncEvent = {
  templateId: string
  action: string
  timestamp: number
}

// Key: sync:{orgId} — sorted set scored by timestamp, auto-expires after 5 min
const SYNC_TTL = 300 // 5 minutes
const MAX_EVENTS = 100

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (process.env.SKIP_RATE_LIMIT === "true") return null

  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  redis = new Redis({ url, token })
  return redis
}

function syncKey(orgId: string) {
  return `sync:${orgId}`
}

/**
 * Record a sync event after a template mutation.
 * No-op if Redis is not available (dev mode).
 */
export async function recordSyncEvent(
  orgId: string,
  templateId: string,
  action: string,
): Promise<void> {
  const r = getRedis()
  if (!r) return

  const key = syncKey(orgId)
  const timestamp = Date.now()
  const value = JSON.stringify({ templateId, action, timestamp })

  await r.zadd(key, { score: timestamp, member: value })
  // Trim old events and refresh TTL
  await r.zremrangebyrank(key, 0, -(MAX_EVENTS + 1))
  await r.expire(key, SYNC_TTL)
}

/**
 * Get sync events for an org since a given timestamp.
 * Returns empty array if Redis is not available.
 */
export async function getSyncEvents(
  orgId: string,
  since: number,
): Promise<SyncEvent[]> {
  const r = getRedis()
  if (!r) return []

  const key = syncKey(orgId)
  const raw: string[] = await r.zrange(key, since + 1, "+inf", { byScore: true })

  return raw.map((v: string) => {
    const parsed = typeof v === "string" ? JSON.parse(v) : v
    return parsed as SyncEvent
  })
}

/**
 * Check if Redis sync is available (used by poll endpoint to signal client).
 */
export function isSyncAvailable(): boolean {
  return getRedis() !== null
}
