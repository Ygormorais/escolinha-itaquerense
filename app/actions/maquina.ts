"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { parseCSV, parseTransacoes, detectarFormato } from "@/lib/maquina-csv"
import { requireAuth } from "@/lib/auth"

type AlunoConciliacao = { id: number; nomeBusca: string; responsavelBusca: string }

function normalizarNome(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function encontrarAluno(indice: AlunoConciliacao[], nomeNoCartao: string): AlunoConciliacao | undefined {
  const nome = normalizarNome(nomeNoCartao)
  if (!nome) return undefined

  const correspondenciaCompleta = indice.find(
    (aluno) => aluno.nomeBusca.includes(nome) || aluno.responsavelBusca.includes(nome)
  )
  if (correspondenciaCompleta) return correspondenciaCompleta

  const partes = nome.split(" ").filter(Boolean)
  return indice.find((aluno) =>
    partes.some((parte) => aluno.nomeBusca.includes(parte) || aluno.responsavelBusca.includes(parte))
  )
}

export async function importarCSV(
  texto: string,
  nomeArquivo: string
): Promise<{ importadas: number; ignoradas: number; formato: string; transacoes: Array<{ dataTransacao: Date; valor: number; parcelas: number; bandeira: string; tipo: string; nomeNoCartao: string; parcela: string; autorizacao?: string; nsu?: string; custoTaxa?: number; valorLiquido?: number; previsao?: Date; linha: number }> } | { error: string }> {
  await requireAuth(["admin", "secretaria"])
  try {
    const { linhas } = parseCSV(texto)
    if (linhas.length === 0) return { error: "Nenhuma transação encontrada no CSV" }

    const formato = detectarFormato(linhas)
    const transacoes = parseTransacoes(linhas)
    if (transacoes.length === 0) return { error: "Não foi possível interpretar as transações. Verifique o formato do CSV." }

    let importadas = 0
    let ignoradas = 0

    for (const t of transacoes) {
      const existente = await db.transacaoMaquina.findFirst({
        where: {
          dataTransacao: t.dataTransacao,
          valor: t.valor,
          nomeNoCartao: t.nomeNoCartao,
        },
      })
      if (existente) { ignoradas++; continue }

      await db.transacaoMaquina.create({
        data: {
          dataTransacao: t.dataTransacao,
          valor: t.valor,
          parcelas: t.parcelas,
          bandeira: t.bandeira,
          tipo: t.tipo,
          nomeNoCartao: t.nomeNoCartao,
          parcela: t.parcela || null,
          autorizacao: t.autorizacao || null,
          nsu: t.nsu || null,
          custoTaxa: t.custoTaxa ?? null,
          valorLiquido: t.valorLiquido ?? null,
          previsao: t.previsao ?? null,
          arquivo: nomeArquivo,
          status: "pendente",
        },
      })
      importadas++
    }

    revalidatePath("/caixa/maquina")
    return { importadas, ignoradas, formato, transacoes }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao importar CSV" }
  }
}

export async function getTransacoes(status?: string) {
  await requireAuth(["admin", "secretaria"])
  const where = status && status !== "todas" ? { status } : {}
  return db.transacaoMaquina.findMany({
    where,
    include: { aluno: { select: { id: true, nome: true, turma: true } } },
    orderBy: { dataTransacao: "desc" },
  })
}

export async function reconciliarTransacao(
  id: number,
  alunoId: number,
  mesReferencia: string,
  dataVencimento: string,
  observacoes?: string
) {
  await requireAuth(["admin", "secretaria"])
  const transacao = await db.transacaoMaquina.findUnique({ where: { id } })
  if (!transacao) return { error: "Transação não encontrada" }
  // Idempotência: não reconciliar de novo (o upsert já evita duplicar, mas o guard é explícito).
  if (transacao.status === "reconciliado") return { error: "Transação já reconciliada" }
  if (!Number.isFinite(transacao.valor) || transacao.valor <= 0) return { error: "Valor inválido na transação" }

  const dados = {
    dataPagamento: transacao.dataTransacao,
    formaPagamento: `Cartão ${transacao.tipo} (${transacao.bandeira})`,
    valorRecebido: transacao.valor,
    observacoes: observacoes || `Reconciliado via maquininha - ${transacao.nomeNoCartao}`,
  }
  // upsert na unique (alunoId, mesReferencia): se a mensalidade do mês já existe,
  // marca como paga via cartão (não duplica); senão cria.
  await db.$transaction(async (tx) => {
    const pagamento = await tx.pagamento.upsert({
      where: { alunoId_mesReferencia: { alunoId, mesReferencia } },
      update: dados,
      create: { alunoId, mesReferencia, dataVencimento: new Date(dataVencimento), ...dados },
    })

    await tx.transacaoMaquina.update({
      where: { id },
      data: { status: "reconciliado", alunoId, pagamentoId: pagamento.id },
    })
  })

  revalidatePath("/caixa/maquina")
  revalidatePath("/caixa/recebimentos")
  return { success: true }
}

export async function reconciliarAuto() {
  await requireAuth(["admin", "secretaria"])
  const [pendentes, alunosAtivos] = await Promise.all([
    db.transacaoMaquina.findMany({ where: { status: "pendente" } }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, responsavel: true },
      orderBy: { id: "asc" },
    }),
  ])
  const indiceAlunos: AlunoConciliacao[] = alunosAtivos.map((aluno) => ({
    id: aluno.id,
    nomeBusca: normalizarNome(aluno.nome),
    responsavelBusca: normalizarNome(aluno.responsavel),
  }))

  let reconciliados = 0
  let naoEncontrados = 0
  let invalidos = 0

  for (const t of pendentes) {
    if (!Number.isFinite(t.valor) || t.valor <= 0) { invalidos++; continue }
    const aluno = encontrarAluno(indiceAlunos, t.nomeNoCartao)
    if (!aluno) { naoEncontrados++; continue }

    const mes = `${t.dataTransacao.getFullYear()}-${String(t.dataTransacao.getMonth() + 1).padStart(2, "0")}`
    const dataVenc = new Date(t.dataTransacao.getFullYear(), t.dataTransacao.getMonth(), 10)

    const dadosAuto = {
      dataPagamento: t.dataTransacao,
      formaPagamento: `Cartão ${t.tipo} (${t.bandeira})`,
      valorRecebido: t.valor,
      observacoes: `Reconciliado automático - ${t.nomeNoCartao}`,
    }
    await db.$transaction(async (tx) => {
      const pagamento = await tx.pagamento.upsert({
        where: { alunoId_mesReferencia: { alunoId: aluno.id, mesReferencia: mes } },
        update: dadosAuto,
        create: { alunoId: aluno.id, mesReferencia: mes, dataVencimento: dataVenc, ...dadosAuto },
      })

      await tx.transacaoMaquina.update({
        where: { id: t.id },
        data: { status: "reconciliado", alunoId: aluno.id, pagamentoId: pagamento.id },
      })
    })
    reconciliados++
  }

  revalidatePath("/caixa/maquina")
  revalidatePath("/caixa/recebimentos")
  return { reconciliados, naoEncontrados, invalidos }
}

