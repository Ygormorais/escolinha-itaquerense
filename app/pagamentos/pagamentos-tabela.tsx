"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { MessageCircle, QrCode, Receipt, Trash2Icon } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PixButton } from "@/components/ui/pix-modal"
import { CobrancaDialog } from "@/components/ui/cobranca-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { deletePagamento } from "@/app/actions/pagamentos"
import { CobrancaBadge } from "./cobranca-badge"
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog"
import type { ListaPagamentosProps } from "./pagamentos-lista-mobile"
import { getPagamentoStatus, linkCobrancaWhatsApp, urlReciboPago } from "./pagamentos-utils"

export function PagamentosTabela({
  pagamentos,
  selected,
  onToggle,
  allSelected,
  onToggleAll,
  chavePix,
  nomeClube,
  cidade,
}: ListaPagamentosProps & { allSelected: boolean; onToggleAll: () => void }) {
  const router = useRouter()

  return (
    <div data-slot="payment-table" className="hidden overflow-x-auto rounded-[var(--radius-card)] border bg-card shadow-sm md:block">
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="cursor-pointer"
                aria-label="Selecionar todos pendentes"
              />
            </TableHead>
            <TableHead>Aluno</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cobrança</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-28 text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentos.map((p) => {
            const status = getPagamentoStatus(p)
            return (
              <TableRow
                key={p.id}
                className={
                  selected.has(p.id)
                    ? "bg-brand-50 dark:bg-brand-950/30"
                    : "hover:bg-muted/40 transition-colors"
                }
              >
                <TableCell>
                  {status !== "Pago" && (
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => onToggle(p.id)}
                      aria-label={`Selecionar pagamento de ${p.aluno.nome}`}
                      className="cursor-pointer"
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                </TableCell>
                <TableCell>{p.aluno.turma}</TableCell>
                <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                <TableCell><StatusBadge status={status} /></TableCell>
                <TableCell>
                  {p.externalId ? (
                    <CobrancaDialog
                      pagamentoId={p.id}
                      alunoNome={p.aluno.nome}
                      mesReferencia={p.mesReferencia}
                      pixCopiaECola={p.pixCopiaECola}
                      linhaDigitavel={p.linhaDigitavel}
                      externalUrl={p.externalUrl}
                      canalPrevisto={p.canalPrevisto}
                    >
                      <CobrancaBadge status={p.statusCobranca} />
                    </CobrancaDialog>
                  ) : !p.dataPagamento ? (
                    <CobrancaDialog
                      pagamentoId={p.id}
                      alunoNome={p.aluno.nome}
                      mesReferencia={p.mesReferencia}
                    >
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                        <QrCode className="size-3" /> Gerar
                      </Button>
                    </CobrancaDialog>
                  ) : null}
                </TableCell>
                <TableCell>
                  {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "-"}
                </TableCell>
                <TableCell data-numeric className="text-right font-semibold">
                  {formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {status !== "Pago" && <RegistrarPagamentoDialog pagamento={p} />}
                    {status !== "Pago" && chavePix && nomeClube && cidade && (
                      <PixButton
                        chave={chavePix}
                        nomeClube={nomeClube}
                        cidade={cidade}
                        valor={p.aluno.mensalidade}
                        descricao={`Mensalidade ${p.mesReferencia} ${p.aluno.nome.split(" ")[0]}`}
                        telefoneResponsavel={p.aluno.telefone}
                        nomeResponsavel={p.aluno.nome}
                      />
                    )}
                    {status !== "Pago" && p.aluno.telefone && (
                      <a
                        href={linkCobrancaWhatsApp(p)}
                        target="_blank" rel="noopener noreferrer"
                        aria-label="Cobrar via WhatsApp"
                        className="inline-flex items-center justify-center size-7 rounded-md text-success-600 hover:bg-success-50 transition-colors"
                      >
                        <MessageCircle className="size-3.5" />
                      </a>
                    )}
                    {status === "Pago" && (
                      <a
                        href={urlReciboPago(p)}
                        target="_blank" rel="noopener noreferrer"
                        aria-label="Imprimir recibo"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Receipt className="size-3" />
                        Recibo
                      </a>
                    )}
                    {status !== "Pago" && (
                      <ConfirmDialog title="Excluir pagamento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={async () => { await deletePagamento(p.id); router.refresh() }}>
                        <Button variant="ghost" size="icon-sm" aria-label="Excluir pagamento">
                          <Trash2Icon className="size-3.5 text-danger-600" />
                        </Button>
                      </ConfirmDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
