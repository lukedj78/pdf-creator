"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete02Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  UserGroup02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, staggerItem, fade } from "@workspace/ui/lib/animation"
import { cn } from "@workspace/ui/lib/utils"
import { trpc } from "@/lib/trpc"
import { useSession, useActiveOrganization } from "@workspace/auth/client"
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"

const ROLE_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
  viewer: "outline",
}

const SUB_TABS = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "activity", label: "Activity" },
] as const

type SubTabId = (typeof SUB_TABS)[number]["id"]

export function TeamTab() {
  const [subTab, setSubTab] = useState<SubTabId>("general")
  const { data: myRole } = trpc.organization.myRole.useQuery()
  const isAdmin = myRole === "owner" || myRole === "admin"

  return (
    <div className="flex gap-6">
      {/* Sub-tabs — vertical */}
      <div className="flex flex-col gap-0.5 w-36 shrink-0">
        {SUB_TABS.map((tab) => {
          if (tab.id === "activity" && !isAdmin) return null
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-left",
                subTab === tab.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={subTab}
            variants={staggerContainer()}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div variants={staggerItem}>
              {subTab === "general" && <GeneralSubTab isAdmin={isAdmin} />}
              {subTab === "members" && <MembersSubTab isAdmin={isAdmin} />}
              {subTab === "activity" && isAdmin && <ActivitySubTab />}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// General Sub-Tab (Workspace settings)
// ---------------------------------------------------------------------------

function GeneralSubTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: activeOrg } = useActiveOrganization()
  const [orgName, setOrgName] = useState(activeOrg?.name ?? "")
  const [orgSlug, setOrgSlug] = useState(activeOrg?.slug ?? "")
  const [saved, setSaved] = useState(false)

  const orgUpdateMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const hasChanges =
    orgName.trim() !== (activeOrg?.name ?? "") ||
    orgSlug.trim() !== (activeOrg?.slug ?? "")

  function handleSave() {
    if (!orgName.trim() || !orgSlug.trim()) return
    orgUpdateMutation.mutate({
      name: orgName.trim(),
      slug: orgSlug.trim(),
    })
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl">
        <div className="dash-card p-4 space-y-2">
          <p className="text-sm font-medium">{activeOrg?.name}</p>
          <p className="text-xs text-muted-foreground">
            Slug: {activeOrg?.slug}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Only admins and owners can edit workspace settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <Field className="gap-1">
          <FieldLabel
            htmlFor="org-name"
            className="text-sm text-muted-foreground font-normal"
          >
            Workspace Name
          </FieldLabel>
          <Input
            id="org-name"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </Field>

        <Field className="gap-1">
          <FieldLabel
            htmlFor="org-slug"
            className="text-sm text-muted-foreground font-normal"
          >
            Workspace Slug
          </FieldLabel>
          <Input
            id="org-slug"
            type="text"
            value={orgSlug}
            onChange={(e) =>
              setOrgSlug(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
              )
            }
          />
          <p className="text-xs text-muted-foreground">
            Only lowercase letters, numbers, and hyphens.
          </p>
        </Field>

        {orgUpdateMutation.error && (
          <p className="text-xs text-destructive">
            {orgUpdateMutation.error.message}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setOrgName(activeOrg?.name ?? "")
              setOrgSlug(activeOrg?.slug ?? "")
            }}
            disabled={!hasChanges}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              orgUpdateMutation.isPending ||
              !orgName.trim() ||
              !orgSlug.trim() ||
              !hasChanges
            }
          >
            {saved ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                Saved
              </>
            ) : orgUpdateMutation.isPending ? (
              "Saving..."
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Members Sub-Tab
// ---------------------------------------------------------------------------

function MembersSubTab({ isAdmin }: { isAdmin: boolean }) {
  const { data: session } = useSession()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">(
    "member"
  )

  const utils = trpc.useUtils()

  const { data: members, isLoading: membersLoading } =
    trpc.organization.listMembers.useQuery()
  const { data: invitations, isLoading: invitationsLoading } =
    trpc.organization.listInvitations.useQuery(undefined, {
      enabled: isAdmin,
    })

  const inviteMutation = trpc.organization.createInvitation.useMutation({
    onSuccess: () => {
      utils.organization.listInvitations.invalidate()
      utils.activityLog.list.invalidate()
      handleCloseInvite()
    },
  })

  const removeMutation = trpc.organization.removeMember.useMutation({
    onSuccess: () => {
      utils.organization.listMembers.invalidate()
      utils.activityLog.list.invalidate()
      setRemoveId(null)
    },
  })

  const cancelInviteMutation = trpc.organization.cancelInvitation.useMutation({
    onSuccess: () => {
      utils.organization.listInvitations.invalidate()
      utils.activityLog.list.invalidate()
      setCancelInviteId(null)
    },
  })

  const updateRoleMutation = trpc.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      utils.organization.listMembers.invalidate()
      utils.activityLog.list.invalidate()
    },
  })

  function handleInvite() {
    if (!inviteEmail.trim()) return
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole })
  }

  function handleCloseInvite() {
    setInviteOpen(false)
    setInviteEmail("")
    setInviteRole("member")
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Members Section */}
      <div className="space-y-3">
        {isAdmin && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Invite
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
        {membersLoading ? (
          <motion.div key="members-skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="dash-card p-3 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </motion.div>
        ) : !members || members.length === 0 ? (
          <motion.div key="members-empty" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon
                icon={UserGroup02Icon}
                size={28}
                className="text-muted-foreground"
              />
            </div>
            <h3 className="text-lg font-medium">No members found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Your team members will appear here.
            </p>
          </motion.div>
        ) : (
          <motion.div key="members-list" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
            <AnimatePresence mode="popLayout">
            {members.map((m) => (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
                className="dash-card p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {m.userImage ? (
                    <img
                      src={m.userImage}
                      alt={m.userName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {m.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {m.userName}
                    </span>
                    {m.userId === session?.user?.id && (
                      <span className="text-[10px] text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.userEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin &&
                  m.role !== "owner" &&
                  m.userId !== session?.user?.id ? (
                    <Select
                      value={m.role}
                      onValueChange={(value) => {
                        if (!value) return
                        updateRoleMutation.mutate({
                          memberId: m.id,
                          role: value as "admin" | "member" | "viewer",
                        })
                      }}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs">
                        <SelectValue>
                          {(value: string) => {
                            const labels: Record<string, string> = {
                              admin: "Admin",
                              member: "Member",
                              viewer: "Viewer",
                            }
                            return labels[value] ?? value
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={ROLE_COLORS[m.role] ?? "outline"}>
                      {m.role}
                    </Badge>
                  )}
                  {isAdmin &&
                    m.role !== "owner" &&
                    m.userId !== session?.user?.id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setRemoveId(m.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                      </Button>
                    )}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Pending Invitations */}
      {isAdmin && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Pending Invitations
          </p>

          <AnimatePresence mode="wait">
          {invitationsLoading ? (
            <motion.div key="inv-skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
              {[1].map((i) => (
                <div
                  key={i}
                  className="dash-card p-3 flex items-center gap-3"
                >
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : !invitations || invitations.length === 0 ? (
            <motion.div key="inv-empty" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={28}
                  className="text-muted-foreground"
                />
              </div>
              <h3 className="text-lg font-medium">No pending invitations</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Invite team members to start collaborating.
              </p>
            </motion.div>
          ) : (
            <motion.div key="inv-list" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2">
              <AnimatePresence mode="popLayout">
              {invitations.map((inv) => (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 200, damping: 24 }}
                  className="dash-card p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      size={18}
                      className="text-muted-foreground"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">
                      {inv.email}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Invited as {inv.role ?? "member"} by {inv.inviterName}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0 cursor-pointer">
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setCancelInviteId(inv.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                        Revoke Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => !open && handleCloseInvite()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => {
                  if (!v) return
                  setInviteRole(v as "admin" | "member" | "viewer")
                }}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => {
                      const labels: Record<string, string> = {
                        admin: "Admin",
                        member: "Member",
                        viewer: "Viewer",
                      }
                      return labels[value] ?? value
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Admins can manage team members and settings. Members can create
                and edit templates.
              </p>
            </div>
            {inviteMutation.error && (
              <p className="text-xs text-destructive">
                {inviteMutation.error.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseInvite}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
            >
              {inviteMutation.isPending ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog
        open={!!removeId}
        onOpenChange={(open) => !open && setRemoveId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure? This person will lose access to the workspace
              immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                removeId && removeMutation.mutate({ memberId: removeId })
              }
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invitation Dialog */}
      <Dialog
        open={!!cancelInviteId}
        onOpenChange={(open) => !open && setCancelInviteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              This will revoke the invitation. The person will no longer be able
              to join.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelInviteId(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cancelInviteId &&
                cancelInviteMutation.mutate({ invitationId: cancelInviteId })
              }
              disabled={cancelInviteMutation.isPending}
            >
              {cancelInviteMutation.isPending
                ? "Cancelling..."
                : "Cancel Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Activity Sub-Tab
// ---------------------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  "organization.updated": "updated workspace settings",
  "member.role_changed": "changed a member's role",
  "member.removed": "removed a member",
  "member.left": "left the workspace",
  "invitation.sent": "sent an invitation",
  "invitation.cancelled": "cancelled an invitation",
}

function formatMeta(
  action: string,
  metadata: Record<string, unknown> | null
) {
  if (!metadata) return null
  if (action === "member.role_changed") {
    return `${metadata.previousRole} → ${metadata.newRole}`
  }
  if (action === "invitation.sent") {
    return `${metadata.email} as ${metadata.role}`
  }
  if (action === "organization.updated") {
    const keys = Object.keys(metadata)
    return keys.join(", ")
  }
  return null
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

function ActivitySubTab() {
  const { data: logs, isLoading } = trpc.activityLog.list.useQuery()

  return (
    <AnimatePresence mode="wait">
    {isLoading ? (
      <motion.div key="activity-skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="max-w-2xl space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="dash-card p-3 flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </motion.div>
    ) : !logs || logs.length === 0 ? (
      <motion.div key="activity-empty" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <HugeiconsIcon
            icon={Clock01Icon}
            size={28}
            className="text-muted-foreground"
          />
        </div>
        <h3 className="text-lg font-medium">No activity yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Team actions like invitations, role changes, and removals will appear
          here.
        </p>
      </motion.div>
    ) : (
      <motion.div key="activity-list" variants={fade} initial="hidden" animate="visible" exit="exit" className="max-w-2xl space-y-1">
      {logs.map((log) => {
        const meta = formatMeta(
          log.action,
          log.metadata as Record<string, unknown> | null
        )
        return (
          <div key={log.id} className="flex items-start gap-2.5 py-2 px-1">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              {log.actorImage ? (
                <img
                  src={log.actorImage}
                  alt={log.actorName}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <span className="text-[9px] font-semibold text-muted-foreground">
                  {log.actorName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs">
                <span className="font-medium">{log.actorName}</span>{" "}
                <span className="text-muted-foreground">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                {meta && (
                  <span className="text-muted-foreground/70">
                    {" "}
                    &middot; {meta}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                {timeAgo(new Date(log.createdAt))}
              </p>
            </div>
          </div>
        )
      })}
    </motion.div>
    )}
    </AnimatePresence>
  )
}
