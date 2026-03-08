"use client"

import { motion } from "framer-motion"
import { staggerContainer } from "../../lib/animation"
import { cn } from "../../lib/utils"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <motion.div
      className={cn(
        "h-[calc(100vh-80px)] -mx-3 -mb-4 -mt-2 md:mx-0 md:mb-0 md:mt-0 md:rounded-lg md:border md:border-border flex flex-col overflow-y-auto bg-background",
        className
      )}
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      <div className="space-y-4 px-4 pb-4 pt-4 md:px-6 flex-1">
        {children}
      </div>
    </motion.div>
  )
}
