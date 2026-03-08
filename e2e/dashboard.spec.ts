import { test, expect } from "@playwright/test"

const authHeaders = {
  Origin: "http://localhost:3000",
}

// Helper: create user and get authenticated page
async function loginUser(page: any, context: any) {
  const email = `dash-e2e-${Date.now()}@test.com`

  // Create user via API
  await context.request.post("http://localhost:3000/api/auth/sign-up/email", {
    data: { name: "Dashboard Test", email, password: "TestPassword123" },
    headers: authHeaders,
  })

  return email
}

test.describe("Dashboard - Unauthenticated", () => {
  test("should redirect all dashboard routes to login", async ({ page }) => {
    const routes = [
      "/dashboard",
      "/dashboard/templates",
      "/dashboard/exports",
      "/dashboard/api-keys",
      "/dashboard/chat",
      "/dashboard/settings",
    ]

    for (const route of routes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    }
  })
})

test.describe("Dashboard - Authenticated", () => {
  test("should show dashboard after login", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    // Should stay on dashboard (not redirect to login)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("should navigate to templates page", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard/templates")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/dashboard\/templates/)
  })

  test("should navigate to exports page", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard/exports")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/dashboard\/exports/)
  })

  test("should navigate to API keys page", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard/api-keys")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/dashboard\/api-keys/)
  })

  test("should navigate to settings page", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard/settings")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/dashboard\/settings/)
  })

  test("should navigate to docs page", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard/docs")
    await page.waitForLoadState("networkidle")

    await expect(page).toHaveURL(/\/dashboard\/docs/)
  })

  test("should show sidebar navigation", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    // Check sidebar exists (icon sidebar is 56px wide)
    const sidebar = page.locator("aside, [data-sidebar], nav").first()
    await expect(sidebar).toBeVisible({ timeout: 10000 })
  })

  test("should show header", async ({ page, context }) => {
    await loginUser(page, context)

    await page.goto("/dashboard")
    await page.waitForLoadState("networkidle")

    const header = page.locator("header").first()
    await expect(header).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Auth Pages - UI Elements", () => {
  test("should show forgot password page", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.waitForLoadState("networkidle")

    await expect(page.locator("#email")).toBeVisible()
    await expect(page.getByRole("button", { name: /reset|send/i })).toBeVisible()
  })
})
