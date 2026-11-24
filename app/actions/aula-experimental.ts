"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIpFromHeaders } from "@/lib/client-ip"
import { registrarLog } from "./log"
import { ocupacaoPorJanela } from "@/lib/aula-experimental-dados"
import {
  CONSENTIMENTO_VERSAO_AULA,
  MENSAGEM_RECUSA,
  STATUS_QUE_BLOQUEIAM_NOVA,
  STATUS_QUE_OCUPAM_VAGA,
  chaveDoNome,
  decidirInscricao,
  montarPreMatricula,
  podeConverter,
  podeMudarStatus,
  primeiroCampoComErroAula,
  rotuloDia,
  telefoneNormalizado,
  validarAulaExperimental,
  validarJanela,
  type EntradaJanela,
  type ErrosAula,
  type MotivoRecusa,
} from "@/lib/aula-experimental"

/** Formulário preenchido em menos que isso é robô. Em dev/e2e fica zerado para não travar a suíte. */
function tempoMinimoPreenchimentoMs(): number {
  const bruto = process.env.AULA_EXPERIMENTAL_TEMPO_MINIMO_MS
  const configurado = Number(bruto)
  if (bruto !== undefined && Number.isFinite(configurado)) return configurado
  return process.env.NODE_ENV === "production" ? 3000 : 0
}

export type ConfirmacaoAula = {
  turma: string
  data: string
  rotuloData: string
  hora: string
  duracaoMin: number
  local: string | null
  icsHref: string
}

export type AgendarAulaResult =
  | { success: true; confirmacao: ConfirmacaoAula }
  | { error: string; campos?: ErrosAula; lotada?: boolean }

class RecusaInscricao extends Error {
  constructor(readonly motivo: MotivoRecusa) {
    super(motivo)
  }
}

function confirmacaoDaJanela(j: { id: number; turma: string; data: string; hora: string; duracaoMin: number; local: string | null }): ConfirmacaoAula {
  return {
    turma: j.turma,
    data: j.data,
    rotuloData: rotuloDia(j.data),
    hora: j.hora,
    duracaoMin: j.duracaoMin,
    local: j.local,
    icsHref: `/aula-experimental/ics/${j.id}`,
  }
}

/**
 * Inscrição pública em uma aula experimental. Endpoint aberto: valida tudo no servidor, limita por IP
 * e por telefone, descarta robôs (isca e tempo mínimo) e nunca aceita acima da capacidade da janela.
 */
