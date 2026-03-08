"use client"

import { authClient, useSession } from "@workspace/auth/client"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { EyeIcon } from "@hugeicons/core-free-icons"

export function ImpersonationBanner() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session } = useSession() as { data: any }

  // Better Auth admin plugin adds impersonatedBy to the session record
  const impersonatedBy = session?.session?.impersonatedBy

  if (!impersonatedBy) return null

  async function handleStop() {
    await authClient.admin.stopImpersonating()
    window.location.href = "/dashboard/admin"
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm shrink-0">
      <HugeiconsIcon icon={EyeIcon} size={16} />
      <span>
        You are impersonating <strong>{session?.user?.name ?? session?.user?.email}</strong>
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs bg-transparent border-white/30 text-white hover:bg-white/10"
        onClick={handleStop}
      >
        Stop Impersonating
      </Button>
    </div>
  )
}
