import { Hono } from "hono"
import { createCaller } from "@workspace/api"
import { buildApiContext } from "../lib/resolve-user"
import { apiSuccess, apiError } from "../lib/response"
import type { ApiEnv } from "../middleware/api-key"

const generations = new Hono<ApiEnv>()

generations.get("/", async (c) => {
  const apiKey = c.get("apiKey")
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100)
  const offset = Number(c.req.query("offset") ?? 0)

  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const result = await caller.generations.list({ limit, offset })
  return apiSuccess(c, result)
})

generations.get("/:id", async (c) => {
  const id = c.req.param("id")
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const generation = await caller.generations.getById({ id })

  if (!generation) return apiError(c, "Generation not found", 404, "NOT_FOUND")
  return apiSuccess(c, generation)
})

generations.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  await caller.generations.delete({ id })
  return apiSuccess(c, { deleted: true })
})

export default generations