export async function agendarAulaExperimental(data: {
  janelaId: number | null
  nomeAtleta: string
  dataNascimento: string
  nomeResponsavel: string
  telefone: string
  email: string
  consentimento: boolean
  /** Isca anti-robô: campo invisível; pessoa nunca preenche. */
  website?: string
  /** Momento (ms desde 1970) em que o formulário foi aberto. */
  abertoEm?: number
}): Promise<AgendarAulaResult> {
  const ip = getClientIpFromHeaders(await headers())
  const porIp = checkRateLimit(`aula-experimental:${ip}`, 5, 10 * 60_000)
  if (!porIp.ok) return { error: "Muitos envios. Aguarde alguns minutos e tente de novo." }

  const janelaId = typeof data?.janelaId === "number" ? data.janelaId : null

  // Robô: isca preenchida ou envio rápido demais. Responde como sucesso, sem gravar nada.
  const rapidoDemais = typeof data?.abertoEm === "number" && Date.now() - data.abertoEm < tempoMinimoPreenchimentoMs()
  if ((typeof data?.website === "string" && data.website.trim() !== "") || rapidoDemais) {
    const janela = janelaId ? await db.janelaAulaExperimental.findUnique({ where: { id: janelaId } }) : null
    if (janela) return { success: true, confirmacao: confirmacaoDaJanela(janela) }
    return { error: MENSAGEM_RECUSA.indisponivel }
  }

  const erros = validarAulaExperimental({
    janelaId,
    nomeAtleta: String(data?.nomeAtleta ?? ""),
    dataNascimento: String(data?.dataNascimento ?? ""),
    nomeResponsavel: String(data?.nomeResponsavel ?? ""),
    telefone: String(data?.telefone ?? ""),
    email: String(data?.email ?? ""),
    consentimento: data?.consentimento === true,
  })
  const primeiro = primeiroCampoComErroAula(erros)
  if (primeiro) {
    return {
      error: Object.keys(erros).length === 1 ? erros[primeiro]! : "Confira os campos destacados no formulário.",
      campos: erros,
    }
  }

  const telefone = telefoneNormalizado(data.telefone)
  // Por contato: o mesmo telefone não consegue lotar as vagas com várias inscrições.
  const porContato = checkRateLimit(`aula-experimental-contato:${telefone}`, 3, 60 * 60_000)
  if (!porContato.ok) return { error: "Muitos envios para este telefone. Tente de novo mais tarde ou fale com a secretaria." }

  const nomeAtleta = data.nomeAtleta.trim()
  const email = data.email.trim()

  try {
    const janela = await db.$transaction(async (tx) => {
      const alvo = await tx.janelaAulaExperimental.findUnique({ where: { id: janelaId! } })
      if (!alvo) throw new RecusaInscricao("indisponivel")

      // Uma aula experimental por criança: mesmo telefone e mesmo nome (sem acento/caixa).
      const doContato = await tx.aulaExperimental.findMany({
        where: { telefone, status: { in: STATUS_QUE_BLOQUEIAM_NOVA } },
        select: { nomeAtleta: true },
      })
      const jaTemAula = doContato.some((a) => chaveDoNome(a.nomeAtleta) === chaveDoNome(nomeAtleta))

      const ocupadas = await tx.aulaExperimental.count({
        where: { janelaId: alvo.id, status: { in: STATUS_QUE_OCUPAM_VAGA } },
      })
      const decisao = decidirInscricao({ janela: alvo, ocupadas, jaTemAula })
      if (!decisao.ok) throw new RecusaInscricao(decisao.motivo)

      await tx.aulaExperimental.create({
        data: {
          janelaId: alvo.id,
          nomeAtleta,
          dataNascimento: new Date(`${data.dataNascimento}T12:00:00.000Z`),
          nomeResponsavel: data.nomeResponsavel.trim(),
          telefone,
          email: email || null,
          consentimentoEm: new Date(),
          consentimentoVersao: CONSENTIMENTO_VERSAO_AULA,
        },
      })

      // Confere de novo depois de gravar: se duas inscrições disputaram a última vaga, a segunda desfaz.
      const depois = await tx.aulaExperimental.count({
        where: { janelaId: alvo.id, status: { in: STATUS_QUE_OCUPAM_VAGA } },
      })
      if (depois > alvo.capacidade) throw new RecusaInscricao("lotada")
      return alvo
    })

    revalidatePath("/aula-experimental")
    revalidatePath("/configuracoes/aula-experimental")
    return { success: true, confirmacao: confirmacaoDaJanela(janela) }
  } catch (e) {
    if (e instanceof RecusaInscricao) {
      return { error: MENSAGEM_RECUSA[e.motivo], lotada: e.motivo === "lotada" }
    }
    return { error: "Não foi possível agendar agora. Tente de novo em instantes." }
  }
}

// ── Administração ────────────────────────────────────────────────────────────

export type ActionResult = { success: true } | { error: string }

const PAGINAS_ADMIN = "/configuracoes/aula-experimental"

export async function criarJanelaAula(entrada: EntradaJanela): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  const validada = validarJanela(entrada)
  if (!validada.ok) return { error: validada.erro }
  const janela = await db.janelaAulaExperimental.create({ data: validada.dados })
  await registrarLog("aula-experimental", "Janela de aula experimental criada", { janelaId: janela.id })
  revalidatePath(PAGINAS_ADMIN)
  revalidatePath("/aula-experimental")
  return { success: true }
}

