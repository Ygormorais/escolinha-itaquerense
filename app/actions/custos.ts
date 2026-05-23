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

export async function updateCusto(id: number, data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}) {
  await db.custo.update({
    where: { id },
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

export async function deleteCusto(id: number) {
  await db.custo.delete({ where: { id } })
  revalidatePath("/custos")
}

export async function getCustosRecorrentes() {
  return db.custoRecorrente.findMany({ orderBy: { descricao: "asc" } })
}

export async function createCustoRecorrente(data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
}) {
  await db.custoRecorrente.create({ data })
  revalidatePath("/custos")
}

export async function updateCustoRecorrente(id: number, data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  ativo: boolean
}) {
  await db.custoRecorrente.update({ where: { id }, data })
  revalidatePath("/custos")
}

export async function deleteCustoRecorrente(id: number) {
  await db.custoRecorrente.delete({ where: { id } })
  revalidatePath("/custos")
}

export async function gerarCustosRecorrentes(mes: string): Promise<{ criados: number }> {
  const [ano, mesNum] = mes.split("-").map(Number)
  const dataRef = new Date(ano, mesNum - 1, 1)

  const modelos = await db.custoRecorrente.findMany({ where: { ativo: true } })

  await db.custo.createMany({
    data: modelos.map((m) => ({
      data: dataRef,
      categoria: m.categoria,
      descricao: m.descricao,
      fornecedor: m.fornecedor,
      valor: m.valor,
      formaPagamento: m.formaPagamento,
      comprovante: false,
    })),
  })

  revalidatePath("/custos")
  revalidatePath("/relatorio")
  revalidatePath("/")

  return { criados: modelos.length }
}
