"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Receipt,
  AlertTriangle,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  History,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BuscaGlobal } from "@/components/ui/busca-global"
import { ThemeToggle } from "@/components/ui/theme-toggle"

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }
  return (
    <button
      onClick={handleLogout}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      title="Sair"
    >
      <LogOut className="size-4" />
    </button>
  )
}

const navGroups = [
  {
    label: "Visão Geral",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/alunos",        label: "Alunos",        icon: Users },
      { href: "/pagamentos",    label: "Pagamentos",    icon: CreditCard },
      { href: "/frequencia",    label: "Frequência",    icon: CalendarCheck },
      { href: "/custos",        label: "Custos",        icon: Receipt },
      { href: "/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
      { href: "/caixa",         label: "Caixa",         icon: Wallet },
    ],
  },
  {
    label: "Documentos & Config",
    items: [
      { href: "/recibos",       label: "Recibos",       icon: FileText },
      { href: "/relatorio",     label: "Relatório",     icon: BarChart3 },
      { href: "/historico",     label: "Histórico",     icon: History },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Image
          src="/logo.jpg"
          alt="E.C. Itaquerense"
          width={36}
          height={36}
          className="rounded-lg object-contain"
        />
        <span className="font-heading text-sm font-bold leading-tight text-brand-900">
          Escolinha<br />Itaquerense
        </span>
      </div>

      <div className="px-3 pt-3">
        <BuscaGlobal />
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 pt-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-800 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-brand-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">E.C. Itaquerense · v0.1</p>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
