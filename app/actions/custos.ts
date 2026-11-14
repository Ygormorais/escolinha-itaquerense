"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { CustoSchema } from "@/lib/schemas"
import { chaveRecorrente } from "@/app/custos/custos-utils"

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
  await requireAuth(["admin"])
  const parsed = CustoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  try {
    const d = parsed.data
    await db.custo.create({
      data: {
        data: new Date(`${d.data}T12:00:00`),
        categoria: d.categoria,
        descricao: d.descricao,
        fornecedor: d.fornecedor,
        valor: d.valor,
        formaPagamento: d.formaPagamento,
        comprovante: d.comprovante,
        observacoes: d.observacoes ?? null,
      },
    })
    await registrarLog("custo_novo", `Custo registrado — ${d.descricao}`, { categoria: d.categoria, valor: d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
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
  await requireAuth(["admin"])
  const parsed = CustoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  try {
    const d = parsed.data
    await db.custo.update({
      where: { id },
      data: {
        data: new Date(`${d.data}T12:00:00`),
        categoria: d.categoria,
        descricao: d.descricao,
        fornecedor: d.fornecedor,
        valor: d.valor,
        formaPagamento: d.formaPagamento,
        comprovante: d.comprovante,
        observacoes: d.observacoes ?? null,
      },
    })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar custo" }
  }
}

export async function deleteCusto(id: number): Promise<ActionResult> {
  await requireAuth(["admin"])
  try {
    await db.custo.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo" }
  }
}

export async function getCustosRecorrentes() {
  await requireAuth(["admin"])
  return db.custoRecorrente.findMany({ orderBy: { descricao: "asc" } })
}

export async function createCustoRecorrente(data: {
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
}): Promise<ActionResult> {
  await requireAuth(["admin"])
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
  await requireAuth(["admin"])
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
  await requireAuth(["admin"])
  try {
    await db.custoRecorrente.delete({ where: { id } })
    revalidatePath("/custos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao excluir custo recorrente" }
  }
}

// Gerações do mesmo processo entram em fila: a checagem de existência e a inserção de uma
// não podem se misturar com as de outra (dois cliques, duas abas), senão ambas inserem.
let filaGeracao: Promise<unknown> = Promise.resolve()

/**
 * Gera os custos recorrentes do mês. É idempotente: modelo que já tem custo no mês
 * (mesma categoria, descrição e fornecedor) é pulado, então clicar de novo não duplica.
 */
export async function gerarCustosRecorrentes(mes: string): Promise<{ criados: number; jaExistentes: number } | { error: string }> {
  await requireAuth(["admin"])
  try {
    const m = /^(\d{4})-(\d{2})$/.exec(mes)
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return { error: "Mês inválido" }
    const ano = Number(m[1])
    const mesNum = Number(m[2])
    const dataRef = new Date(ano, mesNum - 1, 1)
    const proximoMes = new Date(ano, mesNum, 1)

    const executar = (): Promise<{ criados: number; jaExistentes: number }> =>
      db.$transaction(async (tx) => {
        const [modelos, doMes] = await Promise.all([
          tx.custoRecorrente.findMany({ where: { ativo: true } }),
          tx.custo.findMany({
            where: { data: { gte: dataRef, lt: proximoMes } },
            select: { categoria: true, descricao: true, fornecedor: true },
          }),
        ])

        const existentes = new Set(doMes.map(chaveRecorrente))
        const novos = modelos.filter((mod) => {
          const k = chaveRecorrente(mod)
          if (existentes.has(k)) return false
          existentes.add(k) // dois modelos iguais geram um custo só
          return true
        })

        if (novos.length > 0) {
          await tx.custo.createMany({
            data: novos.map((mod) => ({
              data: dataRef,
              categoria: mod.categoria,
              descricao: mod.descricao,
              fornecedor: mod.fornecedor,
              valor: mod.valor,
              formaPagamento: mod.formaPagamento,
              comprovante: false,
            })),
          })
        }
        return { criados: novos.length, jaExistentes: modelos.length - novos.length }
      })

    const resultado = filaGeracao.then(executar, executar)
    filaGeracao = resultado.catch(() => undefined)
    const { criados, jaExistentes } = await resultado

    revalidatePath("/custos")
    revalidatePath("/relatorio")
    revalidatePath("/dashboard")

    return { criados, jaExistentes }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar custos recorrentes" }
  }
}
