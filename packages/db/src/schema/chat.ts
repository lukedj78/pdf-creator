import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { templates } from "./templates"
import { createId } from "./utils"

export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey().$defaultFn(createId),
  templateId: text("template_id").references(() => templates.id, {
    onDelete: "set null",
  }),
  templateSchema: jsonb("template_schema"),
  organizationId: text("organization_id").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(createId),
  sessionId: text("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type ChatSession = typeof chatSessions.$inferSelect
export type NewChatSession = typeof chatSessions.$inferInsert
export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert
