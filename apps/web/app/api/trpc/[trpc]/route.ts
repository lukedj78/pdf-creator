import { headers } from "next/headers"
import { createFetchHandler } from "@workspace/api/handler"
import { type Context } from "@workspace/api"
import { auth } from "@workspace/auth"
import { db } from "@workspace/db"

const handler = createFetchHandler(async (): Promise<Context> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return {
    db,
    session: session
      ? {
          user: session.user,
          session: session.session,
        }
      : null,
  }
})

export { handler as GET, handler as POST }
