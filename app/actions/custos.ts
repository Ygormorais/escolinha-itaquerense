"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function createCusto(data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}) {
  await db.custo.create({
    data: {
      data: new Date(data.data),
      categoria: data.categoria,
      descricao: data.descricao,
      fornecedor: data.fornecedor,
      valor: data.valor,
      formaPagamento: data.formaPagamento,
      comprovante: data.comprovante,
      observacoes: data.observacoes ?? null,
    },
  })

  revalidatePath("/custos")
}
