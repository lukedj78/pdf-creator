"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon, CheckmarkCircle01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { authClient } from "@workspace/auth/client"

export function VerifyEmailContent({ token }: { token: string | null }) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">(
    token ? "loading" : "no-token"
  )

  useEffect(() => {
    if (!token) return

    authClient.verifyEmail({ token } as any).then((result: any) => {
      if (result.error) {
        setStatus("error")
      } else {
        setStatus("success")
      }
    }).catch(() => {
      setStatus("error")
    })
  }, [token])

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

          {status === "loading" && (
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Verifying your email...
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                Please wait while we verify your email address.
              </CardDescription>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col gap-3 items-center">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} className="text-green-500" />
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Email verified
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                Your email has been verified successfully. You can now sign in.
              </CardDescription>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col gap-3 items-center">
              <HugeiconsIcon icon={Cancel01Icon} size={40} className="text-destructive" />
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Verification failed
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                The verification link is invalid or has expired. Please try again.
              </CardDescription>
            </div>
          )}

          {status === "no-token" && (
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Check your email
              </CardTitle>
              <CardDescription className="text-sm font-normal text-muted-foreground">
                We sent you a verification link. Click it to verify your email address.
              </CardDescription>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {(status === "success" || status === "error" || status === "no-token") && (
            <Button
              size="lg"
              className="w-full rounded-lg h-10 cursor-pointer hover:bg-primary/80"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              {status === "success" ? "Go to Login" : "Back to Login"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
