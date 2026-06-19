"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Sheet } from "@/components/ui/sheet"
import { BottomNav } from "@/components/layout/bottom-nav"

interface AdminShellProps {
  children: React.ReactNode
  role?: "admin" | "secretaria" | "tecnico"
  pendingEscalacoes?: number
}

export function AdminShell({ children, role = "admin", pendingEscalacoes = 0 }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    // o body é flex-row; sem este wrapper o header mobile virava uma coluna ao lado do main.
    // min-w-0: item flex tem min-width:auto por padrão e não encolhe abaixo do conteúdo —
    // sem isso, qualquer elemento largo (tabela, picker) estoura a página toda no mobile.
    <div className="flex h-full w-full min-w-0 flex-col md:flex-row">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:m-2 focus:rounded-lg focus:bg-brand-800 focus:p-3 focus:text-white">
        Pular para o conteúdo principal
      </a>
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-heading text-sm font-bold text-brand-900">
          E.C. Itaquerense
        </span>
      </header>

      <div className="hidden md:flex">
        <Sidebar role={role} pendingEscalacoes={pendingEscalacoes} />
      </div>

      <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Sidebar role={role} onClose={() => setSidebarOpen(false)} pendingEscalacoes={pendingEscalacoes} />
      </Sheet>

      <main id="main-content" className="flex min-w-0 flex-1 flex-col overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
