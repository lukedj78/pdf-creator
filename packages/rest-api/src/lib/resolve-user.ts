import { db } from "@workspace/db"
import { member } from "@workspace/db/schema"
import { eq } from "@workspace/db"
import type { Context } from "@workspace/api"

/**
 * Build a tRPC context from an API key's org reference.
 * Looks up a real member of the organization to use as the acting user.
 */
export async function buildApiContext(referenceId: string): Promise<Context> {
  const [m] = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, referenceId))
    .limit(1)

  return {
    db,
    session: {
      user: { id: m?.userId ?? referenceId, name: "", email: "" },
      session: { id: "", activeOrganizationId: referenceId },
    },
  }
}
