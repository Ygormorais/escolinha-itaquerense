import { cache } from "react"
import { db } from "@/lib/db"
import type { StaffRole } from "@/lib/permissions"

export type PendenciaItem = {
  chave: string
  titulo: string
  detalhe: string
  href: string
  prioridade: "alta" | "normal"
  situacao: "atrasada" | "proxima" | "informativa"
  responsavel?: string | null
}
export type PendenciaGrupo = { titulo: string; descricao: string; itens: PendenciaItem[] }

const alta = { prioridade: "alta", situacao: "atrasada" } as const
const normal = { prioridade: "normal", situacao: "proxima" } as const
const informativa = { prioridade: "normal", situacao: "informativa" } as const

async function gruposAdministrativos(): Promise<PendenciaGrupo[]> {
  const agora = new Date()
  const [pagamentos, solicitacoes, renovacoes, espera, documentos, alunos] = await Promise.all([
    db.pagamento.findMany({ where: { dataPagamento: null, dataVencimento: { lt: agora }, aluno: { status: "Ativo" } }, select: { id: true, mesReferencia: true, dataVencimento: true, aluno: { select: { nome: true } } }, orderBy: { dataVencimento: "asc" }, take: 100 }),
    db.solicitacao.findMany({ where: { status: { in: ["pendente", "em_andamento"] } }, select: { id: true, tipo: true, createdAt: true, responsavel: { select: { nome: true } } }, orderBy: { createdAt: "asc" }, take: 100 }),
    db.renovacaoMatricula.findMany({ where: { status: "pendente" }, select: { id: true, periodo: true, createdAt: true, aluno: { select: { nome: true } } }, orderBy: { createdAt: "asc" }, take: 100 }),
    db.listaEsperaTurma.findMany({ where: { status: { in: ["aguardando", "contatado"] } }, select: { id: true, nomeAluno: true, status: true, createdAt: true, turma: { select: { nome: true } } }, orderBy: { createdAt: "asc" }, take: 100 }),
    db.documentoInstitucional.findMany({ where: { ativo: true }, select: { id: true, titulo: true, versoes: { orderBy: { publicadoEm: "desc" }, take: 1, select: { id: true, obrigatorio: true, turmas: true, aceites: { select: { alunoId: true } } } } }, take: 100 }),
    db.aluno.findMany({ where: { status: "Ativo", responsavelId: { not: null } }, select: { id: true, nome: true, turma: true } }),
  ])
  const docs: PendenciaItem[] = []
  for (const doc of documentos) {
    const versao = doc.versoes[0]
    if (!versao?.obrigatorio) continue
    const aceitos = new Set(versao.aceites.map((aceite) => aceite.alunoId))
    const turmas = versao.turmas.split(",").map((turma) => turma.trim())
    const pendentes = alunos.filter((aluno) => (turmas.includes("Todas") || turmas.includes(aluno.turma)) && !aceitos.has(aluno.id))
    if (pendentes.length) docs.push({ chave: `doc-${doc.id}`, titulo: doc.titulo, detalhe: `${pendentes.length} atleta(s) sem aceite da versão vigente.`, href: "/configuracoes/documentos", ...alta })
  }
  return [
    { titulo: "Mensalidades vencidas", descricao: "Pagamentos ativos ainda sem baixa.", itens: pagamentos.map((p) => ({ chave: `pag-${p.id}`, titulo: p.aluno.nome, detalhe: `${p.mesReferencia} · venceu em ${p.dataVencimento.toLocaleDateString("pt-BR")}`, href: "/inadimplencia", ...alta })) },
    { titulo: "Solicitações", descricao: "Pedidos aguardando conclusão.", itens: solicitacoes.map((s) => ({ chave: `sol-${s.id}`, titulo: s.responsavel.nome, detalhe: `${s.tipo} · aberto em ${s.createdAt.toLocaleDateString("pt-BR")}`, href: "/configuracoes/solicitacoes", ...(agora.getTime() - s.createdAt.getTime() > 7 * 86400000 ? alta : normal) })) },
    { titulo: "Renovações", descricao: "Renovações aguardando resposta.", itens: renovacoes.map((r) => ({ chave: `ren-${r.id}`, titulo: r.aluno.nome, detalhe: `${r.periodo} · desde ${r.createdAt.toLocaleDateString("pt-BR")}`, href: "/configuracoes/responsaveis", ...normal })) },
    { titulo: "Lista de espera", descricao: "Famílias aguardando contato ou vaga.", itens: espera.map((e) => ({ chave: `esp-${e.id}`, titulo: e.nomeAluno, detalhe: `${e.turma.nome} · ${e.status} desde ${e.createdAt.toLocaleDateString("pt-BR")}`, href: "/turmas#capacidade-turmas", ...informativa })) },
    { titulo: "Documentos", descricao: "Aceites obrigatórios da versão vigente.", itens: docs },
  ]
}

