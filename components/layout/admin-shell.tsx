"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Sheet } from "@/components/ui/sheet"
import { BottomNav } from "@/components/layout/bottom-nav"
import type { StaffRole } from "@/lib/permissions"
import { staffRoleLabel } from "@/lib/permissions"

interface AdminShellProps {
  children: React.ReactNode
  role?: StaffRole
  pendingEscalacoes?: number
  pendingMatriculas?: number
  pendingSolicitacoes?: number
  pendingPendencias?: number
}

export function AdminShell({ children, role = "admin", pendingEscalacoes = 0, pendingMatriculas = 0, pendingSolicitacoes = 0, pendingPendencias = 0 }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // o body é flex-row; sem este wrapper o header mobile virava uma coluna ao lado do main.
    // min-w-0: item flex tem min-width:auto por padrão e não encolhe abaixo do conteúdo —
    // sem isso, qualquer elemento largo (tabela, picker) estoura a página toda no mobile.
    <div className="flex h-full w-full min-w-0 flex-col md:flex-row">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:m-2 focus:rounded-lg focus:bg-brand-800 focus:p-3 focus:text-white">
        Pular para o conteúdo principal
      </a>
      <header className="relative flex h-14 items-center gap-3 border-b border-border bg-[var(--color-paper-50)] px-4 md:hidden dark:bg-card">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-950 via-brand-600 to-brand-500" aria-hidden />
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex size-10 items-center justify-center rounded-xl text-brand-700 hover:bg-brand-50"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="font-heading text-sm font-extrabold tracking-tight text-brand-600">
            E.C. Itaquerense
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Painel · {staffRoleLabel(role)}
          </p>
        </div>
      </header>

      <div className="hidden md:flex">
        <Sidebar role={role} pendingEscalacoes={pendingEscalacoes} pendingMatriculas={pendingMatriculas} pendingSolicitacoes={pendingSolicitacoes} pendingPendencias={pendingPendencias} />
      </div>

      <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Sidebar role={role} onClose={() => setSidebarOpen(false)} pendingEscalacoes={pendingEscalacoes} pendingMatriculas={pendingMatriculas} pendingSolicitacoes={pendingSolicitacoes} pendingPendencias={pendingPendencias} />
      </Sheet>

      {/* relative mantém elementos absolutos (inclusive sr-only) dentro da área
          de rolagem, sem aumentar a altura do documento e criar um rodapé vazio. */}
      <main id="main-content" className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav role={role} />
    </div>
  )
}
