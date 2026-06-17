"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { dataValida } from "@/lib/utils"

type ActionResult = { success: true } | { error: string }

export async function createCusto(data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth()
  if (!dataValida(data.data)) return { error: "Data inválida" }
  if (!data.descricao?.trim()) return { error: "Descrição é obrigatória" }
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
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
    await registrarLog("custo_novo", `Custo registrado — ${data.descricao}`, { categoria: data.categoria, valor: data.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar custo" }
  }
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
}): Promise<ActionResult> {
  await requireAuth()
  if (!dataValida(data.data)) return { error: "Data inválida" }
  if (!data.descricao?.trim()) return { error: "Descrição é obrigatória" }
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
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
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar custo" }
  }
}

export async function deleteCusto(id: number): Promise<ActionResult> {
  await requireAuth()
  try {
    await db.custo.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo" }
  }
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
}): Promise<ActionResult> {
  await requireAuth()
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
    await db.custoRecorrente.create({ data })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao criar custo recorrente" }
  }
}

export async function updateCustoRecorrente(id: number, data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  ativo: boolean
}): Promise<ActionResult> {
  await requireAuth()
  if (!Number.isFinite(data.valor) || data.valor <= 0) return { error: "Valor inválido" }
  try {
    await db.custoRecorrente.update({ where: { id }, data })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar custo recorrente" }
  }
}

export async function deleteCustoRecorrente(id: number): Promise<ActionResult> {
  await requireAuth()
  try {
    await db.custoRecorrente.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo recorrente" }
  }
}

export async function gerarCustosRecorrentes(mes: string): Promise<{ criados: number } | { error: string }> {
  try {
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
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar custos recorrentes" }
  }
}
