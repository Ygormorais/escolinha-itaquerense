import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Film,
  FileText,
  History,
  LayoutDashboard,
  MessageSquareWarning,
  Newspaper,
  Receipt,
  Send,
  Shirt,
  ShoppingBag,
  Trophy,
  UserCircle,
  Users,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { canAccessStaffPath, type StaffRole } from "@/lib/permissions"

/** Contadores que a navegação mostra como badge (vêm do layout). */
export type NavBadges = Partial<Record<"pendencias" | "escalacoes" | "solicitacoes" | "matriculas", number>>

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  badgeKey?: keyof NavBadges
  badge?: number
}

export type NavGroup = {
  label: string
  items: NavItem[]
  matchPrefixes?: string[]
}

/** Fonte única de rótulos e ícones: Sidebar (desktop/menu) e BottomNav (mobile). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pendencias", label: "Pendências", icon: AlertTriangle, badgeKey: "pendencias" },
      { href: "/secretaria", label: "Secretaria", icon: ClipboardList },
      { href: "/tecnico", label: "Painel Técnico", icon: Trophy },
      { href: "/desenvolvimento", label: "Desenvolvimento", icon: Activity },
    ],
  },
  {
    label: "Operação",
    items: [
      { href: "/alunos", label: "Alunos", icon: Users },
      { href: "/turmas", label: "Turmas", icon: Users2 },
      { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
      { href: "/frequencia", label: "Frequência", icon: CalendarCheck },
      { href: "/agenda", label: "Agenda", icon: Calendar },
      { href: "/uniformes", label: "Uniformes", icon: Shirt },
      { href: "/campeonatos", label: "Campeonatos", icon: Trophy },
      { href: "/custos", label: "Custos", icon: Receipt },
      { href: "/comunicados", label: "Comunicados", icon: Send },
      { href: "/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
      { href: "/caixa", label: "Caixa", icon: Wallet },
      { href: "/produtos", label: "Produtos", icon: ShoppingBag },
      { href: "/avaliacoes", label: "Avaliações", icon: Award },
    ],
  },
  {
    label: "Documentos & Gestão",
    matchPrefixes: ["/relatorio"],
    items: [
      { href: "/recibos", label: "Recibos", icon: FileText },
      { href: "/configuracoes/documentos", label: "Documentos", icon: FileText },
      { href: "/configuracoes/automacoes", label: "Automações", icon: History },
      { href: "/historico", label: "Histórico", icon: History },
      { href: "/noticias", label: "Notícias", icon: Newspaper },
      { href: "/configuracoes/midia", label: "Mídia", icon: Film },
      { href: "/configuracoes/responsaveis", label: "Responsáveis", icon: UserCircle },
      { href: "/configuracoes/escalacoes", label: "Convocações", icon: MessageSquareWarning, badgeKey: "escalacoes" },
      { href: "/configuracoes/solicitacoes", label: "Solicitações", icon: MessageSquareWarning, badgeKey: "solicitacoes" },
      { href: "/configuracoes/matriculas", label: "Pré-Matrículas", icon: ClipboardList, badgeKey: "matriculas" },
    ],
  },
]

export const REPORT_ITEMS: NavItem[] = [
  { href: "/relatorio", label: "Financeiro", icon: BarChart3 },
  { href: "/relatorio/turmas", label: "Por Turma", icon: Users2 },
  { href: "/relatorio/alunos", label: "Alunos", icon: Users },
  { href: "/relatorio/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/relatorio/frequencia", label: "Frequência", icon: CalendarCheck },
]

/**
 * Atalhos da BottomNav por papel, na ordem em que aparecem na Sidebar.
 * Cada papel tem 4 atalhos do próprio dia a dia (o técnico não acessa
 * pagamentos/caixa, então não pode herdar a lista do admin).
 */
const BOTTOM_NAV_PRIORITY: Record<StaffRole, string[]> = {
  admin: ["/dashboard", "/pendencias", "/alunos", "/pagamentos"],
  secretaria: ["/dashboard", "/pendencias", "/alunos", "/pagamentos"],
  tecnico: ["/tecnico", "/frequencia", "/campeonatos", "/alunos"],
}

function withBadge(item: NavItem, badges: NavBadges): NavItem {
  return item.badgeKey ? { ...item, badge: badges[item.badgeKey] ?? 0 } : item
}

export function navGroupsFor(role: StaffRole, badges: NavBadges = {}): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessStaffPath(item.href, role)).map((item) => withBadge(item, badges)),
  }))
}

export function reportItemsFor(role: StaffRole): NavItem[] {
  return REPORT_ITEMS.filter((item) => canAccessStaffPath(item.href, role))
}

export function bottomNavItems(role: StaffRole, badges: NavBadges = {}): NavItem[] {
  const all = NAV_GROUPS.flatMap((group) => group.items)
  return BOTTOM_NAV_PRIORITY[role]
    .map((href) => all.find((item) => item.href === href))
    .filter((item): item is NavItem => item !== undefined && canAccessStaffPath(item.href, role))
    .map((item) => withBadge(item, badges))
}

/** Ativo na própria rota ou em sub-rota, salvo se um item mais específico casar. */
export function isNavItemActive(pathname: string, href: string, allItems: NavItem[]): boolean {
  return pathname === href || (
    pathname.startsWith(`${href}/`) &&
    !allItems.some((item) =>
      item.href !== href &&
      item.href.startsWith(`${href}/`) &&
      pathname.startsWith(item.href)
    )
  )
}
