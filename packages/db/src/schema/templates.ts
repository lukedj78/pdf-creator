import { pgTable, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "./utils"

export const templateStatusEnum = pgEnum("template_status", ["draft", "published"])

export const templates = pgTable("templates", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  description: text("description"),
  schema: jsonb("schema").notNull().$type<Record<string, unknown>>(),
  thumbnail: text("thumbnail"),
  status: templateStatusEnum("status").default("draft").notNull(),
  organizationId: text("organization_id").notNull(),
  createdBy: text("created_by").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export type Template = typeof templates.$inferSelect
export type NewTemplate = typeof templates.$inferInsert
