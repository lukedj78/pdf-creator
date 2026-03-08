"use client"

import { createContext, useContext } from "react"
import type { EditorStore } from "./use-editor-store"

const EditorContext = createContext<EditorStore | null>(null)

export function EditorProvider({
  store,
  children,
}: {
  store: EditorStore
  children: React.ReactNode
}) {
  return (
    <EditorContext.Provider value={store}>{children}</EditorContext.Provider>
  )
}

export function useEditor(): EditorStore {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error("useEditor must be used within EditorProvider")
  return ctx
}
