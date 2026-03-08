import type { Context } from "hono"

export function apiSuccess<T>(c: Context, data: T, status = 200) {
  return c.json({ success: true, data }, status as 200)
}

export function apiError(c: Context, message: string, status = 400, code?: string) {
  return c.json(
    { success: false, error: { message, code: code ?? "BAD_REQUEST" } },
    status as 400
  )
}
