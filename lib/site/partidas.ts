/**
 * Regras puras da página pública de partidas (filtros, ordenação, paginação e
 * formatação). Sem Prisma: seguro para testes e Client Components.
 */

export type Situacao = "todos" | "proximos" | "realizados"
export type ResultadoPartida = "Vitoria" | "Derrota" | "Empate" | "Proximo" | "SemPlacar"

export interface PartidaLinha {
  id: number
  /** ISO 8601; string para atravessar o cache do Next sem virar objeto vazio. */
  data: string
  categoria: string
  competicao: string
  local: string
  nosCasa: boolean
  casa: string
  fora: string
  /** Gols no sentido do mando: [casa, visitante]. */
  placar: [number, number] | null
  resultado: ResultadoPartida
  /** URLs candidatas do escudo do adversário, em ordem de tentativa. */
  escudosAdversario: string[]
  href: string
  externo: boolean
  temSumula: boolean
}

export interface FiltrosPartidas {
  categoria: string | null
  situacao: Situacao
  pagina: number
}

export const POR_PAGINA = 20
const SITUACOES: Situacao[] = ["todos", "proximos", "realizados"]

type Params = Record<string, string | string[] | undefined>

function primeiro(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** Lê os filtros da URL, descartando valores inválidos. */
export function lerFiltros(params: Params): FiltrosPartidas {
  const cat = primeiro(params.categoria)?.trim()
  const sit = primeiro(params.situacao) as Situacao | undefined
  const pag = Number.parseInt(primeiro(params.pagina) ?? "", 10)
  return {
    categoria: cat && /^Sub-\d{1,2}$/.test(cat) ? cat : null,
    situacao: sit && SITUACOES.includes(sit) ? sit : "todos",
    pagina: Number.isFinite(pag) && pag > 1 ? pag : 1,
  }
}

/** Monta o href com os filtros atuais e a mudança pedida; trocar filtro volta à página 1. */
export function hrefPartidas(atual: FiltrosPartidas, mudanca: Partial<FiltrosPartidas>): string {
  const f: FiltrosPartidas = { ...atual, ...mudanca }
  if (!("pagina" in mudanca)) f.pagina = 1
  const q = new URLSearchParams()
  if (f.categoria) q.set("categoria", f.categoria)
  if (f.situacao !== "todos") q.set("situacao", f.situacao)
  if (f.pagina > 1) q.set("pagina", String(f.pagina))
  const s = q.toString()
  return s ? `/partidas?${s}` : "/partidas"
}

export function ordenarCategorias(a: string, b: string): number {
  const na = Number(a.match(/Sub-(\d+)/i)?.[1])
  const nb = Number(b.match(/Sub-(\d+)/i)?.[1])
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.localeCompare(b, "pt-BR")
}

/**
 * Aplica categoria e situação. Próximos vêm do mais perto para o mais longe;
 * realizados e "todos" do mais recente para o mais antigo.
 */
export function filtrarPartidas(linhas: PartidaLinha[], f: FiltrosPartidas, agora: Date): PartidaLinha[] {
  const t = agora.getTime()
  const out = linhas.filter((p) => {
    if (f.categoria && p.categoria !== f.categoria) return false
    if (f.situacao === "proximos") return p.placar === null && new Date(p.data).getTime() >= t
    if (f.situacao === "realizados") return p.placar !== null
    return true
  })
  const asc = f.situacao === "proximos"
  return out.sort((a, b) => {
    const d = new Date(a.data).getTime() - new Date(b.data).getTime()
    return asc ? d : -d
  })
}

export function paginar<T>(itens: T[], pagina: number, porPagina = POR_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina))
  const atual = Math.min(Math.max(1, pagina), totalPaginas)
  return { itens: itens.slice((atual - 1) * porPagina, atual * porPagina), pagina: atual, totalPaginas }
}

/** Números de página a mostrar, com null marcando o salto ("…"). */
export function janelaPaginas(atual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, atual - 1, atual, atual + 1].filter((n) => n >= 1 && n <= total))
  const nums = [...set].sort((a, b) => a - b)
  const out: (number | null)[] = []
  for (const n of nums) {
    const prev = out[out.length - 1]
    if (typeof prev === "number" && n - prev > 1) out.push(null)
    out.push(n)
  }
  return out
}

const dois = (n: number) => String(n).padStart(2, "0")

/** "04/11/2026" e, quando a FPFS informou horário, "21h30". */
export function formatarDataHora(iso: string): { dia: string; hora: string | null } {
  const d = new Date(iso)
  const dia = `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`
  const temHora = d.getHours() !== 0 || d.getMinutes() !== 0
  return { dia, hora: temHora ? `${dois(d.getHours())}h${dois(d.getMinutes())}` : null }
}

/** Nome legível da competição: campeonatos sincronizados da FPFS viram "Federação Paulista de Futsal". */
export function nomeCompeticao(nome: string, fpfsEventoId: number | null): string {
  if (fpfsEventoId != null || /^FPFS\b/i.test(nome.trim())) return "Federação Paulista de Futsal"
  return nome.replace(/\s*[·|]\s*ev\.?\s*\d+.*$/i, "").trim() || nome
}

export function rotuloLocal(local: string): string {
  if (local === "Casa") return "Jogo em casa"
  if (local === "Fora") return "Jogo fora"
  return local
}
