"use client"

import { PageHeader } from "@/components/layout/page-header"

import { PAGINA_ADMIN } from "@/components/layout/pagina"

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
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Produtos"
        description="Uniformes e acessórios vendidos pelo clube, com preço e estoque."
        action={
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" /> Novo produto
          </Button>
        }
      />

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
