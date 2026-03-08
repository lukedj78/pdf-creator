"use client"

import { Button } from "@workspace/ui/components/button"

/**
 * Horizontal scrollable container for suggestions.
 * Follows AI SDK Elements pattern: https://elements.ai-sdk.dev/components/suggestion
 */
export function Suggestions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {children}
    </div>
  )
}

/**
 * A clickable suggestion button that sends a prompt on click.
 * `suggestion` is the full prompt sent to the AI.
 * `description` is the short label shown to the user (defaults to `suggestion`).
 */
export function Suggestion({
  suggestion,
  onClick,
  description,
}: {
  suggestion: string
  onClick: (suggestion: string) => void
  description?: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 text-xs justify-start"
      onClick={() => onClick(suggestion)}
    >
      {description ?? suggestion}
    </Button>
  )
}
