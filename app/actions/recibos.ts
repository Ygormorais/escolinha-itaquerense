"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"
import { dataValida } from "@/lib/utils"
import { calcularHashRecibo, gerarCodigoVerificacao, gerarNumeroRecibo } from "@/lib/recibos"

export async function salvarRecibo(data: {
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: string
}): Promise<{ numero: string; codigoVerificacao: string } | { error: string }> {
  const session = await requireAuth(["admin", "secretaria"])
  if (!data.alunoNome?.trim()) return { error: "Nome do aluno é obrigatório" }
  if (!data.responsavel?.trim()) return { error: "Nome do responsável é obrigatório" }
  if (!data.mesReferencia?.trim()) return { error: "Referência do pagamento é obrigatória" }
  const valor = Number(data.valor)
  if (!Number.isFinite(valor) || valor <= 0) return { error: "Valor inválido" }
  if (!data.dataPagamento || !data.formaPagamento) return { error: "Campos obrigatórios ausentes" }
  if (!dataValida(data.dataPagamento)) return { error: "Data de pagamento inválida" }
  const numero = gerarNumeroRecibo()
  const codigoVerificacao = gerarCodigoVerificacao()
  const dados = {
    numero,
    codigoVerificacao,
    alunoNome: data.alunoNome.trim(),
    responsavel: data.responsavel.trim(),
    mesReferencia: data.mesReferencia.trim(),
    valor,
    formaPagamento: data.formaPagamento,
    dataPagamento: new Date(`${data.dataPagamento}T12:00:00`),
  }

  await db.recibo.create({
    data: {
      ...dados,
      hashIntegridade: calcularHashRecibo(dados),
      emitidoPor: session.user,
    },
  })

  await registrarLog("recibo", `Recibo Nº${numero} emitido — ${data.alunoNome}`, { mes: data.mesReferencia, valor: valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), codigoVerificacao })
  revalidatePath("/recibos")
  return { numero, codigoVerificacao }
}

export async function getRecibos() {
  await requireAuth(["admin", "secretaria"])
  return db.recibo.findMany({ orderBy: { createdAt: "desc" }, take: 500 })
}

export async function cancelarRecibo(id: number) {
  const session = await requireAuth(["admin", "secretaria"])
  const recibo = await db.recibo.findUnique({ where: { id }, select: { numero: true, alunoNome: true } })
  await db.recibo.update({ where: { id }, data: { canceladoAt: new Date(), canceladoPor: session.user } })
  await registrarLog("recibo_cancelado", `Recibo Nº${recibo?.numero ?? id} cancelado — ${recibo?.alunoNome ?? ""}`)
  revalidatePath("/recibos")
}
