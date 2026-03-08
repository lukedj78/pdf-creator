"use client"

import dynamic from "next/dynamic"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Header } from "@/components/header"
import { OrgGuard } from "@/components/org-guard"
import { ImpersonationBanner } from "@/components/impersonation-banner"

const IconSidebar = dynamic(
  () => import("@/components/icon-sidebar").then((m) => ({ default: m.IconSidebar })),
  { ssr: false, loading: () => <div className="w-14 ml-2 my-2 shrink-0" /> }
)

const MobileNav = dynamic(
  () => import("@/components/mobile-nav").then((m) => ({ default: m.MobileNav })),
  { ssr: false }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      <OrgGuard>
        <ImpersonationBanner />
        <div className="dashboard-panel w-full h-dvh flex flex-col overflow-hidden transition-colors duration-300 md:w-[calc(100%-32px)] md:h-[calc(100vh-32px)] md:m-4">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <div className="hidden md:flex">
              <IconSidebar />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2 md:px-4">
              {children}
            </div>
          </div>
          <MobileNav />
        </div>
      </OrgGuard>
    </TooltipProvider>
  )
}
