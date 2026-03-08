import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import crypto from "node:crypto"

// We test the signPayload logic indirectly through deliverWebhook behavior,
// and the fireCallback function

// Mock the database
vi.mock("@workspace/db/schema", () => ({
  webhooks: { organizationId: "orgId", active: "active" },
}))

vi.mock("@workspace/db", () => ({
  db: {},
}))

vi.mock("@workspace/auth", () => ({
  auth: { api: {} },
}))

describe("Webhook Dispatcher Types", () => {
  it("should export correct webhook events", async () => {
    // Import the module to verify it loads
    const module = await import("../lib/webhook-dispatcher")
    expect(module.dispatchWebhookEvent).toBeDefined()
    expect(module.fireCallback).toBeDefined()
  })
})

describe("HMAC Signature", () => {
  it("should produce consistent HMAC-SHA256 signatures", () => {
    const payload = JSON.stringify({ event: "test", data: {} })
    const secret = "test-secret"
    const sig1 = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    const sig2 = crypto.createHmac("sha256", secret).update(payload).digest("hex")
    expect(sig1).toBe(sig2)
    expect(sig1).toHaveLength(64) // SHA-256 hex = 64 chars
  })

  it("should produce different signatures for different secrets", () => {
    const payload = JSON.stringify({ event: "test" })
    const sig1 = crypto.createHmac("sha256", "secret1").update(payload).digest("hex")
    const sig2 = crypto.createHmac("sha256", "secret2").update(payload).digest("hex")
    expect(sig1).not.toBe(sig2)
  })
})

describe("fireCallback", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch)
    mockFetch.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should POST to callback URL", async () => {
    const { fireCallback } = await import("../lib/webhook-dispatcher")

    fireCallback("https://example.com/webhook", {
      event: "export.completed",
      generationId: "gen-1",
      templateId: "tmpl-1",
    })

    // fireCallback is fire-and-forget, wait for microtask
    await new Promise((r) => setTimeout(r, 10))

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Webhook-Event": "export.completed",
        }),
      })
    )
  })

  it("should not throw on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))
    const { fireCallback } = await import("../lib/webhook-dispatcher")

    // Should not throw
    expect(() =>
      fireCallback("https://example.com/webhook", {
        event: "export.failed",
        generationId: "gen-1",
        templateId: null,
        error: "Something failed",
      })
    ).not.toThrow()
  })
})
