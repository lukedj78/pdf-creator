"use client"

import { motion } from "framer-motion"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { slideIn } from "@workspace/ui/lib/animation"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

const navItems = [
  { label: "Templates", href: "/dashboard/templates" },
  { label: "Editor", href: "/dashboard/editor" },
  { label: "AI Chat", href: "/dashboard/chat" },
  { label: "API", href: "/dashboard/api-keys" },
  { label: "Docs", href: "/dashboard/docs" },
]

export function Header() {
  return (
    <motion.header
      className="flex items-center justify-between px-3 py-3 border-b border-border md:px-5"
      variants={slideIn("up", 8)}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <HugeiconsIcon icon={File01Icon} size={16} className="text-primary-foreground" />
        </div>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            Home
          </span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-muted-foreground/60" />
          <span className="text-foreground font-semibold">
            Dashboard
          </span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href}>
              <Button
                variant="outline"
                size="sm"
                className="text-sm cursor-pointer"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </motion.header>
  )
}
