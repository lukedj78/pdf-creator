import { test, expect } from "@playwright/test"

test.describe("Marketing Pages", () => {
  test("should load the landing page", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveTitle(/.+/)
    // Landing page should have some content
    const body = page.locator("body")
    await expect(body).toBeVisible()
  })

  test("should load the features page", async ({ page }) => {
    await page.goto("/features")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load the pricing page", async ({ page }) => {
    await page.goto("/pricing")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load the blog page", async ({ page }) => {
    await page.goto("/blog")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load the contact page", async ({ page }) => {
    await page.goto("/contact")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load the docs page", async ({ page }) => {
    await page.goto("/docs")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should have navigation header", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    // Check for navigation elements
    const nav = page.locator("header, nav").first()
    await expect(nav).toBeVisible()
  })

  test("should navigate to login from marketing", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Find a sign in / login link
    const loginLink = page.getByRole("link", { name: /sign in|login|get started/i }).first()
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/(login|register)/)
    }
  })
})

test.describe("Docs Sub-Pages", () => {
  test("should load quickstart docs", async ({ page }) => {
    await page.goto("/docs/quickstart")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load templates docs", async ({ page }) => {
    await page.goto("/docs/templates")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load SDK docs", async ({ page }) => {
    await page.goto("/docs/sdk")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load API docs", async ({ page }) => {
    await page.goto("/docs/api")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })

  test("should load webhooks docs", async ({ page }) => {
    await page.goto("/docs/webhooks")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("body")).toBeVisible()
  })
})
