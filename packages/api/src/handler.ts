import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "./index"
import type { Context } from "./trpc"

export function createFetchHandler(createContext: () => Promise<Context>) {
  return async (req: Request) => {
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext,
    })
  }
}
