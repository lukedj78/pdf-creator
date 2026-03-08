"use client"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Progress } from "@workspace/ui/components/progress"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    current: true,
    features: [
      "100 PDFs / month",
      "3 templates",
      "1 user",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    current: false,
    features: [
      "10,000 PDFs / month",
      "Unlimited templates",
      "5 users",
      "API access",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    current: false,
    features: [
      "Unlimited PDFs",
      "Unlimited templates",
      "Unlimited users",
      "SSO / SAML",
      "Dedicated support",
      "SLA",
    ],
  },
]

export function BillingTab() {
  return (
    <div className="max-w-3xl space-y-8">
      {/* Current Plan */}
      <div>
        <h3 className="text-sm font-medium mb-4">Current Plan</h3>
        <div className="dash-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Free</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your current plan renews automatically.
              </p>
            </div>
          </div>

          {/* Usage */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">PDFs generated</span>
                <span className="font-medium">0 / 100</span>
              </div>
              <Progress value={0} className="h-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Templates</span>
                <span className="font-medium">0 / 3</span>
              </div>
              <Progress value={0} className="h-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Team members</span>
                <span className="font-medium">1 / 1</span>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-sm font-medium mb-4">Available Plans</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`dash-card p-4 space-y-3 ${
                plan.current ? "ring-1 ring-foreground/20" : ""
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {plan.current && (
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

              {plan.current ? (
                <Button variant="outline" size="sm" disabled className="w-full">
                  Current Plan
                </Button>
              ) : plan.name === "Enterprise" ? (
                <Button variant="outline" size="sm" className="w-full">
                  Contact Sales
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              ) : (
                <Button size="sm" className="w-full">
                  Upgrade
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Billing integration coming soon. Upgrade buttons will connect to
          Stripe Checkout.
        </p>
      </div>
    </div>
  )
}
