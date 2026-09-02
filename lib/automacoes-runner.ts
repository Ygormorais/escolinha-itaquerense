import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

type Candidato = { referencia: string; titulo: string; href: string }

async function candidatos(tipo: string, dias: number): Promise<Candidato[]> {
  const agora = new Date()
  const limiteFuturo = new Date(agora.getTime() + dias * 86400000)
  const limitePassado = new Date(agora.getTime() - dias * 86400000)
  if (tipo === "mensalidade_vencida") {
    const itens = await db.pagamento.findMany({ where: { dataPagamento: null, dataVencimento: { lte: limitePassado }, aluno: { status: "Ativo" } }, select: { id: true, mesReferencia: true, aluno: { select: { nome: true } } }, take: 500 })
    return itens.map((i) => ({ referencia: `pagamento:${i.id}`, titulo: `Mensalidade vencida: ${i.aluno.nome} · ${i.mesReferencia}`, href: "/inadimplencia" }))
  }
  if (tipo === "renovacao_pendente") {
    const itens = await db.renovacaoMatricula.findMany({ where: { status: "pendente", createdAt: { lte: limitePassado } }, select: { id: true, periodo: true, aluno: { select: { nome: true } } }, take: 500 })
    return itens.map((i) => ({ referencia: `renovacao:${i.id}`, titulo: `Renovação pendente: ${i.aluno.nome} · ${i.periodo}`, href: "/configuracoes/responsaveis" }))
  }
  if (tipo === "objetivo_vencendo") {
    const itens = await db.objetivoCompartilhado.findMany({ where: { prazo: { lte: limiteFuturo }, status: { in: ["proposto", "combinado", "revisao_solicitada"] } }, select: { id: true, titulo: true, aluno: { select: { nome: true } } }, take: 500 })
    return itens.map((i) => ({ referencia: `objetivo:${i.id}`, titulo: `Objetivo no prazo: ${i.aluno.nome} · ${i.titulo}`, href: "/desenvolvimento/familias" }))
  }
  const [docs, alunos] = await Promise.all([
    db.documentoInstitucional.findMany({ where: { ativo: true }, select: { id: true, titulo: true, versoes: { orderBy: { publicadoEm: "desc" }, take: 1, select: { id: true, obrigatorio: true, turmas: true, aceites: { select: { alunoId: true } } } } }, take: 200 }),
    db.aluno.findMany({ where: { status: "Ativo", responsavelId: { not: null } }, select: { id: true, nome: true, turma: true } }),
  ])
  const resultado: Candidato[] = []
  for (const doc of docs) {
    const versao = doc.versoes[0]
    if (!versao?.obrigatorio) continue
    const aceitos = new Set(versao.aceites.map((a) => a.alunoId))
    const turmas = versao.turmas.split(",").map((t) => t.trim())
    for (const aluno of alunos) if ((turmas.includes("Todas") || turmas.includes(aluno.turma)) && !aceitos.has(aluno.id)) resultado.push({ referencia: `documento:${versao.id}:${aluno.id}`, titulo: `Aceite pendente: ${doc.titulo} · ${aluno.nome}`, href: "/configuracoes/documentos" })
  }
  return resultado.slice(0, 500)
}

export async function executarRegraAdministrativaSistema(id: number) {
  const regra = await db.regraAutomacao.findFirst({ where: { id, ativa: true }, select: { id: true, tipo: true, antecedenciaDias: true, responsavelId: true } })
  if (!regra) return null
  const ciclo = await db.cicloAutomacao.create({ data: { regraId: regra.id, status: "executando" } })
  try {
    const itens = await candidatos(regra.tipo, regra.antecedenciaDias)
    let criados = 0
    for (const item of itens) {
      const existe = await db.execucaoAutomacao.findUnique({ where: { regraId_referencia: { regraId: regra.id, referencia: item.referencia } }, select: { id: true } })
      if (existe) continue
      try {
        await db.$transaction([
          db.execucaoAutomacao.create({ data: { regraId: regra.id, ...item } }),
          db.notificacaoInterna.create({ data: { destinatarioId: regra.responsavelId, tipo: "automacao", titulo: item.titulo, href: item.href } }),
        ])
        criados++
      } catch (erro) {
        if (!(erro instanceof Prisma.PrismaClientKnownRequestError) || erro.code !== "P2002") throw erro
      }
    }
    const finalizadoEm = new Date()
    await db.$transaction([
      db.regraAutomacao.update({ where: { id: regra.id }, data: { ultimaExecucaoEm: finalizadoEm } }),
      db.cicloAutomacao.update({ where: { id: ciclo.id }, data: { status: "sucesso", encontrados: itens.length, criados, finalizadoEm } }),
    ])
    return { encontrados: itens.length, criados, cicloId: ciclo.id }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message.slice(0, 500) : "Falha desconhecida"
    await db.cicloAutomacao.update({ where: { id: ciclo.id }, data: { status: "erro", erro: mensagem, finalizadoEm: new Date() } })
    throw erro
  }
}

export async function executarTodasAutomacoesAdministrativas() {
  const regras = await db.regraAutomacao.findMany({ where: { ativa: true }, select: { id: true, titulo: true }, orderBy: { id: "asc" } })
  const resultados: Array<{ id: number; titulo: string; encontrados: number; criados: number; erro?: string }> = []
  for (const regra of regras) {
    try {
      const resultado = await executarRegraAdministrativaSistema(regra.id)
      resultados.push({ id: regra.id, titulo: regra.titulo, encontrados: resultado?.encontrados ?? 0, criados: resultado?.criados ?? 0 })
    } catch (erro) {
      resultados.push({ id: regra.id, titulo: regra.titulo, encontrados: 0, criados: 0, erro: erro instanceof Error ? erro.message : "Falha desconhecida" })
    }
  }
  return { regras: resultados.length, criados: resultados.reduce((soma, item) => soma + item.criados, 0), erros: resultados.filter((item) => item.erro).length, resultados, executadoEm: new Date().toISOString() }
}
