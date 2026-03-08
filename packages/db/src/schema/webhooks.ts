import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core"
import { createId } from "./utils"

export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey().$defaultFn(createId),
  url: text("url").notNull(),
  events: jsonb("events").notNull().$type<string[]>(),
  secret: text("secret").notNull(),
  organizationId: text("organization_id").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type Webhook = typeof webhooks.$inferSelect
export type NewWebhook = typeof webhooks.$inferInsert
