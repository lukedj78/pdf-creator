"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem, fade } from "@workspace/ui/lib/animation"
import { DocsSearch } from "@/components/marketing/docs-search"

const sections = [
  {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { label: "Authentication", href: "/docs/api#authentication" },
      { label: "Templates", href: "/docs/api#templates" },
      { label: "Export Spec", href: "/docs/api#generate" },
      { label: "Generations", href: "/docs/api#generations" },
      { label: "Rate Limits & Usage", href: "/docs/api#usage" },
      { label: "Errors", href: "/docs/api#errors" },
    ],
  },
  {
    title: "SDK",
    items: [
      { label: "Installation", href: "/docs/sdk#installation" },
      { label: "Templates", href: "/docs/sdk#templates" },
      { label: "Spec Export", href: "/docs/sdk#export" },
      { label: "Export History", href: "/docs/sdk#generations-list" },
      { label: "Usage & Rate Limits", href: "/docs/sdk#usage" },
      { label: "Error Handling", href: "/docs/sdk#errors" },
    ],
  },
  {
    title: "Template Schema",
    items: [
      { label: "Overview", href: "/docs/templates#overview" },
      { label: "Elements", href: "/docs/templates#elements" },
      { label: "Styles", href: "/docs/templates#styles" },
      { label: "Data Binding", href: "/docs/templates#data-binding" },
      { label: "Page Settings", href: "/docs/templates#page-settings" },
    ],
  },
  {
    title: "Webhooks",
    items: [
      { label: "Callback URL", href: "/docs/webhooks#callback-url" },
      { label: "Dashboard Webhooks", href: "/docs/webhooks#setup" },
      { label: "Events", href: "/docs/webhooks#events" },
      { label: "Security", href: "/docs/webhooks#security" },
    ],
  },
  {
    title: "MCP Server",
    items: [
      { label: "Overview", href: "/docs/mcp#overview" },
      { label: "Setup", href: "/docs/mcp#setup" },
      { label: "Tools", href: "/docs/mcp#tools" },
      { label: "Prompts", href: "/docs/mcp#prompts" },
      { label: "Examples", href: "/docs/mcp#examples" },
      { label: "Resources", href: "/docs/mcp#resources" },
    ],
  },
]

function DocsSidebar() {
  const pathname = usePathname()
  const [hash, setHash] = useState("")

  useEffect(() => {
    setHash(window.location.hash)
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-24 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h4>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const [itemPath, itemHash] = item.href.split("#")
                const isActive = itemHash
                  ? pathname === itemPath && hash === `#${itemHash}`
                  : pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (itemHash) setHash(`#${itemHash}`)
                      }}
                      className={`block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                        isActive
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function DocsMobileNav() {
  const pathname = usePathname()
  const allItems = sections.flatMap((s) =>
    s.items.map((i) => ({ ...i, section: s.title }))
  )

  return (
    <div className="mb-8 overflow-x-auto border-b border-border pb-4 lg:hidden">
      <div className="flex gap-2">
        {allItems
          .filter((item) => !item.href.includes("#"))
          .map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
      </div>
    </div>
  )
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <motion.div
      className="mx-auto max-w-6xl px-6 py-16"
      variants={fade}
      initial="hidden"
      animate="visible"
    >
      <DocsSearch />
      <DocsMobileNav />
      <div className="flex gap-12">
        <DocsSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </motion.div>
  )
}
