"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function salvarRecibo(data: {
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: string
}): Promise<{ numero: string }> {
  const count = await db.recibo.count()
  const numero = String(count + 1).padStart(3, "0")

  await db.recibo.create({
    data: {
      numero,
      alunoNome: data.alunoNome,
      responsavel: data.responsavel,
      mesReferencia: data.mesReferencia,
      valor: data.valor,
      formaPagamento: data.formaPagamento,
      dataPagamento: new Date(data.dataPagamento),
    },
  })

  revalidatePath("/recibos")
  return { numero }
}

export async function getRecibos() {
  return db.recibo.findMany({ orderBy: { createdAt: "desc" } })
}

export async function deleteRecibo(id: number) {
  await db.recibo.delete({ where: { id } })
  revalidatePath("/recibos")
}
