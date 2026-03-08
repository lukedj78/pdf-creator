import { describe, it, expect, vi, beforeEach } from "vitest"
import { SpecDesignerClient, PdfGeneratorClient } from "../client"
import { SpecDesignerError, PdfGeneratorError } from "../types"

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

describe("SpecDesignerClient", () => {
  let client: SpecDesignerClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new SpecDesignerClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.example.com/",
    })
  })

  function mockSuccess(data: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status,
      json: () => Promise.resolve({ success: true, data }),
    })
  }

  function mockError(message: string, code: string, status: number) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve({ error: { message, code } }),
    })
  }

  describe("constructor", () => {
    it("should strip trailing slash from baseUrl", () => {
      const c = new SpecDesignerClient({
        apiKey: "key",
        baseUrl: "https://api.example.com/",
      })
      mockSuccess([])
      c.listTemplates()
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates",
        expect.any(Object)
      )
    })
  })

  describe("request headers", () => {
    it("should include Authorization and Content-Type", async () => {
      mockSuccess([])
      await client.listTemplates()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
        })
      )
    })
  })

  describe("error handling", () => {
    it("should throw SpecDesignerError on API error", async () => {
      mockError("Not found", "NOT_FOUND", 404)

      await expect(client.getTemplate("x")).rejects.toThrow(SpecDesignerError)
      await expect(
        client.getTemplate("x").catch((e) => {
          throw e
        })
      ).rejects.toMatchObject({
        message: expect.any(String),
      })
    })

    it("should throw with fallback message on parse error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("parse error")),
      })

      await expect(client.listTemplates()).rejects.toThrow(
        "Request failed with status 500"
      )
    })

    it("should include status and code in error", async () => {
      mockError("Unauthorized", "UNAUTHORIZED", 401)

      try {
        await client.getTemplate("x")
        expect.unreachable("should have thrown")
      } catch (e) {
        expect(e).toBeInstanceOf(SpecDesignerError)
        expect((e as SpecDesignerError).status).toBe(401)
        expect((e as SpecDesignerError).code).toBe("UNAUTHORIZED")
      }
    })
  })

  describe("listTemplates", () => {
    it("should fetch templates", async () => {
      const templates = [{ id: "1", name: "Invoice" }]
      mockSuccess(templates)

      const result = await client.listTemplates()
      expect(result).toEqual(templates)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates",
        expect.objectContaining({ headers: expect.any(Object) })
      )
    })
  })

  describe("getTemplate", () => {
    it("should fetch a template by id", async () => {
      const template = { id: "tmpl-1", name: "Invoice" }
      mockSuccess(template)

      const result = await client.getTemplate("tmpl-1")
      expect(result).toEqual(template)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates/tmpl-1",
        expect.any(Object)
      )
    })
  })

  describe("createTemplate", () => {
    it("should POST to create template", async () => {
      const created = { id: "new-1", name: "New" }
      mockSuccess(created)

      const result = await client.createTemplate({
        name: "New",
        schema: { root: "doc", elements: {} },
      })
      expect(result).toEqual(created)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "New", schema: { root: "doc", elements: {} } }),
        })
      )
    })
  })

  describe("updateTemplate", () => {
    it("should PUT to update template", async () => {
      const updated = { id: "tmpl-1", name: "Updated" }
      mockSuccess(updated)

      const result = await client.updateTemplate("tmpl-1", { name: "Updated" })
      expect(result).toEqual(updated)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates/tmpl-1",
        expect.objectContaining({ method: "PUT" })
      )
    })
  })

  describe("deleteTemplate", () => {
    it("should DELETE template", async () => {
      mockSuccess(null)

      await client.deleteTemplate("tmpl-1")
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates/tmpl-1",
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  describe("duplicateTemplate", () => {
    it("should POST to duplicate", async () => {
      const dup = { id: "dup-1", name: "Invoice (copy)" }
      mockSuccess(dup)

      const result = await client.duplicateTemplate("tmpl-1")
      expect(result).toEqual(dup)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/templates/tmpl-1/duplicate",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  describe("exportSpec", () => {
    it("should POST to generate", async () => {
      const spec = { id: "gen-1", spec: { root: "doc", elements: {}, state: {} } }
      mockSuccess(spec)

      const result = await client.exportSpec({ templateId: "tmpl-1" })
      expect(result).toEqual(spec)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/generate",
        expect.objectContaining({ method: "POST" })
      )
    })

    it("should support inline template export", async () => {
      mockSuccess({ id: "gen-2", spec: {} })

      await client.exportSpec({ template: { root: "doc", elements: {} } })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ template: { root: "doc", elements: {} } }),
        })
      )
    })
  })

  describe("listGenerations", () => {
    it("should fetch generations", async () => {
      mockSuccess([{ id: "gen-1" }])

      const result = await client.listGenerations()
      expect(result).toEqual([{ id: "gen-1" }])
    })

    it("should pass limit and offset as query params", async () => {
      mockSuccess([])

      await client.listGenerations({ limit: 10, offset: 20 })
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/generations?limit=10&offset=20",
        expect.any(Object)
      )
    })

    it("should omit empty query params", async () => {
      mockSuccess([])

      await client.listGenerations({})
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/generations",
        expect.any(Object)
      )
    })
  })

  describe("getGeneration", () => {
    it("should fetch a generation by id", async () => {
      mockSuccess({ id: "gen-1" })

      const result = await client.getGeneration("gen-1")
      expect(result).toEqual({ id: "gen-1" })
    })
  })

  describe("deleteGeneration", () => {
    it("should DELETE generation", async () => {
      mockSuccess(null)

      await client.deleteGeneration("gen-1")
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/api/v1/generations/gen-1",
        expect.objectContaining({ method: "DELETE" })
      )
    })
  })

  describe("getUsage", () => {
    it("should fetch usage info", async () => {
      const usage = { rateLimit: { limit: 100, remaining: 90, window: "1h" } }
      mockSuccess(usage)

      const result = await client.getUsage()
      expect(result).toEqual(usage)
    })
  })
})

describe("PdfGeneratorClient", () => {
  it("should be an alias for SpecDesignerClient", () => {
    expect(PdfGeneratorClient).toBe(SpecDesignerClient)
  })
})

describe("SpecDesignerError", () => {
  it("should have name, code, status, and message", () => {
    const err = new SpecDesignerError("Not found", "NOT_FOUND", 404)
    expect(err.name).toBe("SpecDesignerError")
    expect(err.message).toBe("Not found")
    expect(err.code).toBe("NOT_FOUND")
    expect(err.status).toBe(404)
    expect(err).toBeInstanceOf(Error)
  })
})

describe("PdfGeneratorError", () => {
  it("should be an alias for SpecDesignerError", () => {
    expect(PdfGeneratorError).toBe(SpecDesignerError)
  })
})
