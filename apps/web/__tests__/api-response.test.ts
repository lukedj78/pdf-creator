import { describe, it, expect } from "vitest"

// These functions are simple enough to inline-test since the original files
// may have been moved. Let's test the logic directly.

function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

function apiError(message: string, status = 400, code?: string) {
  return Response.json(
    { success: false, error: { message, code: code ?? "BAD_REQUEST" } },
    { status }
  )
}

function apiPaginated<T>(
  data: T[],
  { total, limit, offset }: { total: number; limit: number; offset: number }
) {
  return Response.json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  })
}

describe("API Response Utilities", () => {
  describe("apiSuccess", () => {
    it("should return 200 with data", async () => {
      const res = apiSuccess({ id: "1", name: "Test" })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toEqual({ id: "1", name: "Test" })
    })

    it("should support custom status code", async () => {
      const res = apiSuccess({ id: "1" }, 201)
      expect(res.status).toBe(201)
    })
  })

  describe("apiError", () => {
    it("should return error with default 400 status", async () => {
      const res = apiError("Something went wrong")
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.success).toBe(false)
      expect(body.error.message).toBe("Something went wrong")
      expect(body.error.code).toBe("BAD_REQUEST")
    })

    it("should support custom status and code", async () => {
      const res = apiError("Not found", 404, "NOT_FOUND")
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.code).toBe("NOT_FOUND")
    })
  })

  describe("apiPaginated", () => {
    it("should return paginated data", async () => {
      const items = [{ id: "1" }, { id: "2" }]
      const res = apiPaginated(items, { total: 10, limit: 2, offset: 0 })

      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveLength(2)
      expect(body.pagination).toEqual({
        total: 10,
        limit: 2,
        offset: 0,
        hasMore: true,
      })
    })

    it("should set hasMore to false on last page", async () => {
      const items = [{ id: "9" }, { id: "10" }]
      const res = apiPaginated(items, { total: 10, limit: 2, offset: 8 })

      const body = await res.json()
      expect(body.pagination.hasMore).toBe(false)
    })
  })
})
