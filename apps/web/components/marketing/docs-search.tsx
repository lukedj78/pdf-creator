"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

interface SearchEntry {
  title: string
  section: string
  href: string
  keywords: string
}

const searchIndex: SearchEntry[] = [
  // Getting Started
  { title: "Introduction", section: "Getting Started", href: "/docs", keywords: "overview documentation home start" },
  { title: "Quickstart", section: "Getting Started", href: "/docs/quickstart", keywords: "install setup first spec sdk npm api key curl generate export" },
  // API Reference
  { title: "Authentication", section: "API Reference", href: "/docs/api#authentication", keywords: "api key bearer token authorization header" },
  { title: "List Templates", section: "API Reference", href: "/docs/api#templates", keywords: "get templates list search filter pagination" },
  { title: "Create Template", section: "API Reference", href: "/docs/api#templates", keywords: "post create new template schema" },
  { title: "Update Template", section: "API Reference", href: "/docs/api#templates", keywords: "put update edit template" },
  { title: "Delete Template", section: "API Reference", href: "/docs/api#templates", keywords: "delete remove template" },
  { title: "Duplicate Template", section: "API Reference", href: "/docs/api#templates", keywords: "post duplicate copy template clone" },
  { title: "Export Spec", section: "API Reference", href: "/docs/api#generate", keywords: "post export spec json render create document callback" },
  { title: "List Generations", section: "API Reference", href: "/docs/api#generations", keywords: "get generations history list" },
  { title: "Delete Generation", section: "API Reference", href: "/docs/api#generations", keywords: "delete generation remove" },
  { title: "Error Handling", section: "API Reference", href: "/docs/api#errors", keywords: "error status code 400 401 404 429 500 response" },
  { title: "Rate Limiting & Usage", section: "API Reference", href: "/docs/api#usage", keywords: "rate limit usage remaining quota throttle" },
  // SDK
  { title: "Installation", section: "SDK", href: "/docs/sdk#installation", keywords: "npm install pnpm yarn bun setup typescript" },
  { title: "Template Methods", section: "SDK", href: "/docs/sdk#templates", keywords: "list get create update delete duplicate template sdk client" },
  { title: "Spec Export", section: "SDK", href: "/docs/sdk#export", keywords: "export spec json file write save callback" },
  { title: "Error Handling", section: "SDK", href: "/docs/sdk#errors", keywords: "SpecDesignerError catch try error code status" },
  { title: "TypeScript Types", section: "SDK", href: "/docs/sdk#types", keywords: "types typescript interface template generation config" },
  { title: "Usage & Rate Limits", section: "SDK", href: "/docs/sdk#usage", keywords: "getUsage rate limit remaining quota" },
  // Template Schema
  { title: "Schema Overview", section: "Template Schema", href: "/docs/templates#overview", keywords: "json schema flat element map root elements state structure" },
  { title: "Text Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "text content bold italic underline" },
  { title: "Heading Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "heading h1 h2 h3 h4 h5 h6 level" },
  { title: "Image Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "image src alt photo logo" },
  { title: "Table Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "table columns rows header striped bordered data" },
  { title: "Row & Column", section: "Template Schema", href: "/docs/templates#elements", keywords: "row column layout flex gap wrap horizontal vertical" },
  { title: "View", section: "Template Schema", href: "/docs/templates#elements", keywords: "view wrapper container div group nesting children padding border" },
  { title: "Link Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "link hyperlink href url anchor" },
  { title: "Spacer & Divider", section: "Template Schema", href: "/docs/templates#elements", keywords: "spacer divider separator line height thickness" },
  { title: "List Element", section: "Template Schema", href: "/docs/templates#elements", keywords: "list items ordered unordered bullet" },
  { title: "PageNumber", section: "Template Schema", href: "/docs/templates#elements", keywords: "page number total pages footer counter" },
  { title: "Styles", section: "Template Schema", href: "/docs/templates#styles", keywords: "css styles width height padding margin font color border flex" },
  { title: "Data Binding", section: "Template Schema", href: "/docs/templates#data-binding", keywords: "variable binding template data dynamic placeholder mustache" },
  { title: "Page Settings", section: "Template Schema", href: "/docs/templates#page-settings", keywords: "page size a4 a3 letter legal orientation portrait landscape margins" },
  { title: "Nesting Elements", section: "Template Schema", href: "/docs/templates#children", keywords: "children nesting parent layout row column container" },
  // Webhooks
  { title: "Callback URL", section: "Webhooks", href: "/docs/webhooks#callback-url", keywords: "callback url per-request notification generate" },
  { title: "Dashboard Webhooks", section: "Webhooks", href: "/docs/webhooks#setup", keywords: "webhook persistent subscription configure dashboard settings" },
  { title: "Events", section: "Webhooks", href: "/docs/webhooks#events", keywords: "events generation completed failed template created updated" },
  { title: "Security", section: "Webhooks", href: "/docs/webhooks#security", keywords: "hmac sha256 signature verify security secret retry" },
]

function search(query: string): SearchEntry[] {
  if (!query.trim()) return []
  const terms = query.toLowerCase().split(/\s+/)
  return searchIndex
    .map((entry) => {
      const haystack = `${entry.title} ${entry.section} ${entry.keywords}`.toLowerCase()
      const score = terms.reduce((s, term) => s + (haystack.includes(term) ? 1 : 0), 0)
      return { ...entry, score }
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
}

export function DocsSearch() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchEntry[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setResults(search(query))
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function navigate(href: string) {
    setOpen(false)
    setQuery("")
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].href)
    }
  }

  return (
    <div ref={containerRef} className="relative mb-6">
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-16 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/20 focus:ring-1 focus:ring-foreground/10"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl K
        </kbd>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {results.map((entry, i) => (
            <button
              key={entry.href + entry.title}
              onClick={() => navigate(entry.href)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors ${
                i === selectedIndex ? "bg-accent" : ""
              }`}
            >
              <span className="min-w-0 flex-1 truncate">{entry.title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {entry.section}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-popover p-4 text-center text-[13px] text-muted-foreground shadow-lg">
          No results for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
