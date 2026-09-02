"use client"

import { usePathname } from "next/navigation"
import { AdminShell } from "@/components/layout/admin-shell"
import { isPublicRoute } from "@/lib/public-routes"

/**
 * Decide no cliente se a página atual usa o shell do admin (sidebar/header) ou
 * renderiza sem shell (landing pública, login, portal do responsável, matrícula).
 *
 * Precisa ser client component + usePathname porque o root layout NÃO
 * re-renderiza em navegação client-side. Quando a decisão ficava no layout
 * (server), o shell "congelava" do primeiro carregamento — ao voltar de
 * /dashboard para "/", a landing aparecia dentro do shell do admin.
 */
export function ShellGate({
  authenticated,
  role,
  pendingEscalacoes,
  pendingMatriculas,
  pendingSolicitacoes,
  pendingPendencias,
  children,
}: {
  authenticated: boolean
  role: "admin" | "secretaria" | "tecnico"
  pendingEscalacoes: number
  pendingMatriculas: number
  pendingSolicitacoes: number
  pendingPendencias: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showAdmin = authenticated && !isPublicRoute(pathname)

  if (showAdmin) {
    return (
      <AdminShell role={role} pendingEscalacoes={pendingEscalacoes} pendingMatriculas={pendingMatriculas} pendingSolicitacoes={pendingSolicitacoes} pendingPendencias={pendingPendencias}>
        {children}
      </AdminShell>
    )
  }
  return (
    // min-w-0: sem isso o item flex não encolhe abaixo do conteúdo e qualquer
    // elemento largo (decoração da landing, etc.) estoura a página no mobile
    <div id="main-content" className="flex min-w-0 flex-1 flex-col">
      {children}
    </div>
  )
}
