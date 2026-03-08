"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon, GithubIcon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { signIn, authClient } from "@workspace/auth/client"

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message ?? "Login failed")
      setLoading(false)
      return
    }

    // Ensure an active organization is set before navigating
    const { data: orgs } = await authClient.organization.list()
    if (orgs && orgs.length > 0) {
      await authClient.organization.setActive({ organizationId: orgs[0]!.id })
    }

    router.push(callbackUrl)
  }

  async function handleGithub() {
    await signIn.social({ provider: "github", callbackURL: callbackUrl })
  }

  async function handleGoogle() {
    await signIn.social({ provider: "google", callbackURL: callbackUrl })
  }

  return (
    <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
      <Card className="max-w-lg px-6 py-8 sm:p-12 relative gap-6">
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
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground font-normal">
              Sign in to your account
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-6">
              <Field className="grid md:grid-cols-2 md:gap-6 gap-3">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogle}
                  className="text-sm text-medium text-card-foreground gap-2 dark:bg-background rounded-lg h-9 shadow-xs cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGithub}
                  className="text-sm text-medium text-card-foreground gap-2 dark:bg-background rounded-lg h-9 shadow-xs cursor-pointer"
                >
                  <HugeiconsIcon icon={GithubIcon} size={16} />
                  Sign in with GitHub
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-sm text-muted-foreground bg-transparent">
                <span className="px-4">or sign in with</span>
              </FieldSeparator>

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
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="password" className="text-sm text-muted-foreground font-normal">
                    Password*
                  </FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="dark:bg-background h-9 shadow-xs"
                  />
                </Field>
              </div>

              <Field orientation="horizontal" className="justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox id="remember" defaultChecked className="cursor-pointer" />
                  <FieldLabel htmlFor="remember" className="text-sm text-primary font-normal cursor-pointer">
                    Remember this device
                  </FieldLabel>
                </div>
                <Link href="/forgot-password" className="text-sm text-card-foreground font-medium text-end">
                  Forgot password?
                </Link>
              </Field>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Field className="gap-4">
                <Button type="submit" size="lg" disabled={loading} className="rounded-lg h-10 hover:bg-primary/80 cursor-pointer">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-medium text-card-foreground no-underline!">
                    Create an account
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
