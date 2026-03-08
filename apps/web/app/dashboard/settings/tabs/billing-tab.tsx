"use client"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { trpc } from "@/lib/trpc"
import { authClient, useActiveOrganization } from "@workspace/auth/client"

const PLANS = [
  {
    name: "Free",
    slug: "free" as const,
    price: "$0",
    period: "/month",
    features: [
      "100 spec exports / month",
      "3 templates",
      "1 user",
      "10 AI generations / month",
      "REST API (rate limited)",
      "Community support",
    ],
  },
  {
    name: "Pro",
    slug: "pro" as const,
    price: "$29",
    period: "/month",
    features: [
      "5,000 spec exports / month",
      "Unlimited templates",
      "5 users",
      "500 AI generations / month",
      "AI credit packs available",
      "Webhooks",
      "MCP Server",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise" as const,
    price: "Custom",
    period: "",
    features: [
      "Unlimited spec exports",
      "Unlimited templates",
      "Unlimited users",
      "Unlimited AI generations",
      "SSO / SAML",
      "Dedicated support",
      "SLA",
    ],
  },
]

const CREDIT_PACKS = [
  { slug: "ai-credits-100", credits: 100, price: "$5", perCredit: "$0.05" },
  { slug: "ai-credits-500", credits: 500, price: "$20", perCredit: "$0.04" },
  { slug: "ai-credits-1000", credits: 1000, price: "$35", perCredit: "$0.035" },
]

function UsageSkeleton() {
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-1.5 w-full" />
        </div>
      ))}
    </div>
  )
}

export function BillingTab() {
  const { data, isLoading } = trpc.billing.getUsage.useQuery()
  const { data: activeOrg } = useActiveOrganization()

  const currentPlan = data?.plan ?? "free"
  const usage = data?.usage
  const limits = data?.limits

  const handleCheckout = async (slug: string) => {
    try {
      await authClient.checkout({
        slug,
        metadata: activeOrg?.id ? { organizationId: activeOrg.id } : undefined,
      })
    } catch (err) {
      console.error("Checkout failed:", err)
    }
  }

  const handlePortal = async () => {
    try {
      await authClient.customer.portal()
    } catch (err) {
      console.error("Portal failed:", err)
    }
  }

  const aiUsed = usage?.ai.consumed ?? 0
  const aiTotal = limits?.aiCredits ?? 0
  const aiExhausted = aiTotal !== null && aiUsed >= aiTotal

  return (
    <div className="max-w-3xl space-y-8">
      {/* Current Plan */}
      <div>
        <h3 className="text-sm font-medium mb-4">Current Plan</h3>
        <div className="dash-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold capitalize">
                  {currentPlan}
                </span>
                <Badge variant="secondary">Active</Badge>
              </div>
              {data?.subscription?.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground mt-1">
                  Renews{" "}
                  {new Date(
                    data.subscription.currentPeriodEnd,
                  ).toLocaleDateString()}
                </p>
              )}
              {currentPlan !== "free" && (
                <button
                  onClick={handlePortal}
                  className="text-xs text-muted-foreground hover:text-foreground underline mt-1 transition-colors"
                >
                  Manage subscription
                </button>
              )}
            </div>
          </div>

          {/* Usage */}
          {isLoading ? (
            <UsageSkeleton />
          ) : (
            <div className="space-y-3 pt-2 border-t border-border">
              <UsageBar
                label="AI generations"
                used={aiUsed}
                total={aiTotal}
              />
              <UsageBar
                label="Spec exports"
                used={usage?.exports ?? 0}
                total={limits?.exports ?? null}
              />
              <UsageBar
                label="Templates"
                used={usage?.templates ?? 0}
                total={limits?.templates ?? null}
              />
              <UsageBar
                label="Team members"
                used={usage?.members ?? 0}
                total={limits?.members ?? null}
              />
            </div>
          )}
        </div>
      </div>

      {/* Credit Packs — show when AI credits exhausted on Pro */}
      {aiExhausted && currentPlan === "pro" && (
        <div>
          <h3 className="text-sm font-medium mb-4">Buy AI Credits</h3>
          <div className="dash-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Your monthly AI credits are exhausted. Buy a credit pack to
              continue using AI features.
              {data?.subscription?.currentPeriodEnd && (
                <>
                  {" "}
                  Credits reset{" "}
                  {new Date(
                    data.subscription.currentPeriodEnd,
                  ).toLocaleDateString()}
                  .
                </>
              )}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {CREDIT_PACKS.map((pack) => (
                <div
                  key={pack.slug}
                  className="dash-card p-3 space-y-2 text-center"
                >
                  <div className="text-sm font-semibold">
                    {pack.credits} credits
                  </div>
                  <div className="text-lg font-bold">{pack.price}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {pack.perCredit}/credit
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCheckout(pack.slug)}
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={12} />
                    Buy
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Credit Packs upsell for Free users */}
      {aiExhausted && currentPlan === "free" && (
        <div>
          <div className="dash-card p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Your AI trial credits are exhausted (10/month). Upgrade to Pro for
              500 AI generations/month.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => handleCheckout("pro")}
            >
              Upgrade to Pro — $29/month
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-sm font-medium mb-4">Available Plans</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.slug === currentPlan
            return (
              <div
                key={plan.name}
                className={`dash-card p-4 space-y-3 ${
                  isCurrent ? "ring-1 ring-foreground/20" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{plan.name}</span>
                    {isCurrent && (
                      <Badge variant="default" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-xl font-bold">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={12}
                        className="text-foreground shrink-0"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full"
                  >
                    Current Plan
                  </Button>
                ) : plan.slug === "enterprise" ? (
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Sales
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleCheckout(plan.slug)}
                  >
                    {currentPlan === "free" ? "Upgrade" : "Switch"}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function UsageBar({
  label,
  used,
  total,
}: {
  label: string
  used: number
  total: number | null
}) {
  const percentage =
    total === null || total === 0 ? 0 : Math.min(100, (used / total) * 100)
  const isWarning = total !== null && percentage >= 80
  const isExhausted = total !== null && used >= total

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={`font-medium ${isExhausted ? "text-destructive" : isWarning ? "text-yellow-500" : ""}`}
        >
          {used.toLocaleString()} / {total === null ? "∞" : total.toLocaleString()}
        </span>
      </div>
      <Progress
        value={total === null ? 0 : percentage}
        className={`h-1.5 ${isExhausted ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-yellow-500" : ""}`}
      />
    </div>
  )
}
