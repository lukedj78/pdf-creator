"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Badge } from "@workspace/ui/components/badge"
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
  ShieldKeyIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  SmartPhone01Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, staggerItem, fade } from "@workspace/ui/lib/animation"
import { cn } from "@workspace/ui/lib/utils"
import { authClient, useSession } from "@workspace/auth/client"

type SessionItem = {
  id: string
  createdAt: Date
  expiresAt: Date
  ipAddress?: string | null
  userAgent?: string | null
  token: string
}

const SUB_TABS = [
  { id: "password", label: "Password" },
  { id: "2fa", label: "Two-Factor" },
  { id: "sessions", label: "Sessions" },
] as const

type SubTabId = (typeof SUB_TABS)[number]["id"]

export function SecurityTab() {
  const [subTab, setSubTab] = useState<SubTabId>("password")

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
              {subTab === "password" && <PasswordSubTab />}
              {subTab === "2fa" && <TwoFactorSubTab />}
              {subTab === "sessions" && <SessionsSubTab />}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Password Sub-Tab
// ---------------------------------------------------------------------------

function PasswordSubTab() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    setError("")
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setSaving(true)
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })
      if (res.error) {
        setError(res.error.message ?? "Failed to change password.")
        return
      }
      setSaved(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="current-password" className="text-sm text-muted-foreground font-normal">
            Current Password
          </Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-password" className="text-sm text-muted-foreground font-normal">
            New Password
          </Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm-password" className="text-sm text-muted-foreground font-normal">
            Confirm New Password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
          >
            {saved ? (
              <>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                Updated
              </>
            ) : saving ? (
              "Updating..."
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Two-Factor Sub-Tab
// ---------------------------------------------------------------------------

function TwoFactorSubTab() {
  const { data: session } = useSession()

  const [enabled, setEnabled] = useState(
    session?.user
      ? (session.user as Record<string, unknown>).twoFactorEnabled === true
      : false
  )
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [totpCode, setTotpCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [enablePassword, setEnablePassword] = useState("")

  async function handleEnable() {
    setError("")
    if (!enablePassword) {
      setError("Enter your password to enable 2FA.")
      return
    }
    setLoading(true)
    try {
      const res = await authClient.twoFactor.enable({
        password: enablePassword,
      })
      if (res.error) {
        setError(res.error.message ?? "Failed to enable 2FA.")
        return
      }
      if (res.data) {
        const data = res.data as { totpURI?: string; backupCodes?: string[] }
        setTotpUri(data.totpURI ?? null)
        setBackupCodes(data.backupCodes ?? null)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setError("")
    setLoading(true)
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: totpCode })
      if (res.error) {
        setError(res.error.message ?? "Invalid code.")
        return
      }
      setEnabled(true)
      setTotpUri(null)
      setTotpCode("")
      setEnablePassword("")
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    setError("")
    setLoading(true)
    try {
      const res = await authClient.twoFactor.disable({
        password: disablePassword,
      })
      if (res.error) {
        setError(res.error.message ?? "Failed to disable 2FA.")
        return
      }
      setEnabled(false)
      setDisableOpen(false)
      setDisablePassword("")
      setBackupCodes(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="dash-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <HugeiconsIcon icon={ShieldKeyIcon} size={20} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Authenticator App</p>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? "Two-factor authentication is enabled."
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
          </div>
          {enabled ? (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setDisableOpen(true)}
            >
              Disable
            </Button>
          ) : !totpUri ? (
            <div className="flex items-center gap-2">
              <Input
                type="password"
                placeholder="Password"
                value={enablePassword}
                onChange={(e) => setEnablePassword(e.target.value)}
                className="w-36 h-8 text-xs"
              />
              <Button size="sm" onClick={handleEnable} disabled={loading || !enablePassword}>
                {loading ? "..." : "Enable"}
              </Button>
            </div>
          ) : null}
        </div>

        {/* TOTP Setup */}
        {totpUri && !enabled && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Scan this QR code with your authenticator app (Google
              Authenticator, Authy, 1Password, etc.), then enter the
              verification code below.
            </p>
            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUri)}`}
                  alt="2FA QR Code"
                  width={180}
                  height={180}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="totp-code" className="text-sm text-muted-foreground font-normal">
                Verification Code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="max-w-36 font-mono text-center tracking-widest"
                />
                <Button
                  size="sm"
                  onClick={handleVerify}
                  disabled={loading || totpCode.length !== 6}
                >
                  Verify
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes && backupCodes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-medium">Backup Codes</p>
            <p className="text-xs text-muted-foreground">
              Save these codes in a secure place. Each code can only be used
              once.
            </p>
            <div className="grid grid-cols-2 gap-1.5 bg-muted/50 rounded-lg p-3 font-mono text-xs">
              {backupCodes.map((code) => (
                <span key={code} className="text-muted-foreground">
                  {code}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Disable 2FA Dialog */}
      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDisableOpen(false)
            setDisablePassword("")
            setError("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA. This will make your
              account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disable-password">Password</Label>
            <Input
              id="disable-password"
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDisableOpen(false)
                setDisablePassword("")
                setError("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={loading || !disablePassword}
            >
              {loading ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sessions Sub-Tab
// ---------------------------------------------------------------------------

function parseUserAgent(ua?: string | null) {
  if (!ua) return "Unknown device"
  if (ua.includes("Chrome")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari")) return "Safari"
  if (ua.includes("Edge")) return "Edge"
  return "Browser"
}

function SessionsSubTab() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authClient.listSessions()
      if (res.data) {
        setSessions(
          (res.data as SessionItem[]).map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            expiresAt: new Date(s.expiresAt),
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleRevoke(token: string) {
    setRevokingId(token)
    try {
      await authClient.revokeSession({ token })
      setSessions((prev) => prev.filter((s) => s.token !== token))
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <AnimatePresence mode="wait">
    {loading ? (
      <motion.div key="sessions-skeleton" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2 max-w-2xl">
        {[1, 2].map((i) => (
          <div key={i} className="dash-card p-3 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        ))}
      </motion.div>
    ) : sessions.length === 0 ? (
      <motion.div key="sessions-empty" variants={fade} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <HugeiconsIcon icon={SmartPhone01Icon} size={28} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No sessions found</h3>
      </motion.div>
    ) : (
      <motion.div key="sessions-list" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-2 max-w-2xl">
      <AnimatePresence mode="popLayout">
      {sessions.map((s) => {
        const isCurrent =
          s.token === (session?.session as Record<string, unknown>)?.token
        return (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="dash-card p-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Key01Icon} size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {parseUserAgent(s.userAgent)}
                </span>
                {isCurrent && (
                  <Badge variant="default" className="text-[10px]">
                    Current
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {s.ipAddress ?? "Unknown IP"} &middot; Created{" "}
                {s.createdAt.toLocaleDateString()}
              </p>
            </div>
            {!isCurrent && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={() => handleRevoke(s.token)}
                disabled={revokingId === s.token}
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
              </Button>
            )}
          </motion.div>
        )
      })}
      </AnimatePresence>
    </motion.div>
    )}
    </AnimatePresence>
  )
}
