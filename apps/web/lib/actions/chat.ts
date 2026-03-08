"use server"

import { revalidatePath } from "next/cache"
import { createServerCaller } from "@/lib/trpc-server"

export async function getChatSessions() {
  const trpc = await createServerCaller()
  return trpc.chat.listSessions()
}

export async function getChatMessages(sessionId: string) {
  const trpc = await createServerCaller()
  return trpc.chat.getMessages({ sessionId })
}

export async function createChatSession(input: {
  templateId?: string
}) {
  const trpc = await createServerCaller()
  const result = await trpc.chat.createSession(input)
  revalidatePath("/dashboard/chat")
  return result
}
