"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { registrarLog } from "@/app/actions/log"
import { ProdutoSchema } from "@/lib/schemas"

export async function listarProdutos() {
  await requireAuth(["admin"])
  return db.produto.findMany({ orderBy: { createdAt: "desc" } })
}

export async function criarProduto(data: { nome: string; descricao?: string; preco: number; categoria?: string; tamanhos?: string; estoque?: number; ativo?: boolean; imagem?: string }) {
  await requireAuth(["admin"])
  const parsed = ProdutoSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const d = { ...parsed.data, nome: parsed.data.nome.trim() }
  await db.produto.create({ data: d })
  void registrarLog("produto_criado", `Produto criado — ${d.nome}`, { preco: d.preco, estoque: d.estoque })
  revalidatePath("/produtos")
  revalidatePath("/responsavel/lojinha")
  return { success: true as const }
}

export async function atualizarProduto(id: number, data: { nome?: string; descricao?: string; preco?: number; categoria?: string; tamanhos?: string; estoque?: number; ativo?: boolean; imagem?: string }) {
  await requireAuth(["admin"])
  const parsed = ProdutoSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  const produto = await db.produto.update({ where: { id }, data: parsed.data })
  void registrarLog("produto_atualizado", `Produto atualizado — ${produto.nome}`, { id })
  revalidatePath("/produtos")
  revalidatePath("/responsavel/lojinha")
  return { success: true as const }
}

export async function removerProduto(id: number) {
  await requireAuth(["admin"])
  const produto = await db.produto.findUnique({ where: { id }, select: { nome: true } })
  await db.produto.delete({ where: { id } })
  void registrarLog("produto_excluido", `Produto excluído — ${produto?.nome ?? `ID ${id}`}`, { id })
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
  await requireAuth(["admin"])
  if (quantidade <= 0) return { error: "Quantidade deve ser positiva" }

  const produto = await db.produto.findUnique({ where: { id: produtoId } })
  if (!produto) return { error: "Produto não encontrado" }
  if (tipo === "saida" && produto.estoque < quantidade) return { error: "Estoque insuficiente" }

  const delta = tipo === "entrada" ? quantidade : -quantidade
  await db.$transaction([
    db.movimentoEstoque.create({ data: { produtoId, tipo, quantidade, motivo } }),
    db.produto.update({ where: { id: produtoId }, data: { estoque: { increment: delta } } }),
  ])
  void registrarLog("estoque_ajustado", `Estoque ${tipo} — ${produto.nome} (${tipo === "entrada" ? "+" : "-"}${quantidade})`, { produtoId, tipo, quantidade, motivo })
  revalidatePath("/produtos")
  return { success: true as const }
}

export async function getMovimentosEstoque(produtoId: number) {
  await requireAuth(["admin"])
  return db.movimentoEstoque.findMany({
    where: { produtoId },
    orderBy: { createdAt: "desc" },
    take: 30,
  })
}
