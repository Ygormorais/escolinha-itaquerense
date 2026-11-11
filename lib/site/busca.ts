/**
 * Busca do site público: notícias publicadas e partidas, sem acento e sem caixa.
 * Todas as palavras digitadas precisam aparecer (em qualquer campo do item).
 */

export type NoticiaBusca = { id: number; titulo: string; subtitulo: string | null; categoria: string; createdAt: Date }
/** Matéria institucional da landing (conteúdo fixo em lib/landing/materias.ts). */
export type MateriaBusca = { id: string; titulo: string; resumo: string; badge: string; periodo?: string; fonte?: string; href?: string; externo?: boolean }
export type PartidaBusca = { id: number; data: string; categoria: string; competicao: string; casa: string; fora: string; href: string; externo: boolean }

export const MIN_CARACTERES = 2
const LIMITE = 20

export function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** Palavras úteis da consulta; vazio quando a consulta é curta demais. */
export function termosDaBusca(q: string | undefined | null): string[] {
  const limpo = semAcento((q ?? "").trim())
  if (limpo.length < MIN_CARACTERES) return []
  return limpo.split(/\s+/).filter(Boolean)
}

function casa(termos: string[], ...campos: (string | null)[]): boolean {
  const texto = semAcento(campos.filter(Boolean).join(" "))
  return termos.every((t) => texto.includes(t))
}

export function buscarNoSite(
  q: string | undefined | null,
  noticias: NoticiaBusca[],
  partidas: PartidaBusca[],
  materias: MateriaBusca[] = [],
) {
  const termos = termosDaBusca(q)
  if (termos.length === 0) return { termos, materias: [] as MateriaBusca[], noticias: [] as NoticiaBusca[], partidas: [] as PartidaBusca[] }
  return {
    termos,
    materias: materias.filter((m) => casa(termos, m.titulo, m.resumo, m.badge, m.periodo ?? null)).slice(0, LIMITE),
    noticias: noticias
      .filter((n) => casa(termos, n.titulo, n.subtitulo, n.categoria))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, LIMITE),
    partidas: partidas
      .filter((p) => casa(termos, p.casa, p.fora, p.competicao, p.categoria))
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, LIMITE),
  }
}
