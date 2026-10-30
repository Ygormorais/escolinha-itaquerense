"use server"

import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseOFX } from "@/lib/ofx-parser"
import { matchTransactions, type MatchResult } from "@/lib/ofx-matcher"
import { revalidatePath } from "next/cache"
import { emitirReciboSeguro } from "@/lib/baixa"

// Arquivo é lido no client como latin1 (1 byte = 1 char), então content.length
// bate com o tamanho em bytes do arquivo original.
const MAX_OFX_SIZE_BYTES = 5 * 1024 * 1024
// Tolerância de 1 centavo ao comparar o valor enviado pelo client com o valor real
// da transação OFX. Comparação em centavos inteiros (não float) pra não mascarar
// diferenças reais por erro de arredondamento perto do limite.
const TOLERANCIA_CENTAVOS = 1

function paraCentavos(valor: number): number {
  return Math.round(valor * 100)
}

export async function previewOFX(
  content: string
): Promise<MatchResult[] | { error: string }> {
  await requireAuth(["admin", "secretaria"])

  if (content.length > MAX_OFX_SIZE_BYTES) {
    return { error: "Arquivo excede o limite de 5MB." }
  }

  try {
    const transactions = parseOFX(content)

    const [alunos, pagamentos] = await Promise.all([
      db.aluno.findMany({
        where: { status: "Ativo" },
        select: { id: true, nome: true },
      }),
      db.pagamento.findMany({
        where: { dataPagamento: null },
        select: { id: true, alunoId: true, mesReferencia: true, dataPagamento: true },
      }),
    ])

    return matchTransactions(transactions, alunos, pagamentos)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao processar arquivo OFX" }
  }
}

export async function confirmarImportacaoOFX(
  selecoes: { pagamentoId: number; valor: number; dataPagamento: string; fitid: string }[],
  ofxContent: string
): Promise<{ atualizados: number } | { error: string }> {
  const session = await requireAuth(["admin", "secretaria"])

  if (ofxContent.length > MAX_OFX_SIZE_BYTES) {
    return { error: "Arquivo excede o limite de 5MB." }
  }

  try {
    // Nunca confiamos em pagamentoId/valor vindos do client sem checar: reparseia o
    // OFX original para pegar o valor real de cada transação (por fitid) e confere no
    // banco se o pagamento ainda está pendente antes de gravar.
    const transactions = parseOFX(ofxContent)

    // Um fitid duplicado entre transações do próprio OFX é ambíguo — não dá pra saber
    // qual delas uma seleção do client está de fato referenciando, então nenhuma das
    // duas é usada como fonte confiável.
    const contagemFitid = new Map<string, number>()
    for (const t of transactions) contagemFitid.set(t.fitid, (contagemFitid.get(t.fitid) ?? 0) + 1)
    const txPorFitid = new Map(
      transactions.filter((t) => contagemFitid.get(t.fitid) === 1).map((t) => [t.fitid, t])
    )

    // Mesma transação (fitid) não pode ser usada por 2 seleções pra confirmar
    // pagamentos diferentes.
    const fitidUsados = new Map<string, number>()
    for (const s of selecoes) fitidUsados.set(s.fitid, (fitidUsados.get(s.fitid) ?? 0) + 1)

    const pagamentos = await db.pagamento.findMany({
      where: { id: { in: selecoes.map((s) => s.pagamentoId) } },
    })
    const pagamentoPorId = new Map(pagamentos.map((p) => [p.id, p]))

    const validas = selecoes.filter((s) => {
      if ((fitidUsados.get(s.fitid) ?? 0) > 1) return false
      const pagamento = pagamentoPorId.get(s.pagamentoId)
      const tx = txPorFitid.get(s.fitid)
      if (!pagamento || pagamento.dataPagamento !== null) return false
      if (!tx || Math.abs(paraCentavos(tx.amount) - paraCentavos(s.valor)) > TOLERANCIA_CENTAVOS) return false
      return true
    })

    // Condição de corrida: entre o findMany acima e este update outro processo pode
    // ter baixado o mesmo pagamento. O `dataPagamento: null` no where do updateMany
    // garante atomicamente que só grava se ainda estiver pendente; 0 linhas afetadas
    // vira "pulado", não erro fatal do lote.
    const resultados = await db.$transaction(
      validas.map((s) => {
        const tx = txPorFitid.get(s.fitid)!
        return db.pagamento.updateMany({
          where: { id: s.pagamentoId, dataPagamento: null },
          data: {
            dataPagamento: tx.date,
            valorRecebido: tx.amount,
            formaPagamento: "Importação OFX",
          },
        })
      })
    )
    const atualizados = resultados.reduce((soma, r) => soma + r.count, 0)

    // Um recibo por pagamento efetivamente baixado (count 0 = outro processo baixou antes).
    for (const [i, s] of validas.entries()) {
      if (resultados[i]?.count !== 1) continue
      const tx = txPorFitid.get(s.fitid)!
      await emitirReciboSeguro(db, {
        pagamentoId: s.pagamentoId, valor: tx.amount, formaPagamento: "Importação OFX",
        dataPagamento: tx.date, emitidoPor: session?.user ?? null,
      })
    }

    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/caixa")

    return { atualizados }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao confirmar importação" }
  }
}
