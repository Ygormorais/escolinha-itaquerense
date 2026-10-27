"use client"

import Image from "next/image"
import { Pencil, ShoppingBag, Trash2 } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AjustarEstoqueDialog } from "./ajustar-estoque-dialog"
import { rotuloCategoria, type Produto } from "./produtos-utils"

export type ListaProdutosProps = {
  produtos: Produto[]
  onEditar: (produto: Produto) => void
  onRemover: (id: number) => void
  onEstoqueAjustado: () => void
}

export function ProdutosListaMobile({ produtos, onEditar, onRemover, onEstoqueAjustado }: ListaProdutosProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {produtos.map((p) => (
        <article key={p.id} className="rounded-xl border bg-card p-4">
          <div className="flex gap-3">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {p.imagem
                ? <Image src={p.imagem} alt={p.nome} width={56} height={56} unoptimized className="size-full object-cover" />
                : <ShoppingBag className="size-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <h3 aria-label={p.nome} data-name={p.nome} className="truncate font-semibold before:content-[attr(data-name)]" />
                <strong>{formatMoney(p.preco)}</strong>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rotuloCategoria(p.categoria)} · Estoque: {p.estoque}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
                <AjustarEstoqueDialog produto={p} onDone={onEstoqueAjustado} />
                <Button variant="outline" size="sm" onClick={() => onEditar(p)} aria-label="Editar produto"><Pencil className="size-4" /></Button>
                <ConfirmDialog title="Remover produto?" description={`Remover "${p.nome}" permanentemente?`} confirmLabel="Remover" onConfirm={() => onRemover(p.id)}>
                  <Button variant="ghost" size="sm" className="text-destructive" aria-label="Remover produto"><Trash2 className="size-4" /></Button>
                </ConfirmDialog>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
