"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

const dataCivil = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const listaIds = z.array(z.number().int().positive()).max(100).transform((itens) => [...new Set(itens)])
const atividadeUsoSchema = z.object({ atividadeId: z.number().int().positive(), resultado: z.enum(["planejada", "adaptada", "nao_utilizada"]), observacao: z.string().trim().max(500).optional() })

export async function carregarOpcoesDiarioTreino(turma: string) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.string().max(100).safeParse(turma)
  if (!parsed.success) return { error: "Turma inválida." }
  const [atletas, acoes, planos, atividades] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo", turma: parsed.data }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    db.acaoDesenvolvimento.findMany({ where: { status: "pendente", aluno: { turma: parsed.data } }, select: { id: true, titulo: true, aluno: { select: { nome: true } } }, orderBy: { id: "asc" }, take: 100 }),
    db.planoTreino.findMany({ where: { turma: parsed.data }, select: { id: true, createdAt: true }, orderBy: { id: "desc" }, take: 50 }),
    db.atividadeTreino.findMany({ where: { ativa: true, validadaEm: { not: null } }, select: { id: true, titulo: true, duracaoMin: true, faixa: true, objetivo: true }, orderBy: { titulo: "asc" } }),
  ])
  return { dados: { atletas, acoes, planos: planos.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), atividades } }
}

export async function registrarSessaoTreino(input: { turma: string; realizadoEm: string; duracaoMin: number; planoTreinoId: number | null; resumo: string; adaptacoes?: string; ocorrencias?: string; atletaIds: number[]; acaoIds: number[]; atividades: { atividadeId: number; resultado: "planejada" | "adaptada" | "nao_utilizada"; observacao?: string }[] }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ turma: z.string().trim().min(1).max(100), realizadoEm: dataCivil, duracaoMin: z.number().int().min(15).max(240), planoTreinoId: z.number().int().positive().nullable(), resumo: z.string().trim().min(10).max(2000), adaptacoes: z.string().trim().max(1500).optional(), ocorrencias: z.string().trim().max(1500).optional(), atletaIds: listaIds, acaoIds: listaIds, atividades: z.array(atividadeUsoSchema).min(1).max(30) }).safeParse(input)
  if (!parsed.success) return { error: "Confira data, duração, resumo e pelo menos uma atividade validada." }
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date())
  if (parsed.data.realizadoEm > hoje) return { error: "A data do treino não pode estar no futuro." }
  const idsAtividades = [...new Set(parsed.data.atividades.map((item) => item.atividadeId))]
  if (idsAtividades.length !== parsed.data.atividades.length) return { error: "Uma atividade não pode aparecer duas vezes na mesma sessão." }
  const [atletasValidos, acoesValidas, atividadesValidas, planoValido] = await Promise.all([
    db.aluno.count({ where: { id: { in: parsed.data.atletaIds }, status: "Ativo", turma: parsed.data.turma } }),
    db.acaoDesenvolvimento.count({ where: { id: { in: parsed.data.acaoIds }, aluno: { turma: parsed.data.turma } } }),
    db.atividadeTreino.findMany({ where: { id: { in: idsAtividades }, ativa: true, validadaEm: { not: null } }, select: { id: true, versaoAtual: true, versoes: { select: { id: true, numero: true } } } }),
    parsed.data.planoTreinoId ? db.planoTreino.count({ where: { id: parsed.data.planoTreinoId, turma: parsed.data.turma } }) : Promise.resolve(1),
  ])
  if (atletasValidos !== parsed.data.atletaIds.length || acoesValidas !== parsed.data.acaoIds.length) return { error: "Atleta ou ação não pertence mais à turma selecionada." }
  if (atividadesValidas.length !== idsAtividades.length) return { error: "Uma atividade foi retirada ou ainda não foi validada." }
  if (!planoValido) return { error: "O plano não pertence à turma selecionada." }
  const versaoPorAtividade = new Map(atividadesValidas.map((atividade) => [atividade.id, atividade.versoes.find((versao) => versao.numero === atividade.versaoAtual)?.id ?? null]))
  const sessao = await db.sessaoTreino.create({ data: { turma: parsed.data.turma, realizadoEm: parsed.data.realizadoEm, duracaoMin: parsed.data.duracaoMin, planoTreinoId: parsed.data.planoTreinoId, resumo: parsed.data.resumo, adaptacoes: parsed.data.adaptacoes || null, ocorrencias: parsed.data.ocorrencias || null, usuario: auth.user, atletas: { create: parsed.data.atletaIds.map((alunoId) => ({ alunoId })) }, acoes: { create: parsed.data.acaoIds.map((acaoId) => ({ acaoId })) }, atividades: { create: parsed.data.atividades.map((item) => ({ atividadeId: item.atividadeId, atividadeVersaoId: versaoPorAtividade.get(item.atividadeId), resultado: item.resultado, observacao: item.observacao || null })) } }, select: { id: true } })
  revalidatePath("/desenvolvimento")
  return { success: true, id: sessao.id }
}

