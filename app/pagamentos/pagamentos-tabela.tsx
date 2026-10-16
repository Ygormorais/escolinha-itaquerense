"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { MessageCircle, QrCode, Receipt, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PixButton } from "@/components/ui/pix-modal"
import { CobrancaDialog } from "@/components/ui/cobranca-dialog"
import { DataTable, type DataTableColumn } from "@/components/ui/data-table"
import { deletePagamento } from "@/app/actions/pagamentos"
import { CobrancaBadge } from "./cobranca-badge"
import { RegistrarPagamentoDialog } from "./registrar-pagamento-dialog"
import { getPagamentoStatus, linkCobrancaWhatsApp, urlReciboPago, type Pagamento } from "./pagamentos-utils"

const columns: DataTableColumn<Pagamento>[] = [
  {
    id: "aluno",
    header: "Aluno",
    cell: (p) => (
      <Link href={`/alunos/${p.aluno.id}`} className="font-medium text-brand-800 hover:underline">
        {p.aluno.nome}
      </Link>
    ),
  },
  {
    id: "turma",
    header: "Turma",
    cell: (p) => p.aluno.turma,
  },
  {
    id: "vencimento",
    header: "Vencimento",
    cell: (p) => format(new Date(p.dataVencimento), "dd/MM/yyyy"),
  },
  {
    id: "status",
    header: "Status",
    cell: (p) => <StatusBadge status={getPagamentoStatus(p)} />,
  },
  {
    id: "cobranca",
    header: "Cobrança",
    mobileLabel: "Cobrança",
    cell: (p) =>
      p.externalId ? (
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
        <CobrancaDialog pagamentoId={p.id} alunoNome={p.aluno.nome} mesReferencia={p.mesReferencia}>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
            <QrCode className="size-3" /> Gerar
          </Button>
        </CobrancaDialog>
      ) : (
        "-"
      ),
  },
  {
    id: "pagamento",
    header: "Pagamento",
    cell: (p) => (p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "-"),
  },
  {
    id: "valor",
    header: "Valor",
    className: "text-right",
    cell: (p) => (
      <span data-numeric className="font-semibold">
        {formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}
      </span>
    ),
  },
]

export function PagamentosTabela({
  pagamentos,
  selected,
  onSelectionChange,
  emptyTitle,
  chavePix,
  nomeClube,
  cidade,
}: {
  pagamentos: Pagamento[]
  selected: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  emptyTitle: string
  chavePix?: string
  nomeClube?: string
  cidade?: string
}) {
  const router = useRouter()

  function rowActions(p: Pagamento) {
    const status = getPagamentoStatus(p)
    return (
      <>
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
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Cobrar via WhatsApp"
            className="inline-flex items-center justify-center size-9 rounded-md text-success-600 hover:bg-success-50 transition-colors md:size-7"
          >
            <MessageCircle className="size-3.5" />
          </a>
        )}
        {status === "Pago" && (
          <a
            href={urlReciboPago(p)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Imprimir recibo"
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Receipt className="size-3" />
            Recibo
          </a>
        )}
        {status !== "Pago" && (
          <ConfirmDialog title="Excluir pagamento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={async () => {
            try {
              const result = await deletePagamento(p.id)
              if ("error" in result) {
                toast.error(result.error)
                return
              }
              router.refresh()
            } catch {
              toast.error("Erro ao excluir pagamento")
            }
          }}>
            <Button variant="ghost" size="icon-sm" aria-label="Excluir pagamento">
              <Trash2Icon className="size-3.5 text-danger-600" />
            </Button>
          </ConfirmDialog>
        )}
      </>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={pagamentos}
      getRowId={(p) => String(p.id)}
      selectable
      selectedIds={selected}
      onSelectionChange={onSelectionChange}
      isRowSelectable={(p) => getPagamentoStatus(p) !== "Pago"}
      getRowLabel={(p) => `${p.aluno.nome} — ${p.mesReferencia}`}
      rowActions={rowActions}
      emptyState={{ title: emptyTitle }}
    />
  )
}
