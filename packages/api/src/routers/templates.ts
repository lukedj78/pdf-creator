import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { eq, and, desc, ilike, or, count, asc, gte, lte } from "drizzle-orm"
import { templates } from "@workspace/db/schema"
import { router, orgProcedureWith, publicProcedure } from "../trpc"
import { dispatchWebhookEvent } from "../lib/webhook-dispatcher"
import { getOrgPlan, PLAN_LIMITS } from "../lib/quota"

export const templatesRouter = router({
  list: orgProcedureWith({ template: ["read"] })
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["draft", "published"]).optional(),
          dateFrom: z.string().datetime().optional(),
          dateTo: z.string().datetime().optional(),
          sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("updatedAt"),
          sortOrder: z.enum(["asc", "desc"]).default("desc"),
          page: z.number().int().min(1).default(1),
          perPage: z.number().int().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search,
        status,
        dateFrom,
        dateTo,
        sortBy = "updatedAt",
        sortOrder = "desc",
        page = 1,
        perPage = 20,
      } = input ?? {}

      const conditions = [eq(templates.organizationId, ctx.organizationId)]

      if (search) {
        conditions.push(
          or(
            ilike(templates.name, `%${search}%`),
            ilike(templates.description, `%${search}%`)
          )!
        )
      }

      if (status) {
        conditions.push(eq(templates.status, status))
      }

      if (dateFrom) {
        conditions.push(gte(templates.createdAt, new Date(dateFrom)))
      }

      if (dateTo) {
        conditions.push(lte(templates.createdAt, new Date(dateTo)))
      }

      const where = and(...conditions)
      const orderFn = sortOrder === "asc" ? asc : desc
      const orderCol =
        sortBy === "name"
          ? templates.name
          : sortBy === "createdAt"
            ? templates.createdAt
            : templates.updatedAt

      const [items, [countResult]] = await Promise.all([
        ctx.db
          .select()
          .from(templates)
          .where(where)
          .orderBy(orderFn(orderCol))
          .limit(perPage)
          .offset((page - 1) * perPage),
        ctx.db.select({ total: count() }).from(templates).where(where),
      ])

      const total = countResult?.total ?? 0

      return {
        items,
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      }
    }),

  getById: orgProcedureWith({ template: ["read"] })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [template] = await ctx.db
        .select()
        .from(templates)
        .where(
          and(
            eq(templates.id, input.id),
            eq(templates.organizationId, ctx.organizationId)
          )
        )
      return template ?? null
    }),

  create: orgProcedureWith({ template: ["create"] })
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        schema: z.record(z.unknown()),
        status: z.enum(["draft", "published"]).default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enforce template limit based on plan
      const plan = await getOrgPlan(ctx.db, ctx.organizationId)
      const limit = PLAN_LIMITS[plan].templates
      if (limit !== Infinity) {
        const [countResult] = await ctx.db
          .select({ total: count() })
          .from(templates)
          .where(eq(templates.organizationId, ctx.organizationId))
        if ((countResult?.total ?? 0) >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Template limit reached (${limit}). Upgrade your plan to create more templates.`,
          })
        }
      }

      const [template] = await ctx.db
        .insert(templates)
        .values({
          name: input.name,
          description: input.description,
          schema: input.schema,
          status: input.status,
          organizationId: ctx.organizationId,
          createdBy: ctx.session.user.id,
        })
        .returning()

      if (template) {
        dispatchWebhookEvent(ctx.db, ctx.organizationId, "template.created", {
          templateId: template.id,
          name: template.name,
          status: template.status,
        })
      }

      return template
    }),

  update: orgProcedureWith({ template: ["update"] })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        schema: z.record(z.unknown()).optional(),
        status: z.enum(["draft", "published"]).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      const [template] = await ctx.db
        .update(templates)
        .set(data)
        .where(
          and(
            eq(templates.id, id),
            eq(templates.organizationId, ctx.organizationId)
          )
        )
        .returning()

      if (template) {
        dispatchWebhookEvent(ctx.db, ctx.organizationId, "template.updated", {
          templateId: template.id,
          name: template.name,
          status: template.status,
          updatedFields: Object.keys(data),
        })
      }

      return template
    }),

  delete: orgProcedureWith({ template: ["delete"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(templates)
        .where(
          and(
            eq(templates.id, input.id),
            eq(templates.organizationId, ctx.organizationId)
          )
        )

      dispatchWebhookEvent(ctx.db, ctx.organizationId, "template.deleted", {
        templateId: input.id,
      })

      return { success: true }
    }),

  duplicate: orgProcedureWith({ template: ["duplicate"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [original] = await ctx.db
        .select()
        .from(templates)
        .where(
          and(
            eq(templates.id, input.id),
            eq(templates.organizationId, ctx.organizationId)
          )
        )

      if (!original) return null

      const [copy] = await ctx.db
        .insert(templates)
        .values({
          name: `${original.name} (Copy)`,
          description: original.description,
          schema: original.schema,
          status: "draft",
          organizationId: ctx.organizationId,
          createdBy: ctx.session.user.id,
        })
        .returning()

      return copy
    }),

  gallery: publicProcedure.query(async () => {
    const { defaultTemplates } = await import("@workspace/template-engine/defaults")
    const { getPageElementId } = await import("@workspace/template-engine/utils")
    return defaultTemplates.map((t) => {
      const pageId = getPageElementId(t)
      const pageProps = pageId ? (t.elements[pageId]?.props ?? {}) as Record<string, unknown> : {}
      return {
        id: t.id,
        name: t.name,
        description: t.meta?.description ?? `${t.name} template preset`,
        pageSize: (pageProps.size as string) ?? "A4",
        orientation: (pageProps.orientation as string) ?? "portrait",
        elementCount: Object.keys(t.elements).length,
      }
    })
  }),
})
