"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { canAccessStaffPath, type StaffRole } from "@/lib/permissions"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
]

export function BottomNav({ role }: { role: StaffRole }) {
  const pathname = usePathname()

  if (pathname.startsWith("/responsavel") || pathname === "/login") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-[var(--color-paper-50)]/95 backdrop-blur md:hidden dark:bg-card/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação rápida"
    >
      {items.filter((item) => canAccessStaffPath(item.href, role)).map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
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
            <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
