"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificacaoBell } from "@/components/responsavel/notificacao-bell"

const links = [
  { href: "/responsavel", label: "Portal" },
  { href: "/responsavel/galeria", label: "Mural" },
  { href: "/responsavel/jogos", label: "Jogos" },
  { href: "/responsavel/calendario", label: "Calendário" },
  { href: "/responsavel/classificacao", label: "Classificação" },
  { href: "/responsavel/frequencia", label: "Frequência" },
  { href: "/responsavel/desempenho", label: "Desempenho" },
  { href: "/responsavel/boletim", label: "Boletim" },
  { href: "/responsavel/carteirinha", label: "Carteirinha" },
  { href: "/responsavel/historia", label: "História" },
  { href: "/responsavel/lojinha", label: "Lojinha" },
  { href: "/responsavel/solicitacoes", label: "Solicitações" },
  { href: "/responsavel/notificacoes", label: "Notificações" },
]

export function NavResponsavel() {
  const pathname = usePathname()

  async function handleLogout() {
    try {
      await fetch("/api/responsavel/logout", { method: "POST" })
    } finally {
      // navegação hard: descarta o cache RSC do cliente e respeita o cookie
      // apagado, igual ao logout do painel admin.
      window.location.href = "/responsavel/login"
    }
  }

  return (
    <nav className="-m-6 mb-8 border-b border-black/5 bg-white/78 px-6 py-5 shadow-[0_10px_30px_rgba(74,11,11,0.04)] backdrop-blur lg:-m-8 lg:mb-10 lg:px-8 print:hidden">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-800">
              Portal do Responsável
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-700)]">
              Acompanhe os registros mais importantes da rotina da escolinha.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificacaoBell />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="size-4" />
              Sair
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                pathname === link.href
                  ? "border-brand-800 bg-brand-800 text-white shadow-[0_12px_24px_rgba(127,0,0,0.18)]"
                  : "border-transparent bg-[var(--color-paper-100)] text-[var(--color-ink-700)] hover:border-brand-200 hover:bg-brand-50 hover:text-brand-900"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
