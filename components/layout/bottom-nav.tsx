"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, CreditCard, Settings, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/caixa", label: "Caixa", icon: Wallet },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/configuracoes", label: "Config", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith("/responsavel") || pathname === "/login") return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card md:hidden safe-area-bottom"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegação rápida"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors min-h-[44px] min-w-[44px] justify-center",
              isActive
                ? "text-brand-800"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
