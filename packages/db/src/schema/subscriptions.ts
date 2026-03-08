import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createId } from "./utils"
import { relations } from "drizzle-orm"
import { organization } from "./auth"

export const subscription = pgTable("subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  polarSubscriptionId: text("polar_subscription_id").notNull().unique(),
  polarProductId: text("polar_product_id").notNull(),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] })
    .notNull()
    .default("free"),
  status: text("status", {
    enum: ["active", "canceled", "past_due", "trialing"],
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.organizationId],
    references: [organization.id],
  }),
}))
