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
  const alunos = await db.aluno.findMany({ where: { status: "Ativo" } })

  let criados = 0
  let ignorados = 0

  for (const aluno of alunos) {
    const existe = await db.pagamento.findFirst({
      where: { alunoId: aluno.id, mesReferencia: mes },
    })
    if (existe) {
      ignorados++
      continue
    }
    const [ano, mesNum] = mes.split("-").map(Number)
    await db.pagamento.create({
      data: {
        alunoId: aluno.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, 10),
      },
    })
    criados++
  }

  revalidatePath("/pagamentos")
  revalidatePath("/")

  return { criados, ignorados }
}
