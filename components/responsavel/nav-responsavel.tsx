"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificacaoBell } from "@/components/responsavel/notificacao-bell"

/** Links prioritários (sempre visíveis no início da faixa) */
const linksPrincipais = [
  { href: "/responsavel", label: "Início" },
  { href: "/responsavel/mensalidades", label: "Mensalidades" },
  { href: "/responsavel/frequencia", label: "Frequência" },
  { href: "/responsavel/jogos", label: "Jogos" },
  { href: "/responsavel/calendario", label: "Calendário" },
  { href: "/responsavel/desempenho", label: "Desempenho" },
  { href: "/responsavel/boletim", label: "Boletim" },
]

const linksSecundarios = [
  { href: "/responsavel/uniformes", label: "Uniforme" },
  { href: "/responsavel/carteirinha", label: "Carteirinha" },
  { href: "/responsavel/classificacao", label: "Classificação" },
  { href: "/responsavel/lojinha", label: "Lojinha" },
  { href: "/responsavel/galeria", label: "Mural" },
  { href: "/responsavel/solicitacoes", label: "Solicitações" },
  { href: "/responsavel/notificacoes", label: "Notificações" },
  { href: "/responsavel/renovacao", label: "Renovação" },
  { href: "/responsavel/historia", label: "História" },
]

const links = [...linksPrincipais, ...linksSecundarios]

export function NavResponsavel() {
  const pathname = usePathname()

  async function handleLogout() {
    try {
      await fetch("/api/responsavel/logout", { method: "POST" })
    } finally {
      window.location.href = "/responsavel/login"
    }
  }

  return (
    <nav
      className={cn(
        "-mx-4 mb-8 sticky top-0 z-30 overflow-hidden rounded-2xl border border-[var(--border)]",
        "bg-[rgba(255,252,249,0.96)] shadow-[0_1px_0_var(--border),0_2px_8px_rgba(74,11,11,0.06)] backdrop-blur-md",
        "sm:-mx-6 lg:-mx-8 print:hidden",
      )}
    >
      {/* Faixa alvirrubra — mesma linguagem da landing */}
      <div
        className="h-1 w-full bg-gradient-to-r from-[var(--red-deep)] via-[var(--red)] to-[var(--red-warm)]"
        aria-hidden
      />

      <div className="flex flex-col gap-1 px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/responsavel"
            className="flex min-w-0 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--red)] focus-visible:ring-offset-2"
          >
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="size-11 rounded-[10px] object-contain shadow-sm ring-1 ring-[var(--border)] sm:size-12"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-body text-[17px] font-bold leading-tight tracking-[0.2px] text-[var(--red)]">
                Portal da família
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[2px] text-[var(--text-light)]">
                E.C. Itaquerense · acompanhamento
              </p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <NotificacaoBell />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[var(--red)] bg-transparent font-semibold text-[var(--red)] hover:bg-[var(--red)] hover:text-white"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Abas — mesma tipografia e underline da nav da landing */}
        <div
          className="flex items-stretch gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Seções do portal"
        >
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/responsavel" && pathname.startsWith(link.href + "/"))
            return (
              <Link
                key={link.href}
                href={link.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  "relative shrink-0 px-3.5 py-3.5 font-body text-[13px] font-semibold tracking-[0.02em] whitespace-nowrap transition-colors sm:text-[14px]",
                  active
                    ? "text-[var(--red)]"
                    : "text-[var(--text)] hover:text-[var(--red)]",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-3.5 bottom-2.5 h-0.5 rounded-full bg-[var(--red)] transition-transform origin-center",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                  aria-hidden
                />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
