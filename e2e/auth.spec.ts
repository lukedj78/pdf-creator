import { test, expect } from "@playwright/test"

const authHeaders = {
  Origin: "http://localhost:3000",
}

test.describe("Auth Flow - Pages", () => {
  test("should redirect /dashboard to /login when not authenticated", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).toContain("callbackUrl")
  })

  test("should show login page with form elements", async ({ page }) => {
    await page.goto("/login")
    await page.waitForLoadState("networkidle")

    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Google/i })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /GitHub/i })
    ).toBeVisible()
  })

  test("should show register page with form elements", async ({ page }) => {
    await page.goto("/register")
    await page.waitForLoadState("networkidle")

    await expect(page.getByText("Create your account")).toBeVisible()
    await expect(page.locator("#name")).toBeVisible()
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Sign up", exact: true })
    ).toBeVisible()
  })

  test("should have link from login to register", async ({ page }) => {
    await page.goto("/login")
    const registerLink = page.locator('a[href="/register"]')
    await expect(registerLink).toBeVisible()
    await registerLink.click()
    await expect(page).toHaveURL(/\/register/, { timeout: 10000 })
  })

  test("should have link from register to login", async ({ page }) => {
    await page.goto("/register")
    const loginLink = page.locator('a[href="/login"]')
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe("Auth Flow - Registration & Login", () => {
  test("should register and redirect to dashboard", async ({ page }) => {
    const email = `reg-e2e-${Date.now()}@test.com`

    await page.goto("/register")
    await page.waitForLoadState("networkidle")
    await page.locator("#name").fill("Register Test")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill("TestPassword123")
    await page.getByRole("button", { name: "Sign up", exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("should login and redirect to dashboard", async ({
    page,
    context,
  }) => {
    const email = `login-e2e-${Date.now()}@test.com`

    // Create user via API
    await context.request.post(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        data: { name: "Login Test", email, password: "TestPassword123" },
        headers: authHeaders,
      }
    )

    // Clear cookies to reset session from sign-up
    await context.clearCookies()

    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill("TestPassword123")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })

  test("should redirect authenticated user from /login to /dashboard", async ({
    page,
    context,
  }) => {
    const email = `redirect-e2e-${Date.now()}@test.com`

    // Create and sign in via API (sets session cookie)
    await context.request.post(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        data: { name: "Redirect Test", email, password: "TestPassword123" },
        headers: authHeaders,
      }
    )

    // Navigate to /login — should redirect to /dashboard because session cookie is set
    await page.goto("/login")
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test("should show error on invalid login", async ({ page, context }) => {
    const email = `invalid-e2e-${Date.now()}@test.com`

    // Create user via API
    await context.request.post(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        data: { name: "Invalid Test", email, password: "TestPassword123" },
        headers: authHeaders,
      }
    )

    // Clear cookies so we can access login page
    await context.clearCookies()

    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await page.locator("#email").fill(email)
    await page.locator("#password").fill("WrongPassword999")
    await page.getByRole("button", { name: "Sign in", exact: true }).click()

    await expect(page.locator(".text-destructive")).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe("Auth API", () => {
  test("GET /api/auth/ok should return ok", async ({ request }) => {
    const response = await request.get("/api/auth/ok")
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.ok).toBe(true)
  })

  test("POST /api/auth/sign-up/email should create user", async ({
    request,
  }) => {
    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "API Test User",
        email: `api-${Date.now()}@test.com`,
        password: "TestPassword123",
      },
      headers: authHeaders,
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.user.name).toBe("API Test User")
    expect(body.token).toBeTruthy()
  })

  test("POST /api/auth/sign-in/email should return session", async ({
    request,
  }) => {
    const email = `signin-${Date.now()}@test.com`

    await request.post("/api/auth/sign-up/email", {
      data: { name: "Sign In User", email, password: "TestPassword123" },
      headers: authHeaders,
    })

    const response = await request.post("/api/auth/sign-in/email", {
      data: { email, password: "TestPassword123" },
      headers: authHeaders,
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.user.email).toBe(email)
    expect(body.token).toBeTruthy()
  })

  test("GET /api/auth/get-session should return session with cookie", async ({
    request,
  }) => {
    const email = `session-${Date.now()}@test.com`

    await request.post("/api/auth/sign-up/email", {
      data: { name: "Session User", email, password: "TestPassword123" },
      headers: authHeaders,
    })

    const signInRes = await request.post("/api/auth/sign-in/email", {
      data: { email, password: "TestPassword123" },
      headers: authHeaders,
    })
    expect(signInRes.status()).toBe(200)

    const sessionRes = await request.get("/api/auth/get-session")
    expect(sessionRes.status()).toBe(200)
    const session = await sessionRes.json()
    expect(session.user.email).toBe(email)
  })
})
