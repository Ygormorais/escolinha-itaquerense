"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function registrarPagamento(
  id: number,
  data: {
    dataPagamento: string
    formaPagamento: string
    valorRecebido: number
  }
) {
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
}

export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
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
}

export async function deletePagamento(id: number) {
  await db.pagamento.delete({ where: { id } })
  revalidatePath("/pagamentos")
  revalidatePath("/inadimplencia")
  revalidatePath("/")
}

export async function marcarComoPago(
  id: number,
  data: { dataPagamento: string; formaPagamento: string; valorRecebido: number }
) {
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
}
