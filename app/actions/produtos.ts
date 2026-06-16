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
