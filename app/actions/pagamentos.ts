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
