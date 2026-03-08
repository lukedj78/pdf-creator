"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { trpc } from "@/lib/trpc"
import { useActiveOrganization, signOut } from "@workspace/auth/client"
import { useRouter } from "next/navigation"

export function DangerTab() {
  const router = useRouter()
  const { data: activeOrg } = useActiveOrganization()
  const { data: myRole } = trpc.organization.myRole.useQuery()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const isOwner = myRole === "owner"
  const orgName = activeOrg?.name ?? "this organization"

  const deleteMutation = trpc.organization.delete.useMutation({
    onSuccess: async () => {
      await signOut()
      router.push("/login")
    },
  })

  const leaveMutation = trpc.organization.leave.useMutation({
    onSuccess: () => {
      router.push("/dashboard")
      router.refresh()
    },
  })

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-destructive/30 p-3 space-y-3">

        {/* Leave Organization */}
        {!isOwner && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Leave Organization</p>
              <p className="text-xs text-muted-foreground">
                You will lose access to all templates and data in this workspace.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setLeaveOpen(true)}
            >
              Leave
            </Button>
          </div>
        )}

        {/* Delete Organization */}
        {isOwner && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete Organization</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this organization and all its data including
                templates, exports, and members.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Leave Dialog */}
      <Dialog
        open={leaveOpen}
        onOpenChange={(open) => !open && setLeaveOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Organization</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{orgName}</strong>? You will
              need a new invitation to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false)
            setConfirmText("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All templates,
              exports, API keys, and team data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              Type <strong>{orgName}</strong> to confirm
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={orgName}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false)
                setConfirmText("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={
                deleteMutation.isPending || confirmText !== orgName
              }
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
