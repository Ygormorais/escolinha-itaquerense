"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useId, useState } from "react"
import { BarChart3, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { BuscaGlobal } from "@/components/ui/busca-global"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { OnboardingRestart } from "@/components/onboarding/onboarding-restart"
import { staffRoleLabel, type StaffRole } from "@/lib/permissions"
import { isNavItemActive, navGroupsFor, reportItemsFor } from "@/lib/navigation"

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

export function Sidebar({ onClose, role = "admin", pendingEscalacoes = 0, pendingMatriculas = 0, pendingSolicitacoes = 0, pendingPendencias = 0 }: { onClose?: () => void; role?: StaffRole; pendingEscalacoes?: number; pendingMatriculas?: number; pendingSolicitacoes?: number; pendingPendencias?: number }) {
  const pathname = usePathname()
  const sidebarId = useId().replaceAll(":", "")

  const reportItems = reportItemsFor(role)
  const navGroups = navGroupsFor(role, {
    pendencias: pendingPendencias,
    escalacoes: pendingEscalacoes,
    solicitacoes: pendingSolicitacoes,
    matriculas: pendingMatriculas,
  })

  const allNavItems = navGroups.flatMap((group) => group.items)
  const activeGroup = navGroups.find((group) =>
    group.items.some((item) => isNavItemActive(pathname, item.href, allNavItems)) ||
    group.matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  )?.label
  const [groupPreference, setGroupPreference] = useState(() => ({
    pathname,
    value: activeGroup ?? "Visão Geral",
  }))
  const [reportPreference, setReportPreference] = useState(() => ({
    pathname,
    value: pathname.startsWith("/relatorio"),
  }))
  const openGroup = groupPreference.pathname === pathname
    ? groupPreference.value
    : activeGroup ?? "Visão Geral"
  const relOpen = reportPreference.pathname === pathname
    ? reportPreference.value
    : pathname.startsWith("/relatorio")

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
          className="rounded-xl object-contain shadow-sm ring-1 ring-brand-100"
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

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 pt-4" aria-label="Navegação principal">
        {navGroups.map((group, groupIndex) => {
          const isOpen = openGroup === group.label
          const groupId = `${sidebarId}-nav-group-${groupIndex}`
          const pendingCount = group.items.reduce((total, item) => total + (item.badge ?? 0), 0)

          return (
            <div key={group.label} className="rounded-xl border border-transparent data-[open=true]:border-border data-[open=true]:bg-white/60 dark:data-[open=true]:bg-muted/30" data-open={isOpen}>
              <button
                type="button"
                onClick={() => setGroupPreference({
                  pathname,
                  value: openGroup === group.label ? "" : group.label,
                })}
                aria-expanded={isOpen}
                aria-controls={groupId}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-brand-900/80 transition-colors hover:bg-white hover:text-brand-900 dark:text-brand-200/80 dark:hover:bg-muted"
              >
                <span className="flex-1">{group.label}</span>
                {pendingCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] tracking-normal text-white" aria-label={`${pendingCount} pendências`}>
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
                <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-90")} aria-hidden />
              </button>
              {isOpen && <div id={groupId} className="flex flex-col gap-0.5 px-1 pb-1.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const isActive = isNavItemActive(pathname, href, allNavItems)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-800 font-semibold shadow-sm ring-1 ring-brand-100 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-brand-600"
                        : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm dark:hover:bg-muted"
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", isActive && "text-brand-600")} />
                    <span className="flex-1 truncate">{label}</span>
                    {badge != null && badge > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
              {group.label === "Documentos & Gestão" && (
                <div>
                  <button
                    type="button"
                    onClick={() => setReportPreference({ pathname, value: !relOpen })}
                    aria-expanded={relOpen}
                    aria-controls={`${sidebarId}-reports`}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      pathname.startsWith("/relatorio")
                        ? "bg-brand-50 text-brand-800 font-semibold ring-1 ring-brand-100"
                        : "text-muted-foreground hover:bg-white hover:text-foreground dark:hover:bg-muted"
                    )}
                  >
                    <BarChart3 className="size-4 shrink-0" />
                    <span className="flex-1 truncate text-left">Relatórios</span>
                    <ChevronRight className={cn("size-3.5 shrink-0 transition-transform", relOpen && "rotate-90")} />
                  </button>
                  {relOpen && (
                    <div id={`${sidebarId}-reports`} className="ml-4 flex flex-col gap-0.5 border-l-2 border-brand-100 pl-3 dark:border-brand-900">
                      {reportItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || (href !== "/relatorio" && pathname.startsWith(href))
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors",
                              isActive
                                ? "text-brand-800 font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                          >
                            <Icon className="size-3.5 shrink-0" />
                            <span className="truncate">{label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              </div>}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-border bg-white/60 px-4 py-3 flex items-center justify-between dark:bg-card">
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
