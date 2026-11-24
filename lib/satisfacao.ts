import { z } from "zod"
import { preencherModelo, textoDoModelo, whatsappHrefPara, type ModelosPersonalizados } from "@/lib/whatsapp-modelos"

/**
 * Pesquisa de satisfação (NPS): uma pergunta de 0 a 10 e um comentário opcional por responsável,
 * em campanhas com período. Funções puras; as consultas ficam nas páginas e nas actions.
 *
 *  - Promotor: nota 9 ou 10. Neutro: 7 ou 8. Detrator: 0 a 6.
 *  - NPS = % de promotores - % de detratores, arredondado, de -100 a 100.
 */

export const PERGUNTA_PADRAO = "De 0 a 10, o quanto você recomendaria a escolinha para outra família?"
export const MAX_COMENTARIO = 500
export const MAX_DIAS_CAMPANHA = 90

export type CategoriaNps = "promotor" | "neutro" | "detrator"

export function categoriaDaNota(nota: number): CategoriaNps {
  if (nota >= 9) return "promotor"
  if (nota >= 7) return "neutro"
  return "detrator"
}

export type ResumoNps = {
  total: number
  promotores: number
  neutros: number
  detratores: number
  /** Nulo sem respostas: "0" enganaria, pois significa um clube dividido. */
  nps: number | null
  /** Quantidade de respostas por nota, índice 0 a 10. */
  distribuicao: number[]
}

export function calcularNps(notas: number[]): ResumoNps {
  const distribuicao = Array.from({ length: 11 }, () => 0)
  let promotores = 0
  let neutros = 0
  let detratores = 0
  for (const nota of notas) {
    if (!Number.isInteger(nota) || nota < 0 || nota > 10) continue
    distribuicao[nota]++
    const categoria = categoriaDaNota(nota)
    if (categoria === "promotor") promotores++
    else if (categoria === "neutro") neutros++
    else detratores++
  }
  const total = promotores + neutros + detratores
  const nps = total === 0 ? null : Math.round(((promotores - detratores) / total) * 100)
  return { total, promotores, neutros, detratores, nps, distribuicao }
}

/** Faixa de leitura do NPS (referência comum de mercado). */
export function faixaDoNps(nps: number | null): "sem-dados" | "excelente" | "bom" | "atencao" | "critico" {
  if (nps === null) return "sem-dados"
  if (nps >= 50) return "excelente"
  if (nps >= 0) return "bom"
  if (nps >= -50) return "atencao"
  return "critico"
}

// --- Campanha e elegibilidade ------------------------------------------------------------------

export type CampanhaPeriodo = { inicio: Date | string; fim: Date | string; encerradaEm?: Date | string | null }

/** AAAA-MM-DD de uma data gravada à meia-noite UTC. */
function dia(data: Date | string): string {
  return (typeof data === "string" ? data : data.toISOString()).slice(0, 10)
}

/** Aberta entre o início e o fim (inclusive), no dia do clube, e enquanto não encerrada. */
export function campanhaAberta(c: CampanhaPeriodo, hoje: string): boolean {
  if (c.encerradaEm) return false
  return dia(c.inicio) <= hoje && hoje <= dia(c.fim)
}

export type EntradaElegibilidade = {
  campanha: CampanhaPeriodo
  hoje: string
  /** Atletas ativos vinculados ao responsável. */
  alunosAtivos: number
  jaRespondeu: boolean
}

/** Só quem tem atleta ativo e ainda não respondeu vê a pesquisa, e só com a campanha aberta. */
export function podeResponder(e: EntradaElegibilidade): boolean {
  return campanhaAberta(e.campanha, e.hoje) && e.alunosAtivos > 0 && !e.jaRespondeu
}

/** Uma campanha por vez: a nova só nasce se nenhuma estiver aberta ou por começar. */
export function conflitaComOutraCampanha(existentes: CampanhaPeriodo[], hoje: string): boolean {
  return existentes.some((c) => !c.encerradaEm && dia(c.fim) >= hoje)
}

export type SituacaoCampanha = "aberta" | "agendada" | "encerrada"

export function situacaoDaCampanha(c: CampanhaPeriodo, hoje: string): SituacaoCampanha {
  if (c.encerradaEm || dia(c.fim) < hoje) return "encerrada"
  return dia(c.inicio) > hoje ? "agendada" : "aberta"
}

/** Lembrete único: liga na campanha aberta, nos últimos 3 dias dela, enquanto não enviado. */
export const DIAS_ANTES_DO_FIM_LEMBRETE = 3

