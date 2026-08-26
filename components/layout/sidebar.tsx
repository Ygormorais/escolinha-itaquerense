"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useId, useState } from "react"
import {
  LayoutDashboard,
  Users,
  Users2,
  CreditCard,
  CalendarCheck,
  Calendar,
  Send,
  Shirt,
  Receipt,
  AlertTriangle,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  History,
  LogOut,
  ClipboardList,
  Trophy,
  Newspaper,
  UserCircle,
  MessageSquareWarning,
  Film,
  ShoppingBag,
  Award,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BuscaGlobal } from "@/components/ui/busca-global"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { OnboardingRestart } from "@/components/onboarding/onboarding-restart"
import { canAccessStaffPath, staffRoleLabel, type StaffRole } from "@/lib/permissions"

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

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}
type NavGroup = {
  label: string
  items: NavItem[]
  matchPrefixes?: string[]
}

function filterByRole(items: NavItem[], role: StaffRole): NavItem[] {
  return items.filter((item) => canAccessStaffPath(item.href, role))
}

function isNavItemActive(pathname: string, href: string, allItems: NavItem[]): boolean {
  return pathname === href || (
    pathname.startsWith(`${href}/`) &&
    !allItems.some((item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      pathname.startsWith(item.href)
    )
  )
}

export function Sidebar({ onClose, role = "admin", pendingEscalacoes = 0, pendingMatriculas = 0, pendingSolicitacoes = 0 }: { onClose?: () => void; role?: StaffRole; pendingEscalacoes?: number; pendingMatriculas?: number; pendingSolicitacoes?: number }) {
  const pathname = usePathname()
  const sidebarId = useId().replaceAll(":", "")

  const reportItems = filterByRole([
    { href: "/relatorio", label: "Financeiro", icon: BarChart3 },
    { href: "/relatorio/turmas", label: "Por Turma", icon: Users2 },
    { href: "/relatorio/alunos", label: "Alunos", icon: Users },
    { href: "/relatorio/pagamentos", label: "Pagamentos", icon: CreditCard },
    { href: "/relatorio/frequencia", label: "Frequência", icon: CalendarCheck },
  ], role)

  const navGroups: NavGroup[] = [
    {
      label: "Visão Geral",
      items: filterByRole([
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/secretaria", label: "Secretaria", icon: ClipboardList },
        { href: "/tecnico", label: "Painel Técnico", icon: Trophy },
      ], role),
    },
    {
      label: "Operação",
      items: filterByRole([
        { href: "/alunos",        label: "Alunos",        icon: Users },
        { href: "/turmas",        label: "Turmas",        icon: Users2 },
        { href: "/pagamentos",    label: "Pagamentos",    icon: CreditCard },
        { href: "/frequencia",    label: "Frequência",    icon: CalendarCheck },
        { href: "/agenda",        label: "Agenda",         icon: Calendar },
        { href: "/uniformes",     label: "Uniformes",     icon: Shirt },
        { href: "/campeonatos",  label: "Campeonatos",  icon: Trophy },
        { href: "/noticias",     label: "Notícias",     icon: Newspaper },
        { href: "/custos",        label: "Custos",        icon: Receipt },
        { href: "/comunicados",   label: "Comunicados",   icon: Send },
        { href: "/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
        { href: "/caixa",         label: "Caixa",         icon: Wallet },
        { href: "/produtos",      label: "Produtos",      icon: ShoppingBag },
        { href: "/avaliacoes",    label: "Avaliações",    icon: Award },
      ], role),
    },
    {
      label: "Documentos & Config",
      matchPrefixes: ["/relatorio"],
      items: filterByRole([
        { href: "/recibos",       label: "Recibos",       icon: FileText },
        { href: "/historico",     label: "Histórico",     icon: History },
        { href: "/configuracoes/midia", label: "Mídia", icon: Film },
        { href: "/configuracoes", label: "Configurações", icon: Settings },
        { href: "/configuracoes/responsaveis", label: "Responsáveis", icon: UserCircle },
        { href: "/configuracoes/escalacoes", label: "Convocações", icon: MessageSquareWarning, badge: pendingEscalacoes },
        { href: "/configuracoes/solicitacoes", label: "Solicitações", icon: MessageSquareWarning, badge: pendingSolicitacoes },
        { href: "/configuracoes/matriculas", label: "Pré-Matrículas", icon: ClipboardList, badge: pendingMatriculas },
      ], role),
    },
  ]

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
    <aside className="flex h-full min-h-screen w-64 flex-col border-r border-border bg-[var(--color-paper-50)] dark:bg-card md:h-screen">
      {/* faixa de marca alvirrubra */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-950 via-brand-600 to-brand-500" aria-hidden />

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
          <p className="font-heading text-[15px] font-extrabold leading-tight tracking-tight text-brand-600">
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
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-brand-800/70 transition-colors hover:bg-white hover:text-brand-800 dark:text-brand-300/70 dark:hover:bg-muted"
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
              {group.label === "Documentos & Config" && (
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
