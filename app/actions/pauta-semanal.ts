"use server"

import { createHash } from "node:crypto"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { carregarPainelDesenvolvimento } from "@/lib/desenvolvimento-data"
import { MAX_TEXTO_PAUTA, prepararPautaSemanal } from "@/lib/pauta-semanal"
import { registrarLog } from "@/app/actions/log"

const resumoSelect = { id: true, turma: true, cicloInicio: true, usuario: true, createdAt: true } as const
const textoSelect = { ...resumoSelect, texto: true } as const
const textoSchema = z.string().max(MAX_TEXTO_PAUTA).transform((value) => value.replace(/\r\n?/g, "\n").trim()).pipe(z.string().min(30))
const cicloFiltroSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const data = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === value && data.getUTCDay() === 1
})

export async function salvarPautaSemanal(input: { turma: string; cicloInicio: string; texto: string; textoBase: string; revisado: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({
    turma: z.string().max(150), cicloInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    texto: textoSchema, textoBase: textoSchema, revisado: z.literal(true),
  }).safeParse(input)
  if (!parsed.success) return { error: "Revise a pauta e confirme a revisão antes de salvar. O limite é de 100.000 caracteres." }
  const { turma, cicloInicio, texto, textoBase } = parsed.data
  const chave = createHash("sha256").update(JSON.stringify([turma, cicloInicio, auth.user, texto])).digest("hex")
  const existente = await db.pautaSemanal.findUnique({ where: { chave }, select: textoSelect })
  // Repetir uma gravação confirmada não cria outra versão, mesmo se os dados
  // tiverem mudado desde então. Nunca atualizamos conteúdo de versões antigas.
  if (existente) return { salvo: { ...existente, createdAt: existente.createdAt.toISOString() } }

  const panel = await carregarPainelDesenvolvimento()
  if (panel.cicloInicio !== cicloInicio) return { error: "O ciclo mudou. Atualize o painel e prepare a pauta do ciclo atual. Suas edições não foram salvas." }
  let textoAtual: string
  try {
    textoAtual = prepararPautaSemanal({
      cicloInicio: panel.cicloInicio, insights: panel.insights, atletas: panel.oportunidades,
      acoes: Object.fromEntries(Object.entries(panel.acoes).map(([key, acao]) => [key, {
        status: acao.status, planoSemanal: acao.planoSemanal, rascunhoAprovado: acao.rascunhoAprovadoEm !== null,
      }])),
    }, turma).texto
  } catch { return { error: "Esta turma não está disponível no painel atual. Atualize os dados antes de salvar." } }
  if (textoAtual !== textoBase) return { error: "Os registros da turma mudaram. Atualize o painel, prepare a pauta novamente e revise antes de salvar. Suas edições foram preservadas." }

  const salvo = await db.pautaSemanal.upsert({
    where: { chave }, update: {}, create: { turma, cicloInicio, texto, usuario: auth.user, chave }, select: textoSelect,
  })
  await registrarLog("pauta_semanal_salva", `Pauta semanal revisada — ${turma || "Sem turma"}`, { pautaId: salvo.id, turma, cicloInicio })
  return { salvo: { ...salvo, createdAt: salvo.createdAt.toISOString() } }
}

export async function listarPautasSemanais(input: { turma?: string; cicloInicio?: string; antesDe?: number } = {}) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ turma: z.string().max(150).optional(), cicloInicio: cicloFiltroSchema.optional(), antesDe: z.number().int().positive().optional() }).safeParse(input)
  if (!parsed.success) return { error: "Filtros inválidos. Use a segunda-feira de início do ciclo e uma página válida." }
  const [rows, turmas] = await Promise.all([
    db.pautaSemanal.findMany({
      where: { ...(parsed.data.turma !== undefined ? { turma: parsed.data.turma } : {}), ...(parsed.data.cicloInicio ? { cicloInicio: parsed.data.cicloInicio } : {}), ...(parsed.data.antesDe ? { id: { lt: parsed.data.antesDe } } : {}) },
      select: resumoSelect, orderBy: { id: "desc" }, take: 11,
    }),
    // Opções vêm do histórico completo, não do elenco ativo nem da página atual.
    // Nas próximas páginas, reutilizamos as opções já carregadas pelo cliente.
    parsed.data.antesDe ? undefined : db.pautaSemanal.groupBy({ by: ["turma"], orderBy: { turma: "asc" } }),
  ])
  const itens = rows.slice(0, 10)
  return { itens: itens.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), proximaPagina: rows.length > 10 ? itens.at(-1)!.id : null, turmas: turmas?.map((item) => item.turma) }
}

export async function consultarPautaSemanal(id: number) {
  await requireAuth(["admin", "tecnico"])
  if (!z.number().int().positive().safeParse(id).success) return { error: "Pauta inválida." }
  const pauta = await db.pautaSemanal.findUnique({ where: { id }, select: textoSelect })
  if (!pauta) return { error: "Pauta não encontrada." }
  return { pauta: { ...pauta, createdAt: pauta.createdAt.toISOString() } }
}
