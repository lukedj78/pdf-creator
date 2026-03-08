"use client"

import { motion } from "framer-motion"
import { staggerItem, spring, staggerDelay, transition } from "@workspace/ui/lib/animation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Download01Icon, Settings01Icon } from "@hugeicons/core-free-icons"

type MetricRow = {
  label: string
  value: string
  unit?: string
  bar?: { value: number; max: number }
}

type ContentCardData = {
  title: string
  subtitle: string
  metrics: MetricRow[]
}

const cards: ContentCardData[] = [
  {
    title: "Template Library & Management",
    subtitle: "Browse, create and manage PDF templates",
    metrics: [
      { label: "Invoice Standard", value: "342", unit: "exports", bar: { value: 342, max: 400 } },
      { label: "Monthly Report", value: "218", unit: "exports", bar: { value: 218, max: 400 } },
      { label: "Contract Agreement", value: "156", unit: "exports" },
      { label: "Product Catalog", value: "89", unit: "exports" },
      { label: "Custom Templates", value: "4", unit: "drafts" },
    ],
  },
  {
    title: "Visual Editor Components",
    subtitle: "Drag & drop building blocks for PDF design",
    metrics: [
      { label: "Text Blocks", value: "12", unit: "types" },
      { label: "Table Layouts", value: "8", unit: "variants" },
      { label: "Image Containers", value: "6", unit: "types" },
      { label: "Chart Components", value: "4", unit: "types", bar: { value: 4, max: 10 } },
      { label: "Custom Components", value: "3", unit: "user" },
    ],
  },
  {
    title: "AI Agent Performance",
    subtitle: "Natural language document creation metrics",
    metrics: [
      { label: "Generation Accuracy", value: "94.2", unit: "%" },
      { label: "Avg Iterations to Final", value: "1.8", unit: "" },
      { label: "User Satisfaction", value: "4.7", unit: "/5" },
      { label: "Templates from Prompt", value: "24", unit: "total", bar: { value: 24, max: 50 } },
      { label: "Modification Requests", value: "142", unit: "total" },
    ],
  },
  {
    title: "REST API & SDK Usage",
    subtitle: "Third-party integration endpoints",
    metrics: [
      { label: "POST /generate", value: "2,180", unit: "calls" },
      { label: "GET /templates", value: "890", unit: "calls" },
      { label: "POST /render", value: "350", unit: "calls" },
      { label: "Avg Response Time", value: "230", unit: "ms", bar: { value: 230, max: 1000 } },
      { label: "Error Rate", value: "0.3", unit: "%" },
    ],
  },
  {
    title: "Export History & Storage",
    subtitle: "Generated documents and storage usage",
    metrics: [
      { label: "Today", value: "48", unit: "PDFs" },
      { label: "This Week", value: "312", unit: "PDFs" },
      { label: "This Month", value: "1,248", unit: "PDFs", bar: { value: 1248, max: 2000 } },
      { label: "Storage Used", value: "2.4", unit: "GB" },
      { label: "Avg File Size", value: "1.8", unit: "MB" },
    ],
  },
  {
    title: "Team & Collaboration",
    subtitle: "Shared workflows and permissions",
    metrics: [
      { label: "Team Members", value: "8", unit: "active" },
      { label: "Shared Templates", value: "15", unit: "total" },
      { label: "Pending Reviews", value: "3", unit: "" },
      { label: "Comments This Week", value: "42", unit: "" },
      { label: "Role: Admin", value: "2", unit: "users" },
    ],
  },
  {
    title: "Webhooks & Automation",
    subtitle: "Event-driven spec export pipelines",
    metrics: [
      { label: "Active Webhooks", value: "5", unit: "" },
      { label: "Triggers Today", value: "127", unit: "events" },
      { label: "Success Rate", value: "99.1", unit: "%", bar: { value: 99, max: 100 } },
      { label: "Avg Processing", value: "450", unit: "ms" },
      { label: "Failed (24h)", value: "1", unit: "event" },
    ],
  },
  {
    title: "Usage & Billing",
    subtitle: "Current plan limits and consumption",
    metrics: [
      { label: "Plan", value: "Pro", unit: "" },
      { label: "PDFs Remaining", value: "8,752", unit: "/10k" },
      { label: "API Calls Left", value: "96,580", unit: "/100k", bar: { value: 96, max: 100 } },
      { label: "AI Credits", value: "4,200", unit: "/5k" },
      { label: "Next Billing", value: "Mar 15", unit: "" },
    ],
  },
]

function AnimatedBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="w-full h-[5px] rounded-full bg-muted mt-0.5">
      <motion.div
        className="h-full rounded-full bg-foreground/40"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ ...spring.gentle, delay: 0.6 }}
      />
    </div>
  )
}

function ContentCard({
  card,
  index,
}: {
  card: ContentCardData
  index: number
}) {
  return (
    <motion.div
      className="dash-card p-3 h-full flex flex-col"
      variants={staggerItem}
      initial="hidden"
      animate="visible"
    >
      <h4 className="text-base font-semibold leading-tight mb-0.5">
        {card.title}
      </h4>
      <p className="text-xs text-muted-foreground mb-2 leading-tight">
        {card.subtitle}
      </p>

      <div className="flex-1 flex flex-col gap-2">
        {card.metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold">{m.value}</span>
                {m.unit && (
                  <span className="text-xs text-muted-foreground">{m.unit}</span>
                )}
              </div>
            </div>
            {m.bar && <AnimatedBar value={m.bar.value} max={m.bar.max} />}
          </div>
        ))}
      </div>

      <button className="dash-btn-details w-full mt-3 flex items-center justify-between px-3 py-1.5 cursor-pointer">
        <span className="text-sm font-medium text-accent-foreground">
          View Details
        </span>
        <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-accent-foreground" />
      </button>
    </motion.div>
  )
}

export function MainContent() {
  return (
    <div>
      <motion.div
        className="flex items-center justify-between mb-2"
        variants={staggerItem}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-base font-semibold">
          SpecDesigner Platform Overview
        </h2>
        <div className="flex items-center gap-1.5">
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <HugeiconsIcon icon={Download01Icon} size={16} />
          </button>
          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <HugeiconsIcon icon={Settings01Icon} size={16} />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, i) => (
          <ContentCard key={card.title} card={card} index={i} />
        ))}
      </div>
    </div>
  )
}
