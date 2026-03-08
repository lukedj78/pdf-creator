"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { staggerItem } from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
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
  DropdownMenuSeparator,
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
  UserGroup02Icon,
  MoreHorizontalIcon,
  SecurityIcon,
  SecurityCheckIcon,
  Delete02Icon,
  UserIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons"
import { authClient, useSession } from "@workspace/auth/client"

type UserItem = {
  id: string
  name: string
  email: string
  image: string | null
  role: string | null
  banned: boolean | null
  banReason: string | null
  createdAt: string
  emailVerified: boolean
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const PAGE_SIZE = 20

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Dialogs
  const [banDialog, setBanDialog] = useState<UserItem | null>(null)
  const [banReason, setBanReason] = useState("")
  const [roleDialog, setRoleDialog] = useState<UserItem | null>(null)
  const [newRole, setNewRole] = useState<"user" | "admin" | "superadmin">("user")
  const [deleteDialog, setDeleteDialog] = useState<UserItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Guard: only platform admins
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin"

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          ...(search
            ? {
                searchValue: search,
                searchField: "email" as const,
                searchOperator: "contains" as const,
              }
            : {}),
          sortBy: "createdAt",
          sortDirection: "desc",
        },
      })
      if (res.data) {
        setUsers((res.data.users ?? []) as unknown as UserItem[])
        setTotal(res.data.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    if (isAdmin) loadUsers()
  }, [loadUsers, isAdmin])

  // Debounce search
  const [searchInput, setSearchInput] = useState("")
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <HugeiconsIcon icon={SecurityIcon} size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Access Denied</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            You need platform admin privileges to access this page.
          </p>
        </div>
      </PageShell>
    )
  }

  async function handleBan() {
    if (!banDialog) return
    setActionLoading(true)
    try {
      await authClient.admin.banUser({
        userId: banDialog.id,
        banReason: banReason || undefined,
      })
      setBanDialog(null)
      setBanReason("")
      await loadUsers()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(true)
    try {
      await authClient.admin.unbanUser({ userId })
      await loadUsers()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSetRole() {
    if (!roleDialog) return
    setActionLoading(true)
    try {
      await authClient.admin.setRole({
        userId: roleDialog.id,
        role: newRole,
      })
      setRoleDialog(null)
      await loadUsers()
    } finally {
      setActionLoading(false)
    }
  }

  async function handleImpersonate(userId: string) {
    await authClient.admin.impersonateUser({ userId })
    window.location.href = "/dashboard"
  }

  async function handleDelete() {
    if (!deleteDialog) return
    setActionLoading(true)
    try {
      await authClient.admin.removeUser({ userId: deleteDialog.id })
      setDeleteDialog(null)
      await loadUsers()
    } finally {
      setActionLoading(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <PageShell>
      <PageTitle
        title="Platform Admin"
        subtitle={`${total} registered user${total !== 1 ? "s" : ""}`}
      />

      {/* Search */}
      <motion.div variants={staggerItem}>
        <Input
          placeholder="Search by email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
      </motion.div>

      {/* Users List */}
      <motion.div className="space-y-2" variants={staggerItem}>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="dash-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 hidden sm:block" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <HugeiconsIcon icon={UserGroup02Icon} size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {search ? "Try a different search term." : "No users registered yet."}
            </p>
          </div>
        ) : (
          users.map((u) => (
            <motion.div
              key={u.id}
              className="dash-card px-4 py-3"
              variants={staggerItem}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {u.image ? (
                    <img src={u.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {u.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "?"}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{u.name}</span>
                    {u.id === session?.user?.id && (
                      <span className="text-[10px] text-muted-foreground">(you)</span>
                    )}
                    {u.banned && (
                      <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Role badge */}
                <Badge
                  variant={u.role === "admin" ? "default" : "outline"}
                  className="hidden sm:inline-flex text-[10px]"
                >
                  {u.role ?? "user"}
                </Badge>

                {/* Created */}
                <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
                  {timeAgo(u.createdAt)}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground shrink-0">
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setRoleDialog(u)
                      setNewRole((u.role ?? "user") as "user" | "admin" | "superadmin")
                    }}>
                      <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
                      Change Role
                    </DropdownMenuItem>
                    {session?.user?.role === "superadmin" && u.id !== session?.user?.id && (
                      <DropdownMenuItem onClick={() => handleImpersonate(u.id)}>
                        <HugeiconsIcon icon={EyeIcon} size={14} />
                        Impersonate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {u.banned ? (
                      <DropdownMenuItem onClick={() => handleUnban(u.id)}>
                        <HugeiconsIcon icon={UserIcon} size={14} />
                        Unban
                      </DropdownMenuItem>
                    ) : u.id !== session?.user?.id ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setBanDialog(u)}
                      >
                        <HugeiconsIcon icon={SecurityIcon} size={14} />
                        Ban
                      </DropdownMenuItem>
                    ) : null}
                    {u.id !== session?.user?.id && (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteDialog(u)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                        Delete User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          className="flex items-center justify-between pt-2"
          variants={staggerItem}
        >
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}

      {/* Ban Dialog */}
      <Dialog open={!!banDialog} onOpenChange={(open) => !open && setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban <strong>{banDialog?.name}</strong> ({banDialog?.email}). They will be
              immediately logged out and unable to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason (optional)</Label>
            <Input
              id="ban-reason"
              placeholder="e.g. Spam, ToS violation"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={actionLoading}
            >
              {actionLoading ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Role Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(open) => !open && setRoleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change platform role for <strong>{roleDialog?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={newRole} onValueChange={(v) => v && setNewRole(v as "user" | "admin" | "superadmin")}>
              <SelectTrigger>
                <SelectValue>
                  {(value: string) => {
                    const labels: Record<string, string> = { superadmin: "Super Admin", admin: "Admin", user: "User" }
                    return labels[value] ?? value
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {session?.user?.role === "superadmin" && (
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Super Admins can impersonate other admins. Admins can manage users, ban accounts, and impersonate regular users.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSetRole} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete <strong>{deleteDialog?.name}</strong> ({deleteDialog?.email}).
              This will remove all their data and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
