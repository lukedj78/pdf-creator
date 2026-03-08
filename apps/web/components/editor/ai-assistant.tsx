"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { AnimatePresence, motion } from "framer-motion"
import { useEditor } from "@/lib/editor/editor-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Sheet, SheetContent } from "@workspace/ui/components/sheet"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiChat02Icon,
  Cancel01Icon,
  SentIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import type { Template } from "@workspace/template-engine/schema"
import { Suggestions, Suggestion } from "@/components/ai/suggestion"
import { DOCUMENT_SUGGESTIONS, EDIT_SUGGESTIONS } from "@/components/ai/suggestions-config"

// --- Trigger Button ---

export function AiAssistantTrigger({
  isOpen,
  onToggle,
}: {
  isOpen: boolean
  onToggle: () => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 50,
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                className="size-12 rounded-full shadow-lg"
                onClick={onToggle}
                aria-label={isOpen ? "Close AI Assistant" : "AI Assistant"}
                aria-expanded={isOpen}
              />
            }
          >
            <HugeiconsIcon
              icon={isOpen ? Cancel01Icon : AiChat02Icon}
              size={22}
            />
          </TooltipTrigger>
          <TooltipContent side="left">
            {isOpen ? "Close AI Assistant" : "AI Assistant"}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </div>,
    document.body,
  )
}

// --- Panel ---

export function AiAssistantPanel({
  isOpen,
  onClose,
  onSave,
  templateId,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  templateId?: string
}) {
  const isMobile = useIsMobile()
  const { state, dispatch } = useEditor()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chatContent = (
    <AiAssistantChat
      template={state.template}
      dispatch={dispatch}
      onSave={onSave}
      templateId={templateId}
    />
  )

  // Mobile: Sheet from bottom
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="flex h-[85vh] flex-col p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">AI Assistant</h3>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{chatContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  if (!mounted) return null

  // Desktop: floating panel portal
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 76,
            right: 16,
            zIndex: 50,
          }}
        >
          <motion.div
            role="dialog"
            aria-label="AI Assistant"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex h-[600px] w-[400px] flex-col overflow-hidden rounded-xl bg-background shadow-lg ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">AI Assistant</h3>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{chatContent}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

// --- Chat Content ---

function AiAssistantChat({
  template,
  dispatch,
  onSave,
  templateId,
}: {
  template: Template
  dispatch: React.Dispatch<any>
  onSave: () => void
  templateId?: string
}) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const appliedToolCallsRef = useRef<Set<string>>(new Set())
  const templateRef = useRef(template)
  templateRef.current = template

  // Stable transport with template snapshot — only recreated on templateId change
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/editor",
        body: { templateId },
      }),
    [templateId]
  )

  const { messages, sendMessage, status, setMessages, error } = useChat({
    id: "editor-assistant",
    transport,
    onError: (err) => {
      console.error("[editor-chat] useChat error:", err)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Watch for template updates via data parts and save actions via tool results
  useEffect(() => {
    let latestTemplate: Template | null = null

    for (const message of messages) {
      if (message.role !== "assistant") continue
      for (const part of message.parts) {
        // Data parts: template updates sent via the stream (not in model context)
        const dataPart = part as { type: string; data?: unknown }
        if (dataPart.type === "data-template-update" && dataPart.data) {
          latestTemplate = dataPart.data as Template
          continue
        }

        // Tool parts: check for saveTemplate action
        if (part.type === "text" || part.type === "reasoning" || part.type === "source-url" || part.type === "file") continue
        const toolPart = part as { type: string; toolCallId?: string; state?: string; output?: unknown }
        if (toolPart.toolCallId && toolPart.state === "output-available" && toolPart.output) {
          if (!appliedToolCallsRef.current.has(toolPart.toolCallId)) {
            appliedToolCallsRef.current.add(toolPart.toolCallId)
            const result = toolPart.output as Record<string, unknown>
            if (result.action === "saveTemplate") {
              onSave()
            }
          }
        }
      }
    }

    if (latestTemplate) {
      dispatch({ type: "AI_UPDATE_TEMPLATE", template: latestTemplate })
    }
  }, [messages, dispatch, onSave])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return
    const text = inputValue
    setInputValue("")
    sendMessage(
      { text },
      { body: { template: templateRef.current, templateId } }
    )
  }, [inputValue, isLoading, sendMessage, templateId])

  const handleClear = useCallback(() => {
    setMessages([])
    appliedToolCallsRef.current.clear()
  }, [setMessages])

  // Whether the template already has content (more than Document + Page)
  const hasContent = Object.keys(template.elements).length > 2

  const handleSuggestion = useCallback((prompt: string) => {
    if (isLoading) return
    sendMessage(
      { text: prompt },
      { body: { template: templateRef.current, templateId } }
    )
  }, [isLoading, sendMessage, templateId])

  return (
    <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <HugeiconsIcon icon={AiChat02Icon} size={20} className="text-primary" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {!hasContent
                ? "Start from a template or describe what you need"
                : "Ask me to modify your template"}
            </p>
          </div>
        )}

        {messages.map((message: UIMessage) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <div key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </div>
                  )
                }
                const toolPart = part as { type: string; toolCallId?: string; state?: string; toolName?: string }
                if (toolPart.toolCallId) {
                  const toolName = toolPart.type.startsWith("tool-")
                    ? toolPart.type.slice(5)
                    : (toolPart.toolName ?? "tool")
                  return (
                    <div key={i} className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {toolName}
                      </Badge>
                      {toolPart.state === "output-available" && (
                        <span className="text-[10px] text-muted-foreground">Done</span>
                      )}
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mx-3 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            Error: {error.message}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-2">
        {messages.length === 0 && (
          <div className="mb-2">
            <Suggestions>
              {(!hasContent ? DOCUMENT_SUGGESTIONS : EDIT_SUGGESTIONS).map((s) => (
                <Suggestion
                  key={s.label}
                  suggestion={s.prompt}
                  description={s.label}
                  onClick={handleSuggestion}
                />
              ))}
            </Suggestions>
          </div>
        )}
        {messages.length > 0 && (
          <div className="flex justify-end mb-1.5">
            <button
              onClick={handleClear}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <HugeiconsIcon icon={Delete02Icon} size={10} />
              Clear chat
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-1.5"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI to modify your template..."
            disabled={isLoading}
            className="flex-1 h-8 text-xs"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon-sm">
            <HugeiconsIcon icon={SentIcon} size={14} />
          </Button>
        </form>
      </div>
    </>
  )
}
