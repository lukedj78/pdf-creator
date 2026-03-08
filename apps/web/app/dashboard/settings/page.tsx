"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { staggerContainer, staggerItem } from "@workspace/ui/lib/animation"
import { PageShell } from "@workspace/ui/components/shared/page-shell"
import { PageTitle } from "@workspace/ui/components/shared/page-title"
import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  User02Icon,
  UserGroup02Icon,
  Link01Icon,
  ShieldKeyIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import { ProfileTab } from "./tabs/profile-tab"
import { TeamTab } from "./tabs/team-tab"
import { WebhooksTab } from "./tabs/webhooks-tab"
import { SecurityTab } from "./tabs/security-tab"
import { BillingTab } from "./tabs/billing-tab"

const TABS = [
  { id: "profile", label: "Profile", icon: User02Icon, description: "Manage your personal information, notifications, and account." },
  { id: "team", label: "Workspace", icon: UserGroup02Icon, description: "Manage your workspace, members, and invitations." },
  { id: "security", label: "Security", icon: ShieldKeyIcon, description: "Password, two-factor authentication, and active sessions." },
  { id: "billing", label: "Billing", icon: CreditCardIcon, description: "Manage your plan, usage, and billing information." },
  { id: "webhooks", label: "Webhooks", icon: Link01Icon, description: "Receive HTTP callbacks when events occur in your workspace." },
] as const

type TabId = (typeof TABS)[number]["id"]

const VALID_TABS = TABS.map((t) => t.id)

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const initialTab = VALID_TABS.includes(tabParam as TabId)
    ? (tabParam as TabId)
    : "profile"
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as TabId)) {
      setActiveTab(tabParam as TabId)
    }
  }, [tabParam])

  return (
    <PageShell>
      <PageTitle
        title="Settings"
        subtitle="Manage your profile, team, and workspace preferences."
      />

      {/* Tabs Navigation */}
      <motion.div
        className="flex gap-1 border-b border-border pb-px overflow-x-auto"
        variants={staggerItem}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "text-foreground border-b-2 border-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HugeiconsIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Description + Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={staggerContainer()}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="space-y-4"
        >
          <motion.p variants={staggerItem} className="text-xs text-muted-foreground">
            {TABS.find((t) => t.id === activeTab)?.description}
          </motion.p>
          <motion.div variants={staggerItem}>
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "team" && <TeamTab />}
            {activeTab === "security" && <SecurityTab />}
            {activeTab === "billing" && <BillingTab />}
            {activeTab === "webhooks" && <WebhooksTab />}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </PageShell>
  )
}
