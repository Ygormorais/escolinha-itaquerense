"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { BuscaGlobal } from "@/components/ui/busca-global"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { OnboardingRestart } from "@/components/onboarding/onboarding-restart"
import { staffRoleLabel, type StaffRole } from "@/lib/permissions"
import { isNavItemActive, navSectionsFor, secaoAtiva } from "@/lib/navigation"

function Contador({ valor }: { valor?: number }) {
  if (!valor) return null
  return (
    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
      {valor > 99 ? "99+" : valor}
    </span>
  )
}

function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }
  return (
    <button
      onClick={handleLogout}
      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Sair do sistema"
    >
      <LogOut className="size-4" />
    </button>
  )
}

export function Sidebar({ onClose, role = "admin", pendingEscalacoes = 0, pendingMatriculas = 0, pendingSolicitacoes = 0, pendingAtraso = 0 }: { onClose?: () => void; role?: StaffRole; pendingEscalacoes?: number; pendingMatriculas?: number; pendingSolicitacoes?: number; pendingAtraso?: number }) {
  const pathname = usePathname()
  const secoes = navSectionsFor(role, {
    atraso: pendingAtraso,
    escalacoes: pendingEscalacoes,
    solicitacoes: pendingSolicitacoes,
    matriculas: pendingMatriculas,
  })
  const ativa = secaoAtiva(pathname, secoes)
  const todosItens = secoes.flatMap((s) => [{ href: s.href, label: s.label, icon: s.icon }, ...s.children])

  return (
    <aside className="dark flex h-full min-h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:h-screen">
      {/* Escopo "dark": a sidebar usa sempre o tema escuro, como o topo do site. */}
      <div className="h-1 w-full bg-brand-600" aria-hidden />

      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Image
          src="/logo.png"
          alt="E.C. Itaquerense"
          width={40}
          height={40}
          priority
          className="rounded-[var(--radius-control)] object-contain"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-heading text-[15px] font-extrabold leading-tight tracking-tight text-white">
            Escolinha
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Itaquerense · {staffRoleLabel(role)}
          </p>
        </div>
      </div>

      <div className="px-3 pt-3">
        <BuscaGlobal />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto py-3" aria-label="Navegação principal">
        {secoes.map((secao) => {
          const secaoEhAtiva = ativa?.label === secao.label
          const paginaAtual = isNavItemActive(pathname, secao.href, todosItens)
          const Icon = secao.icon
          return (
            <div key={secao.label}>
              <Link
                href={secao.href}
                onClick={onClose}
                aria-current={paginaAtual ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60",
                  secaoEhAtiva
                    ? "border-brand-600 bg-white/5 font-bold text-white"
                    : "border-transparent font-medium text-white/70 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{secao.label}</span>
                <Contador valor={secao.badge} />
              </Link>
              {secaoEhAtiva && secao.children.length > 0 && (
                <div className="flex flex-col pb-1">
                  {secao.children.map((item) => {
                    const ativo = isNavItemActive(pathname, item.href, todosItens)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 py-1.5 pl-11 pr-4 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/60",
                          ativo ? "font-semibold text-white" : "text-white/60 hover:text-white",
                        )}
                      >
                        <span className="flex-1 truncate">{item.label}</span>
                        <Contador valor={item.badge} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-[10px] font-medium text-muted-foreground">E.C. Itaquerense</p>
        <div className="flex items-center gap-1">
          <OnboardingRestart />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
