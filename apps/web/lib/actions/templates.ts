"use server"

import { revalidatePath } from "next/cache"
import { createServerCaller } from "@/lib/trpc-server"

export async function getTemplates(input?: {
  search?: string
  sortBy?: "name" | "createdAt" | "updatedAt"
  sortOrder?: "asc" | "desc"
  page?: number
  perPage?: number
}) {
  const trpc = await createServerCaller()
  return trpc.templates.list(input)
}

export async function getTemplate(id: string) {
  const trpc = await createServerCaller()
  return trpc.templates.getById({ id })
}

export async function createTemplate(input: {
  name: string
  description?: string
  schema: Record<string, unknown>
}) {
  const trpc = await createServerCaller()
  const result = await trpc.templates.create(input)
  revalidatePath("/dashboard/templates")
  return result
}

export async function updateTemplate(input: {
  id: string
  name?: string
  description?: string
  schema?: Record<string, unknown>
  isPublic?: boolean
}) {
  const trpc = await createServerCaller()
  const result = await trpc.templates.update(input)
  revalidatePath("/dashboard/templates")
  revalidatePath(`/dashboard/templates/${input.id}`)
  return result
}

export async function deleteTemplate(id: string) {
  const trpc = await createServerCaller()
  const result = await trpc.templates.delete({ id })
  revalidatePath("/dashboard/templates")
  return result
}

export async function duplicateTemplate(id: string) {
  const trpc = await createServerCaller()
  const result = await trpc.templates.duplicate({ id })
  revalidatePath("/dashboard/templates")
  return result
}

export async function getTemplateGallery() {
  const trpc = await createServerCaller()
  return trpc.templates.gallery()
}
