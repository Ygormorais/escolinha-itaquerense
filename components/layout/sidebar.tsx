"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
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
  UserCircle,
  MessageSquareWarning,
  Film,
  ShoppingBag,
  Award,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BuscaGlobal } from "@/components/ui/busca-global"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { OnboardingRestart } from "@/components/onboarding/onboarding-restart"

function LogoutButton() {
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
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
}

type SidebarRole = "admin" | "secretaria" | "tecnico"

function filterByRole(items: NavItem[], role: SidebarRole): NavItem[] {
  const canAccess = (href: string): boolean => {
    const restrictedTecnico = [
      "/pagamentos", "/uniformes", "/custos", "/comunicados",
      "/inadimplencia", "/caixa", "/produtos", "/recibos",
      "/relatorio/alunos", "/relatorio/pagamentos",
      "/historico", "/configuracoes/midia",
      "/configuracoes", "/configuracoes/escalacoes",
      "/configuracoes/responsaveis", "/secretaria",
    ]
    const restrictedSecretaria = [
      "/custos", "/caixa", "/produtos", "/campeonatos",
      "/avaliacoes", "/configuracoes/escalacoes",
    ]
    if (role === "admin") return true
    if (role === "tecnico") return !restrictedTecnico.some((r) => href.startsWith(r))
    if (role === "secretaria") return !restrictedSecretaria.some((r) => href.startsWith(r))
    return false
  }
  return items.filter((i) => canAccess(i.href))
}

export function Sidebar({ pendingEscalacoes = 0, onClose, role = "admin" }: { pendingEscalacoes?: number; onClose?: () => void; role?: SidebarRole }) {
  const pathname = usePathname()

  const navGroups: NavGroup[] = [
    {
      label: "Visão Geral",
      items: filterByRole([
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/secretaria", label: "Secretaria", icon: ClipboardList },
      ], role),
    },
    {
      label: "Operação",
      items: filterByRole([
        { href: "/alunos",        label: "Alunos",        icon: Users },
        { href: "/pagamentos",    label: "Pagamentos",    icon: CreditCard },
        { href: "/frequencia",    label: "Frequência",    icon: CalendarCheck },
        { href: "/agenda",        label: "Agenda",         icon: Calendar },
        { href: "/uniformes",     label: "Uniformes",     icon: Shirt },
        { href: "/campeonatos",  label: "Campeonatos",  icon: Trophy },
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
      items: filterByRole([
        { href: "/recibos",       label: "Recibos",       icon: FileText },
        { href: "/relatorio",     label: "Rel. Financeiro", icon: BarChart3 },
        { href: "/relatorio/alunos", label: "Rel. Alunos", icon: Users },
        { href: "/relatorio/pagamentos", label: "Rel. Pagamentos", icon: CreditCard },
        { href: "/relatorio/frequencia", label: "Rel. Frequência", icon: CalendarCheck },
        { href: "/historico",     label: "Histórico",     icon: History },
        { href: "/configuracoes/midia", label: "Mídia", icon: Film },
        { href: "/configuracoes", label: "Configurações", icon: Settings },
        { href: "/configuracoes/escalacoes", label: "Convocações", icon: MessageSquareWarning, badge: pendingEscalacoes },
        { href: "/configuracoes/responsaveis", label: "Responsáveis", icon: UserCircle },
        { href: "/configuracoes/solicitacoes", label: "Solicitações", icon: MessageSquareWarning },
        { href: "/configuracoes/matriculas", label: "Pré-Matrículas", icon: ClipboardList },
      ], role),
    },
  ]

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Image
          src="/logo.jpg"
          alt="E.C. Itaquerense"
          width={36}
          height={36}
          priority
          className="rounded-lg object-contain"
          aria-hidden="true"
        />
        <span className="font-heading text-sm font-bold leading-tight text-brand-900">
          Escolinha<br />Itaquerense
        </span>
      </div>

      <div className="px-3 pt-3">
        <BuscaGlobal />
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 pt-4" aria-label="Navegação principal">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-800 font-semibold before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-brand-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                    {badge != null && badge > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">E.C. Itaquerense · v0.1</p>
        <div className="flex items-center gap-1">
          <OnboardingRestart />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </aside>
  )
}
