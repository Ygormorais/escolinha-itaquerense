"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"

type ActionResult = { success: true } | { error: string }

export async function registrarPagamento(
  id: number,
  data: {
    dataPagamento: string
    formaPagamento: string
    valorRecebido: number
    observacoes?: string
  }
): Promise<ActionResult> {
  try {
    await db.pagamento.update({
      where: { id },
      data: {
        dataPagamento: new Date(data.dataPagamento),
        formaPagamento: data.formaPagamento,
        valorRecebido: data.valorRecebido,
        observacoes: data.observacoes ?? null,
      },
    })
    const pag = await db.pagamento.findUnique({ where: { id }, include: { aluno: { select: { nome: true } } } })
    await registrarLog("pagamento", `Pagamento registrado — ${pag?.aluno.nome ?? ""}`, { mes: pag?.mesReferencia ?? "", valor: `R$ ${data.valorRecebido.toFixed(2)}`, forma: data.formaPagamento })
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar pagamento" }
  }
}

export async function registrarPagamentosLote(
  ids: number[],
  data: { dataPagamento: string; formaPagamento: string }
): Promise<{ atualizados: number } | { error: string }> {
  try {
    const pagamentos = await db.pagamento.findMany({
      where: { id: { in: ids } },
      include: { aluno: { select: { nome: true, mensalidade: true } } },
    })

    for (const p of pagamentos) {
      await db.pagamento.update({
        where: { id: p.id },
        data: {
          dataPagamento: new Date(data.dataPagamento),
          formaPagamento: data.formaPagamento,
          valorRecebido: p.aluno.mensalidade,
        },
      })
    }

    await registrarLog("pagamento", `Lote de ${ids.length} pagamento(s) registrado(s)`, { forma: data.formaPagamento, data: data.dataPagamento })
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { atualizados: ids.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar pagamentos em lote" }
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

export async function gerarMensalidadesAno(
  ano: number
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  try {
    const alunos = await db.aluno.findMany({ where: { status: "Ativo" } })
    let criados = 0
    let ignorados = 0

    for (let mesNum = 1; mesNum <= 12; mesNum++) {
      const mes = `${ano}-${String(mesNum).padStart(2, "0")}`
      const existentes = await db.pagamento.findMany({
        where: { mesReferencia: mes },
        select: { alunoId: true },
      })
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
        criados += novos.length
      }
      ignorados += existentesSet.size
    }

    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { criados, ignorados }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar mensalidades anuais" }
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
