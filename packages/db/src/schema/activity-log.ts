import { pgTable, text, timestamp, index, jsonb } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { user } from "./auth"
import { organization } from "./auth"

export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_orgId_idx").on(table.organizationId),
    index("activity_log_createdAt_idx").on(table.createdAt),
  ]
)

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  organization: one(organization, {
    fields: [activityLog.organizationId],
    references: [organization.id],
  }),
  actor: one(user, {
    fields: [activityLog.actorId],
    references: [user.id],
  }),
}))
