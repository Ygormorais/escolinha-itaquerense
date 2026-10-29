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
  Megaphone,
  FileText,
  History,
  Home,
  LayoutDashboard,
  Settings,
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
export type NavBadges = Partial<Record<"atraso" | "pendencias" | "escalacoes" | "solicitacoes" | "matriculas", number>>

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

export type NavSection = {
  href: string
  label: string
  icon: LucideIcon
  badgeKey?: keyof NavBadges
  badge?: number
  children: NavItem[]
}

/** Menu do admin: 10 seções por tarefa; sub-itens aparecem dentro da seção ativa. */
export const NAV_SECTIONS: NavSection[] = [
  { href: "/dashboard", label: "Início", icon: Home, children: [] },
  {
    href: "/pagamentos", label: "Pagamentos", icon: CreditCard, badgeKey: "atraso",
    children: [{ href: "/inadimplencia", label: "Inadimplência", icon: AlertTriangle }],
  },
  {
    href: "/alunos", label: "Alunos", icon: Users,
    children: [
      { href: "/turmas", label: "Turmas", icon: Users2 },
      { href: "/configuracoes/responsaveis", label: "Responsáveis", icon: UserCircle },
      { href: "/configuracoes/matriculas", label: "Pré-matrículas", icon: ClipboardList, badgeKey: "matriculas" },
      { href: "/configuracoes/solicitacoes", label: "Solicitações", icon: MessageSquareWarning, badgeKey: "solicitacoes" },
    ],
  },
  {
    href: "/frequencia", label: "Frequência", icon: CalendarCheck,
    children: [{ href: "/relatorio/frequencia", label: "Relatório de frequência", icon: BarChart3 }],
  },
  {
    href: "/agenda", label: "Jogos e agenda", icon: Calendar,
    children: [
      { href: "/campeonatos", label: "Campeonatos", icon: Trophy },
      { href: "/configuracoes/escalacoes", label: "Convocações", icon: MessageSquareWarning, badgeKey: "escalacoes" },
    ],
  },
  {
    href: "/desenvolvimento", label: "Desenvolvimento", icon: Activity,
    children: [
      { href: "/avaliacoes", label: "Avaliações", icon: Award },
      { href: "/tecnico", label: "Painel técnico", icon: ClipboardList },
    ],
  },
  {
    href: "/comunicados", label: "Comunicação", icon: Send,
    children: [
      { href: "/noticias", label: "Notícias", icon: Newspaper },
      { href: "/configuracoes/midia", label: "Mídia", icon: Film },
      { href: "/configuracoes/publicidade", label: "Publicidade", icon: Megaphone },
    ],
  },
  {
    href: "/uniformes", label: "Loja", icon: ShoppingBag,
    children: [{ href: "/produtos", label: "Produtos", icon: Shirt }],
  },
  {
    href: "/caixa", label: "Financeiro", icon: Wallet,
    children: [
      { href: "/custos", label: "Custos", icon: Receipt },
      { href: "/recibos", label: "Recibos", icon: FileText },
      { href: "/relatorio", label: "Relatório financeiro", icon: BarChart3 },
      { href: "/relatorio/turmas", label: "Relatório por turma", icon: Users2 },
      { href: "/relatorio/alunos", label: "Relatório de alunos", icon: Users },
      { href: "/relatorio/pagamentos", label: "Relatório de pagamentos", icon: CreditCard },
    ],
  },
  {
    href: "/configuracoes/documentos", label: "Configurações", icon: Settings,
    children: [
      { href: "/configuracoes/automacoes", label: "Automações", icon: History },
      { href: "/historico", label: "Histórico", icon: History },
    ],
  },
]

/**
 * Seções visíveis para o papel. Sub-item sem acesso sai; se a rota principal não é
 * permitida, a seção leva ao primeiro sub-item permitido; sem nenhuma rota, a seção sai.
 */
export function navSectionsFor(role: StaffRole, badges: NavBadges = {}): NavSection[] {
  return NAV_SECTIONS.flatMap((secao) => {
    let children = secao.children.filter((c) => canAccessStaffPath(c.href, role)).map((c) => withBadge(c, badges))
    let href = secao.href
    if (!canAccessStaffPath(href, role)) {
      if (children.length === 0) return []
      href = children[0].href
      children = children.slice(1)
    }
    const badge = secao.badgeKey ? badges[secao.badgeKey] ?? 0 : undefined
    return [{ ...secao, href, children, badge }]
  })
}

/** Seção que contém a rota atual (pela rota principal ou por um sub-item). */
export function secaoAtiva(pathname: string, sections: NavSection[]): NavSection | undefined {
  const itens = sections.flatMap((s) => [{ href: s.href, label: s.label, icon: s.icon }, ...s.children])
  return sections.find((s) =>
    isNavItemActive(pathname, s.href, itens) || s.children.some((c) => isNavItemActive(pathname, c.href, itens)),
  )
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
      { href: "/configuracoes/publicidade", label: "Publicidade", icon: Megaphone },
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
  admin: ["/dashboard", "/pagamentos", "/alunos", "/frequencia"],
  secretaria: ["/pagamentos", "/alunos", "/frequencia", "/comunicados"],
  tecnico: ["/desenvolvimento", "/frequencia", "/agenda", "/alunos"],
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
  const secoes = navSectionsFor(role, badges)
  const itens: NavItem[] = secoes.flatMap((s) => [{ href: s.href, label: s.label, icon: s.icon, badge: s.badge }, ...s.children])
  return BOTTOM_NAV_PRIORITY[role]
    .map((href) => itens.find((item) => item.href === href))
    .filter((item): item is NavItem => item !== undefined)
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
