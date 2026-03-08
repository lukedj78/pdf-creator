"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { slideIn, staggerDelay, spring, transition } from "@workspace/ui/lib/animation"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  LayoutGridIcon,
  File01Icon,
  PenTool01Icon,
  Message01Icon,
  Download01Icon,
  Key01Icon,
  Settings01Icon,
  User02Icon,
  Logout01Icon,
  CreditCardIcon,
  Moon01Icon,
  Sun01Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@workspace/ui/components/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@workspace/ui/components/dropdown-menu"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { authClient, useSession, signOut } from "@workspace/auth/client"

const mainItems = [
  { icon: LayoutGridIcon, label: "Dashboard", href: "/dashboard" },
  { icon: PenTool01Icon, label: "Editor", href: "/dashboard/editor" },
  { icon: File01Icon, label: "Templates", href: "/dashboard/templates" },
  { icon: Message01Icon, label: "AI Chat", href: "/dashboard/chat" },
  { icon: Download01Icon, label: "Exports", href: "/dashboard/exports" },
  { icon: Key01Icon, label: "API Keys", href: "/dashboard/api-keys" },
]

const footerItems = [
  { icon: Settings01Icon, label: "Settings", href: "/dashboard/settings" },
]

type SidebarItem = {
  icon: IconSvgElement
  label: string
  href: string
}

function SidebarIcon({
  item,
  index,
  active,
}: {
  item: SidebarItem
  index: number
  active: boolean
}) {
  return (
    <Tooltip key={item.label}>
      <TooltipTrigger
        render={<Link href={item.href} />}
      >
        <motion.div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.gentle, delay: staggerDelay(index, 0.05) }}
        >
          <HugeiconsIcon icon={item.icon} size={20} />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

function UserMenu() {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const router = useRouter()

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted transition-all mt-1">
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? ""}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            {initials ? (
              <span className="text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            ) : (
              <HugeiconsIcon icon={User02Icon} size={16} className="text-primary-foreground" />
            )}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" sideOffset={8} align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {session?.user?.name ?? "My Account"}
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=profile")}>
            <HugeiconsIcon icon={User02Icon} size={16} />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=team")}>
            <HugeiconsIcon icon={CreditCardIcon} size={16} />
            Team
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
            <HugeiconsIcon icon={Settings01Icon} size={16} />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <HugeiconsIcon icon={Sun01Icon} size={16} /> : <HugeiconsIcon icon={Moon01Icon} size={16} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <HugeiconsIcon icon={Logout01Icon} size={16} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function IconSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isPlatformAdmin = session?.user?.role === "admin" || session?.user?.role === "superadmin"

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  const adminItem: SidebarItem = {
    icon: SecurityCheckIcon,
    label: "Admin",
    href: "/dashboard/admin",
  }

  return (
    <motion.div
      className="flex flex-col items-center py-3 shrink-0 w-14 ml-2 my-2 dash-card"
      variants={slideIn("left", 12)}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col items-center gap-1 flex-1">
        {mainItems.map((item, i) => (
          <SidebarIcon key={item.label} item={item} index={i} active={isActive(item.href)} />
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 mt-2 pt-2 border-t border-border">
        {isPlatformAdmin && (
          <SidebarIcon
            item={adminItem}
            index={mainItems.length}
            active={isActive(adminItem.href)}
          />
        )}
        {footerItems.map((item, i) => (
          <SidebarIcon
            key={item.label}
            item={item}
            index={mainItems.length + (isPlatformAdmin ? 1 : 0) + i}
            active={isActive(item.href)}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring.gentle, delay: staggerDelay(mainItems.length + footerItems.length + (isPlatformAdmin ? 1 : 0), 0.05) }}
        >
          <UserMenu />
        </motion.div>
      </div>
    </motion.div>
  )
}
