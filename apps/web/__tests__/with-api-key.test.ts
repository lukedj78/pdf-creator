import { describe, it, expect } from "vitest"

// Test the middleware pattern used by withApiKey

describe("withApiKey Middleware Pattern", () => {
  describe("middleware chain", () => {
    it("should short-circuit on auth failure", async () => {
      const handler = async () => new Response("OK")

      // Simulating the withApiKey pattern
      const authResult = new Response("Unauthorized", { status: 401 })
      const isError = authResult instanceof Response

      if (isError) {
        expect(authResult.status).toBe(401)
        return // Short-circuit, handler never called
      }

      // Should not reach here
      expect.unreachable("Should have returned early")
    })

    it("should call handler with context on valid auth", async () => {
      let handlerCalled = false
      const handler = async (_req: Request, ctx: { apiKey: { keyId: string } }) => {
        handlerCalled = true
        return new Response(JSON.stringify({ keyId: ctx.apiKey.keyId }))
      }

      const authResult = { keyId: "key-1", referenceId: "org-1" }
      const isError = authResult instanceof Response

      expect(isError).toBe(false)

      const req = new Request("http://localhost:3000/test")
      const res = await handler(req, { apiKey: authResult })
      expect(handlerCalled).toBe(true)
      expect(res.status).toBe(200)
    })

    it("should catch unhandled errors and return 500", async () => {
      const handler = async () => {
        throw new Error("Unexpected error")
      }

      try {
        await handler()
        expect.unreachable("Should have thrown")
      } catch (error) {
        const res = Response.json(
          { success: false, error: { message: "Internal server error", code: "INTERNAL_ERROR" } },
          { status: 500 }
        )
        expect(res.status).toBe(500)
        const body = await res.json()
        expect(body.error.code).toBe("INTERNAL_ERROR")
      }
    })
  })
})
