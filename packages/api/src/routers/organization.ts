import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import {
  organization,
  member,
  invitation,
  user,
} from "@workspace/db/schema"
import { router, orgProcedure, orgProcedureWith } from "../trpc"
import { recordActivity } from "./activity-log"

export const organizationRouter = router({
  get: orgProcedure.query(async ({ ctx }) => {
    const [org] = await ctx.db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organizationId))
      .limit(1)

    if (!org) throw new TRPCError({ code: "NOT_FOUND" })
    return org
  }),

  update: orgProcedureWith({ organization: ["update"] })
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        slug: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9-]+$/)
          .optional(),
        logo: z.string().url().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.slug) {
        const [existing] = await ctx.db
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.slug, input.slug))
          .limit(1)

        if (existing && existing.id !== ctx.organizationId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Slug already taken",
          })
        }
      }

      const updates: Record<string, unknown> = {}
      if (input.name !== undefined) updates.name = input.name
      if (input.slug !== undefined) updates.slug = input.slug
      if (input.logo !== undefined) updates.logo = input.logo

      if (Object.keys(updates).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No updates provided" })
      }

      const [org] = await ctx.db
        .update(organization)
        .set(updates)
        .where(eq(organization.id, ctx.organizationId))
        .returning()

      await recordActivity(ctx.db, {
        organizationId: ctx.organizationId,
        actorId: ctx.session.user.id,
        action: "organization.updated",
        targetType: "organization",
        targetId: ctx.organizationId,
        metadata: updates,
      })

      return org
    }),

  listMembers: orgProcedure.query(async ({ ctx }) => {
    const members = await ctx.db
      .select({
        id: member.id,
        role: member.role,
        createdAt: member.createdAt,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, ctx.organizationId))

    return members
  }),

  updateMemberRole: orgProcedureWith({ member: ["update"] })
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["admin", "member", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(member)
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!target) throw new TRPCError({ code: "NOT_FOUND" })

      if (target.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot change owner role",
        })
      }

      const previousRole = target.role

      const [updated] = await ctx.db
        .update(member)
        .set({ role: input.role })
        .where(eq(member.id, input.memberId))
        .returning()

      await recordActivity(ctx.db, {
        organizationId: ctx.organizationId,
        actorId: ctx.session.user.id,
        action: "member.role_changed",
        targetType: "member",
        targetId: target.userId,
        metadata: { previousRole, newRole: input.role },
      })

      return updated
    }),

  removeMember: orgProcedureWith({ member: ["delete"] })
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [target] = await ctx.db
        .select()
        .from(member)
        .where(
          and(
            eq(member.id, input.memberId),
            eq(member.organizationId, ctx.organizationId)
          )
        )
        .limit(1)

      if (!target) throw new TRPCError({ code: "NOT_FOUND" })

      if (target.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove the owner",
        })
      }

      if (target.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove yourself",
        })
      }

      await ctx.db
        .delete(member)
        .where(eq(member.id, input.memberId))

      await recordActivity(ctx.db, {
        organizationId: ctx.organizationId,
        actorId: ctx.session.user.id,
        action: "member.removed",
        targetType: "member",
        targetId: target.userId,
      })

      return { success: true }
    }),

  listInvitations: orgProcedureWith({ invitation: ["create"] }).query(async ({ ctx }) => {
    const invitations = await ctx.db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        inviterName: user.name,
      })
      .from(invitation)
      .innerJoin(user, eq(invitation.inviterId, user.id))
      .where(
        and(
          eq(invitation.organizationId, ctx.organizationId),
          eq(invitation.status, "pending")
        )
      )

    return invitations
  }),

  createInvitation: orgProcedureWith({ invitation: ["create"] })
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member", "viewer"]).default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existingUser] = await ctx.db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email))
        .limit(1)

      if (existingUser) {
        const [existingMember] = await ctx.db
          .select({ id: member.id })
          .from(member)
          .where(
            and(
              eq(member.organizationId, ctx.organizationId),
              eq(member.userId, existingUser.id)
            )
          )
          .limit(1)

        if (existingMember) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this organization",
          })
        }
      }

      const [existingInvite] = await ctx.db
        .select({ id: invitation.id })
        .from(invitation)
        .where(
          and(
            eq(invitation.organizationId, ctx.organizationId),
            eq(invitation.email, input.email),
            eq(invitation.status, "pending")
          )
        )
        .limit(1)

      if (existingInvite) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An invitation is already pending for this email",
        })
      }

      const [inv] = await ctx.db
        .insert(invitation)
        .values({
          id: crypto.randomUUID(),
          organizationId: ctx.organizationId,
          email: input.email,
          role: input.role,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          inviterId: ctx.session.user.id,
        })
        .returning()

      await recordActivity(ctx.db, {
        organizationId: ctx.organizationId,
        actorId: ctx.session.user.id,
        action: "invitation.sent",
        targetType: "invitation",
        targetId: inv!.id,
        metadata: { email: input.email, role: input.role },
      })

      return inv
    }),

  cancelInvitation: orgProcedureWith({ invitation: ["cancel"] })
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(invitation)
        .where(
          and(
            eq(invitation.id, input.invitationId),
            eq(invitation.organizationId, ctx.organizationId)
          )
        )

      await recordActivity(ctx.db, {
        organizationId: ctx.organizationId,
        actorId: ctx.session.user.id,
        action: "invitation.cancelled",
        targetType: "invitation",
        targetId: input.invitationId,
      })

      return { success: true }
    }),

  myRole: orgProcedure.query(async ({ ctx }) => {
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

    return m?.role ?? "member"
  }),

  leave: orgProcedure.mutation(async ({ ctx }) => {
    const [m] = await ctx.db
      .select()
      .from(member)
      .where(
        and(
          eq(member.organizationId, ctx.organizationId),
          eq(member.userId, ctx.session.user.id)
        )
      )
      .limit(1)

    if (!m) throw new TRPCError({ code: "NOT_FOUND" })

    if (m.role === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Owner cannot leave. Transfer ownership first.",
      })
    }

    await ctx.db.delete(member).where(eq(member.id, m.id))

    await recordActivity(ctx.db, {
      organizationId: ctx.organizationId,
      actorId: ctx.session.user.id,
      action: "member.left",
      targetType: "member",
      targetId: ctx.session.user.id,
    })

    return { success: true }
  }),

  delete: orgProcedureWith({ organization: ["delete"] }).mutation(async ({ ctx }) => {
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

    if (!m || m.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the owner can delete the organization",
      })
    }

    await ctx.db
      .delete(organization)
      .where(eq(organization.id, ctx.organizationId))

    return { success: true }
  }),
})
