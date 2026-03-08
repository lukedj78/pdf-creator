"use client"

import { useState, useCallback } from "react"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Badge } from "@workspace/ui/components/badge"
import { useEditor } from "@/lib/editor/editor-context"
import { variationsResultSchema } from "@/lib/variations-schema"
import type { Template, Element } from "@workspace/template-engine/schema"

type VariationScope = "layout" | "colors" | "typography" | "content" | "all"

const SCOPES: { value: VariationScope; label: string; description: string }[] = [
  { value: "all", label: "All", description: "Vary everything" },
  { value: "layout", label: "Layout", description: "Spacing & alignment" },
  { value: "colors", label: "Colors", description: "Color palette" },
  { value: "typography", label: "Typography", description: "Fonts & sizes" },
  { value: "content", label: "Content", description: "Text & data" },
]

type Variation = {
  label: string
  props: Record<string, unknown>
}

export function VariationsModal({
  open,
  onOpenChange,
  elementId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  elementId: string | null
}) {
  const { state, dispatch } = useEditor()
  const [step, setStep] = useState<"scope" | "streaming" | "error">("scope")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [currentScope, setCurrentScope] = useState<VariationScope>("all")
  const [customPrompt, setCustomPrompt] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const element = elementId ? state.template.elements[elementId] : null

  // Find sibling types for context
  const siblingTypes = elementId
    ? Object.values(state.template.elements)
        .find((el) => el.children.includes(elementId))
        ?.children.filter((id) => id !== elementId)
        .map((id) => state.template.elements[id]?.type ?? "Unknown") ?? []
    : []

  const { object, submit, isLoading, error } = useObject({
    api: "/api/variations",
    schema: variationsResultSchema,
    onFinish: ({ object: result, error: finishError }) => {
      if (finishError || !result?.variations?.length) {
        setStep("error")
        setErrorMessage(finishError?.message ?? "No variations generated")
      }
    },
    onError: (err) => {
      setStep("error")
      setErrorMessage(err.message)
    },
  })

  const handleGenerate = useCallback((scope: VariationScope, prompt?: string) => {
    if (!element || !elementId) return

    setStep("streaming")
    setCurrentScope(scope)
    setSelectedIndex(null)

    submit({
      element: { type: element.type, props: element.props },
      scope,
      customPrompt: prompt || undefined,
      templateName: state.template.name,
      siblingTypes,
    })
  }, [element, elementId, state.template, siblingTypes, submit])

  // Build final variations list, merging with original props
  const variations: Variation[] = (object?.variations ?? [])
    .filter((v): v is { label: string; props: Record<string, unknown> } =>
      !!v?.label && !!v?.props
    )
    .map((v) => ({
      label: v.label,
      props: { ...(element?.props ?? {}), ...v.props },
    }))

  const handleApply = useCallback(() => {
    if (!elementId || selectedIndex === null) return

    const variation = variations[selectedIndex]
    if (!variation) return

    dispatch({
      type: "UPDATE_ELEMENT",
      elementId,
      props: variation.props,
    })

    onOpenChange(false)
  }, [elementId, selectedIndex, variations, dispatch, onOpenChange])

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setStep("scope")
      setSelectedIndex(null)
      setCustomPrompt("")
      setErrorMessage("")
    }
    onOpenChange(open)
  }, [onOpenChange])

  if (!element || !elementId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            AI Variations
            <Badge variant="outline" className="font-normal text-xs">
              {element.type}
            </Badge>
            {isLoading && (
              <span className="text-xs text-muted-foreground font-normal animate-pulse">
                generating...
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {step === "scope" && (
            <ScopeSelector
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
              onSelect={(scope) => handleGenerate(scope, customPrompt)}
            />
          )}

          {step === "error" && (
            <ErrorState
              message={errorMessage || error?.message || "Something went wrong"}
              onRetry={() => setStep("scope")}
            />
          )}

          {step === "streaming" && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <VariationCard
                  label="Original"
                  element={element}
                  isSelected={false}
                  isOriginal
                />
                {/* Streamed variations */}
                {variations.map((variation, index) => (
                  <VariationCard
                    key={index}
                    label={variation.label}
                    element={{ ...element, props: variation.props }}
                    isSelected={selectedIndex === index}
                    onClick={() => !isLoading || variation.props ? setSelectedIndex(index) : undefined}
                  />
                ))}
                {/* Skeleton placeholders while loading */}
                {isLoading && variations.length < 3 && (
                  Array.from({ length: 3 - variations.length }).map((_, i) => (
                    <div key={`skel-${i}`} className="rounded-lg border p-3 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setStep("scope")}>
                    Change scope
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleGenerate(currentScope, customPrompt)} disabled={isLoading}>
                    Regenerate
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={selectedIndex === null || isLoading}
                >
                  Apply variation
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ScopeSelector({
  customPrompt,
  onCustomPromptChange,
  onSelect,
}: {
  customPrompt: string
  onCustomPromptChange: (value: string) => void
  onSelect: (scope: VariationScope) => void
}) {
  return (
    <div className="space-y-4 pt-2">
      <div>
        <label htmlFor="custom-prompt" className="text-sm text-muted-foreground block mb-1.5">
          Describe what you want (optional):
        </label>
        <textarea
          id="custom-prompt"
          value={customPrompt}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder='e.g. "Make it more minimal" or "Use a red accent color"'
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          rows={2}
        />
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1.5">
          Choose scope:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SCOPES.map((scope) => (
            <button
              key={scope.value}
              onClick={() => onSelect(scope.value)}
              className="flex flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <span className="text-sm font-medium">{scope.label}</span>
              <span className="text-[11px] text-muted-foreground">{scope.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function VariationCard({
  label,
  element,
  isSelected,
  isOriginal,
  onClick,
}: {
  label: string
  element: Element
  isSelected: boolean
  isOriginal?: boolean
  onClick?: () => void
}) {
  const props = element.props as Record<string, unknown>

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 transition-all ${
        isOriginal
          ? "opacity-60 border-dashed"
          : "cursor-pointer hover:border-primary/50"
      } ${isSelected ? "border-primary ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium truncate">{label}</span>
        {isOriginal && (
          <Badge variant="outline" className="text-[10px] h-4">
            current
          </Badge>
        )}
      </div>
      <div className="rounded border bg-white p-2 text-black overflow-hidden" style={{ fontSize: 11, lineHeight: 1.4, maxHeight: 120 }}>
        <ElementPreview element={element} props={props} />
      </div>
    </div>
  )
}

/** Minimal preview renderer for a single element */
function ElementPreview({
  element,
  props,
}: {
  element: Element
  props: Record<string, unknown>
}) {
  switch (element.type) {
    case "Text":
      return (
        <p style={{
          margin: 0,
          fontSize: props.fontSize ? Number(props.fontSize) * 0.8 : 9,
          color: props.color ? String(props.color) : undefined,
          textAlign: props.align as React.CSSProperties["textAlign"],
          fontWeight: props.fontWeight ? String(props.fontWeight) : undefined,
          fontStyle: props.fontStyle ? String(props.fontStyle) : undefined,
        }}>
          {String(props.text || "Text")}
        </p>
      )
    case "Heading": {
      const sizes: Record<string, number> = { h1: 18, h2: 14, h3: 12, h4: 10 }
      const level = String(props.level || "h2")
      return (
        <div style={{
          fontWeight: "bold",
          fontSize: sizes[level] ?? 14,
          color: props.color ? String(props.color) : undefined,
          textAlign: props.align as React.CSSProperties["textAlign"],
        }}>
          {String(props.text || "Heading")}
        </div>
      )
    }
    case "Divider":
      return <hr style={{ border: "none", borderTop: `${Number(props.thickness || 1)}px solid ${String(props.color || "#e5e5e5")}` }} />
    case "Spacer":
      return <div style={{ height: Math.min(Number(props.height || 20) * 0.5, 20), background: "#f0f0f0", borderRadius: 2 }} />
    case "Table": {
      const columns = (props.columns as Array<{ header: string }>) || []
      return (
        <div className="text-[9px]">
          <div className="flex gap-1 font-semibold" style={{ backgroundColor: props.headerBackgroundColor ? String(props.headerBackgroundColor) : "#f5f5f5", padding: "2px 4px" }}>
            {columns.slice(0, 4).map((c, i) => <span key={i} className="flex-1 truncate">{c.header}</span>)}
          </div>
          <div className="text-muted-foreground px-1 py-0.5">...</div>
        </div>
      )
    }
    case "List": {
      const items = ((props.items as string[]) || []).slice(0, 3)
      return (
        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9 }}>
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    }
    default:
      return <div className="text-[9px] text-muted-foreground">{element.type}</div>
  }
}
