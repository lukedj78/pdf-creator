"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@workspace/ui/lib/animation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  RocketIcon,
  ApiIcon,
  PackageIcon,
  FileEditIcon,
  WebhookIcon,
} from "@hugeicons/core-free-icons"

const cards = [
  {
    icon: RocketIcon,
    title: "Quickstart",
    description: "Export your first JSON spec in under 5 minutes.",
    href: "/docs/quickstart",
  },
  {
    icon: ApiIcon,
    title: "REST API",
    description:
      "Full reference for templates, spec export, and history endpoints.",
    href: "/docs/api",
  },
  {
    icon: PackageIcon,
    title: "SDK",
    description:
      "TypeScript SDK for Node.js, Deno, and Bun. Install and start exporting specs.",
    href: "/docs/sdk",
  },
  {
    icon: FileEditIcon,
    title: "Template Schema",
    description:
      "JSON schema specification: elements, styles, data binding, page settings.",
    href: "/docs/templates",
  },
  {
    icon: WebhookIcon,
    title: "Webhooks",
    description:
      "Receive real-time notifications when specs are exported or templates change.",
    href: "/docs/webhooks",
  },
]

export default function DocsPage() {
  return (
    <motion.div
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Documentation
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Everything you need to export json-render specs programmatically — via REST API,
          TypeScript SDK, or the visual editor.
        </p>
      </motion.div>

      <motion.div
        className="mt-10 grid gap-4 sm:grid-cols-2"
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <motion.div key={card.href} variants={staggerItem}>
            <Link
              href={card.href}
              className="group flex gap-4 rounded-lg border border-border p-5 transition-colors hover:border-foreground/20 hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <HugeiconsIcon
                  icon={card.icon}
                  size={20}
                  className="text-foreground/70"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{card.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-12 rounded-lg border border-border bg-card p-6"
        variants={staggerItem}
      >
        <h2 className="text-sm font-semibold">Base URL</h2>
        <code className="mt-2 block text-[13px] text-muted-foreground">
          https://your-domain.com/api/v1
        </code>
        <p className="mt-3 text-[13px] text-muted-foreground">
          All API endpoints are prefixed with{" "}
          <code className="rounded bg-accent px-1.5 py-0.5 text-[12px]">
            /api/v1
          </code>
          . Authentication uses Bearer tokens via API keys generated from your
          dashboard.
        </p>
      </motion.div>
    </motion.div>
  )
}