async function gruposTecnicos(usuario: string): Promise<PendenciaGrupo[]> {
  const usuarioDb = await db.usuario.findUnique({ where: { username: usuario }, select: { id: true } })
  const usuarioId = usuarioDb?.id ?? -1
  const agora = new Date()
  const [rotinas, objetivos, conversas, fichas] = await Promise.all([
    db.rotinaOcorrencia.findMany({ where: { status: "pendente", OR: [{ rotina: { responsavelId: usuarioId } }, { rotina: { responsavelId: null } }] }, select: { id: true, vencimento: true, rotina: { select: { titulo: true, categoria: true } } }, orderBy: { vencimento: "asc" }, take: 100 }),
    db.objetivoCompartilhado.findMany({ where: { status: { in: ["proposto", "revisao_solicitada"] } }, select: { id: true, titulo: true, status: true, prazo: true, aluno: { select: { nome: true } } }, orderBy: { updatedAt: "asc" }, take: 100 }),
    db.conversaFamilia.findMany({ where: { status: "aberta" }, select: { id: true, titulo: true, updatedAt: true, aluno: { select: { nome: true } }, mensagens: { orderBy: { id: "desc" }, take: 1, select: { autorTipo: true } } }, orderBy: { updatedAt: "asc" }, take: 100 }),
    db.aluno.findMany({ where: { status: "Ativo", OR: [{ alergias: { not: null } }, { condicaoSaude: { not: null } }] }, select: { id: true, nome: true, turma: true, fichaMedicaVersao: true, leiturasFichaMedica: { where: { usuarioId }, select: { versao: true } } }, orderBy: [{ turma: "asc" }, { nome: "asc" }] }),
  ])
  const naoLidas = fichas.filter((f) => !f.leiturasFichaMedica.some((leitura) => leitura.versao === f.fichaMedicaVersao))
  return [
    { titulo: "Rotinas da comissão", descricao: "Ocorrências atribuídas a você ou à equipe.", itens: rotinas.map((r) => ({ chave: `rot-${r.id}`, titulo: r.rotina.titulo, detalhe: `${r.rotina.categoria} · ${r.vencimento.toLocaleDateString("pt-BR")}`, href: "/desenvolvimento/operacao#rotinas-operacionais", ...(r.vencimento < agora ? alta : normal) })) },
    { titulo: "Objetivos familiares", descricao: "Propostas sem confirmação ou com pedido de conversa.", itens: objetivos.map((o) => ({ chave: `obj-${o.id}`, titulo: `${o.aluno.nome} · ${o.titulo}`, detalhe: `${o.status.replaceAll("_", " ")}${o.prazo ? ` · prazo ${o.prazo.toLocaleDateString("pt-BR")}` : ""}`, href: "/desenvolvimento/familias", ...(o.status === "revisao_solicitada" || (o.prazo && o.prazo < agora) ? alta : normal) })) },
    { titulo: "Conversas abertas", descricao: "Conversas cujo último movimento pode exigir retorno.", itens: conversas.map((c) => ({ chave: `conv-${c.id}`, titulo: `${c.aluno.nome} · ${c.titulo}`, detalhe: `${c.mensagens[0]?.autorTipo === "familia" ? "Última mensagem da família" : "Aguardando família"} · ${c.updatedAt.toLocaleDateString("pt-BR")}`, href: "/desenvolvimento/familias", ...(c.mensagens[0]?.autorTipo === "familia" ? normal : informativa) })) },
    { titulo: "Fichas médicas não lidas", descricao: "Versões com alerta ainda não confirmadas por você.", itens: naoLidas.map((f) => ({ chave: `med-${f.id}`, titulo: f.nome, detalhe: `${f.turma} · versão ${f.fichaMedicaVersao}`, href: "/tecnico/saude", ...alta })) },
  ]
}

export const carregarPendencias = cache(async (role: StaffRole, usuario: string): Promise<PendenciaGrupo[]> => {
  const grupos = [
    ...(role === "admin" || role === "secretaria" ? await gruposAdministrativos() : []),
    ...(role === "admin" || role === "tecnico" ? await gruposTecnicos(usuario) : []),
  ]
  const chaves = grupos.flatMap((grupo) => grupo.itens.map((item) => item.chave))
  if (!chaves.length) return grupos
  const tratamentos = await db.tratamentoPendencia.findMany({ where: { chave: { in: chaves } }, select: { chave: true, status: true, responsavel: true, adiadaAte: true } })
  const porChave = new Map(tratamentos.map((item) => [item.chave, item]))
  const agora = new Date()
  return grupos.map((grupo) => ({ ...grupo, itens: grupo.itens.flatMap((item) => {
    const tratamento = porChave.get(item.chave)
    if (tratamento?.status === "resolvida" || (tratamento?.status === "adiada" && tratamento.adiadaAte && tratamento.adiadaAte > agora)) return []
    return [{ ...item, responsavel: tratamento?.responsavel }]
  }) }))
})

export async function contarPendencias(role: StaffRole, usuario: string) {
  const grupos = await carregarPendencias(role, usuario)
  return grupos.reduce((total, grupo) => total + grupo.itens.length, 0)
}
