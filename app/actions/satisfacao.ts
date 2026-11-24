"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getClientIpFromHeaders } from "@/lib/client-ip"
import { checkRateLimit } from "@/lib/rate-limit"
import { hojeNoClube } from "@/lib/datas-clube"
import { getResponsavelSession } from "@/lib/responsavel-session"
import {
  PERGUNTA_PADRAO,
  campanhaAberta,
  campanhaSchema,
  conflitaComOutraCampanha,
  respostaSchema,
} from "@/lib/satisfacao"
import { registrarLog } from "./log"

export type ResultadoSatisfacao = { success: true } | { error: string }

const meiaNoiteUtc = (dia: string) => new Date(`${dia}T00:00:00.000Z`)

function revalidarTudo() {
  revalidatePath("/configuracoes/satisfacao")
  revalidatePath("/responsavel")
  revalidatePath("/responsavel/pesquisa")
}

export async function criarPesquisa(input: {
  titulo: string
  pergunta?: string
  inicio: string
  fim: string
  lembrete?: boolean
}): Promise<ResultadoSatisfacao> {
  const session = await requireAuth(["admin", "secretaria"])
  const parsed = campanhaSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira o título e o período da pesquisa." }
  const hoje = hojeNoClube()
  if (parsed.data.fim < hoje) return { error: "O fim da pesquisa não pode estar no passado." }
  const existentes = await db.pesquisaSatisfacao.findMany({ select: { inicio: true, fim: true, encerradaEm: true } })
  if (conflitaComOutraCampanha(existentes, hoje)) return { error: "Já existe uma pesquisa aberta ou agendada. Encerre-a antes de criar outra." }
  await db.pesquisaSatisfacao.create({
    data: {
      titulo: parsed.data.titulo,
      pergunta: parsed.data.pergunta?.trim() || PERGUNTA_PADRAO,
      inicio: meiaNoiteUtc(parsed.data.inicio),
      fim: meiaNoiteUtc(parsed.data.fim),
      lembrete: parsed.data.lembrete === true,
      criadoPor: session.user,
    },
  })
  await registrarLog("pesquisa_satisfacao_criada", `Pesquisa de satisfação criada: ${parsed.data.titulo}`)
  revalidarTudo()
  return { success: true }
}

export async function encerrarPesquisa(id: number): Promise<ResultadoSatisfacao> {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || id <= 0) return { error: "Pesquisa inválida." }
  const { count } = await db.pesquisaSatisfacao.updateMany({ where: { id, encerradaEm: null }, data: { encerradaEm: new Date() } })
  if (count === 0) return { error: "Pesquisa não encontrada ou já encerrada." }
  await registrarLog("pesquisa_satisfacao_encerrada", `Pesquisa de satisfação #${id} encerrada`)
  revalidarTudo()
  return { success: true }
}

/** Resposta da família logada. Uma por responsável por pesquisa; o servidor revalida tudo. */
export async function responderPesquisa(input: {
  pesquisaId: number
  nota: number
  comentario?: string
  anonimo?: boolean
}): Promise<ResultadoSatisfacao> {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Sessão expirada. Entre novamente." }
  const responsavelId = session.responsavelId

  const ip = getClientIpFromHeaders(await headers())
  if (!checkRateLimit(`satisfacao:resp:${responsavelId}`, 10, 10 * 60_000).ok || !checkRateLimit(`satisfacao:ip:${ip}`, 30, 10 * 60_000).ok) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." }
  }

  const parsed = respostaSchema.safeParse(input)
  if (!parsed.success) return { error: "Escolha uma nota de 0 a 10. O comentário pode ter até 500 caracteres." }

  const [pesquisa, alunos] = await Promise.all([
    db.pesquisaSatisfacao.findUnique({ where: { id: parsed.data.pesquisaId }, select: { id: true, inicio: true, fim: true, encerradaEm: true } }),
    db.aluno.findMany({ where: { responsavelId, status: "Ativo" }, select: { turma: true } }),
  ])
  if (!pesquisa || !campanhaAberta(pesquisa, hojeNoClube())) return { error: "Esta pesquisa não está mais aberta." }
  if (alunos.length === 0) return { error: "A pesquisa é para famílias com atleta ativo." }

  const turmas = [...new Set(alunos.map((a) => a.turma))].sort((a, b) => a.localeCompare(b, "pt-BR")).join(",")
  try {
    await db.respostaSatisfacao.create({
      data: {
        pesquisaId: pesquisa.id,
        responsavelId,
        nota: parsed.data.nota,
        comentario: parsed.data.comentario?.trim() || null,
        anonimo: parsed.data.anonimo === true,
        turmas,
      },
    })
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002") {
      return { error: "Sua resposta já foi registrada. Obrigado!" }
    }
    return { error: "Não foi possível registrar a resposta agora. Tente novamente." }
  }
  revalidarTudo()
  return { success: true }
}
