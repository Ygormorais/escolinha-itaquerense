"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function listarCampeonatos() {
  return db.campeonato.findMany({
    include: { _count: { select: { inscricoes: true } } },
    orderBy: { dataInicio: "desc" },
  })
}

export async function getCampeonato(id: number) {
  return db.campeonato.findUnique({
    where: { id },
    include: {
      inscricoes: {
        include: { aluno: { select: { id: true, nome: true, turma: true, responsavel: true, telefone: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function criarCampeonato(data: {
  nome: string
  descricao?: string
  dataInicio: string
  dataFim?: string
  local?: string
  taxaInscricao: number
  taxaJogo?: number
  taxaArbitragem?: number
  custoTransporte?: number
  custoUniforme?: number
  observacoes?: string
}) {
  await requireAuth()
  const campeonato = await db.campeonato.create({
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      dataInicio: new Date(data.dataInicio + "T12:00:00"),
      dataFim: data.dataFim ? new Date(data.dataFim + "T12:00:00") : null,
      local: data.local || null,
      taxaInscricao: data.taxaInscricao,
      taxaJogo: data.taxaJogo ?? 0,
      taxaArbitragem: data.taxaArbitragem ?? 0,
      custoTransporte: data.custoTransporte ?? 0,
      custoUniforme: data.custoUniforme ?? 0,
      observacoes: data.observacoes || null,
    },
  })
  revalidatePath("/campeonatos")
  return campeonato
}

export async function editarCampeonato(id: number, data: {
  nome: string
  descricao?: string
  dataInicio: string
  dataFim?: string
  local?: string
  taxaInscricao: number
  taxaJogo?: number
  taxaArbitragem?: number
  custoTransporte?: number
  custoUniforme?: number
  observacoes?: string
  status?: string
}) {
  await requireAuth()
  await db.campeonato.update({
    where: { id },
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      dataInicio: new Date(data.dataInicio + "T12:00:00"),
      dataFim: data.dataFim ? new Date(data.dataFim + "T12:00:00") : null,
      local: data.local || null,
      taxaInscricao: data.taxaInscricao,
      taxaJogo: data.taxaJogo ?? 0,
      taxaArbitragem: data.taxaArbitragem ?? 0,
      custoTransporte: data.custoTransporte ?? 0,
      custoUniforme: data.custoUniforme ?? 0,
      observacoes: data.observacoes || null,
      status: data.status || "aberto",
    },
  })
  revalidatePath("/campeonatos")
  revalidatePath(`/campeonatos/${id}`)
}

export async function deletarCampeonato(id: number) {
  await requireAuth()
  await db.campeonato.delete({ where: { id } })
  revalidatePath("/campeonatos")
}

export async function inscreverAluno(campeonatoId: number, alunoId: number, data?: {
  bolsa?: boolean
  desconto?: number
  observacoes?: string
}) {
  await requireAuth()
  const inscricao = await db.inscricaoCampeonato.create({
    data: {
      campeonatoId,
      alunoId,
      bolsa: data?.bolsa ?? false,
      desconto: data?.desconto ?? 0,
      observacoes: data?.observacoes || null,
    },
  })
  revalidatePath(`/campeonatos/${campeonatoId}`)
  return inscricao
}

export async function removerInscricao(id: number, campeonatoId: number) {
  await requireAuth()
  await db.inscricaoCampeonato.delete({ where: { id } })
  revalidatePath(`/campeonatos/${campeonatoId}`)
}

export async function registrarPagamentoInscricao(
  id: number,
  campeonatoId: number,
  data: { valorPago: number; formaPagamento: string; dataPagamento: string }
) {
  await requireAuth()
  const inscricao = await db.inscricaoCampeonato.findUnique({ where: { id } })
  if (!inscricao) return { error: "Inscrição não encontrada" }

  await db.inscricaoCampeonato.update({
    where: { id },
    data: {
      taxaPaga: true,
      valorPago: data.valorPago,
      formaPagamento: data.formaPagamento,
      dataPagamento: new Date(data.dataPagamento + "T12:00:00"),
    },
  })

  revalidatePath(`/campeonatos/${campeonatoId}`)
  return { success: true }
}

export async function calcularTaxaTotal(campeonato: {
  taxaInscricao: number
  taxaJogo: number
  taxaArbitragem: number
  custoTransporte: number
  custoUniforme: number
}, desconto?: number): Promise<number> {
  const total =
    campeonato.taxaInscricao +
    campeonato.taxaJogo +
    campeonato.taxaArbitragem +
    campeonato.custoTransporte +
    campeonato.custoUniforme
  return Math.max(0, total - (desconto ?? 0))
}
