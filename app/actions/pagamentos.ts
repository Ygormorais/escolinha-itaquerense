"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type ActionResult = { success: true } | { error: string }

export async function registrarPagamento(
  id: number,
  data: {
    dataPagamento: string
    formaPagamento: string
    valorRecebido: number
  }
): Promise<ActionResult> {
  try {
    await db.pagamento.update({
      where: { id },
      data: {
        dataPagamento: new Date(data.dataPagamento),
        formaPagamento: data.formaPagamento,
        valorRecebido: data.valorRecebido,
      },
    })
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar pagamento" }
  }
}

export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  try {
    const [ano, mesNum] = mes.split("-").map(Number)

    const [alunos, existentes] = await Promise.all([
      db.aluno.findMany({ where: { status: "Ativo" } }),
      db.pagamento.findMany({
        where: { mesReferencia: mes },
        select: { alunoId: true },
      }),
    ])

    const existentesSet = new Set(existentes.map((e) => e.alunoId))
    const novos = alunos.filter((a) => !existentesSet.has(a.id))

    if (novos.length > 0) {
      await db.pagamento.createMany({
        data: novos.map((a) => ({
          alunoId: a.id,
          mesReferencia: mes,
          dataVencimento: new Date(ano, mesNum - 1, 10),
        })),
      })
    }

    revalidatePath("/pagamentos")
    revalidatePath("/")

    return { criados: novos.length, ignorados: existentesSet.size }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar mensalidades" }
  }
}

export async function deletePagamento(id: number): Promise<ActionResult> {
  try {
    await db.pagamento.delete({ where: { id } })
    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir pagamento" }
  }
}

export async function marcarComoPago(
  id: number,
  data: { dataPagamento: string; formaPagamento: string; valorRecebido: number }
): Promise<ActionResult> {
  try {
    await db.pagamento.update({
      where: { id },
      data: {
        dataPagamento: new Date(data.dataPagamento),
        formaPagamento: data.formaPagamento,
        valorRecebido: data.valorRecebido,
      },
    })
    revalidatePath("/inadimplencia")
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao marcar como pago" }
  }
}
