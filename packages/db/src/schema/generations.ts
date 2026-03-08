import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { templates } from "./templates"
import { createId } from "./utils"

export const generations = pgTable("generations", {
  id: text("id").primaryKey().$defaultFn(createId),
  templateId: text("template_id")
    .references(() => templates.id, { onDelete: "cascade" }),
  data: jsonb("data").$type<Record<string, unknown>>(),
  outputUrl: text("output_url"),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .default("pending")
    .notNull(),
  format: text("format", { enum: ["json", "pdf", "png", "jpg"] })
    .default("json")
    .notNull(),
  callbackUrl: text("callback_url"),
  organizationId: text("organization_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Generation = typeof generations.$inferSelect
export type NewGeneration = typeof generations.$inferInsert
