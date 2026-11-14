import { CalendarDays, CreditCard, Home, School, UserRound, type LucideIcon } from "lucide-react"

export type PaginaPortal = { href: string; label: string }

export type GrupoPortal = {
  id: string
  label: string
  /** Rótulo curto para a barra inferior do celular. */
  labelCurto: string
  icon: LucideIcon
  /** Primeira página do grupo: é para onde o menu leva. */
  href: string
  /** Páginas do grupo, mostradas como abas quando há mais de uma. */
  paginas: PaginaPortal[]
  /** Rotas que pertencem ao grupo mas não viram aba (detalhes, recibo, PDF). */
  extras?: string[]
}

/**
 * Menu do portal da família em 5 grupos, como as seções do admin.
 * Telas parecidas (Desempenho/Boletim, Jogos/Calendário/Classificação, Uniforme/Lojinha)
 * ficam lado a lado como abas do mesmo grupo.
 */
export const GRUPOS_PORTAL: GrupoPortal[] = [
  {
    id: "inicio",
    label: "Início",
    labelCurto: "Início",
    icon: Home,
    href: "/responsavel",
    paginas: [{ href: "/responsavel", label: "Início" }],
    extras: ["/responsavel/aluno"],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    labelCurto: "Financeiro",
    icon: CreditCard,
    href: "/responsavel/mensalidades",
    paginas: [{ href: "/responsavel/mensalidades", label: "Mensalidades" }],
    // A declaração é por aluno: o botão fica no cartão de cada aluno em Mensalidades.
    extras: ["/responsavel/recibos", "/responsavel/declaracao"],
  },
  {
    id: "atleta",
    label: "Meu atleta",
    labelCurto: "Atleta",
    icon: UserRound,
    href: "/responsavel/frequencia",
    paginas: [
      { href: "/responsavel/frequencia", label: "Frequência" },
      { href: "/responsavel/desempenho", label: "Desempenho" },
      { href: "/responsavel/boletim", label: "Boletim" },
      { href: "/responsavel/carteirinha", label: "Carteirinha" },
      { href: "/responsavel/uniformes", label: "Uniforme" },
      { href: "/responsavel/lojinha", label: "Lojinha" },
    ],
  },
  {
    id: "jogos",
    label: "Jogos",
    labelCurto: "Jogos",
    icon: CalendarDays,
    href: "/responsavel/jogos",
    paginas: [
      { href: "/responsavel/jogos", label: "Jogos" },
      { href: "/responsavel/calendario", label: "Calendário" },
      { href: "/responsavel/classificacao", label: "Classificação" },
      { href: "/responsavel/galeria", label: "Mural" },
    ],
  },
  {
    id: "escolinha",
    label: "Escolinha",
    labelCurto: "Escolinha",
    icon: School,
    href: "/responsavel/documentos",
    paginas: [
      { href: "/responsavel/documentos", label: "Documentos" },
      { href: "/responsavel/solicitacoes", label: "Solicitações" },
      { href: "/responsavel/conversas", label: "Conversas" },
      { href: "/responsavel/renovacao", label: "Renovação" },
      { href: "/responsavel/notificacoes", label: "Notificações" },
      { href: "/responsavel/historia", label: "Nossa história" },
    ],
  },
]

function dentro(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/")
}

/** Grupo da rota atual; Início só quando é exatamente a home ou um detalhe dela. */
export function grupoDaRota(pathname: string): GrupoPortal | null {
  for (const g of GRUPOS_PORTAL) {
    const rotas = [...g.paginas.map((p) => p.href), ...(g.extras ?? [])]
    const casa = rotas.some((href) => (href === "/responsavel" ? pathname === href : dentro(pathname, href)))
    if (casa) return g
  }
  return null
}

/** Aba ativa do grupo (a mais específica que casa com a rota). */
export function abaAtiva(grupo: GrupoPortal, pathname: string): PaginaPortal | null {
  return grupo.paginas.find((p) => (p.href === "/responsavel" ? pathname === p.href : dentro(pathname, p.href))) ?? null
}
