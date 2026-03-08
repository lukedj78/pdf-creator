"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { fade } from "@workspace/ui/lib/animation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { Label } from "@workspace/ui/components/label"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
import {
  Add01Icon,
  Delete02Icon,
  Link01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  MoreHorizontalIcon,
  PauseIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons"
import { trpc } from "@/lib/trpc"

const WEBHOOK_EVENTS = [
  { id: "export.completed", label: "Export Completed" },
  { id: "export.failed", label: "Export Failed" },
  { id: "template.created", label: "Template Created" },
  { id: "template.updated", label: "Template Updated" },
  { id: "template.deleted", label: "Template Deleted" },
] as const

type WebhookItem = {
  id: string
  url: string
  events: string[]
  active: boolean
  createdAt: Date
}

export function WebhooksTab() {
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Secret shown only once after creation
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const [newUrl, setNewUrl] = useState("")
  const [newEvents, setNewEvents] = useState<string[]>([])
  const [createError, setCreateError] = useState<string | null>(null)

  const utils = trpc.useUtils()

  const { data: rawWebhooks, isLoading } = trpc.webhooks.list.useQuery()

  const createMutation = trpc.webhooks.create.useMutation({
    onSuccess: (data) => {
      utils.webhooks.list.invalidate()
      setCreateError(null)
      setCreateOpen(false)
      setNewUrl("")
      setNewEvents([])
      // Show the secret once in a success dialog
      if (data?.secret) {
        setCreatedSecret(data.secret)
      }
    },
    onError: (err) => {
      setCreateError(err.message)
    },
  })

  const deleteMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate()
      setDeleteId(null)
    },
  })

  const toggleMutation = trpc.webhooks.toggle.useMutation({
    onSuccess: () => {
      utils.webhooks.list.invalidate()
    },
  })

  const webhooks: WebhookItem[] = (rawWebhooks ?? []).map((w) => ({
    ...w,
    events: (w.events ?? []) as string[],
    createdAt: new Date(w.createdAt),
  }))

  function handleCreate() {
    if (!newUrl.trim() || newEvents.length === 0) return
    createMutation.mutate({ url: newUrl.trim(), events: newEvents })
  }

  function handleCloseCreate() {
    setCreateOpen(false)
    setNewUrl("")
    setNewEvents([])
    setCreateError(null)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleEvent(eventId: string) {
    setNewEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    )
  }

  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add Webhook
        </Button>
      </div>

      <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="dash-card p-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </motion.div>
      ) : webhooks.length === 0 ? (
        <motion.div key="empty" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <HugeiconsIcon
              icon={Link01Icon}
              size={28}
              className="text-muted-foreground"
            />
          </div>
          <h3 className="text-lg font-medium">No webhooks yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Add a webhook to receive real-time notifications when events happen.
          </p>
        </motion.div>
      ) : (
        <motion.div key="list" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
        <AnimatePresence mode="popLayout">
        {webhooks.map((webhook) => (
          <motion.div
            key={webhook.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="dash-card p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={Link01Icon}
                  size={18}
                  className="text-muted-foreground"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate font-mono">
                    {webhook.url}
                  </span>
                  <Badge
                    variant={webhook.active ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {webhook.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {webhook.events.map((event) => (
                    <span
                      key={event}
                      className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 cursor-pointer">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      toggleMutation.mutate({
                        id: webhook.id,
                        active: !webhook.active,
                      })
                    }
                  >
                    <HugeiconsIcon icon={webhook.active ? PauseIcon : PlayIcon} size={14} />
                    {webhook.active ? "Pause" : "Resume"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteId(webhook.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => !open && handleCloseCreate()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>
              Enter the URL and select which events should trigger this webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input
                id="webhook-url"
                placeholder="https://example.com/webhooks"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleEvent(event.id)}
                  >
                    <Checkbox
                      checked={newEvents.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <span className="text-sm">{event.label}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {event.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreate}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createMutation.isPending ||
                !newUrl.trim() ||
                newEvents.length === 0
              }
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Reveal Dialog — shown once after creation */}
      <Dialog
        open={!!createdSecret}
        onOpenChange={(open) => !open && setCreatedSecret(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Created</DialogTitle>
            <DialogDescription>
              Copy the signing secret below. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Signing Secret
            </Label>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-3 py-2 rounded font-mono flex-1 select-all break-all">
                {createdSecret}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(createdSecret!)}
              >
                <HugeiconsIcon
                  icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                  size={14}
                />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedSecret(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Webhook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this webhook? You will stop
              receiving notifications for its events. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
