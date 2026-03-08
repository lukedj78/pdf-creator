"use client"

import { useEffect, useRef } from "react"
import { useSession, useActiveOrganization, useListOrganizations, authClient } from "@workspace/auth/client"

/**
 * Fallback guard: if a session exists but no org is active
 * (e.g. stale session, social login callback), set one automatically.
 * Primary activation happens in login/register pages.
 */
export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = useSession()
  const { data: activeOrg, isPending: orgPending } = useActiveOrganization()
  const { data: orgs, isPending: orgsPending } = useListOrganizations()
  const settingRef = useRef(false)

  useEffect(() => {
    if (sessionPending || orgPending || orgsPending) return
    if (!session?.user || activeOrg || settingRef.current) return

    settingRef.current = true

    async function ensureOrg() {
      if (orgs && orgs.length > 0) {
        await authClient.organization.setActive({
          organizationId: orgs[0]!.id,
        })
        window.location.reload()
        return
      }

      const res = await authClient.organization.create({
        name: `${session!.user.name ?? "My"}'s Workspace`,
        slug: `workspace-${session!.user.id.slice(0, 8)}`,
      })

      if (res.data) {
        await authClient.organization.setActive({
          organizationId: res.data.id,
        })
        window.location.reload()
      }
    }

    ensureOrg()
  }, [session, sessionPending, activeOrg, orgPending, orgs, orgsPending])

  return <>{children}</>
}
