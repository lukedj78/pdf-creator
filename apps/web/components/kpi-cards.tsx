"use client"

import { motion } from "framer-motion"
import { staggerItem, staggerContainer, spring, staggerDelay } from "@workspace/ui/lib/animation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  File01Icon,
  Download01Icon,
  Key01Icon,
  UserGroupIcon,
  ChartIncreaseIcon,
  ZapIcon,
  Clock01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"

type KpiItem = {
  icon: IconSvgElement
  label: string
  value: string
  unit: string
  sparkline?: number[]
  comparison?: { value: string }
  progress?: number
  fraction?: { current: number; total: number }
}

const row1: KpiItem[] = [
  {
    icon: File01Icon,
    label: "Total Templates",
    value: "12",
    unit: "",
    sparkline: [3, 5, 4, 7, 6, 8, 9, 11, 10, 12],
  },
  {
    icon: Download01Icon,
    label: "PDFs Generated",
    value: "1,248",
    unit: "",
    comparison: { value: "vs 980 last month" },
  },
  {
    icon: Key01Icon,
    label: "API Requests",
    value: "3,420",
    unit: "",
    progress: 68,
  },
  {
    icon: UserGroupIcon,
    label: "Active Users",
    value: "23",
    unit: "/ 50",
    fraction: { current: 23, total: 50 },
  },
]

const row2: KpiItem[] = [
  {
    icon: ChartIncreaseIcon,
    label: "Success Rate",
    value: "98.4",
    unit: "%",
    progress: 98,
  },
  {
    icon: ZapIcon,
    label: "AI Generations",
    value: "462",
    unit: "",
    sparkline: [20, 35, 28, 42, 38, 55, 60, 52, 68, 64],
  },
  {
    icon: Clock01Icon,
    label: "Avg. Generation Time",
    value: "2.4",
    unit: "s",
    comparison: { value: "vs 3.1s last month" },
  },
  {
    icon: Message01Icon,
    label: "Chat Sessions",
    value: "86",
    unit: "",
    progress: 43,
  },
]

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 60
  const h = 24
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={w} height={h} className="shrink-0 opacity-40">
      <polyline
        points={points}
        fill="none"
        className="stroke-foreground"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MiniProgress({ value }: { value: number }) {
  const r = 14
  const stroke = 3
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <svg width={36} height={36} className="shrink-0 -rotate-90">
      <circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        className="stroke-muted"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={18}
        cy={18}
        r={r}
        fill="none"
        className="stroke-foreground"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ ...spring.gentle, delay: 0.5 }}
      />
    </svg>
  )
}

function DotGrid({
  current,
  total,
}: {
  current: number
  total: number
}) {
  const cols = Math.ceil(Math.sqrt(total))
  return (
    <div
      className="grid gap-[3px] shrink-0"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[5px] h-[5px] rounded-full ${
            i < current ? "bg-foreground" : "bg-muted"
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...spring.micro, delay: 0.6 + staggerDelay(i, 0.02) }}
        />
      ))}
    </div>
  )
}

function KpiCard({ item, index }: { item: KpiItem; index: number }) {
  return (
    <motion.div
      className="flex-1 min-w-0"
      variants={staggerItem}
      initial="hidden"
      animate="visible"
      custom={index}
    >
      <div className="dash-card px-3.5 py-3 h-full relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={item.icon} size={20} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold leading-none">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-xs text-muted-foreground">{item.unit}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-none mt-1.5 truncate">
                {item.label}
              </p>
            </div>
          </div>
          <div className="shrink-0 hidden lg:block">
            {item.sparkline && <MiniSparkline data={item.sparkline} />}
            {item.progress && !item.sparkline && !item.fraction && (
              <MiniProgress value={item.progress} />
            )}
            {item.fraction && (
              <DotGrid
                current={item.fraction.current}
                total={item.fraction.total}
              />
            )}
            {item.comparison && (
              <span className="text-xs text-muted-foreground">
                {item.comparison.value}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function KpiCards() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {row1.map((item, i) => (
          <KpiCard key={item.label} item={item} index={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {row2.map((item, i) => (
          <KpiCard key={item.label} item={item} index={i + 4} />
        ))}
      </div>
    </div>
  )
}
