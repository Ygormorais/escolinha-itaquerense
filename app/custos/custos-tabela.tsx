"use client"

import { format } from "date-fns"
import { CheckIcon, PencilIcon, ReceiptText, SearchX, Trash2Icon } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CustoFormDialog } from "./custo-form-dialog"
import type { ListaCustosProps } from "./custos-lista-mobile"

export function CustosTabela({ totalRegistros, custos, busca, onDelete }: ListaCustosProps) {
  return (
    <div className="hidden rounded-xl border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Fornecedor</TableHead>
            <TableHead>Forma Pgto</TableHead>
            <TableHead>Comp.</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {totalRegistros === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                  <ReceiptText className="size-10 opacity-30" />
                  <p className="text-sm">Nenhum custo registrado neste mês.</p>
                  <p className="text-xs">Use <strong className="text-foreground">Novo custo</strong> ou <strong className="text-foreground">Gerar recorrentes</strong> para começar.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {totalRegistros > 0 && custos.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <SearchX className="size-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum custo encontrado para &ldquo;{busca}&rdquo;.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {custos.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{format(new Date(c.data), "dd/MM/yyyy")}</TableCell>
              <TableCell>{c.categoria}</TableCell>
              <TableCell>{c.descricao || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{c.fornecedor || "—"}</TableCell>
              <TableCell>{c.formaPagamento}</TableCell>
              <TableCell>
                {c.comprovante && <CheckIcon className="size-4 text-success-600" />}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMoney(c.valor)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <CustoFormDialog
                    custo={c}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Editar custo">
                        <PencilIcon className="size-3.5" />
                      </Button>
                    }
                  />
                  <ConfirmDialog title="Excluir custo?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => onDelete(c.id)}>
                    <Button variant="ghost" size="icon-sm" aria-label="Excluir custo">
                      <Trash2Icon className="size-3.5 text-danger-600" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
