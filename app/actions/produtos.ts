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
  await db.produto.create({ data })
  revalidatePath("/configuracoes/produtos")
}

export async function atualizarProduto(id: number, data: { nome?: string; descricao?: string; preco?: number; categoria?: string; tamanhos?: string; estoque?: number; ativo?: boolean; imagem?: string }) {
  await requireAuth()
  await db.produto.update({ where: { id }, data })
  revalidatePath("/configuracoes/produtos")
}

export async function removerProduto(id: number) {
  await requireAuth()
  await db.produto.delete({ where: { id } })
  revalidatePath("/configuracoes/produtos")
}
