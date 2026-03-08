"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LayoutGridIcon,
  PenTool01Icon,
  File01Icon,
  Message01Icon,
  Download01Icon,
  Key01Icon,
  Settings01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@workspace/ui/components/dropdown-menu"

const primaryItems = [
  { icon: LayoutGridIcon, label: "Home", href: "/dashboard" },
  { icon: PenTool01Icon, label: "Editor", href: "/dashboard/editor" },
  { icon: Message01Icon, label: "AI Chat", href: "/dashboard/chat" },
]

const moreItems = [
  { icon: File01Icon, label: "Templates", href: "/dashboard/templates" },
  { icon: Download01Icon, label: "Exports", href: "/dashboard/exports" },
  { icon: Key01Icon, label: "API Keys", href: "/dashboard/api-keys" },
  { icon: Settings01Icon, label: "Settings", href: "/dashboard/settings" },
]

export function MobileNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const moreIsActive = moreItems.some((item) => isActive(item.href))

  return (
    <nav className="flex md:hidden items-center justify-around border-t border-border bg-background/80 backdrop-blur-lg px-1 py-1.5 shrink-0">
      {primaryItems.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] transition-colors ${
              active ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <HugeiconsIcon icon={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] transition-colors cursor-pointer ${
            moreIsActive ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
          <span>More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={8}>
          {moreItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              className={isActive(item.href) ? "text-foreground" : ""}
              render={<Link href={item.href} />}
            >
              <HugeiconsIcon icon={item.icon} size={16} />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  )
}
