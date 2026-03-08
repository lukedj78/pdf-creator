import { createAccessControl } from "better-auth/plugins/access"
import {
  defaultStatements as orgDefaultStatements,
  adminAc as orgAdminAc,
  memberAc as orgMemberAc,
  ownerAc as orgOwnerAc,
} from "better-auth/plugins/organization/access"
import {
  defaultStatements as adminDefaultStatements,
  adminAc as platformAdminAc,
  userAc as platformUserAc,
} from "better-auth/plugins/admin/access"

// ---------------------------------------------------------------------------
// Statements — every resource + action the app cares about
// ---------------------------------------------------------------------------
const statement = {
  ...adminDefaultStatements,
  ...orgDefaultStatements,
  template: ["create", "read", "update", "delete", "duplicate"],
  generation: ["create", "read", "delete"],
  chat: ["create", "read"],
  apiKey: ["create", "read", "delete"],
  webhook: ["create", "read", "update", "delete"],
} as const

export const ac = createAccessControl(statement)

// ---------------------------------------------------------------------------
// Platform roles (user.role — Better Auth admin plugin)
// ---------------------------------------------------------------------------
export const platformRoles = {
  superadmin: ac.newRole({
    ...platformAdminAc.statements,
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "impersonate",
      "impersonate-admins",
      "delete",
      "set-password",
      "get",
      "update",
    ],
  }),
  admin: ac.newRole({
    user: [
      "create",
      "list",
      "set-role",
      "ban",
      "delete",
      "set-password",
      "get",
      "update",
    ],
    session: ["list", "revoke", "delete"],
  }),
  user: ac.newRole({
    ...platformUserAc.statements,
  }),
}

// ---------------------------------------------------------------------------
// Organization roles (member.role — Better Auth organization plugin)
// ---------------------------------------------------------------------------
export const orgRoles = {
  owner: ac.newRole({
    ...orgOwnerAc.statements,
    template: ["create", "read", "update", "delete", "duplicate"],
    generation: ["create", "read", "delete"],
    chat: ["create", "read"],
    apiKey: ["create", "read", "delete"],
    webhook: ["create", "read", "update", "delete"],
  }),
  admin: ac.newRole({
    ...orgAdminAc.statements,
    template: ["create", "read", "update", "delete", "duplicate"],
    generation: ["create", "read", "delete"],
    chat: ["create", "read"],
    apiKey: ["create", "read", "delete"],
    webhook: ["create", "read", "update", "delete"],
  }),
  member: ac.newRole({
    ...orgMemberAc.statements,
    template: ["create", "read", "update", "delete", "duplicate"],
    generation: ["create", "read", "delete"],
    chat: ["create", "read"],
    apiKey: ["read"],
    webhook: ["read"],
  }),
  viewer: ac.newRole({
    template: ["read"],
    generation: ["read"],
    chat: ["read"],
    apiKey: ["read"],
    webhook: ["read"],
  }),
}
