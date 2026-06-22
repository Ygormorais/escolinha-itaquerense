"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { parseCSV, parseTransacoes, detectarFormato } from "@/lib/maquina-csv"
import { requireAuth } from "@/lib/auth"

export async function importarCSV(
  texto: string,
  nomeArquivo: string
): Promise<{ importadas: number; ignoradas: number; formato: string; transacoes: Array<{ dataTransacao: Date; valor: number; parcelas: number; bandeira: string; tipo: string; nomeNoCartao: string; parcela: string; autorizacao?: string; nsu?: string; custoTaxa?: number; valorLiquido?: number; previsao?: Date; linha: number }> } | { error: string }> {
  await requireAuth()
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
  await requireAuth()
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
  const pagamento = await db.pagamento.upsert({
    where: { alunoId_mesReferencia: { alunoId, mesReferencia } },
    update: dados,
    create: { alunoId, mesReferencia, dataVencimento: new Date(dataVencimento), ...dados },
  })

  await db.transacaoMaquina.update({
    where: { id },
    data: { status: "reconciliado", alunoId, pagamentoId: pagamento.id },
  })

  revalidatePath("/caixa/maquina")
  revalidatePath("/caixa/recebimentos")
  return { success: true }
}

export async function reconciliarAuto() {
  await requireAuth()
  const pendentes = await db.transacaoMaquina.findMany({
    where: { status: "pendente" },
  })

  let reconciliados = 0
  let naoEncontrados = 0
  let invalidos = 0

  for (const t of pendentes) {
    if (!Number.isFinite(t.valor) || t.valor <= 0) { invalidos++; continue }
    const nome = t.nomeNoCartao.toLowerCase().trim()
    const alunos = await db.aluno.findMany({
      where: {
        OR: [
          { nome: { contains: nome } },
          { responsavel: { contains: nome } },
        ],
        status: "Ativo",
      },
      take: 1,
    })

    if (alunos.length === 0) {
      const partes = nome.split(" ")
      const aluno = await db.aluno.findFirst({
        where: {
          OR: partes.map((p) => ({
            OR: [
              { nome: { contains: p } },
              { responsavel: { contains: p } },
            ],
          })),
          status: "Ativo",
        },
      })
      if (!aluno) { naoEncontrados++; continue }
      alunos.push(aluno)
    }

    const mes = `${t.dataTransacao.getFullYear()}-${String(t.dataTransacao.getMonth() + 1).padStart(2, "0")}`
    const dataVenc = new Date(t.dataTransacao.getFullYear(), t.dataTransacao.getMonth(), 10)

    const dadosAuto = {
      dataPagamento: t.dataTransacao,
      formaPagamento: `Cartão ${t.tipo} (${t.bandeira})`,
      valorRecebido: t.valor,
      observacoes: `Reconciliado automático - ${t.nomeNoCartao}`,
    }
    const pag = await db.pagamento.upsert({
      where: { alunoId_mesReferencia: { alunoId: alunos[0].id, mesReferencia: mes } },
      update: dadosAuto,
      create: { alunoId: alunos[0].id, mesReferencia: mes, dataVencimento: dataVenc, ...dadosAuto },
    })

    await db.transacaoMaquina.update({
      where: { id: t.id },
      data: { status: "reconciliado", alunoId: alunos[0].id, pagamentoId: pag.id },
    })
    reconciliados++
  }

  revalidatePath("/caixa/maquina")
  revalidatePath("/caixa/recebimentos")
  return { reconciliados, naoEncontrados, invalidos }
}

export async function ignorarTransacao(id: number) {
  await requireAuth()
  await db.transacaoMaquina.update({
    where: { id },
    data: { status: "ignorado" },
  })
  revalidatePath("/caixa/maquina")
}

export async function getResumoMaquina() {
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
