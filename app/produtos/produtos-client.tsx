"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { removerProduto } from "@/app/actions/produtos"
import { ProdutoFormDialog } from "./produto-form-dialog"
import { ProdutosListaMobile } from "./produtos-lista-mobile"
import { ProdutosTabela } from "./produtos-tabela"
import type { Produto } from "./produtos-utils"

export function ProdutosClient({ produtos }: { produtos: Produto[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  // Muda a cada abertura: remonta o formulário e descarta o que ficou digitado antes.
  const [sessao, setSessao] = useState(0)

  function openNew() {
    setEditando(null)
    setSessao((s) => s + 1)
    setOpen(true)
  }

  function openEdit(p: Produto) {
    setEditando(p)
    setSessao((s) => s + 1)
    setOpen(true)
  }

  async function handleRemover(id: number) {
    try {
      await removerProduto(id)
      toast.success("Produto removido!")
      router.refresh()
    } catch {
      toast.error("Erro ao remover produto")
    }
  }

  const listaProps = {
    produtos,
    onEditar: openEdit,
    onRemover: handleRemover,
    onEstoqueAjustado: () => router.refresh(),
  }

  return (
    <div className="space-y-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="size-6 text-brand-600" />
          Produtos
        </h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> Novo Produto
        </Button>
      </div>

      <ProdutoFormDialog key={sessao} open={open} onOpenChange={setOpen} produto={editando} />

      {produtos.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhum produto cadastrado" description="Adicione produtos para a lojinha." />
      ) : (
        <>
          <ProdutosListaMobile {...listaProps} />
          <ProdutosTabela {...listaProps} />
        </>
      )}
    </div>
  )
}
