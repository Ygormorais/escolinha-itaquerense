"use client"

import { format } from "date-fns"
import { CheckIcon, PencilIcon, ReceiptText, SearchX, Trash2Icon } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CustoFormDialog } from "./custo-form-dialog"
import type { Custo } from "./custos-utils"

export type ListaCustosProps = {
  /** Todos os custos do mês, para distinguir "mês vazio" de "busca sem resultado". */
  totalRegistros: number
  custos: Custo[]
  busca: string
  onDelete: (id: number) => void
}

export function CustosListaMobile({ totalRegistros, custos, busca, onDelete }: ListaCustosProps) {
  return (
    <div className="grid gap-3 md:hidden" data-slot="costs-mobile-list">
      {totalRegistros === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-12 text-center text-muted-foreground">
          <ReceiptText className="size-10 opacity-30" />
          <p className="text-sm">Nenhum custo registrado neste mês.</p>
        </div>
      ) : custos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-10 text-center">
          <SearchX className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum lançamento atende à busca &ldquo;{busca}&rdquo;.</p>
        </div>
      ) : custos.map((c) => (
        <article key={c.id} className="rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{c.descricao || c.categoria}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.categoria} · {format(new Date(c.data), "dd/MM/yyyy")}</p>
            </div>
            <p data-numeric className="shrink-0 text-lg font-bold">{formatMoney(c.valor)}</p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Fornecedor</dt>
              <dd className="mt-1 truncate font-medium">{c.fornecedor || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Pagamento</dt>
              <dd className="mt-1 flex items-center gap-1 font-medium">{c.formaPagamento}{c.comprovante && <CheckIcon className="size-3.5 text-success-600" aria-label="Com comprovante" />}</dd>
            </div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
            <CustoFormDialog custo={c} trigger={<Button variant="outline" className="w-full"><PencilIcon className="size-4" />Editar</Button>} />
            <ConfirmDialog title="Excluir custo?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => onDelete(c.id)}>
              <Button variant="ghost" className="w-full"><Trash2Icon className="size-4 text-danger-600" />Excluir</Button>
            </ConfirmDialog>
          </div>
        </article>
      ))}
    </div>
  )
}
