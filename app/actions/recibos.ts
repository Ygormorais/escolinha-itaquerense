"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"

export async function salvarRecibo(data: {
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: string
}): Promise<{ numero: string } | { error: string }> {
  await requireAuth()
  if (!data.alunoNome?.trim()) return { error: "Nome do aluno é obrigatório" }
  const valor = Number(data.valor)
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido" }
  if (!data.dataPagamento || !data.formaPagamento) return { error: "Campos obrigatórios ausentes" }
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

  await registrarLog("recibo", `Recibo Nº${numero} emitido — ${data.alunoNome}`, { mes: data.mesReferencia, valor: data.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })
  revalidatePath("/recibos")
  return { numero }
}

export async function getRecibos() {
  await requireAuth()
  return db.recibo.findMany({ orderBy: { createdAt: "desc" }, take: 500 })
}

export async function deleteRecibo(id: number) {
  await requireAuth()
  const recibo = await db.recibo.findUnique({ where: { id }, select: { numero: true, alunoNome: true } })
  await db.recibo.delete({ where: { id } })
  await registrarLog("recibo_excluido", `Recibo Nº${recibo?.numero ?? id} excluído — ${recibo?.alunoNome ?? ""}`)
  revalidatePath("/recibos")
}
