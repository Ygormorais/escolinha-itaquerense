"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"
import { getConfig } from "@/lib/config"
import { dataValida, plural } from "@/lib/utils"
import { runGerarMensalidadesMes } from "@/lib/pagamentos-jobs"

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
  await requireAuth()
  const valor = Number(data.valorRecebido)
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido" }
  if (!data.dataPagamento || !data.formaPagamento) return { error: "Campos obrigatórios ausentes" }
  if (!dataValida(data.dataPagamento)) return { error: "Data de pagamento inválida" }
  try {
    await db.pagamento.update({
      where: { id },
      data: {
        dataPagamento: new Date(data.dataPagamento),
        formaPagamento: data.formaPagamento,
        valorRecebido: data.valorRecebido,
        canalPrevisto: data.formaPagamento,
        statusCobranca: "pago",
        observacoes: data.observacoes ?? null,
      },
    })
    const pag = await db.pagamento.findUnique({ where: { id }, include: { aluno: { select: { nome: true } } } })
    await registrarLog("pagamento", `Pagamento registrado — ${pag?.aluno.nome ?? ""}`, { mes: pag?.mesReferencia ?? "", valor: data.valorRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), forma: data.formaPagamento })
    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/caixa")
    revalidatePath("/caixa/recebimentos")
    revalidatePath("/caixa/dinheiro")
    revalidatePath("/caixa/pix")
    revalidatePath("/caixa/boleto")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar pagamento" }
  }
}

export async function getPagamentosPendentes(alunoId: number) {
  return db.pagamento.findMany({
    where: { alunoId, dataPagamento: null },
    select: {
      id: true,
      mesReferencia: true,
      dataVencimento: true,
      aluno: { select: { mensalidade: true } },
    },
    orderBy: { dataVencimento: "asc" },
  })
}

export async function registrarPagamentosLote(
  ids: number[],
  data: { dataPagamento: string; formaPagamento: string }
): Promise<{ atualizados: number } | { error: string }> {
  await requireAuth()
  if (!dataValida(data.dataPagamento)) return { error: "Data de pagamento inválida" }
  try {
    const pagamentos = await db.pagamento.findMany({
      where: { id: { in: ids } },
      include: { aluno: { select: { nome: true, mensalidade: true } } },
    })

    await db.$transaction(
      pagamentos.map((p) =>
        db.pagamento.update({
          where: { id: p.id },
          data: {
            dataPagamento: new Date(data.dataPagamento),
            formaPagamento: data.formaPagamento,
            valorRecebido: p.aluno.mensalidade,
            canalPrevisto: data.formaPagamento,
            statusCobranca: "pago",
          },
        })
      )
    )

    await registrarLog("pagamento", `Lote: ${plural(ids.length, "pagamento registrado", "pagamentos registrados", "nenhum")}`, { forma: data.formaPagamento, data: data.dataPagamento })
    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/caixa")
    revalidatePath("/caixa/recebimentos")
    revalidatePath("/")
    return { atualizados: ids.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao registrar pagamentos em lote" }
  }
}

export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  await requireAuth()
  try {
    const result = await runGerarMensalidadesMes(mes)
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return result
  } catch (e) {
    // P2002: o unique(alunoId, mesReferencia) rejeitou uma corrida cron×manual (sem cobrança dupla).
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002") {
      return { error: "As mensalidades deste mês já foram geradas (por outro processo). Recarregue a página." }
    }
    return { error: e instanceof Error ? e.message : "Erro ao gerar mensalidades" }
  }
}

export async function gerarMensalidadesAno(
  ano: number
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  await requireAuth()
  try {
    const rawDia = getConfig().diaVencimento
    const diaVencimento = Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10
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
            dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
            canalPrevisto: null,
            statusCobranca: null,
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
  await requireAuth()
  try {
    const pag = await db.pagamento.findUnique({
      where: { id },
      include: { aluno: { select: { nome: true } } },
    })

    if (pag?.externalId) {
      const { cancelarCobranca } = await import("@/app/actions/cobranca")
      const cancelResult = await cancelarCobranca(id)
      if ("error" in cancelResult) return cancelResult
    }

    await db.pagamento.delete({ where: { id } })
    await registrarLog("pagamento_excluido", `Pagamento excluído — ${pag?.aluno.nome ?? ""}`, {
      mes: pag?.mesReferencia ?? "",
    })
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
  await requireAuth()
  const valor = Number(data.valorRecebido)
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido" }
  if (!dataValida(data.dataPagamento)) return { error: "Data de pagamento inválida" }
  try {
    await db.pagamento.update({
      where: { id },
      data: {
        dataPagamento: new Date(data.dataPagamento),
        formaPagamento: data.formaPagamento,
        valorRecebido: data.valorRecebido,
        canalPrevisto: data.formaPagamento,
        statusCobranca: "pago",
      },
    })

    const pag = await db.pagamento.findUnique({ where: { id }, include: { aluno: { select: { nome: true } } } })
    await registrarLog("pagamento_pago", `Pagamento marcado como pago — ${pag?.aluno.nome ?? ""}`, { mes: pag?.mesReferencia ?? "", valor: data.valorRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) })
    revalidatePath("/inadimplencia")
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao marcar como pago" }
  }
}
