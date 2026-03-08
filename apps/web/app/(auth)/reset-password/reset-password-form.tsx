"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { authClient } from "@workspace/auth/client"

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.")
      return
    }

    setLoading(true)

    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      } as any)

      if ((result as any).error) {
        setError((result as any).error.message ?? "Failed to reset password")
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch {
      setError("Failed to reset password. The link may have expired.")
      setLoading(false)
    }
  }

  if (!token && !success) {
    return (
      <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
        <Card className="px-6 py-8 sm:p-12 relative gap-6">
          <CardHeader className="text-center gap-6 p-0">
            <div className="mx-auto">
              <Link href="/">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <HugeiconsIcon icon={File01Icon} size={20} className="text-primary-foreground" />
                </div>
              </Link>
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Invalid reset link
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                This password reset link is invalid or has expired.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Button
              size="lg"
              className="w-full rounded-lg h-10 cursor-pointer hover:bg-primary/80"
              nativeButton={false}
              render={<Link href="/forgot-password" />}
            >
              Request a new link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
      <Card className="px-6 py-8 sm:p-12 relative gap-6">
        <CardHeader className="text-center gap-6 p-0">
          <div className="mx-auto">
            <Link href="/">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <HugeiconsIcon icon={File01Icon} size={20} className="text-primary-foreground" />
              </div>
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl font-medium text-card-foreground">
              {success ? "Password reset" : "Set new password"}
            </CardTitle>
            <CardDescription className="text-sm font-normal text-muted-foreground">
              {success
                ? "Your password has been reset successfully."
                : "Enter your new password below."
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {success ? (
            <Button
              size="lg"
              className="w-full rounded-lg h-10 cursor-pointer hover:bg-primary/80"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Go to Login
            </Button>
          ) : (
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-6">
                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="password" className="text-sm text-muted-foreground font-normal">
                      New password*
                    </FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="dark:bg-background h-9 shadow-xs"
                    />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="confirm-password" className="text-sm text-muted-foreground font-normal">
                      Confirm password*
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="dark:bg-background h-9 shadow-xs"
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" size="lg" disabled={loading} className="rounded-lg h-10 cursor-pointer hover:bg-primary/80">
                  {loading ? "Resetting..." : "Reset password"}
                </Button>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
