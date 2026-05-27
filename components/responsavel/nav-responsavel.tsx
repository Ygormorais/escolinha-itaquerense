"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const links = [
  { href: "/responsavel", label: "Dashboard" },
  { href: "/responsavel/galeria", label: "Mural" },
  { href: "/responsavel/jogos", label: "Jogos" },
  { href: "/responsavel/classificacao", label: "Classificação" },
  { href: "/responsavel/desempenho", label: "Desempenho" },
  { href: "/responsavel/reunioes", label: "Reuniões" },
  { href: "/responsavel/historia", label: "História" },
  { href: "/responsavel/lojinha", label: "Lojinha" },
]

export function NavResponsavel() {
  const pathname = usePathname()
  return (
    <nav className="flex items-center gap-2 overflow-x-auto -m-6 mb-6 px-6 py-4 border-b bg-muted/40">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "shrink-0 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === link.href
              ? "bg-brand-600 text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
