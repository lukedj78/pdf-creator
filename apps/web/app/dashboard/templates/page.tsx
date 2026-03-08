"use client"

import { useState } from "react"
import { useSyncPolling } from "@/hooks/use-sync-polling"
import { useQueryState, parseAsInteger, parseAsStringLiteral } from "nuqs"
import { motion } from "framer-motion"
import {
  staggerContainer,
  staggerItem,
  hover,
  tap,
} from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { createEmptyTemplate } from "@workspace/template-engine/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Search01Icon,
  MoreVerticalIcon,
  Copy01Icon,
  Delete02Icon,
  File01Icon,
  GridIcon,
  Menu01Icon,
  Download01Icon,
  FilterIcon,
  CheckmarkCircle01Icon,
  Edit01Icon,
  ArrowRight01Icon,
  SparklesIcon,
  InfinityCircleIcon,
  UserGroup02Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import { trpc } from "@/lib/trpc"
import Link from "next/link"

function buildEmptySchema(pageSize: string): Record<string, unknown> {
  const t = createEmptyTemplate("Untitled")
  // Update page size in the Page element
  const docEl = t.elements[t.root]!
  const pageId = docEl.children[0]!
  t.elements[pageId] = {
    ...t.elements[pageId]!,
    props: { ...t.elements[pageId]!.props, size: pageSize },
  }
  const { id, name, ...spec } = t
  return spec as Record<string, unknown>
}

