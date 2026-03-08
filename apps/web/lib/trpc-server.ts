import "server-only"
import { headers } from "next/headers"
import { createCaller, type Context } from "@workspace/api"
import { auth } from "@workspace/auth"
import { db } from "@workspace/db"

export async function createServerCaller() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const ctx: Context = {
    db,
    session: session
      ? {
          user: session.user,
          session: session.session,
        }
      : null,
  }

  return createCaller(ctx)
}
