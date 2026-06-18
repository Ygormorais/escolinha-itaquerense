"use client"

import { usePathname } from "next/navigation"
import { AdminShell } from "@/components/layout/admin-shell"

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
  children,
}: {
  authenticated: boolean
  role: "admin" | "secretaria" | "tecnico"
  pendingEscalacoes: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showAdmin =
    authenticated &&
    !pathname.startsWith("/responsavel") &&
    !pathname.startsWith("/matricula") &&
    pathname !== "/login" &&
    pathname !== "/" &&
    pathname !== "/frequencia/scanner" // tela cheia (uso tipo quiosque)

  if (showAdmin) {
    return (
      <AdminShell role={role} pendingEscalacoes={pendingEscalacoes}>
        {children}
      </AdminShell>
    )
  }
  return (
    <div id="main-content" className="flex flex-1 flex-col">
      {children}
    </div>
  )
}