export default function TemplatesPage() {
  const [search, setSearch] = useQueryState("q", { defaultValue: "", clearOnDefault: true, shallow: false, throttleMs: 300 })
  const [viewMode, setViewMode] = useQueryState("view", parseAsStringLiteral(["grid", "list"] as const).withDefault("grid").withOptions({ clearOnDefault: true, shallow: false }))
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsStringLiteral(["all", "draft", "published"] as const).withDefault("all").withOptions({ clearOnDefault: true, shallow: false }))
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true, shallow: false }))
  const [createOpen, setCreateOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newPageSize, setNewPageSize] = useState("A4")

  const utils = trpc.useUtils()

  // Poll for MCP sync events (invalidates templates.list automatically)
  useSyncPolling()

  const { data, isLoading, isFetching } = trpc.templates.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    perPage: 20,
  })

  const { data: billing } = trpc.billing.getUsage.useQuery()

  const templateLimitReached = billing
    ? billing.limits.templates !== null && billing.usage.templates >= billing.limits.templates
    : false

  function handleNewTemplate() {
    if (templateLimitReached) {
      setUpgradeOpen(true)
    } else {
      setCreateOpen(true)
    }
  }

  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate()
      utils.billing.getUsage.invalidate()
      setCreateOpen(false)
      setNewName("")
      setNewDescription("")
      setNewPageSize("A4")
    },
  })

  const duplicateMutation = trpc.templates.duplicate.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate()
      utils.billing.getUsage.invalidate()
    },
  })

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate()
      utils.billing.getUsage.invalidate()
      setDeleteId(null)
    },
  })

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => utils.templates.list.invalidate(),
  })

  function handleCreate() {
    if (!newName.trim()) return
    createMutation.mutate({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      schema: buildEmptySchema(newPageSize),
    })
  }

  function handleDelete() {
    if (!deleteId) return
    deleteMutation.mutate({ id: deleteId })
  }

  function handleExport(template: TemplateItem) {
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleToggleStatus(template: TemplateItem) {
    updateMutation.mutate({
      id: template.id,
      status: template.status === "draft" ? "published" : "draft",
    })
  }

  const templates = data?.items ?? []
  const pagination = data?.pagination

  return (
    <PageShell>
      <PageTitle
        title="Templates"
        subtitle="Create and manage your PDF templates."
        action={
          <>
            <Link href="/dashboard/templates/gallery">
              <Button variant="outline">
                <HugeiconsIcon icon={File01Icon} data-icon="inline-start" />
                Gallery
              </Button>
            </Link>
            <Button onClick={handleNewTemplate}>
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              New Template
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>
                Start with a blank template or choose a preset.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  placeholder="My Template"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Input
                  id="template-description"
                  placeholder="Optional description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Page Size</Label>
                <Select value={newPageSize} onValueChange={(v) => v && setNewPageSize(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) => {
                        const labels: Record<string, string> = {
                          A4: "A4 (210 × 297mm)",
                          A3: "A3 (297 × 420mm)",
                          A5: "A5 (148 × 210mm)",
                          Letter: "Letter (8.5 × 11in)",
                          Legal: "Legal (8.5 × 14in)",
                        }
                        return labels[value] ?? value
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297mm)</SelectItem>
                    <SelectItem value="A3">A3 (297 × 420mm)</SelectItem>
                    <SelectItem value="A5">A5 (148 × 210mm)</SelectItem>
                    <SelectItem value="Letter">Letter (8.5 × 11in)</SelectItem>
                    <SelectItem value="Legal">Legal (8.5 × 14in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>

          {/* Upgrade Dialog */}
          <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
            <DialogContent className="max-w-md gap-0 p-0 overflow-hidden">
              {/* Header with visual accent */}
              <div className="bg-muted/40 px-6 pt-8 pb-6 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <HugeiconsIcon icon={SparklesIcon} size={24} className="text-primary" />
                </div>
                <DialogHeader className="p-0">
                  <DialogTitle className="text-lg">You've reached your limit</DialogTitle>
                  <DialogDescription className="text-sm">
                    Free plan includes up to {billing?.limits.templates ?? 3} templates. Upgrade to unlock unlimited templates and more.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Usage bar */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Templates used</span>
                  <span className="font-medium text-destructive">
                    {billing?.usage.templates ?? 0}/{billing?.limits.templates ?? 3}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-destructive transition-all" style={{ width: "100%" }} />
                </div>
              </div>

              {/* Pro features */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">What you get with Pro</p>
                <div className="grid gap-2.5">
                  {[
                    { icon: InfinityCircleIcon, text: "Unlimited templates" },
                    { icon: SparklesIcon, text: "500 AI credits/month" },
                    { icon: Link01Icon, text: "Webhooks & MCP access" },
                    { icon: UserGroup02Icon, text: "Up to 5 team members" },
                  ].map((feature) => (
                    <div key={feature.text} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <HugeiconsIcon icon={feature.icon} size={14} className="text-primary" />
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
                <Button
                  nativeButton={false}
                  render={<Link href="/dashboard/settings?tab=billing" />}
                  onClick={() => setUpgradeOpen(false)}
                  className="w-full h-10 gap-2"
                >
                  Upgrade to Pro — $29/mo
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Button>
                <DialogClose
                  render={
                    <Button variant="ghost" className="w-full text-muted-foreground text-sm">
                      Maybe later
                    </Button>
                  }
                />
              </div>
            </DialogContent>
          </Dialog>
          </>
        }
      />

      {/* Toolbar */}
      <motion.div
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        variants={staggerItem}
      >
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as "all" | "draft" | "published")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-36 h-9">
              <HugeiconsIcon icon={FilterIcon} size={14} className="mr-1.5 text-muted-foreground" />
              <SelectValue>
                {(value: string) => {
                  const labels: Record<string, string> = {
                    all: "All Status",
                    draft: "Draft",
                    published: "Published",
                  }
                  return labels[value] ?? value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
            >
              <HugeiconsIcon icon={GridIcon} size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
            >
              <HugeiconsIcon icon={Menu01Icon} size={16} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl ring-1 ring-foreground/10 p-4 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                <Skeleton className="h-3 w-14 shrink-0 hidden sm:block" />
                <Skeleton className="h-6 w-6 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        )
      ) : templates.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          variants={staggerItem}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <HugeiconsIcon icon={File01Icon} size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No templates yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            {search || statusFilter !== "all"
              ? "No templates match your filters. Try adjusting your search."
              : "Create your first template to start generating PDFs."}
          </p>
          {!search && statusFilter === "all" && (
            <Button onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              Create Template
            </Button>
          )}
        </motion.div>
      ) : viewMode === "grid" ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
        >
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onDuplicate={() => duplicateMutation.mutate({ id: template.id })}
              onDelete={() => setDeleteId(template.id)}
              onExport={() => handleExport(template)}
              onToggleStatus={() => handleToggleStatus(template)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="space-y-2"
          variants={staggerContainer(0.03)}
          initial="hidden"
          animate="visible"
        >
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              onDuplicate={() => duplicateMutation.mutate({ id: template.id })}
              onDelete={() => setDeleteId(template.id)}
              onExport={() => handleExport(template)}
              onToggleStatus={() => handleToggleStatus(template)}
            />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div
          className="flex items-center justify-between pt-2"
          variants={staggerItem}
        >
          <p className="text-sm text-muted-foreground">
            {pagination.total} template{pagination.total !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

type TemplateItem = {
  id: string
  name: string
  description: string | null
  status: "draft" | "published"
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  schema: Record<string, unknown>
}

function StatusBadge({ status }: { status: "draft" | "published" }) {
  return (
    <Badge variant={status === "published" ? "default" : "secondary"}>
      {status === "published" ? (
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} className="mr-1" />
      ) : (
        <HugeiconsIcon icon={Edit01Icon} size={12} className="mr-1" />
      )}
      {status === "published" ? "Published" : "Draft"}
    </Badge>
  )
}

function TemplateCard({
  template,
  onDuplicate,
  onDelete,
  onExport,
  onToggleStatus,
}: {
  template: TemplateItem
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onToggleStatus: () => void
}) {
  return (
    <motion.div variants={staggerItem} whileHover={hover.lift} whileTap={tap.press} className="h-full">
      <Card size="sm" className="group relative h-full">
        <CardHeader className="flex-1">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-1">
            <HugeiconsIcon icon={File01Icon} size={20} className="text-muted-foreground" />
          </div>
          <CardTitle className="flex items-center gap-2">
            <Link
              href={`/dashboard/editor?id=${template.id}`}
              className="hover:underline truncate"
            >
              {template.name}
            </Link>
          </CardTitle>
          {template.description && (
            <CardDescription className="line-clamp-2">
              {template.description}
            </CardDescription>
          )}
          <CardAction>
            <TemplateMenu
              template={template}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onExport={onExport}
              onToggleStatus={onToggleStatus}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <StatusBadge status={template.status} />
            <p className="text-xs text-muted-foreground">
              {formatDate(template.updatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TemplateRow({
  template,
  onDuplicate,
  onDelete,
  onExport,
  onToggleStatus,
}: {
  template: TemplateItem
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onToggleStatus: () => void
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        <HugeiconsIcon icon={File01Icon} size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/editor?id=${template.id}`}
          className="text-sm font-medium hover:underline truncate block"
        >
          {template.name}
        </Link>
        {template.description && (
          <p className="text-xs text-muted-foreground truncate">
            {template.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={template.status} />
        {template.isPublic && <Badge variant="outline">Public</Badge>}
        <span className="text-xs text-muted-foreground hidden sm:block">
          {formatDate(template.updatedAt)}
        </span>
        <TemplateMenu
          template={template}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onExport={onExport}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </motion.div>
  )
}

function TemplateMenu({
  template,
  onDuplicate,
  onDelete,
  onExport,
  onToggleStatus,
}: {
  template: TemplateItem
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onToggleStatus: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-xs">
            <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onToggleStatus}>
          {template.status === "draft" ? (
            <>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              Publish
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Edit01Icon} size={16} />
              Unpublish
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <HugeiconsIcon icon={Copy01Icon} size={16} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport}>
          <HugeiconsIcon icon={Download01Icon} size={16} />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <HugeiconsIcon icon={Delete02Icon} size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function formatDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}
