import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, twoFactor, admin } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth"
import { Polar } from "@polar-sh/sdk"
import { db } from "@workspace/db/client"
import { eq } from "drizzle-orm"
import { subscription, member } from "@workspace/db/schema"
import { sendEmail } from "./emails/send"
import { VerifyEmail } from "./emails/verify-email"
import { ResetPassword } from "./emails/reset-password"
import { Invitation } from "./emails/invitation"
import { ac, platformRoles, orgRoles } from "./permissions"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002"

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
})

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3002",
  trustedOrigins: [appUrl],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        react: ResetPassword({ url, name: user.name }),
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        react: VerifyEmail({ url, name: user.name }),
      })
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  },
  plugins: [
    organization({
      ac,
      roles: orgRoles,
      creatorRole: "owner",
      membershipLimit: 50,
      sendInvitationEmail: async (data) => {
        const url = `${appUrl}/organization/accept-invitation?id=${data.id}`
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on Pdf Creator`,
          react: Invitation({
            url,
            inviterName: data.inviter.user.name,
            organizationName: data.organization.name,
          }),
        })
      },
    }),
    twoFactor(),
    admin({
      ac,
      roles: platformRoles,
      defaultRole: "user",
      adminRoles: ["superadmin", "admin"],
    }),
    apiKey({
      references: "organization",
      rateLimit: {
        enabled: false,
      },
    }),
    ...(process.env.POLAR_ACCESS_TOKEN
      ? [
          polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
              checkout({
                products: [
                  ...(process.env.POLAR_PRO_PRODUCT_ID
                    ? [{ productId: process.env.POLAR_PRO_PRODUCT_ID, slug: "pro" }]
                    : []),
                  ...(process.env.POLAR_ENTERPRISE_PRODUCT_ID
                    ? [{ productId: process.env.POLAR_ENTERPRISE_PRODUCT_ID, slug: "enterprise" }]
                    : []),
                  ...(process.env.POLAR_CREDITS_100_PRODUCT_ID
                    ? [{ productId: process.env.POLAR_CREDITS_100_PRODUCT_ID, slug: "ai-credits-100" }]
                    : []),
                  ...(process.env.POLAR_CREDITS_500_PRODUCT_ID
                    ? [{ productId: process.env.POLAR_CREDITS_500_PRODUCT_ID, slug: "ai-credits-500" }]
                    : []),
                  ...(process.env.POLAR_CREDITS_1000_PRODUCT_ID
                    ? [{ productId: process.env.POLAR_CREDITS_1000_PRODUCT_ID, slug: "ai-credits-1000" }]
                    : []),
                ],
                successUrl: `${appUrl}/dashboard/settings?tab=billing&checkout={CHECKOUT_ID}`,
                authenticatedUsersOnly: true,
              }),
              portal(),
              usage(),
              webhooks({
                secret: process.env.POLAR_WEBHOOK_SECRET ?? "",
                onSubscriptionActive: async ({ data }) => {
                  // Try metadata first, then resolve from customer's userId
                  let orgId = (data as any).metadata?.organizationId as string | undefined
                  if (!orgId) {
                    const userId = (data as any).customer?.externalId as string | undefined
                    if (userId) {
                      const [membership] = await db
                        .select({ orgId: member.organizationId })
                        .from(member)
                        .where(eq(member.userId, userId))
                        .limit(1)
                      orgId = membership?.orgId
                    }
                  }
                  if (!orgId) return

                  const productId = (data as any).productId as string
                  const plan = productId === process.env.POLAR_PRO_PRODUCT_ID
                    ? "pro"
                    : productId === process.env.POLAR_ENTERPRISE_PRODUCT_ID
                      ? "enterprise"
                      : "pro"

                  // Upsert subscription
                  const existing = await db
                    .select()
                    .from(subscription)
                    .where(eq(subscription.polarSubscriptionId, (data as any).id))
                    .limit(1)

                  if (existing.length > 0) {
                    await db
                      .update(subscription)
                      .set({
                        status: "active",
                        plan,
                        polarProductId: productId,
                        currentPeriodEnd: (data as any).currentPeriodEnd
                          ? new Date((data as any).currentPeriodEnd)
                          : null,
                        updatedAt: new Date(),
                      })
                      .where(eq(subscription.polarSubscriptionId, (data as any).id))
                  } else {
                    await db.insert(subscription).values({
                      organizationId: orgId,
                      polarSubscriptionId: (data as any).id,
                      polarProductId: productId,
                      plan,
                      status: "active",
                      currentPeriodEnd: (data as any).currentPeriodEnd
                        ? new Date((data as any).currentPeriodEnd)
                        : null,
                    })
                  }
                },
                onSubscriptionCanceled: async ({ data }) => {
                  await db
                    .update(subscription)
                    .set({ status: "canceled", updatedAt: new Date() })
                    .where(eq(subscription.polarSubscriptionId, (data as any).id))
                },
                onSubscriptionRevoked: async ({ data }) => {
                  await db
                    .update(subscription)
                    .set({ status: "canceled", updatedAt: new Date() })
                    .where(eq(subscription.polarSubscriptionId, (data as any).id))
                },
              }),
            ],
          }),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})

export type Auth = typeof auth

export { toNextJsHandler } from "better-auth/next-js"
