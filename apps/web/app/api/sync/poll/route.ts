import { headers } from "next/headers"
import { auth } from "@workspace/auth"
import { getSyncEvents, isSyncAvailable } from "@/lib/sync"

export async function GET(req: Request) {
  // Check if sync is available (Redis configured)
  if (!isSyncAvailable()) {
    return Response.json({ available: false, events: [] })
  }

  // Authenticate via session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.session?.activeOrganizationId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const orgId = session.session.activeOrganizationId
  const url = new URL(req.url)
  const since = Number(url.searchParams.get("since") ?? "0")

  const events = await getSyncEvents(orgId, since)

  return Response.json({ available: true, events })
}