export async function ignorarTransacao(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.transacaoMaquina.update({
    where: { id },
    data: { status: "ignorado" },
  })
  revalidatePath("/caixa/maquina")
}

export async function getResumoMaquina() {
  await requireAuth(["admin", "secretaria"])
  const [aggTotal, aggPendente, aggReconciliado, totalTransacoes, aggTaxa] = await Promise.all([
    db.transacaoMaquina.aggregate({ where: { status: { not: "ignorado" } }, _sum: { valor: true } }),
    db.transacaoMaquina.aggregate({ where: { status: "pendente" }, _sum: { valor: true }, _count: true }),
    db.transacaoMaquina.aggregate({ where: { status: "reconciliado" }, _sum: { valor: true }, _count: true }),
    db.transacaoMaquina.count(),
    db.transacaoMaquina.aggregate({
      where: { custoTaxa: { not: null }, valor: { gt: 0 } },
      _sum: { custoTaxa: true, valor: true },
    }),
  ])

  const totalCusto = aggTaxa._sum.custoTaxa ?? 0
  const totalBase = aggTaxa._sum.valor ?? 0
  const taxaMedia = totalBase > 0 ? (totalCusto / totalBase) * 100 : null

  return {
    total: aggTotal._sum.valor ?? 0,
    totalPendente: aggPendente._sum.valor ?? 0,
    totalReconciliado: aggReconciliado._sum.valor ?? 0,
    pendentes: aggPendente._count,
    reconciliados: aggReconciliado._count,
    totalTransacoes,
    taxaMedia,
  }
}
