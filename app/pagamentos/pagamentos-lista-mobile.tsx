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
import { deletePagamento } from "@/app/actions/pagamentos"
import { CobrancaBadge } from "./cobranca-badge"
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog"
import { getPagamentoStatus, linkCobrancaWhatsApp, urlReciboPago, type Pagamento } from "./pagamentos-utils"

export type ListaPagamentosProps = {
  pagamentos: Pagamento[]
  selected: Set<number>
  onToggle: (id: number) => void
  chavePix?: string
  nomeClube?: string
  cidade?: string
}

export function PagamentosListaMobile({ pagamentos, selected, onToggle, chavePix, nomeClube, cidade }: ListaPagamentosProps) {
  const router = useRouter()

  return (
    <div data-slot="payment-mobile-list" className={pagamentos.length === 0 ? "hidden" : "grid gap-3 md:hidden"}>
      {pagamentos.map((p) => {
        const status = getPagamentoStatus(p)
        return (
          <article key={p.id} className={selected.has(p.id) ? "rounded-[var(--radius-card)] border border-brand-300 bg-brand-50 p-4 shadow-sm" : "rounded-[var(--radius-card)] border bg-card p-4 shadow-sm"}>
            <div className="flex items-start gap-3">
              {status !== "Pago" ? (
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => onToggle(p.id)}
                  aria-label={`Selecionar pagamento de ${p.aluno.nome}`}
                  className="mt-1 size-4 cursor-pointer"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <Link href={`/alunos/${p.aluno.id}`} className="block truncate font-semibold text-brand-800 hover:underline">
                  {p.aluno.nome}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.aluno.turma} · {p.mesReferencia}</p>
              </div>
              <StatusBadge status={status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Vencimento</dt>
                <dd data-numeric className="mt-0.5 font-semibold">{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-muted-foreground">Valor</dt>
                <dd data-numeric className="mt-0.5 font-bold">{formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}</dd>
              </div>
              {p.dataPagamento ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Pagamento</dt>
                  <dd data-numeric className="mt-0.5 font-semibold">{format(new Date(p.dataPagamento), "dd/MM/yyyy")}</dd>
                </div>
              ) : null}
              {p.externalId ? (
                <div className={p.dataPagamento ? "text-right" : "col-span-2"}>
                  <dt className="text-xs text-muted-foreground">Cobrança</dt>
                  <dd className="mt-1">
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
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {status !== "Pago" ? <RegistrarPagamentoDialog pagamento={p} /> : null}
              {status !== "Pago" && !p.externalId ? (
                <CobrancaDialog pagamentoId={p.id} alunoNome={p.aluno.nome} mesReferencia={p.mesReferencia}>
                  <Button variant="outline" size="sm"><QrCode className="size-3.5" /> Gerar cobrança</Button>
                </CobrancaDialog>
              ) : null}
              {status !== "Pago" && chavePix && nomeClube && cidade ? (
                <PixButton
                  chave={chavePix}
                  nomeClube={nomeClube}
                  cidade={cidade}
                  valor={p.aluno.mensalidade}
                  descricao={`Mensalidade ${p.mesReferencia} ${p.aluno.nome.split(" ")[0]}`}
                  telefoneResponsavel={p.aluno.telefone}
                  nomeResponsavel={p.aluno.nome}
                />
              ) : null}
              {status !== "Pago" && p.aluno.telefone ? (
                <a
                  href={linkCobrancaWhatsApp(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-success-600/25 px-3 text-xs font-semibold text-success-600"
                >
                  <MessageCircle className="size-3.5" aria-hidden /> Cobrar
                </a>
              ) : null}
              {status === "Pago" ? (
                <a
                  href={urlReciboPago(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 text-xs font-semibold text-muted-foreground"
                >
                  <Receipt className="size-3.5" aria-hidden /> Recibo
                </a>
              ) : null}
              {status !== "Pago" ? (
                <ConfirmDialog title="Excluir pagamento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={async () => { await deletePagamento(p.id); router.refresh() }}>
                  <Button variant="ghost" size="icon-lg" className="ml-auto" aria-label={`Excluir pagamento de ${p.aluno.nome}`}>
                    <Trash2Icon className="size-4 text-danger-600" />
                  </Button>
                </ConfirmDialog>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )
}
