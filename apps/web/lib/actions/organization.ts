"use server"

import { revalidatePath } from "next/cache"
import { createServerCaller } from "@/lib/trpc-server"

export async function getOrganization() {
  const trpc = await createServerCaller()
  return trpc.organization.get()
}

export async function updateOrganization(input: {
  name?: string
  slug?: string
  logo?: string | null
}) {
  const trpc = await createServerCaller()
  const result = await trpc.organization.update(input)
  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  return result
}

export async function listMembers() {
  const trpc = await createServerCaller()
  return trpc.organization.listMembers()
}

export async function updateMemberRole(input: {
  memberId: string
  role: "admin" | "member" | "viewer"
}) {
  const trpc = await createServerCaller()
  const result = await trpc.organization.updateMemberRole(input)
  revalidatePath("/dashboard/settings")
  return result
}

export async function removeMember(memberId: string) {
  const trpc = await createServerCaller()
  const result = await trpc.organization.removeMember({ memberId })
  revalidatePath("/dashboard/settings")
  return result
}

export async function listInvitations() {
  const trpc = await createServerCaller()
  return trpc.organization.listInvitations()
}

export async function createInvitation(input: {
  email: string
  role?: "admin" | "member" | "viewer"
}) {
  const trpc = await createServerCaller()
  const result = await trpc.organization.createInvitation(input)
  revalidatePath("/dashboard/settings")
  return result
}

export async function cancelInvitation(invitationId: string) {
  const trpc = await createServerCaller()
  const result = await trpc.organization.cancelInvitation({ invitationId })
  revalidatePath("/dashboard/settings")
  return result
}

export async function getMyRole() {
  const trpc = await createServerCaller()
  return trpc.organization.myRole()
}

export async function leaveOrganization() {
  const trpc = await createServerCaller()
  const result = await trpc.organization.leave()
  revalidatePath("/dashboard")
  return result
}

export async function deleteOrganization() {
  const trpc = await createServerCaller()
  const result = await trpc.organization.delete()
  revalidatePath("/dashboard")
  return result
}
