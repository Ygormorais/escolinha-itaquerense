"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { StaffRole } from "@/lib/permissions"
import { bottomNavItems, isNavItemActive, NAV_GROUPS } from "@/lib/navigation"

const allNavItems = NAV_GROUPS.flatMap((group) => group.items)

export function BottomNav({ role, pendingPendencias = 0 }: { role: StaffRole; pendingPendencias?: number }) {
  const pathname = usePathname()

  if (pathname.startsWith("/responsavel") || pathname === "/login") return null

  const items = bottomNavItems(role, { pendencias: pendingPendencias })

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-[var(--color-paper-50)]/95 backdrop-blur md:hidden dark:bg-card/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação rápida"
    >
      {items.map(({ href, label, icon: Icon, badge }) => {
        const isActive = isNavItemActive(pathname, href, allNavItems)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-3 py-1.5 text-[10px] font-semibold transition-colors",
              isActive
                ? "text-brand-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <span
                className="absolute top-0 h-0.5 w-8 rounded-b-full bg-brand-600"
                aria-hidden
              />
            )}
            <span className="relative">
              <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
              {badge != null && badge > 0 && (
                <span
                  data-numeric
                  className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold text-white"
                  aria-label={`${badge} pendências`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
