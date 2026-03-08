"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { staggerContainer, staggerItem } from "@workspace/ui/lib/animation"

export function CodeBlock({
  code,
  language = "typescript",
  title,
}: {
  code: string
  language?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-card">
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {language}
          </span>
        </div>
      )}
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
          <code>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

export function DocsPage({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <motion.article
      className="prose-docs"
      variants={staggerContainer(0.03)}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base text-muted-foreground">{description}</p>
        )}
      </motion.div>
      <motion.div variants={staggerItem} className="mt-8 space-y-8">
        {children}
      </motion.div>
    </motion.article>
  )
}

export function DocsSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-[14px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  )
}

export function EndpointCard({
  method,
  path,
  description,
  children,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  children?: React.ReactNode
}) {
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-500",
    POST: "bg-blue-500/10 text-blue-500",
    PUT: "bg-amber-500/10 text-amber-500",
    DELETE: "bg-red-500/10 text-red-500",
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="text-[13px] font-medium">{path}</code>
      </div>
      <div className="px-4 py-3">
        <p className="text-[13px] text-muted-foreground">{description}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}

export function ParamTable({
  params,
}: {
  params: { name: string; type: string; required?: boolean; description: string }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 pr-4 font-medium">Parameter</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {params.map((p) => (
            <tr key={p.name}>
              <td className="py-2 pr-4">
                <code className="text-[12px]">{p.name}</code>
                {p.required && (
                  <span className="ml-1 text-[10px] text-red-400">required</span>
                )}
              </td>
              <td className="py-2 pr-4 text-muted-foreground">
                <code className="text-[12px]">{p.type}</code>
              </td>
              <td className="py-2 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip"
  children: React.ReactNode
}) {
  const styles = {
    info: "border-blue-500/30 bg-blue-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    tip: "border-emerald-500/30 bg-emerald-500/5",
  }
  const labels = { info: "Note", warning: "Warning", tip: "Tip" }

  return (
    <div className={`rounded-lg border p-4 ${styles[type]}`}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {labels[type]}
      </p>
      <div className="text-[13px] text-foreground/90">{children}</div>
    </div>
  )
}
