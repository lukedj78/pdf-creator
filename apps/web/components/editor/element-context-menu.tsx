"use client"

import { useEffect, useRef } from "react"
import { useEditor } from "@/lib/editor/editor-context"

export type ContextMenuPosition = {
  x: number
  y: number
  elementId: string
} | null

export function ElementContextMenu({
  position,
  onClose,
  onVariations,
  onDuplicate,
  onDelete,
}: {
  position: ContextMenuPosition
  onClose: () => void
  onVariations: (elementId: string) => void
  onDuplicate: (elementId: string) => void
  onDelete: (elementId: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { state } = useEditor()

  useEffect(() => {
    if (!position) return

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }

    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [position, onClose])

  if (!position) return null

  const element = state.template.elements[position.elementId]
  if (!element) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
      style={{ top: position.y, left: position.x }}
    >
      <button
        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onVariations(position.elementId)
          onClose()
        }}
      >
        <SparklesIcon />
        AI Variations
      </button>
      <div className="my-1 h-px bg-border" />
      <button
        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
        onClick={() => {
          onDuplicate(position.elementId)
          onClose()
        }}
      >
        <CopyIcon />
        Duplicate
      </button>
      <button
        className="relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none text-destructive hover:bg-destructive/10"
        onClick={() => {
          onDelete(position.elementId)
          onClose()
        }}
      >
        <TrashIcon />
        Delete
      </button>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}