export async function listarSessoesTreino(input: { turma?: string; depoisDe?: number } = {}) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ turma: z.string().max(100).optional(), depoisDe: z.number().int().positive().optional() }).safeParse(input)
  if (!parsed.success) return { error: "Filtros inválidos." }
  const rows = await db.sessaoTreino.findMany({ where: { ...(parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }), ...(parsed.data.depoisDe ? { id: { lt: parsed.data.depoisDe } } : {}) }, select: { id: true, turma: true, realizadoEm: true, duracaoMin: true, resumo: true, adaptacoes: true, ocorrencias: true, usuario: true, createdAt: true, planoTreinoId: true, atletas: { select: { aluno: { select: { id: true, nome: true } } }, orderBy: { alunoId: "asc" } }, acoes: { select: { acao: { select: { id: true, titulo: true } } }, orderBy: { acaoId: "asc" } }, atividades: { select: { resultado: true, observacao: true, atividade: { select: { id: true, titulo: true } }, atividadeVersao: { select: { numero: true, titulo: true } } }, orderBy: { atividadeId: "asc" } } }, orderBy: { id: "desc" }, take: 21 })
  const itens = rows.slice(0, 20).map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), atletas: item.atletas.map((v) => v.aluno), acoes: item.acoes.map((v) => v.acao), atividades: item.atividades.map((uso) => ({ ...uso, atividade: { ...uso.atividade, titulo: uso.atividadeVersao?.titulo ?? uso.atividade.titulo }, versao: uso.atividadeVersao?.numero ?? null, atividadeVersao: undefined })) }))
  return { dados: { itens, proximaPagina: rows.length > 20 ? itens.at(-1)!.id : null } }
}

const atividadeSchema = z.object({ titulo: z.string().trim().min(3).max(120), descricao: z.string().trim().min(10).max(1500), objetivo: z.string().trim().min(2).max(80), faixa: z.enum(["6–8", "9–11", "12–15", "16–17", "todas"]), duracaoMin: z.number().int().min(3).max(120), materiais: z.array(z.string().trim().min(1).max(50)).max(20).transform((itens) => [...new Set(itens)]), tags: z.array(z.string().trim().min(1).max(40)).max(20).transform((itens) => [...new Set(itens)]) })

export async function criarAtividadeTreino(input: z.input<typeof atividadeSchema>) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = atividadeSchema.safeParse(input)
  if (!parsed.success) return { error: "Confira título, descrição, objetivo, faixa, duração, materiais e tags." }
  const dados = { ...parsed.data, materiais: JSON.stringify(parsed.data.materiais), tags: JSON.stringify(parsed.data.tags), criadaPor: auth.user }
  await db.atividadeTreino.create({ data: { ...dados, versoes: { create: { numero: 1, ...dados } } } })
  revalidatePath("/desenvolvimento")
  return { success: true }
}

export async function validarAtividadeTreino(input: { id: number; revisada: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ id: z.number().int().positive(), revisada: z.literal(true) }).safeParse(input)
  if (!parsed.success) return { error: "Confirme a revisão da atividade." }
  const atividade = await db.atividadeTreino.findFirst({ where: { id: parsed.data.id, ativa: true, validadaEm: null }, select: { id: true, versaoAtual: true } })
  if (!atividade) return { error: "A atividade já foi validada, retirada ou não existe." }
  const agora = new Date()
  await db.$transaction([
    db.atividadeTreino.update({ where: { id: atividade.id }, data: { validadaEm: agora, validadaPor: auth.user } }),
    db.atividadeTreinoVersao.updateMany({ where: { atividadeId: atividade.id, numero: atividade.versaoAtual }, data: { validadaEm: agora, validadaPor: auth.user } }),
  ])
  revalidatePath("/desenvolvimento")
  return { success: true }
}

export async function alternarFavoritoAtividade(atividadeId: number) {
  const auth = await requireAuth(["admin", "tecnico"])
  if (!z.number().int().positive().safeParse(atividadeId).success) return { error: "Atividade inválida." }
  const usuario = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true } })
  if (!usuario) return { error: "Usuário não localizado." }
  const atual = await db.atividadeTreinoFavorito.findUnique({ where: { atividadeId_usuarioId: { atividadeId, usuarioId: usuario.id } }, select: { atividadeId: true } })
  if (atual) await db.atividadeTreinoFavorito.delete({ where: { atividadeId_usuarioId: { atividadeId, usuarioId: usuario.id } } })
  else {
    const atividade = await db.atividadeTreino.findFirst({ where: { id: atividadeId, ativa: true, validadaEm: { not: null } }, select: { id: true } })
    if (!atividade) return { error: "Apenas atividades ativas e validadas podem ser favoritas." }
    await db.atividadeTreinoFavorito.create({ data: { atividadeId, usuarioId: usuario.id } })
  }
  return { success: true, favorita: !atual }
}

