import { router, createCallerFactory } from "./trpc"
import { templatesRouter } from "./routers/templates"
import { generationsRouter } from "./routers/generations"
import { chatRouter } from "./routers/chat"
import { webhooksRouter } from "./routers/webhooks"
import { organizationRouter } from "./routers/organization"
import { userPreferencesRouter } from "./routers/user-preferences"
import { activityLogRouter } from "./routers/activity-log"
import { billingRouter } from "./routers/billing"

export const appRouter = router({
  templates: templatesRouter,
  generations: generationsRouter,
  chat: chatRouter,
  webhooks: webhooksRouter,
  organization: organizationRouter,
  userPreferences: userPreferencesRouter,
  activityLog: activityLogRouter,
  billing: billingRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)

export { type Context } from "./trpc"
