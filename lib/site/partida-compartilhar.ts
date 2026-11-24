/**
 * Cartão de resultado compartilhável: texto, endereço e link do WhatsApp de uma partida
 * FINALIZADA do clube. Só times, placar, categoria e data: nada de dado de aluno.
 * Funções puras, usadas pela lista pública, pelo portal e pela página /partidas/[id].
 */

export type PartidaCompartilhavel = {
  id: number
  /** Time da casa e visitante, já no sentido do mando. */
  casa: string
  fora: string
  /** Gols no sentido do mando: [casa, visitante]. Nulo = jogo sem placar (não compartilhável). */
  placar: [number, number] | null
  categoria: string
  /** ISO 8601. */
  data: string
}

const CLUBE_CURTO = "Itaquerense"
const ID_MAXIMO = 2_147_483_647

/** Só partida com placar completo vira card: jogo futuro ou sem súmula não tem resultado a divulgar. */
export function partidaFinalizada(p: Pick<PartidaCompartilhavel, "placar">): p is Pick<PartidaCompartilhavel, "placar"> & { placar: [number, number] } {
  return p.placar !== null && Number.isInteger(p.placar[0]) && Number.isInteger(p.placar[1]) && p.placar[0] >= 0 && p.placar[1] >= 0
}

/** Id da URL → número, ou null se não for um inteiro positivo seguro (nada de "12abc", "-1", "1e3"). */
export function lerIdPartida(valor: string | null | undefined): number | null {
  if (!valor || !/^[1-9]\d{0,9}$/.test(valor)) return null
  const n = Number(valor)
  return n <= ID_MAXIMO ? n : null
}

export function caminhoPartida(id: number): string {
  return `/partidas/${id}`
}

/** URL absoluta da página da partida; tolera barra final na base. */
export function urlPartida(base: string, id: number): string {
  return `${base.replace(/\/+$/, "")}${caminhoPartida(id)}`
}

/** "04/11/2026" no fuso do clube, para a data gravada em ISO. */
export function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" })
}

/** "Itaquerense 3 × 1 Rival". */
export function tituloResultado(p: PartidaCompartilhavel & { placar: [number, number] }): string {
  return `${p.casa} ${p.placar[0]} × ${p.placar[1]} ${p.fora}`
}

/** Frase do resultado do ponto de vista do clube, para o texto do compartilhamento. */
function veredito(p: PartidaCompartilhavel & { placar: [number, number] }): string {
  const nosCasa = p.casa === CLUBE_CURTO
  const pro = nosCasa ? p.placar[0] : p.placar[1]
  const contra = nosCasa ? p.placar[1] : p.placar[0]
  if (pro > contra) return "Vitória"
  if (pro < contra) return "Derrota"
  return "Empate"
}

/** Texto do WhatsApp: resultado, categoria, data e o link do card. */
export function textoCompartilhar(p: PartidaCompartilhavel & { placar: [number, number] }, base: string): string {
  return `${veredito(p)} do ${CLUBE_CURTO} no ${p.categoria}: ${tituloResultado(p)} (${dataCurta(p.data)})\n${urlPartida(base, p.id)}`
}

/** Link "Compartilhar no WhatsApp" (sem número: a pessoa escolhe o contato ou grupo). Nulo se o jogo não terminou. */
export function whatsappCompartilharHref(p: PartidaCompartilhavel, base: string): string | null {
  if (!partidaFinalizada(p)) return null
  return `https://wa.me/?text=${encodeURIComponent(textoCompartilhar(p as PartidaCompartilhavel & { placar: [number, number] }, base))}`
}

/** Dados do jogo do portal (campos de Partida do Prisma) no formato do cartão. */
export function jogoParaCompartilhar(j: {
  id: number
  adversario: string
  local: string
  golsPro: number | null
  golsContra: number | null
  data: Date | string
  categoria: string
}): PartidaCompartilhavel {
  const nosCasa = j.local !== "Fora"
  const realizado = j.golsPro != null && j.golsContra != null
  const placar: [number, number] | null = realizado ? (nosCasa ? [j.golsPro!, j.golsContra!] : [j.golsContra!, j.golsPro!]) : null
  return {
    id: j.id,
    casa: nosCasa ? CLUBE_CURTO : j.adversario,
    fora: nosCasa ? j.adversario : CLUBE_CURTO,
    placar,
    categoria: j.categoria,
    data: new Date(j.data).toISOString(),
  }
}

/** Iniciais para o monograma do adversário no cartão de imagem (sem buscar escudo externo). */
export function iniciaisTime(nome: string): string {
  const partes = nome.replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean)
  return (partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] ?? "?").slice(0, 2)).toUpperCase()
}