export async function atualizarJanelaAula(
  id: number,
  alteracao: { ativa?: boolean; capacidade?: number },
): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || id <= 0) return { error: "Janela inválida." }
  const dados: { ativa?: boolean; capacidade?: number } = {}
  if (typeof alteracao.ativa === "boolean") dados.ativa = alteracao.ativa
  if (alteracao.capacidade !== undefined) {
    const cap = Number(alteracao.capacidade)
    if (!Number.isInteger(cap) || cap < 1 || cap > 60) return { error: "A capacidade deve ficar entre 1 e 60 vagas." }
    const ocupacao = (await ocupacaoPorJanela([id])).get(id) ?? 0
    if (cap < ocupacao) return { error: `Já há ${ocupacao} inscritos nesta data. Cancele inscrições antes de reduzir as vagas.` }
    dados.capacidade = cap
  }
  if (Object.keys(dados).length === 0) return { error: "Nada para atualizar." }
  const { count } = await db.janelaAulaExperimental.updateMany({ where: { id }, data: dados })
  if (!count) return { error: "Janela não encontrada." }
  revalidatePath(PAGINAS_ADMIN)
  revalidatePath("/aula-experimental")
  return { success: true }
}

export async function excluirJanelaAula(id: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || id <= 0) return { error: "Janela inválida." }
  const inscritos = await db.aulaExperimental.count({ where: { janelaId: id } })
  if (inscritos > 0) return { error: "Esta data já tem inscrições. Desative-a em vez de excluir." }
  const { count } = await db.janelaAulaExperimental.deleteMany({ where: { id } })
  if (!count) return { error: "Janela não encontrada." }
  revalidatePath(PAGINAS_ADMIN)
  revalidatePath("/aula-experimental")
  return { success: true }
}

export async function atualizarStatusAula(id: number, status: string): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || id <= 0) return { error: "Inscrição inválida." }
  const aula = await db.aulaExperimental.findUnique({ where: { id }, select: { status: true } })
  if (!aula) return { error: "Inscrição não encontrada." }
  if (!podeMudarStatus(aula.status, status)) {
    return { error: aula.status === "convertida" ? "Esta inscrição já virou pré-matrícula." : "Status inválido." }
  }
  await db.aulaExperimental.update({ where: { id }, data: { status } })
  revalidatePath(PAGINAS_ADMIN)
  return { success: true }
}

export type ConverterResult = { success: true; preMatriculaId: number } | { error: string }

/** Cria a pré-matrícula com os dados da inscrição e marca a aula como convertida (uma vez só). */
export async function converterAulaEmPreMatricula(id: number): Promise<ConverterResult> {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || id <= 0) return { error: "Inscrição inválida." }
  try {
    const preId = await db.$transaction(async (tx) => {
      const aula = await tx.aulaExperimental.findUnique({ where: { id }, include: { janela: true } })
      if (!aula) throw new Error("Inscrição não encontrada.")
      if (!podeConverter(aula)) throw new Error("Esta inscrição já foi convertida ou foi cancelada.")
      // Trava atômica: só uma conversão simultânea consegue marcar a aula.
      const { count } = await tx.aulaExperimental.updateMany({
        where: { id, preMatriculaId: null, status: { notIn: ["convertida", "cancelada"] } },
        data: { status: "convertida" },
      })
      if (count === 0) throw new Error("Esta inscrição já foi convertida.")
      const pre = await tx.preMatricula.create({ data: montarPreMatricula(aula, aula.janela) })
      await tx.aulaExperimental.update({ where: { id }, data: { preMatriculaId: pre.id } })
      return pre.id
    })
    await registrarLog("aula-experimental", "Aula experimental convertida em pré-matrícula", { aulaId: id, preMatriculaId: preId })
    revalidatePath(PAGINAS_ADMIN)
    revalidatePath("/configuracoes/matriculas")
    return { success: true, preMatriculaId: preId }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao converter a inscrição." }
  }
}
