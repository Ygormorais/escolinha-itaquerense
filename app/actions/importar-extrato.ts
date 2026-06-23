"use server"

import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseOFX } from "@/lib/ofx-parser"
import { matchTransactions, type MatchResult } from "@/lib/ofx-matcher"
import { revalidatePath } from "next/cache"

export async function previewOFX(
  content: string
): Promise<MatchResult[] | { error: string }> {
  await requireAuth(["admin", "secretaria"])

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
  selecoes: { pagamentoId: number; valor: number; dataPagamento: string }[]
): Promise<{ atualizados: number } | { error: string }> {
  await requireAuth(["admin", "secretaria"])

  try {
    await Promise.all(
      selecoes.map((s) =>
        db.pagamento.update({
          where: { id: s.pagamentoId },
          data: {
            dataPagamento: new Date(s.dataPagamento),
            valorRecebido: s.valor,
            formaPagamento: "Importação OFX",
          },
        })
      )
    )

    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/caixa")

    return { atualizados: selecoes.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao confirmar importação" }
  }
}
