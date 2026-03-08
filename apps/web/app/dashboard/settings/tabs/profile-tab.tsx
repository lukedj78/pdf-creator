"use client"

import { useState, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"
import { Field, FieldLabel } from "@workspace/ui/components/field"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, staggerItem, fade } from "@workspace/ui/lib/animation"
import { cn } from "@workspace/ui/lib/utils"
import { useSession, authClient, useActiveOrganization, signOut } from "@workspace/auth/client"
import { trpc } from "@/lib/trpc"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Camera01Icon,
} from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@workspace/ui/components/dialog"

const SUB_TABS = [
  { id: "account", label: "Account" },
  { id: "notifications", label: "Notifications" },
  { id: "danger", label: "Danger Zone" },
] as const

type SubTabId = (typeof SUB_TABS)[number]["id"]

export function ProfileTab() {
  const [subTab, setSubTab] = useState<SubTabId>("account")

  return (
    <div className="flex gap-6">
      {/* Sub-tabs — vertical */}
      <div className="flex flex-col gap-0.5 w-36 shrink-0">
        {SUB_TABS.map((tab) => (
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
        ))}
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
              {subTab === "account" && <AccountSubTab />}
              {subTab === "notifications" && <NotificationsSubTab />}
              {subTab === "danger" && <DangerSubTab />}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Account Sub-Tab
// ---------------------------------------------------------------------------

function AccountSubTab() {
  const { data: session } = useSession()
  const [name, setName] = useState(session?.user?.name ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const displayImage = avatarPreview ?? session?.user?.image

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await authClient.updateUser({
        name: name.trim(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = name.trim() !== (session?.user?.name ?? "")

  return (
    <div className="max-w-3xl">
      <div className="flex sm:flex-row flex-col gap-6">
        {/* Avatar section */}
        <div className="sm:w-52 shrink-0">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="group relative w-28 h-28 rounded-full mx-auto bg-muted flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={session?.user?.name ?? ""}
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-muted-foreground">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <HugeiconsIcon
                  icon={Camera01Icon}
                  size={24}
                  className="text-white"
                />
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="flex flex-col items-center">
              <p className="text-sm font-medium">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="flex-1">
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <Field className="gap-1">
              <FieldLabel
                htmlFor="profile-name"
                className="text-sm text-muted-foreground font-normal"
              >
                Full Name
              </FieldLabel>
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field className="gap-1">
              <FieldLabel
                htmlFor="profile-email"
                className="text-sm text-muted-foreground font-normal"
              >
                Email
              </FieldLabel>
              <Input
                id="profile-email"
                type="email"
                value={session?.user?.email ?? ""}
                disabled
                className="opacity-60"
              />
            </Field>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setName(session?.user?.name ?? "")
                  setAvatarPreview(null)
                }}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !name.trim() || !hasChanges}
              >
                {saved ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                    Saved
                  </>
                ) : saving ? (
                  "Saving..."
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notifications Sub-Tab
// ---------------------------------------------------------------------------

function NotificationsSubTab() {
  const utils = trpc.useUtils()
  const { data: prefs, isLoading: prefsLoading } =
    trpc.userPreferences.get.useQuery()
  const prefsMutation = trpc.userPreferences.update.useMutation({
    onSuccess: () => utils.userPreferences.get.invalidate(),
  })

  return (
    <div className="max-w-2xl">
      <AnimatePresence mode="wait">
        {prefsLoading ? (
          <motion.div key="skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </motion.div>
        ) : (
          <motion.div key="content" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5 flex-1">
                <Label
                  htmlFor="email-notifications"
                  className="text-sm font-medium"
                >
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Exports, team joins, and workspace activity.
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={prefs?.emailNotifications ?? true}
                onCheckedChange={(checked) =>
                  prefsMutation.mutate({ emailNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5 flex-1">
                <Label
                  htmlFor="marketing-emails"
                  className="text-sm font-medium"
                >
                  Marketing Emails
                </Label>
                <p className="text-xs text-muted-foreground">
                  Product updates, tips, and promotions.
                </p>
              </div>
              <Switch
                id="marketing-emails"
                checked={prefs?.marketingEmails ?? false}
                onCheckedChange={(checked) =>
                  prefsMutation.mutate({ marketingEmails: checked })
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Danger Zone Sub-Tab
// ---------------------------------------------------------------------------

function DangerSubTab() {
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
    <div className="max-w-2xl space-y-3">
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
