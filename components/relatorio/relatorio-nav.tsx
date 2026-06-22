"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/relatorio", label: "Financeiro" },
  { href: "/relatorio/alunos", label: "Alunos" },
  { href: "/relatorio/pagamentos", label: "Pagamentos" },
  { href: "/relatorio/frequencia", label: "Frequência" },
]

export function RelatorioNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
      {TABS.map(({ href, label }) => {
        const isActive = href === "/relatorio" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
