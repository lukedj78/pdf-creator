import { createMiddleware } from "hono/factory"
import { auth } from "@workspace/auth"
import { rateLimit } from "../lib/rate-limit"

export type ApiKeyContext = {
  keyId: string
  referenceId: string
}

export type ApiEnv = {
  Variables: {
    apiKey: ApiKeyContext
  }
}

export const apiKeyMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  const header = c.req.header("authorization")

  if (!header?.startsWith("Bearer ")) {
    return c.json(
      { success: false, error: { message: "Missing or invalid Authorization header", code: "UNAUTHORIZED" } },
      401
    )
  }

  const key = header.slice(7)

  try {
    const result = await auth.api.verifyApiKey({ body: { key } })

    if (!result?.valid) {
      return c.json(
        { success: false, error: { message: "Invalid API key", code: "UNAUTHORIZED" } },
        401
      )
    }

    c.set("apiKey", {
      keyId: result.key?.id ?? "",
      referenceId: result.key?.referenceId ?? "",
    })
  } catch {
    return c.json(
      { success: false, error: { message: "Invalid API key", code: "UNAUTHORIZED" } },
      401
    )
  }

  // Rate limit
  const apiKey = c.get("apiKey")
  const rateLimitResult = await rateLimit(apiKey.keyId)

  if (!rateLimitResult.success) {
    return c.json(
      { success: false, error: { message: "Rate limit exceeded. Please try again later.", code: "RATE_LIMIT_EXCEEDED" } },
      429
    )
  }

  await next()

  // Attach rate limit headers
  if (rateLimitResult.remaining >= 0) {
    c.header("X-RateLimit-Limit", String(rateLimitResult.limit))
    c.header("X-RateLimit-Remaining", String(rateLimitResult.remaining))
  }
})
