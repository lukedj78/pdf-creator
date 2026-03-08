import { z } from "zod"
import { eq, and, desc } from "drizzle-orm"
import { generations, templates } from "@workspace/db/schema"
import { router, orgProcedureWith } from "../trpc"
import { templateSchema, toSpec } from "@workspace/template-engine/schema"

export const generationsRouter = router({
  list: orgProcedureWith({ generation: ["read"] })
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { limit = 20, offset = 0 } = input ?? {}
      return ctx.db
        .select({
          id: generations.id,
          templateId: generations.templateId,
          templateName: templates.name,
          data: generations.data,
          outputUrl: generations.outputUrl,
          status: generations.status,
          format: generations.format,
          organizationId: generations.organizationId,
          createdBy: generations.createdBy,
          createdAt: generations.createdAt,
        })
        .from(generations)
        .leftJoin(templates, eq(generations.templateId, templates.id))
        .where(eq(generations.organizationId, ctx.organizationId))
        .orderBy(desc(generations.createdAt))
        .limit(limit)
        .offset(offset)
    }),

  getById: orgProcedureWith({ generation: ["read"] })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [generation] = await ctx.db
        .select()
        .from(generations)
        .where(
          and(
            eq(generations.id, input.id),
            eq(generations.organizationId, ctx.organizationId)
          )
        )
      return generation ?? null
    }),

  /** Export a JSON spec from a template, optionally merging state data */
  exportSpec: orgProcedureWith({ generation: ["create"] })
    .input(
      z.union([
        z.object({
          templateId: z.string(),
          data: z.record(z.unknown()).optional(),
        }),
        z.object({
          template: templateSchema,
          data: z.record(z.unknown()).optional(),
        }),
      ])
    )
    .mutation(async ({ ctx, input }) => {
      const { data } = input
      let template: z.infer<typeof templateSchema>
      let templateId: string

      if ("templateId" in input) {
        templateId = input.templateId
        const [dbTemplate] = await ctx.db
          .select()
          .from(templates)
          .where(
            and(
              eq(templates.id, input.templateId),
              eq(templates.organizationId, ctx.organizationId)
            )
          )

        if (!dbTemplate) {
          throw new Error("Template not found")
        }

        template = templateSchema.parse({
          id: dbTemplate.id,
          name: dbTemplate.name,
          ...(dbTemplate.schema as Record<string, unknown>),
        })
      } else {
        template = input.template
        templateId = template.id
      }

      // Merge provided data into template state
      if (data) {
        template = { ...template, state: { ...template.state, ...data } }
      }

      // Extract json-render compatible spec
      const spec = toSpec(template)

      // Record the export
      const [generation] = await ctx.db
        .insert(generations)
        .values({
          templateId,
          data: data as Record<string, unknown>,
          format: "json",
          status: "completed",
          organizationId: ctx.organizationId,
          createdBy: ctx.session.user.id,
        })
        .returning()

      return {
        id: generation!.id,
        spec,
      }
    }),

  delete: orgProcedureWith({ generation: ["delete"] })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(generations)
        .where(
          and(
            eq(generations.id, input.id),
            eq(generations.organizationId, ctx.organizationId)
          )
        )
      return { success: true }
    }),
})
