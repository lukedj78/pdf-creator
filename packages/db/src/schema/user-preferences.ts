import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { user } from "./auth"

export const userPreferences = pgTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .unique(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  marketingEmails: boolean("marketing_emails").default(false).notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}))
