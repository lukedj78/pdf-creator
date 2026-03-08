"use server"

import { revalidatePath } from "next/cache"
import { createServerCaller } from "@/lib/trpc-server"

export async function getWebhooks() {
  const trpc = await createServerCaller()
  return trpc.webhooks.list()
}

export async function createWebhook(input: {
  url: string
  events: string[]
}) {
  const trpc = await createServerCaller()
  const result = await trpc.webhooks.create(input)
  revalidatePath("/dashboard/settings")
  return result
}

export async function deleteWebhook(id: string) {
  const trpc = await createServerCaller()
  const result = await trpc.webhooks.delete({ id })
  revalidatePath("/dashboard/settings")
  return result
}

export async function toggleWebhook(id: string, active: boolean) {
  const trpc = await createServerCaller()
  const result = await trpc.webhooks.toggle({ id, active })
  revalidatePath("/dashboard/settings")
  return result
}
