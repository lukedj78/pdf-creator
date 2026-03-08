"use server"

import { createServerCaller } from "@/lib/trpc-server"

export async function getGenerations(input?: {
  limit?: number
  offset?: number
}) {
  const trpc = await createServerCaller()
  return trpc.generations.list(input)
}

export async function getGeneration(id: string) {
  const trpc = await createServerCaller()
  return trpc.generations.getById({ id })
}
