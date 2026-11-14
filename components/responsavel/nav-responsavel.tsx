"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificacaoBell } from "@/components/responsavel/notificacao-bell"
import { GRUPOS_PORTAL, abaAtiva, grupoDaRota } from "@/lib/portal-navegacao"

/**
 * Navegação do portal: 5 grupos no topo (desktop) e na barra inferior (celular),
 * e as páginas do grupo atual como abas logo abaixo, como as seções do admin.
 */
export function NavResponsavel() {
  const pathname = usePathname()
  const router = useRouter()
  const grupo = grupoDaRota(pathname)
  const aba = grupo ? abaAtiva(grupo, pathname) : null

  async function handleLogout() {
    try {
      await fetch("/api/responsavel/logout", { method: "POST" })
    } finally {
      router.replace("/responsavel/login")
      router.refresh()
    }
  }

  return (
    <>
      <nav
        aria-label="Portal da família"
        className={cn(
          "-mx-4 mb-4 sticky top-0 z-30 overflow-visible rounded-[var(--radius-lg)] border border-[var(--border)]",
          "[--text:#F5F5F5] [--text-light:#A3A3A3] [--border:#262626] bg-[#0B0B0B] shadow-md",
          "sm:-mx-6 lg:-mx-8 print:hidden",
        )}
      >
        <div className="h-1 w-full rounded-t-[var(--radius-lg)] bg-[var(--red)]" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <Link
            href="/responsavel"
            className="flex min-w-0 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--red)] focus-visible:ring-offset-2"
          >
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="size-10 rounded-[10px] object-contain shadow-sm ring-1 ring-[var(--border)] sm:size-11"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-body text-[16px] font-bold leading-tight text-white">Portal da família</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[2px] text-[var(--text-light)]">E.C. Itaquerense</p>
            </div>
          </Link>

          <div className="hidden min-w-0 items-stretch md:flex">
            {GRUPOS_PORTAL.map((g) => {
              const ativo = grupo?.id === g.id
              return (
                <Link
                  key={g.id}
                  href={g.href}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-2 font-body text-[14px] font-semibold whitespace-nowrap transition-colors lg:px-4",
                    ativo ? "text-white" : "text-[var(--text-light)] hover:text-white",
                  )}
                >
                  {g.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[var(--red)] transition-transform lg:inset-x-4",
                      ativo ? "scale-x-100" : "scale-x-0",
                    )}
                    aria-hidden
                  />
                </Link>
              )
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NotificacaoBell />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[var(--red)] bg-transparent font-semibold text-white hover:bg-[var(--red)] hover:text-white"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      {grupo && grupo.paginas.length > 1 ? (
        <nav
          aria-label={`Seções de ${grupo.label}`}
          className="-mx-4 mb-6 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 print:hidden [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex gap-1">
            {grupo.paginas.map((p) => {
              const ativa = aba?.href === p.href
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  aria-current={ativa ? "page" : undefined}
                  className={cn(
                    "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                    ativa ? "border-brand-600 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : (
        <div className="mb-4" aria-hidden />
      )}

      <nav
        aria-label="Navegação rápida do portal"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-border bg-[var(--color-paper-50)]/95 backdrop-blur md:hidden print:hidden dark:bg-card/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {GRUPOS_PORTAL.map((g) => {
          const ativo = grupo?.id === g.id
          const Icon = g.icon
          return (
            <Link
              key={g.id}
              href={g.href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-[10px] font-semibold transition-colors",
                ativo ? "text-brand-600" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {ativo && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-brand-600" aria-hidden />}
              <Icon className="size-5" strokeWidth={ativo ? 2.25 : 2} aria-hidden />
              {g.labelCurto}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
