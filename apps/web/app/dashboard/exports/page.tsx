"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { staggerItem } from "@workspace/ui/lib/animation"
import { DataTable } from "@workspace/ui/components/shared/data-table"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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
  File01Icon,
  Clock01Icon,
  Delete02Icon,
  Image01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import type { ColumnDef } from "@tanstack/react-table"
import { trpc } from "@/lib/trpc"

type GenerationRow = {
  id: string
  templateId: string | null
  templateName: string | null
  status: string
  format: string
  createdAt: Date
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-500",
    processing: "bg-amber-500/10 text-amber-500",
    pending: "bg-muted text-muted-foreground",
    failed: "bg-red-500/10 text-red-500",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  )
}

function FormatIcon({ format }: { format: string }) {
  if (format === "png" || format === "jpg") {
    return <HugeiconsIcon icon={Image01Icon} size={16} className="text-muted-foreground" />
  }
  return <HugeiconsIcon icon={File01Icon} size={16} className="text-muted-foreground" />
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

const columns: ColumnDef<GenerationRow>[] = [
  {
    accessorKey: "templateName",
    header: "Template",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          <FormatIcon format={row.original.format} />
        </div>
        <div>
          <span className="font-medium block">
            {row.original.templateName ?? "Unknown Template"}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.original.format.toUpperCase()}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <HugeiconsIcon icon={Clock01Icon} size={14} />
        <span>{timeAgo(row.original.createdAt)}</span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: function ActionsCell({ row, table }) {
      const meta = table.options.meta as { onDelete: (id: string) => void } | undefined
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            meta?.onDelete(row.original.id)
          }}
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </Button>
      )
    },
  },
]

export default function ExportsPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const { data: rawGenerations, isLoading } = trpc.generations.list.useQuery({
    limit: 100,
  })

  const deleteMutation = trpc.generations.delete.useMutation({
    onSuccess: () => {
      utils.generations.list.invalidate()
      setDeleteId(null)
    },
  })

  const generations: GenerationRow[] = (rawGenerations ?? []).map((g) => ({
    id: g.id,
    templateId: g.templateId,
    templateName: g.templateName,
    status: g.status,
    format: g.format,
    createdAt: new Date(g.createdAt),
  }))

  return (
    <PageShell>
      <PageTitle
        title="Export History"
        subtitle="Your recently generated PDF documents"
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full max-w-sm rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="hidden sm:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          ))}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="sm:hidden flex items-start gap-3 py-3 border-b last:border-0">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      ) : generations.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          variants={staggerItem}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <HugeiconsIcon icon={Download01Icon} size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No exports yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Export a spec via the API or AI Chat to see it here.
          </p>
        </motion.div>
      ) : (
        <DataTable
          columns={columns}
          data={generations}
          bare
          searchKey="templateName"
          searchPlaceholder="Search exports..."
          pageSize={10}
          renderMobileCard={(row) => (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FormatIcon format={row.format} />
                </div>
                <div className="min-w-0">
                  <span className="font-medium truncate block">
                    {row.templateName ?? "Unknown Template"}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <span>{row.format.toUpperCase()}</span>
                    <span>&middot;</span>
                    <HugeiconsIcon icon={Clock01Icon} size={12} />
                    <span>{timeAgo(row.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={row.status} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteId(row.id)
                  }}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                </Button>
              </div>
            </div>
          )}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Export Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this export record? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
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
