"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const itens = [
  ["/desenvolvimento", "Visão geral"],
  ["/desenvolvimento/operacao", "Operação"],
  ["/desenvolvimento/treinos", "Treinos"],
  ["/desenvolvimento/familias", "Famílias"],
  ["/desenvolvimento/inteligencia", "Inteligência local"],
] as const

export function DesenvolvimentoNav() {
  const pathname = usePathname()
  return <nav className="sticky top-0 z-20 border-b bg-background/95 px-4 py-2 backdrop-blur sm:px-6 lg:px-8 print:hidden" aria-label="Áreas de Desenvolvimento"><div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">{itens.map(([href, label]) => { const ativo = pathname === href; return <Link key={href} href={href} aria-current={ativo ? "page" : undefined} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-semibold", ativo ? "bg-brand-800 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>{label}</Link> })}</div></nav>
}
