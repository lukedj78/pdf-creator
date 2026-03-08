import { Hono } from "hono"
import { createCaller } from "@workspace/api"
import { buildApiContext } from "../lib/resolve-user"
import { apiSuccess, apiError } from "../lib/response"
import { recordSyncEvent } from "../lib/sync"
import type { ApiEnv } from "../middleware/api-key"

const templates = new Hono<ApiEnv>()

templates.get("/", async (c) => {
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const result = await caller.templates.list()
  return apiSuccess(c, result)
})

templates.post("/", async (c) => {
  const body = await c.req.json()

  if (!body.name || !body.schema) {
    return apiError(c, "Fields 'name' and 'schema' are required", 400)
  }

  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const template = await caller.templates.create({
    name: body.name,
    description: body.description,
    schema: body.schema,
    status: body.status ?? "draft",
  })
  recordSyncEvent(apiKey.referenceId, template!.id, "template.created")
  return apiSuccess(c, template, 201)
})

templates.get("/:id", async (c) => {
  const id = c.req.param("id")
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const template = await caller.templates.getById({ id })

  if (!template) return apiError(c, "Template not found", 404, "NOT_FOUND")
  return apiSuccess(c, template)
})

templates.put("/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const template = await caller.templates.update({
    id,
    name: body.name,
    description: body.description,
    schema: body.schema,
    status: body.status,
    isPublic: body.isPublic,
  })

  if (!template) return apiError(c, "Template not found", 404, "NOT_FOUND")
  recordSyncEvent(apiKey.referenceId, id, "template.updated")
  return apiSuccess(c, template)
})

templates.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  await caller.templates.delete({ id })
  recordSyncEvent(apiKey.referenceId, id, "template.deleted")
  return apiSuccess(c, { deleted: true })
})

templates.post("/:id/duplicate", async (c) => {
  const id = c.req.param("id")
  const apiKey = c.get("apiKey")
  const ctx = await buildApiContext(apiKey.referenceId)
  const caller = createCaller(ctx)
  const template = await caller.templates.duplicate({ id })

  if (!template) return apiError(c, "Template not found", 404, "NOT_FOUND")
  recordSyncEvent(apiKey.referenceId, template.id, "template.duplicated")
  return apiSuccess(c, template, 201)
})

export default templates
