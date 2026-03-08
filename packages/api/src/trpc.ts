import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { eq, and } from "drizzle-orm"
import { member } from "@workspace/db/schema"
import { ac, orgRoles } from "@workspace/auth/permissions"
import type { Database } from "@workspace/db"

export type Context = {
  db: Database
  session: {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      role?: string | null
    }
    session: {
      id: string
      activeOrganizationId?: string | null
    }
  } | null
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure
export const createCallerFactory = t.createCallerFactory

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  })
})

// Platform admin — requires user.role = "admin" or "superadmin"
const ADMIN_ROLES = ["superadmin", "admin"]

export const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ADMIN_ROLES.includes(ctx.session.user.role ?? "")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Platform admin access required",
    })
  }
  return next({ ctx })
})

export const orgProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.session.activeOrganizationId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active organization selected",
    })
  }
  return next({
    ctx: {
      ...ctx,
      organizationId: ctx.session.session.activeOrganizationId,
    },
  })
})

// ---------------------------------------------------------------------------
// Permission-checked procedure — checks org role against ac permissions
// Usage: orgProcedureWith({ template: ["create"] })
// ---------------------------------------------------------------------------
type Statement = typeof ac extends { statements: infer S } ? S : never
type Permissions = { [K in keyof Statement]?: Statement[K][number][] }

export function orgProcedureWith(requiredPermissions: Permissions) {
  return orgProcedure.use(async ({ ctx, next }) => {
    const [m] = await ctx.db
      .select({ role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, ctx.organizationId),
          eq(member.userId, ctx.session.user.id)
        )
      )
      .limit(1)

    if (!m) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organization" })
    }

    const roleDef = orgRoles[m.role as keyof typeof orgRoles]
    if (!roleDef) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Unknown role" })
    }

    // Check each required permission against the role
    for (const [resource, actions] of Object.entries(requiredPermissions)) {
      const roleStatements = roleDef.statements as Record<string, string[]>
      const allowed = roleStatements[resource] ?? []
      for (const action of actions ?? []) {
        if (!allowed.includes(action)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Missing permission: ${resource}:${action}`,
          })
        }
      }
    }

    return next({
      ctx: { ...ctx, memberRole: m.role },
    })
  })
}
