import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient, adminClient } from "better-auth/client/plugins"
import { apiKeyClient } from "@better-auth/api-key/client"
import { ac, platformRoles, orgRoles } from "./permissions"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3002",
  plugins: [
    organizationClient({
      ac,
      roles: orgRoles,
    }),
    twoFactorClient(),
    adminClient({
      ac,
      roles: platformRoles,
    }),
    apiKeyClient(),
  ],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  useActiveOrganization,
  useListOrganizations,
} = authClient
