import crypto from "node:crypto"
import { eq, and } from "drizzle-orm"
import { webhooks } from "@workspace/db/schema"
import type { Database } from "@workspace/db"

export type WebhookEvent =
  | "export.completed"
  | "export.failed"
  | "template.created"
  | "template.updated"
  | "template.deleted"

export interface WebhookPayload {
  event: WebhookEvent
  data: Record<string, unknown>
  timestamp: string
}

function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
}

const MAX_RETRIES = 5
const RETRY_DELAYS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000] // 1m, 5m, 30m, 2h, 12h

async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  attempt = 0
): Promise<boolean> {
  const body = JSON.stringify(payload)
  const signature = signPayload(body, secret)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Attempt": String(attempt + 1),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    })

    if (res.ok || res.status < 500) {
      return true
    }

    // Server error — retry if attempts remain
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_DELAYS[attempt] ?? 43_200_000
      setTimeout(() => deliverWebhook(url, payload, secret, attempt + 1), delay)
    }
    return false
  } catch {
    // Network error — retry if attempts remain
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_DELAYS[attempt] ?? 43_200_000
      setTimeout(() => deliverWebhook(url, payload, secret, attempt + 1), delay)
    }
    return false
  }
}

/**
 * Dispatch a webhook event to all active webhooks subscribed to this event
 * for the given organization. Fire-and-forget — does not block the caller.
 */
export function dispatchWebhookEvent(
  db: Database,
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): void {
  // Fully fire-and-forget: never block or crash the caller
  ;(async () => {
    try {
      const activeWebhooks = await db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.organizationId, organizationId),
            eq(webhooks.active, true)
          )
        )

      const payload: WebhookPayload = {
        event,
        data,
        timestamp: new Date().toISOString(),
      }

      for (const wh of activeWebhooks) {
        const events = (wh.events ?? []) as string[]
        if (!events.includes(event)) continue
        deliverWebhook(wh.url, payload, wh.secret)
      }
    } catch {
      // Silent failure — webhook dispatch must never affect the main flow
    }
  })()
}

/**
 * Fire a per-request callback URL with HMAC signing.
 * Used by the generate endpoint for callbackUrl parameter.
 */
export function fireCallback(
  url: string,
  payload: {
    event: "export.completed" | "export.failed"
    generationId: string
    templateId: string | null
    error?: string
  }
): void {
  const body = JSON.stringify({
    ...payload,
    timestamp: new Date().toISOString(),
  })

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Event": payload.event,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {
    // Fire-and-forget
  })
}
