"use client"

import { motion } from "framer-motion"
import { slideIn } from "@workspace/ui/lib/animation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { File01Icon, BarChartIcon, ZapIcon, MoreHorizontalIcon } from "@hugeicons/core-free-icons"

function SidebarCard({
  title,
  icon,
  metrics,
  innerCards,
  footer,
  delay,
}: {
  title: string
  icon: IconSvgElement
  metrics: { label: string; value: string; unit?: string }[]
  innerCards?: { label: string; value: string; unit?: string }[]
  footer?: string
  delay: number
}) {
  return (
    <motion.div
      className="dash-card p-3.5"
      variants={slideIn("left", 12)}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <HugeiconsIcon icon={icon} size={16} className="text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
        </button>
      </div>

      <div className="space-y-2.5 mb-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <span className="text-sm text-muted-foreground">{m.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold">{m.value}</span>
              {m.unit && (
                <span className="text-xs text-muted-foreground">{m.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {innerCards && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {innerCards.map((card) => (
            <div key={card.label} className="dash-card-inner px-2.5 py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{card.value}</span>
                {card.unit && (
                  <span className="text-xs text-muted-foreground">{card.unit}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {footer && (
        <p className="text-xs text-muted-foreground italic mt-2">{footer}</p>
      )}
    </motion.div>
  )
}

export function SidebarCards() {
  return (
    <>
      <SidebarCard
        title="Template Overview"
        icon={File01Icon}
        delay={0.6}
        metrics={[
          { label: "Total Templates", value: "12" },
          { label: "Published", value: "8" },
          { label: "Drafts", value: "4" },
        ]}
        innerCards={[
          { value: "342", label: "Invoice Exports" },
          { value: "218", label: "Report Exports" },
          { value: "156", label: "Contract Exports" },
          { value: "89", label: "Catalog Exports" },
        ]}
        footer="Most used: Invoice Standard template"
      />
      <SidebarCard
        title="Generation & API Stats"
        icon={BarChartIcon}
        delay={0.8}
        metrics={[
          { label: "Total PDFs Generated", value: "1,248" },
          { label: "Via REST API", value: "892", unit: "req" },
          { label: "Via Visual Editor", value: "356" },
        ]}
        innerCards={[
          { value: "98.4", unit: "%", label: "Success Rate" },
          { value: "230", unit: "ms", label: "Avg Latency" },
          { value: "2.4", unit: "s", label: "Avg Gen Time" },
          { value: "99.9", unit: "%", label: "API Uptime" },
        ]}
      />
      <SidebarCard
        title="AI Chat Agent"
        icon={ZapIcon}
        delay={1.0}
        metrics={[
          { label: "Chat Sessions", value: "86" },
          { label: "Templates Created via AI", value: "24" },
          { label: "Template Modifications", value: "142" },
        ]}
        innerCards={[
          { value: "94.2", unit: "%", label: "AI Accuracy" },
          { value: "1.8", label: "Avg Iterations" },
          { value: "4.7", unit: "/5", label: "User Rating" },
          { value: "3.2", unit: "s", label: "Response Time" },
        ]}
        footer="AI assists 37% of all spec exports"
      />
    </>
  )
}