export async function listarBibliotecaAtividades(input: { busca?: string; faixa?: string; objetivo?: string; favoritas?: boolean; incluirArquivadas?: boolean } = {}) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ busca: z.string().trim().max(100).optional(), faixa: z.string().max(20).optional(), objetivo: z.string().max(80).optional(), favoritas: z.boolean().optional(), incluirArquivadas: z.boolean().optional() }).safeParse(input)
  if (!parsed.success) return { error: "Filtros inválidos." }
  const usuario = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true } })
  if (!usuario) return { error: "Usuário não localizado." }
  const rows = await db.atividadeTreino.findMany({ where: { ...(parsed.data.incluirArquivadas ? {} : { ativa: true }), ...(parsed.data.faixa ? { faixa: parsed.data.faixa } : {}), ...(parsed.data.objetivo ? { objetivo: parsed.data.objetivo } : {}), ...(parsed.data.busca ? { OR: [{ titulo: { contains: parsed.data.busca } }, { descricao: { contains: parsed.data.busca } }, { tags: { contains: parsed.data.busca } }] } : {}), ...(parsed.data.favoritas ? { favoritos: { some: { usuarioId: usuario.id } } } : {}) }, select: { id: true, titulo: true, descricao: true, objetivo: true, faixa: true, duracaoMin: true, materiais: true, tags: true, ativa: true, versaoAtual: true, arquivadaEm: true, validadaEm: true, validadaPor: true, criadaPor: true, favoritos: { where: { usuarioId: usuario.id }, select: { usuarioId: true } }, usos: { select: { resultado: true, observacao: true }, take: 100 }, versoes: { select: { id: true, numero: true, titulo: true, descricao: true, objetivo: true, faixa: true, duracaoMin: true, materiais: true, tags: true, validadaEm: true, validadaPor: true, criadaPor: true, createdAt: true }, orderBy: { numero: "desc" }, take: 20 } }, orderBy: [{ ativa: "desc" }, { validadaEm: "desc" }, { titulo: "asc" }], take: 100 })
  const lerLista = (valor: string) => { try { const parsed = z.array(z.string()).safeParse(JSON.parse(valor)); return parsed.success ? parsed.data : [] } catch { return [] } }
  const itens = rows.map((item) => ({ ...item, validadaEm: item.validadaEm?.toISOString() ?? null, arquivadaEm: item.arquivadaEm?.toISOString() ?? null, favorita: item.favoritos.length > 0, materiais: lerLista(item.materiais), tags: lerLista(item.tags), versoes: item.versoes.map((versao) => ({ ...versao, materiais: lerLista(versao.materiais), tags: lerLista(versao.tags), validadaEm: versao.validadaEm?.toISOString() ?? null, createdAt: versao.createdAt.toISOString() })), usos: { total: item.usos.length, planejada: item.usos.filter((uso) => uso.resultado === "planejada").length, adaptada: item.usos.filter((uso) => uso.resultado === "adaptada").length, naoUtilizada: item.usos.filter((uso) => uso.resultado === "nao_utilizada").length, observacoesRecentes: item.usos.map((uso) => uso.observacao).filter((texto): texto is string => Boolean(texto)).slice(0, 3) } }                   ))
  return { dados: { itens } }
}

export async function atualizarAtividadeTreino(id: number, input: z.input<typeof atividadeSchema>) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = atividadeSchema.safeParse(input)
  if (!Number.isInteger(id) || !parsed.success) return { error: "Confira os dados da atividade." }
  const atual = await db.atividadeTreino.findUnique({ where: { id }, select: { id: true, versaoAtual: true, ativa: true } })
  if (!atual || !atual.ativa) return { error: "Atividade arquivada ou não encontrada." }
  const numero = atual.versaoAtual + 1
  const dados = { ...parsed.data, materiais: JSON.stringify(parsed.data.materiais), tags: JSON.stringify(parsed.data.tags) }
  try {
    await db.$transaction([
      db.atividadeTreino.update({ where: { id }, data: { ...dados, versaoAtual: numero, validadaEm: null, validadaPor: null } }),
      db.atividadeTreinoVersao.create({ data: { atividadeId: id, numero, ...dados, criadaPor: auth.user } }),
    ])
  } catch {
    return { error: "A atividade foi alterada por outra pessoa. Atualize a biblioteca e tente novamente." }
  }
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}

export async function duplicarAtividadeTreino(id: number) {
  const auth = await requireAuth(["admin", "tecnico"])
  const atual = await db.atividadeTreino.findUnique({ where: { id }, select: { titulo: true, descricao: true, objetivo: true, faixa: true, duracaoMin: true, materiais: true, tags: true } })
  if (!atual) return { error: "Atividade não encontrada." }
  const titulo = `${atual.titulo.slice(0, 112)} (cópia)`
  const dados = { ...atual, titulo, criadaPor: auth.user }
  await db.atividadeTreino.create({ data: { ...dados, versoes: { create: { numero: 1, ...dados } } } })
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}

export async function definirAtividadeAtiva(id: number, ativa: boolean) {
  const auth = await requireAuth(["admin", "tecnico"])
  if (!Number.isInteger(id)) return { error: "Atividade inválida." }
  const resultado = await db.atividadeTreino.updateMany({ where: { id }, data: { ativa, arquivadaEm: ativa ? null : new Date(), arquivadaPor: ativa ? null : auth.user } })
  if (!resultado.count) return { error: "Atividade não encontrada." }
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}
