import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, twoFactor, admin } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { db } from "@workspace/db/client"
import { sendEmail } from "./emails/send"
import { VerifyEmail } from "./emails/verify-email"
import { ResetPassword } from "./emails/reset-password"
import { Invitation } from "./emails/invitation"
import { ac, platformRoles, orgRoles } from "./permissions"

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002"

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
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
})

export type Auth = typeof auth

export { toNextJsHandler } from "better-auth/next-js"
