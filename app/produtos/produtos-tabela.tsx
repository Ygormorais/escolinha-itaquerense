"use client"

import Image from "next/image"
import { CheckCircle, Pencil, ShoppingBag, Trash2, XCircle } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AjustarEstoqueDialog } from "./ajustar-estoque-dialog"
import type { ListaProdutosProps } from "./produtos-lista-mobile"
import { rotuloCategoria } from "./produtos-utils"

export function ProdutosTabela({ produtos, onEditar, onRemover, onEstoqueAjustado }: ListaProdutosProps) {
  return (
    <div className="hidden md:block"><Table>
      <TableHeader>
        <TableRow>
          <TableHead>Preview</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Preço</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Estoque</TableHead>
          <TableHead>Tamanhos</TableHead>
          <TableHead>Ativo</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {produtos.map((p) => (
          <TableRow key={p.id}>
            <TableCell>
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {p.imagem ? (
                  <Image
                    src={p.imagem}
                    alt={p.nome}
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="size-5 text-muted-foreground" />
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">{p.nome}</TableCell>
            <TableCell>{formatMoney(p.preco)}</TableCell>
            <TableCell>
              <Badge variant="secondary">
                {rotuloCategoria(p.categoria)}
              </Badge>
            </TableCell>
            <TableCell>
              {p.estoque > 0 ? (
                <Badge variant="default" className="bg-success-600">{p.estoque}</Badge>
              ) : (
                <Badge variant="outline" className="text-danger-600">0</Badge>
              )}
            </TableCell>
            <TableCell>{p.tamanhos ?? "—"}</TableCell>
            <TableCell>
              {p.ativo ? (
                <Badge
                  variant="default"
                  className="gap-1 bg-success-600 text-white"
                >
                  <CheckCircle className="size-3" /> Sim
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="size-3" /> Não
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <AjustarEstoqueDialog produto={p} onDone={onEstoqueAjustado} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditar(p)}
                  aria-label="Editar produto"
                >
                  <Pencil className="size-4" />
                </Button>
                <ConfirmDialog title="Remover produto?" description={`Remover "${p.nome}" permanentemente?`} confirmLabel="Remover" onConfirm={() => onRemover(p.id)}>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Remover produto">
                    <Trash2 className="size-4" />
                  </Button>
                </ConfirmDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table></div>
  )
}