export function deveEnviarLembrete(c: CampanhaPeriodo & { lembrete: boolean; lembreteEnviadoEm?: Date | string | null }, hoje: string): boolean {
  if (!c.lembrete || c.lembreteEnviadoEm || !campanhaAberta(c, hoje)) return false
  const limite = new Date(`${dia(c.fim)}T00:00:00.000Z`)
  limite.setUTCDate(limite.getUTCDate() - DIAS_ANTES_DO_FIM_LEMBRETE)
  return hoje >= limite.toISOString().slice(0, 10)
}

// --- Validação (servidor) ----------------------------------------------------------------------

export const respostaSchema = z.object({
  pesquisaId: z.number().int().positive(),
  nota: z.number().int().min(0).max(10),
  comentario: z.string().trim().max(MAX_COMENTARIO).optional(),
  anonimo: z.boolean().optional(),
})

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00.000Z`)) && new Date(`${v}T00:00:00.000Z`).toISOString().slice(0, 10) === v)

export const campanhaSchema = z
  .object({
    titulo: z.string().trim().min(3).max(120),
    pergunta: z.string().trim().min(10).max(200).optional(),
    inicio: dataIso,
    fim: dataIso,
    lembrete: z.boolean().optional(),
  })
  .refine((c) => c.fim >= c.inicio, { message: "O fim não pode ser antes do início.", path: ["fim"] })
  .refine((c) => (Date.parse(c.fim) - Date.parse(c.inicio)) / 86_400_000 <= MAX_DIAS_CAMPANHA, {
    message: `A campanha pode durar no máximo ${MAX_DIAS_CAMPANHA} dias.`,
    path: ["fim"],
  })

// --- Painel ------------------------------------------------------------------------------------

export type RespostaPainel = {
  id: number
  nota: number
  comentario: string | null
  turmas: string
  anonimo: boolean
  createdAt: Date | string
  responsavel: { id: number; nome: string; telefone: string }
}

export function turmasDaResposta(r: Pick<RespostaPainel, "turmas">): string[] {
  return r.turmas.split(",").map((t) => t.trim()).filter(Boolean)
}

/** Filtro por turma: resposta de família com atletas em duas turmas conta nas duas. */
export function filtrarPorTurma<T extends Pick<RespostaPainel, "turmas">>(respostas: T[], turma: string | null | undefined): T[] {
  if (!turma) return respostas
  return respostas.filter((r) => turmasDaResposta(r).includes(turma))
}

export type TurmaNps = ResumoNps & { turma: string }

/** NPS por turma, da menor nota para a maior (quem precisa de atenção aparece primeiro). */
export function npsPorTurma(respostas: Pick<RespostaPainel, "nota" | "turmas">[]): TurmaNps[] {
  const porTurma = new Map<string, number[]>()
  for (const r of respostas) for (const t of turmasDaResposta(r)) porTurma.set(t, [...(porTurma.get(t) ?? []), r.nota])
  return [...porTurma.entries()]
    .map(([turma, notas]) => ({ turma, ...calcularNps(notas) }))
    .sort((a, b) => (a.nps ?? 101) - (b.nps ?? 101) || a.turma.localeCompare(b.turma, "pt-BR"))
}

export type DetratorPainel = {
  id: number
  nota: number
  comentario: string | null
  turmas: string[]
  createdAt: Date | string
  /** Nulo quando a resposta é anônima ou a exibição está anonimizada. */
  nome: string | null
  whatsappHref: string | null
}

/** Primeiro nome, para a mensagem acolhedora. */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || "responsável"
}

/**
 * Detratores (nota até 6), do mais insatisfeito para o menos e, no empate, do mais recente.
 * Resposta anônima (pedido da família) ou exibição anonimizada não leva nome nem contato.
 */
export function listarDetratores(
  respostas: RespostaPainel[],
  opcoes: { clube: string; anonimizar?: boolean; modelos?: ModelosPersonalizados | null; nomeAluno?: string },
): DetratorPainel[] {
  return respostas
    .filter((r) => categoriaDaNota(r.nota) === "detrator")
    .sort((a, b) => a.nota - b.nota || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => {
      const oculto = r.anonimo || opcoes.anonimizar === true
      const mensagem = preencherModelo(textoDoModelo("satisfacao", opcoes.modelos), {
        responsavel: primeiroNome(r.responsavel.nome),
        clube: opcoes.clube,
      })
      return {
        id: r.id,
        nota: r.nota,
        comentario: r.comentario,
        turmas: turmasDaResposta(r),
        createdAt: r.createdAt,
        nome: oculto ? null : r.responsavel.nome,
        whatsappHref: oculto ? null : whatsappHrefPara(r.responsavel.telefone, mensagem),
      }
    })
}

/** Rótulo do respondente na lista de comentários. */
export function rotuloRespondente(nome: string | null): string {
  return nome ?? "Família anônima"
}
