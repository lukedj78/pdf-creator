import { KpiCards } from "@/components/kpi-cards"
import { SidebarCards } from "@/components/sidebar-cards"
import { MainContent } from "@/components/main-content"

export default function DashboardPage() {
  return (
    <>
      <KpiCards />

      <div className="flex flex-col gap-2.5 mt-2.5 lg:flex-row">
        <div className="w-full shrink-0 space-y-2.5 lg:w-[270px]">
          <SidebarCards />
        </div>

        <div className="flex-1 min-w-0">
          <MainContent />
        </div>
      </div>
    </>
  )
}
