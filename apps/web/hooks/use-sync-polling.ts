"use client"

import { useEffect, useRef, useCallback } from "react"
import { trpc } from "@/lib/trpc"

type SyncEvent = {
  templateId: string
  action: string
  timestamp: number
}

type PollResponse = {
  available: boolean
  events: SyncEvent[]
}

const POLL_INTERVAL = 5000 // 5 seconds

/**
 * Polls for sync events from MCP mutations.
 *
 * - If Redis sync is available (prod): polls /api/sync/poll for new events,
 *   invalidates relevant React Query caches when changes are detected.
 * - If not available (dev): enables refetchInterval on the template query
 *   as a fallback.
 *
 * @param templateId - If provided, also invalidates the specific template query
 *   and calls onTemplateChanged when that template is modified externally.
 */
export function useSyncPolling({
  templateId,
  onTemplateChanged,
  enabled = true,
}: {
  templateId?: string
  onTemplateChanged?: () => void
  enabled?: boolean
} = {}) {
  const utils = trpc.useUtils()
  const lastTimestamp = useRef(Date.now())
  const syncAvailable = useRef<boolean | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/sync/poll?since=${lastTimestamp.current}`)
      if (!res.ok) return

      const data: PollResponse = await res.json()

      // First poll: check if sync is available
      if (syncAvailable.current === null) {
        syncAvailable.current = data.available
      }

      if (!data.available || data.events.length === 0) return

      // Update timestamp to latest event
      const maxTs = Math.max(...data.events.map((e) => e.timestamp))
      lastTimestamp.current = maxTs

      // Invalidate template list cache
      utils.templates.list.invalidate()

      // Check if our specific template was modified
      if (templateId) {
        const relevant = data.events.some((e) => e.templateId === templateId)
        if (relevant) {
          utils.templates.getById.invalidate({ id: templateId })
          onTemplateChanged?.()
        }
      }
    } catch {
      // Silently ignore poll errors
    }
  }, [templateId, onTemplateChanged, utils])

  useEffect(() => {
    if (!enabled) return

    // Start polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [poll, enabled])

  return {
    /** Whether Redis sync is available. null = not yet determined. */
    syncAvailable: syncAvailable.current,
  }
}
