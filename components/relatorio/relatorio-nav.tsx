"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { StaffRole } from "@/lib/permissions"

const TABS = [
  { href: "/relatorio", label: "Financeiro", roles: ["admin"] },
  { href: "/relatorio/alunos", label: "Alunos", roles: ["admin", "secretaria"] },
  { href: "/relatorio/pagamentos", label: "Pagamentos", roles: ["admin", "secretaria"] },
  { href: "/relatorio/frequencia", label: "Frequência", roles: ["admin", "secretaria", "tecnico"] },
]

export function RelatorioNav({ role = "admin" }: { role?: StaffRole }) {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted p-1 w-fit">
      {TABS.filter((tab) => tab.roles.includes(role)).map(({ href, label }) => {
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
