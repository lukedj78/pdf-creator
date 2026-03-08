"use client"

import { motion } from "framer-motion"
import { staggerItem } from "../../lib/animation"
import { cn } from "../../lib/utils"

interface PageTitleProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageTitle({ title, subtitle, action, className }: PageTitleProps) {
  return (
    <motion.div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      variants={staggerItem}
    >
      <div>
        <h1 className="text-base font-medium">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2">{action}</div>
      )}
    </motion.div>
  )
}
