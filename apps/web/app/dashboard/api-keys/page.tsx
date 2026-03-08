"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { staggerItem } from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Key01Icon,
  Delete02Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import { authClient, useActiveOrganization, useSession } from "@workspace/auth/client"

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `about ${minutes} minute${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `about ${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `about ${days} day${days > 1 ? "s" : ""} ago`
  const months = Math.floor(days / 30)
  return `about ${months} month${months > 1 ? "s" : ""} ago`
}

type ApiKeyItem = {
  id: string
  name: string | null
  start: string | null
  prefix: string | null
  enabled: boolean
  createdAt: Date
  expiresAt: Date | null
  requestCount: number
  lastRequest: Date | null
}

export default function ApiKeysPage() {
  const { data: activeOrg } = useActiveOrganization()
  const { data: session } = useSession()
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [newExpiration, setNewExpiration] = useState<string>("never")
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadKeys = useCallback(async (showLoading = false) => {
    if (!activeOrg?.id) return
    if (showLoading) setIsLoading(true)
    try {
      const res = await authClient.apiKey.list({
        query: { organizationId: activeOrg.id },
      })
      if (res.data) {
        const payload = res.data as unknown as { apiKeys?: ApiKeyItem[] }
        const list = Array.isArray(payload.apiKeys) ? payload.apiKeys : []
        setKeys(
          list.map((k) => ({
            ...k,
            createdAt: new Date(k.createdAt),
            expiresAt: k.expiresAt ? new Date(k.expiresAt) : null,
            lastRequest: k.lastRequest ? new Date(k.lastRequest) : null,
          }))
        )
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeOrg?.id])

  useEffect(() => {
    loadKeys(true)
  }, [loadKeys])

  function getExpiresAt(): Date | undefined {
    const now = new Date()
    switch (newExpiration) {
      case "7d": return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case "30d": return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      case "60d": return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      case "90d": return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
      case "1y": return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
      default: return undefined
    }
  }

  async function handleCreate() {
    if (!activeOrg?.id || !newKeyName.trim()) return
    setIsCreating(true)
    const expiresAt = getExpiresAt()
    try {
      const res = await authClient.apiKey.create({
        name: newKeyName.trim(),
        organizationId: activeOrg.id,
        ...(expiresAt && { expiresAt }),
      })
      if (res.data?.key) {
        setCreatedKey(res.data.key)
        await loadKeys()
      }
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await authClient.apiKey.delete({ keyId: deleteId })
      await loadKeys()
      setDeleteId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCloseCreate() {
    setCreateOpen(false)
    setNewKeyName("")
    setNewExpiration("never")
    setCreatedKey(null)
  }

  return (
    <PageShell>
      <PageTitle
        title="API Keys"
        subtitle="Manage API keys for programmatic access to your templates and spec exports."
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Create Key
          </Button>
        }
      />

      {/* Quick Start */}
      <motion.div className="dash-card p-4 space-y-3" variants={staggerItem}>
        <h2 className="text-sm font-medium">Quick Start</h2>
        <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
          <pre className="text-muted-foreground">
{`curl -X POST https://your-domain.com/api/v1/generate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"templateId": "your-template-id", "data": {"name": "John"}}'`}
          </pre>
        </div>
      </motion.div>

      {/* Keys List */}
      <motion.div className="space-y-2" variants={staggerItem}>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dash-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-36 hidden sm:block" />
                  <Skeleton className="h-6 w-6 rounded-full hidden sm:block" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : keys.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            variants={staggerItem}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon icon={Key01Icon} size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No API keys yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create an API key to start using the REST API.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
          {keys.map((key) => (
            <motion.div
              key={key.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              className="dash-card px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <HugeiconsIcon
                    icon={Key01Icon}
                    size={16}
                    className="text-muted-foreground"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {key.name || "Unnamed Key"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {key.start
                        ? `…${key.start}`
                        : "••••••"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {key.lastRequest
                      ? `Last used ${timeAgo(key.lastRequest)}`
                      : "Never used"}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    Created {timeAgo(key.createdAt)}
                  </span>
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 cursor-pointer">
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteId(key.id)}
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
        )}
      </motion.div>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => !open && handleCloseCreate()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key Created" : "Create API Key"}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Copy your API key now. You won't be able to see it again."
                : "Give your API key a name to help you identify it later."}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                <span className="flex-1">{createdKey}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(createdKey)}
                  className="shrink-0"
                >
                  <HugeiconsIcon
                    icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                    size={16}
                  />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreate}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production, Development, CI/CD"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select value={newExpiration} onValueChange={(v) => v && setNewExpiration(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => {
                        const labels: Record<string, string> = {
                          never: "No expiration",
                          "7d": "7 days",
                          "30d": "30 days",
                          "60d": "60 days",
                          "90d": "90 days",
                          "1y": "1 year",
                        }
                        return labels[value] ?? value
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">No expiration</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                    <SelectItem value="30d">30 days</SelectItem>
                    <SelectItem value="60d">60 days</SelectItem>
                    <SelectItem value="90d">90 days</SelectItem>
                    <SelectItem value="1y">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newKeyName.trim()}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? Any applications using
              this key will immediately lose access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
