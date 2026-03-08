"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@workspace/ui/lib/animation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  SentIcon,
  Message01Icon,
  PenTool01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { trpc } from "@/lib/trpc"
import { TemplateRenderer } from "@workspace/template-engine/renderer"
import type { Template } from "@workspace/template-engine/schema"
import {
  addElement,
  removeElement,
  updateElement,
  createEmptyTemplate,
  getPageElementId,
  updateState,
} from "@workspace/template-engine/utils"
import type { ElementType } from "@workspace/template-engine/schema"
import { useRouter } from "next/navigation"
import { Suggestions, Suggestion } from "@/components/ai/suggestion"
import { DOCUMENT_SUGGESTIONS, EDIT_SUGGESTIONS } from "@/components/ai/suggestions-config"

export default function ChatPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template>(createEmptyTemplate("Untitled"))
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const router = useRouter()

  const { data: sessions, isLoading: sessionsLoading } =
    trpc.chat.listSessions.useQuery()

  const createTemplateFromChat = trpc.templates.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        router.push(`/dashboard/editor?id=${data.id}`)
      }
    },
  })

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (session) => {
      if (session) {
        setActiveSessionId(session.id)
        setTemplate(createEmptyTemplate("Untitled"))
        utils.chat.listSessions.invalidate()
      }
    },
  })

  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: (_, variables) => {
      if (activeSessionId === variables.id) {
        setActiveSessionId(null)
        setTemplate(createEmptyTemplate("Untitled"))
      }
      setDeleteSessionId(null)
      utils.chat.listSessions.invalidate()
    },
  })

  return (
    <motion.div
      className="h-full -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border overflow-hidden flex bg-background"
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      {/* Sessions sidebar */}
      <motion.div
        className="hidden md:flex w-60 border-r bg-background flex-col"
        variants={staggerItem}
      >
        <div className="p-3 border-b">
          <Button
            className="w-full"
            size="sm"
            onClick={() => createSession.mutate({})}
            disabled={createSession.isPending}
          >
            <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))
          ) : sessions?.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2 text-center">
              No chats yet
            </p>
          ) : (
            sessions?.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setTemplate(createEmptyTemplate("Untitled"))
                  setActiveSessionId(session.id)
                }}
                className={`group w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors cursor-pointer ${
                  activeSessionId === session.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <HugeiconsIcon icon={Message01Icon} size={14} className="shrink-0" />
                <span className="truncate flex-1">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteSessionId(session.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Chat area */}
      <motion.div className="flex-1 flex flex-col min-w-0" variants={staggerItem}>
        {activeSessionId ? (
          <ChatLoader
            key={activeSessionId}
            sessionId={activeSessionId}
            onTemplateChange={setTemplate}
            initialMessage={pendingMessage}
            onInitialMessageSent={() => setPendingMessage(null)}
          />
        ) : (
          <EmptyState onNewChat={(message?: string) => {
            if (message) setPendingMessage(message)
            createSession.mutate({})
          }} />
        )}
      </motion.div>

      {/* Template preview */}
      <motion.div
        className="hidden lg:flex w-80 border-l bg-muted/30 flex-col"
        variants={staggerItem}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Preview
          </h3>
          {Object.keys(template.elements).length > 2 && (
            <Button
              variant="ghost"
              size="xs"
              disabled={createTemplateFromChat.isPending}
              onClick={() => {
                const { id, name, ...schema } = template
                createTemplateFromChat.mutate({
                  name,
                  schema: schema as Record<string, unknown>,
                })
              }}
            >
              <HugeiconsIcon icon={PenTool01Icon} data-icon="inline-start" size={12} />
              {createTemplateFromChat.isPending ? "Saving..." : "Open in Editor"}
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-3 flex justify-center">
          <div className="transform scale-[0.35] origin-top">
            <TemplateRenderer template={template} />
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteSessionId} onOpenChange={(open) => !open && setDeleteSessionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? All messages will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSessionId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteSessionId && deleteSession.mutate({ id: deleteSessionId })}
              disabled={deleteSession.isPending}
            >
              {deleteSession.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

function EmptyState({ onNewChat }: { onNewChat: (message?: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <HugeiconsIcon icon={Message01Icon} size={28} className="text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">AI Template Designer</h2>
      <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
        Describe the JSON spec template you want to create and I'll build it for you.
        You can iterate and refine it through conversation.
      </p>
      <Suggestions>
        {DOCUMENT_SUGGESTIONS.map((s) => (
          <Suggestion
            key={s.label}
            suggestion={s.prompt}
            description={s.label}
            onClick={(prompt) => onNewChat(prompt)}
          />
        ))}
      </Suggestions>
    </div>
  )
}

function applyToolResult(
  template: Template,
  result: Record<string, unknown>
): Template {
  const action = result.action as string
  let t = template

  switch (action) {
    case "createTemplate": {
      const tmpl = result.template as Record<string, unknown>
      t = createEmptyTemplate(tmpl.name as string)
      // Apply page settings from createTemplate
      const pageId = getPageElementId(t)
      if (pageId) {
        const pageProps: Record<string, unknown> = {}
        if (tmpl.pageSize) pageProps.size = tmpl.pageSize
        if (tmpl.orientation) pageProps.orientation = tmpl.orientation
        if (tmpl.marginTop !== undefined) pageProps.marginTop = tmpl.marginTop
        if (tmpl.marginRight !== undefined) pageProps.marginRight = tmpl.marginRight
        if (tmpl.marginBottom !== undefined) pageProps.marginBottom = tmpl.marginBottom
        if (tmpl.marginLeft !== undefined) pageProps.marginLeft = tmpl.marginLeft
        if (Object.keys(pageProps).length > 0) {
          t = updateElement(t, pageId, { props: pageProps })
        }
      }
      break
    }
    case "addElement": {
      const { template: newT } = addElement(
        t,
        result.type as ElementType,
        (result.props as Record<string, unknown>) ?? {},
        { parentId: result.parentId as string | undefined }
      )
      t = newT
      break
    }
    case "updateElement": {
      t = updateElement(t, result.elementId as string, {
        props: result.props as Record<string, unknown>,
      })
      break
    }
    case "removeElement": {
      t = removeElement(t, result.elementId as string)
      break
    }
    case "setPageSettings": {
      const settings = result.settings as Record<string, unknown>
      const pageId = getPageElementId(t)
      if (pageId && settings) {
        t = updateElement(t, pageId, { props: settings })
      }
      break
    }
    case "updateState": {
      const pointer = result.pointer as string
      const value = result.value
      if (pointer) {
        t = updateState(t, pointer, value)
      }
      break
    }
  }

  return t
}

function ChatLoader({
  sessionId,
  onTemplateChange,
  initialMessage,
  onInitialMessageSent,
}: {
  sessionId: string
  onTemplateChange: (t: Template) => void
  initialMessage?: string | null
  onInitialMessageSent?: () => void
}) {
  const { data: savedMessages, isLoading: messagesLoading } =
    trpc.chat.getMessages.useQuery({ sessionId })
  const { data: session, isLoading: sessionLoading } =
    trpc.chat.getSession.useQuery({ id: sessionId })

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!savedMessages) return []
    return savedMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: m.content }],
    }))
  }, [savedMessages])

  const savedTemplate = useMemo(() => {
    if (session?.templateSchema) {
      try {
        const schema = session.templateSchema as Record<string, unknown>
        const base = createEmptyTemplate((schema.name as string) ?? "Untitled")
        return {
          ...base,
          ...schema,
          elements: (schema.elements as Template["elements"]) ?? base.elements,
          root: (schema.root as string) ?? base.root,
          state: (schema.state as Record<string, unknown>) ?? {},
        } as Template
      } catch {
        // ignore
      }
    }
    return createEmptyTemplate("Untitled")
  }, [session])

  // Set template from saved state on load
  useEffect(() => {
    if (!sessionLoading) {
      onTemplateChange(savedTemplate)
    }
  }, [savedTemplate, sessionLoading])

  if (messagesLoading || sessionLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    )
  }

  return (
    <ChatInterface
      key={sessionId}
      sessionId={sessionId}
      initialMessages={initialMessages}
      onTemplateChange={onTemplateChange}
      initialMessage={initialMessage}
      onInitialMessageSent={onInitialMessageSent}
    />
  )
}

function ChatInterface({
  sessionId,
  initialMessages,
  onTemplateChange,
  initialMessage,
  onInitialMessageSent,
}: {
  sessionId: string
  initialMessages: UIMessage[]
  onTemplateChange: (t: Template) => void
  initialMessage?: string | null
  onInitialMessageSent?: () => void
}) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const templateRef = useRef(createEmptyTemplate("Untitled"))
  const appliedToolCallsRef = useRef<Set<string>>(new Set())
  const initialMessageSentRef = useRef(false)
  const router = useRouter()

  const saveTemplate = trpc.chat.updateSessionTemplate.useMutation()
  const saveAsPersistent = trpc.templates.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        router.push(`/dashboard/editor?id=${data.id}`)
      }
    },
  })

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { sessionId } }),
    [sessionId]
  )

  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto-send initial message from suggestion shortcut
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current && status === "ready") {
      initialMessageSentRef.current = true
      sendMessage({ text: initialMessage })
      onInitialMessageSent?.()
    }
  }, [initialMessage, status])

  // Watch for tool results in messages and apply them to template
  useEffect(() => {
    let t = templateRef.current
    let changed = false

    for (const message of messages) {
      if (message.role !== "assistant") continue
      for (const part of message.parts) {
        if (part.type === "text" || part.type === "reasoning" || part.type === "source-url" || part.type === "file") continue
        // Tool parts in v6 have toolCallId and state
        const toolPart = part as { type: string; toolCallId?: string; state?: string; output?: unknown }
        if (toolPart.toolCallId && toolPart.state === "output-available" && toolPart.output) {
          if (!appliedToolCallsRef.current.has(toolPart.toolCallId)) {
            appliedToolCallsRef.current.add(toolPart.toolCallId)
            const result = toolPart.output as Record<string, unknown>

            // Handle saveTemplate: persist as a real template and redirect to editor
            if (result.action === "saveTemplate") {
              const { id, name, ...schema } = t
              saveAsPersistent.mutate({
                name,
                schema: schema as Record<string, unknown>,
              })
              continue
            }

            t = applyToolResult(t, result)
            changed = true
          }
        }
      }
    }

    if (changed) {
      templateRef.current = t
      onTemplateChange(t)
      // Persist to DB
      const { id, name, ...schema } = t
      saveTemplate.mutate({
        id: sessionId,
        templateSchema: { id, name, ...schema } as Record<string, unknown>,
      })
    }
  }, [messages, onTemplateChange, sessionId])

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSend() {
    if (!inputValue.trim() || isLoading) return
    const text = inputValue
    setInputValue("")
    sendMessage({ text })
  }

  return (
    <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Start by describing what kind of template you want.
            </p>
          </div>
        )}

        {messages.map((message: UIMessage) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
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
                // Tool parts have type like 'tool-createTemplate', 'tool-addElement', etc.
                // or 'dynamic-tool'
                const toolPart = part as { type: string; toolCallId?: string; state?: string; toolName?: string }
                if (toolPart.toolCallId) {
                  const toolName = toolPart.type.startsWith("tool-")
                    ? toolPart.type.slice(5)
                    : (toolPart.toolName ?? "tool")
                  return (
                    <div key={i} className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {toolName}
                      </Badge>
                      {toolPart.state === "output-available" && (
                        <span className="text-xs text-muted-foreground">Done</span>
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
          <div className="flex gap-3">
            <div className="bg-muted rounded-lg px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {messages.length === 0 && (
          <div className="mb-2">
            <Suggestions>
              {EDIT_SUGGESTIONS.map((s) => (
                <Suggestion
                  key={s.label}
                  suggestion={s.prompt}
                  description={s.label}
                  onClick={(prompt) => sendMessage({ text: prompt })}
                />
              ))}
            </Suggestions>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your template or ask for changes..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
            <HugeiconsIcon icon={SentIcon} size={18} />
          </Button>
        </form>
      </div>
    </>
  )
}
