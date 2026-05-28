"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Sheet } from "@/components/ui/sheet"

interface AdminShellProps {
  children: React.ReactNode
  pendingEscalacoes: number
}

export function AdminShell({ children, pendingEscalacoes }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="font-heading text-sm font-bold text-brand-900">
          E.C. Itaquerense
        </span>
      </header>

      <div className="hidden md:block">
        <Sidebar pendingEscalacoes={pendingEscalacoes} />
      </div>

      <Sheet open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Sidebar pendingEscalacoes={pendingEscalacoes} onClose={() => setSidebarOpen(false)} />
      </Sheet>

      <main className="flex flex-1 flex-col overflow-auto">
        {children}
      </main>
    </>
  )
}
