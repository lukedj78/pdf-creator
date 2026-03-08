import { describe, it, expect } from "vitest"
import { appRouter, createCaller } from "../index"
import type { Context } from "../trpc"

function createMockDb() {
  return {} as Context["db"]
}

function createUnauthenticatedContext(): Context {
  return { db: createMockDb(), session: null }
}

function createAuthenticatedContext(
  overrides?: Partial<NonNullable<Context["session"]>>
): Context {
  return {
    db: createMockDb(),
    session: {
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
      },
      session: {
        id: "session-1",
        activeOrganizationId: null,
      },
      ...overrides,
    },
  }
}

function createOrgContext(orgId = "org-1"): Context {
  return createAuthenticatedContext({
    session: { id: "session-1", activeOrganizationId: orgId },
  })
}

describe("tRPC Procedures", () => {
  describe("protectedProcedure", () => {
    it("should reject unauthenticated requests", async () => {
      const caller = createCaller(createUnauthenticatedContext())
      await expect(caller.templates.list()).rejects.toThrow("UNAUTHORIZED")
    })
  })

  describe("orgProcedure", () => {
    it("should reject requests without active organization", async () => {
      const caller = createCaller(createAuthenticatedContext())
      await expect(caller.templates.list()).rejects.toThrow(
        "No active organization selected"
      )
    })
  })

  describe("Router structure", () => {
    it("should have all expected template procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("templates.list")
      expect(procedures).toContain("templates.getById")
      expect(procedures).toContain("templates.create")
      expect(procedures).toContain("templates.update")
      expect(procedures).toContain("templates.delete")
      expect(procedures).toContain("templates.duplicate")
    })

    it("should have all expected generation procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("generations.list")
      expect(procedures).toContain("generations.getById")
      expect(procedures).toContain("generations.delete")
    })

    it("should have all expected chat procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("chat.listSessions")
      expect(procedures).toContain("chat.getMessages")
      expect(procedures).toContain("chat.createSession")
    })

    it("should have all expected webhook procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("webhooks.list")
      expect(procedures).toContain("webhooks.create")
      expect(procedures).toContain("webhooks.delete")
      expect(procedures).toContain("webhooks.toggle")
    })

    it("should have all expected organization procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("organization.get")
      expect(procedures).toContain("organization.listMembers")
      expect(procedures).toContain("organization.myRole")
    })

    it("should have all expected user preferences procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("userPreferences.get")
      expect(procedures).toContain("userPreferences.update")
    })

    it("should have all expected activity log procedures", () => {
      const procedures = Object.keys(appRouter._def.procedures)
      expect(procedures).toContain("activityLog.list")
    })

    it("should have the correct total number of routers", () => {
      const allProcedures = Object.keys(appRouter._def.procedures)
      const routerPrefixes = new Set(allProcedures.map((p) => p.split(".")[0]))
      expect(routerPrefixes).toEqual(
        new Set(["templates", "generations", "chat", "webhooks", "organization", "userPreferences", "activityLog"])
      )
    })
  })

  describe("protectedProcedure - more cases", () => {
    it("should reject unauthenticated requests for generations", async () => {
      const caller = createCaller(createUnauthenticatedContext())
      await expect(caller.generations.list()).rejects.toThrow("UNAUTHORIZED")
    })

    it("should reject unauthenticated requests for chat", async () => {
      const caller = createCaller(createUnauthenticatedContext())
      await expect(caller.chat.listSessions()).rejects.toThrow("UNAUTHORIZED")
    })

    it("should reject unauthenticated requests for webhooks", async () => {
      const caller = createCaller(createUnauthenticatedContext())
      await expect(caller.webhooks.list()).rejects.toThrow("UNAUTHORIZED")
    })

    it("should reject unauthenticated requests for user preferences", async () => {
      const caller = createCaller(createUnauthenticatedContext())
      await expect(caller.userPreferences.get()).rejects.toThrow("UNAUTHORIZED")
    })
  })

  describe("orgProcedure - more cases", () => {
    it("should reject generations without active organization", async () => {
      const caller = createCaller(createAuthenticatedContext())
      await expect(caller.generations.list()).rejects.toThrow(
        "No active organization selected"
      )
    })

    it("should reject webhooks without active organization", async () => {
      const caller = createCaller(createAuthenticatedContext())
      await expect(caller.webhooks.list()).rejects.toThrow(
        "No active organization selected"
      )
    })
  })
})
