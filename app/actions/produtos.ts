"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function listarProdutos() {
  await requireAuth()
  return db.produto.findMany({ orderBy: { createdAt: "desc" } })
}

export async function criarProduto(data: { nome: string; descricao?: string; preco: number; categoria?: string; tamanhos?: string; estoque?: number; ativo?: boolean; imagem?: string }) {
  await requireAuth()
  if (!data.nome?.trim()) return { error: "Nome do produto é obrigatório" }
  const preco = Number(data.preco)
  if (!Number.isFinite(preco) || preco < 0) return { error: "Preço inválido" }
  if (data.estoque !== undefined && (!Number.isFinite(data.estoque) || data.estoque < 0)) return { error: "Estoque inválido" }
  await db.produto.create({ data: { ...data, nome: data.nome.trim() } })
  revalidatePath("/produtos")
  revalidatePath("/responsavel/lojinha")
  return { success: true as const }
}

export async function atualizarProduto(id: number, data: { nome?: string; descricao?: string; preco?: number; categoria?: string; tamanhos?: string; estoque?: number; ativo?: boolean; imagem?: string }) {
  await requireAuth()
  if (data.preco !== undefined) {
    const preco = Number(data.preco)
    if (!Number.isFinite(preco) || preco < 0) return { error: "Preço inválido" }
  }
  if (data.estoque !== undefined && (!Number.isFinite(data.estoque) || data.estoque < 0)) return { error: "Estoque inválido" }
  await db.produto.update({ where: { id }, data })
  revalidatePath("/produtos")
  revalidatePath("/responsavel/lojinha")
  return { success: true as const }
}

export async function removerProduto(id: number) {
  await requireAuth()
  await db.produto.delete({ where: { id } })
  revalidatePath("/produtos")
  revalidatePath("/responsavel/lojinha")
  return { success: true as const }
}

export async function ajustarEstoque(
  produtoId: number,
  tipo: "entrada" | "saida",
  quantidade: number,
  motivo?: string
) {
  await requireAuth()
  if (quantidade <= 0) return { error: "Quantidade deve ser positiva" }

  const produto = await db.produto.findUnique({ where: { id: produtoId } })
  if (!produto) return { error: "Produto não encontrado" }
  if (tipo === "saida" && produto.estoque < quantidade) return { error: "Estoque insuficiente" }

  const delta = tipo === "entrada" ? quantidade : -quantidade
  await db.$transaction([
    db.movimentoEstoque.create({ data: { produtoId, tipo, quantidade, motivo } }),
    db.produto.update({ where: { id: produtoId }, data: { estoque: { increment: delta } } }),
  ])
  revalidatePath("/produtos")
  return { success: true as const }
}

export async function getMovimentosEstoque(produtoId: number) {
  await requireAuth()
  return db.movimentoEstoque.findMany({
    where: { produtoId },
    orderBy: { createdAt: "desc" },
    take: 30,
  })
}
