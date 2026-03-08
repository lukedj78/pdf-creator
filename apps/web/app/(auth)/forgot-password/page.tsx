"use client"

import Link from "next/link"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { authClient } from "@workspace/auth/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await authClient.resetPassword({
      email,
      redirectTo: "/reset-password",
    } as any)

    if (result.error) {
      setError(result.error.message ?? "Failed to send reset email")
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
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
              Forgot your password?
            </CardTitle>
            <CardDescription className="text-sm font-normal text-muted-foreground">
              {sent
                ? <>If an account exists with <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.</>
                : "Enter the email associated with your account and we\u2019ll send you a reset link."
              }
            </CardDescription>
          </div>
        </CardHeader>
        {!sent && (
          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-6">
                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel htmlFor="email" className="text-sm text-muted-foreground font-normal">
                      Email*
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="dark:bg-background h-9 shadow-xs"
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Field className="gap-4">
                  <Button type="submit" size="lg" disabled={loading} className="rounded-lg h-10 cursor-pointer hover:bg-primary/80">
                    {loading ? "Sending..." : "Send reset link"}
                  </Button>
                  <Button type="button" size="lg" variant="ghost" className="rounded-lg cursor-pointer" nativeButton={false} render={<Link href="/login" />}>
                    Back to Login
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        )}
        {sent && (
          <CardContent className="p-0">
            <Field className="gap-4">
              <Button size="lg" variant="ghost" className="rounded-lg cursor-pointer" nativeButton={false} render={<Link href="/login" />}>
                <Link href="/login">Back to Login</Link>
              </Button>
            </Field>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
