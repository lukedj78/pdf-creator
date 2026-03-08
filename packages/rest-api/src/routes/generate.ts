import { Hono } from "hono"
import { z } from "zod"
import { templateSchema, toSpec } from "@workspace/template-engine/schema"
import { db } from "@workspace/db"
import { templates, generations } from "@workspace/db/schema"
import { eq } from "@workspace/db"
import { dispatchWebhookEvent, fireCallback } from "@workspace/api/lib/webhook-dispatcher"
import { buildApiContext } from "../lib/resolve-user"
import { apiError } from "../lib/response"
import { recordSyncEvent } from "../lib/sync"
import type { ApiEnv } from "../middleware/api-key"

const generate = new Hono<ApiEnv>()

const exportBodySchema = z.union([
  z.object({
    templateId: z.string(),
    data: z.record(z.unknown()).optional(),
    callbackUrl: z.string().url().optional(),
  }),
  z.object({
    template: templateSchema,
    data: z.record(z.unknown()).optional(),
    callbackUrl: z.string().url().optional(),
  }),
])

generate.post("/", async (c) => {
  const apiKey = c.get("apiKey")

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return apiError(c, "Invalid JSON body", 400)
  }

  const parsed = exportBodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError(c, "Invalid request body: templateId or template object required", 400)
  }

  const { data, callbackUrl } = parsed.data
  let template: z.infer<typeof templateSchema>
  let templateId: string | undefined

  if ("templateId" in parsed.data) {
    templateId = parsed.data.templateId
    const [dbTemplate] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, parsed.data.templateId))

    if (!dbTemplate) {
      return apiError(c, "Template not found", 404, "NOT_FOUND")
    }

    template = templateSchema.parse({
      id: dbTemplate.id,
      name: dbTemplate.name,
      ...(dbTemplate.schema as Record<string, unknown>),
    })
  } else {
    template = parsed.data.template
    templateId = undefined
  }

  try {
    if (data) {
      template = { ...template, state: { ...template.state, ...data } }
    }

    const spec = toSpec(template)

    const ctx = await buildApiContext(apiKey.referenceId)
    const actingUserId = ctx.session?.user?.id ?? apiKey.referenceId

    const [generation] = await db
      .insert(generations)
      .values({
        templateId: templateId ?? null,
        data: data as Record<string, unknown>,
        format: "json",
        status: "completed",
        organizationId: apiKey.referenceId,
        createdBy: actingUserId,
      })
      .returning()

    if (callbackUrl) {
      fireCallback(callbackUrl, {
        event: "export.completed",
        generationId: generation!.id,
        templateId: templateId ?? null,
      })
    }

    dispatchWebhookEvent(db, apiKey.referenceId, "export.completed", {
      generationId: generation!.id,
      templateId: templateId ?? null,
    })

    if (templateId) {
      recordSyncEvent(apiKey.referenceId, templateId, "generation.completed")
    }
    return c.json({ success: true, data: { id: generation!.id, spec } })
  } catch (error) {
    const ctx = await buildApiContext(apiKey.referenceId)
    const actingUserId = ctx.session?.user?.id ?? apiKey.referenceId

    const [generation] = await db
      .insert(generations)
      .values({
        templateId: templateId ?? null,
        data: data as Record<string, unknown>,
        format: "json",
        status: "failed",
        organizationId: apiKey.referenceId,
        createdBy: actingUserId,
      })
      .returning()

    if (callbackUrl) {
      fireCallback(callbackUrl, {
        event: "export.failed",
        generationId: generation!.id,
        templateId: templateId ?? null,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    dispatchWebhookEvent(db, apiKey.referenceId, "export.failed", {
      generationId: generation!.id,
      templateId: templateId ?? null,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    console.error("Spec export failed:", error)
    return apiError(c, "Spec export failed", 500, "EXPORT_ERROR")
  }
})

export default generate
