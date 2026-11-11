"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, MessageCircle, Printer, QrCode, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { CobrancaDialog } from "@/components/ui/cobranca-dialog"
import { deletePagamento, registrarBaixa } from "@/app/actions/pagamentos"
import { cn, formatMoney } from "@/lib/utils"
import { FORMAS_PAGAMENTO, urlImpressaoRecibo } from "./pagamentos-utils"
import { CobrancaBadge } from "./cobranca-badge"

export type MensalidadeDoPainel = {
  id: number
  mesReferencia: string
  vencimento: string
  restante: number
  situacao: "atrasada" | "parcial" | "a_vencer"
  externalId: string | null
  statusCobranca: string | null
  canalPrevisto: string | null
  pixCopiaECola: string | null
  linhaDigitavel: string | null
  externalUrl: string | null
}

type ReciboEmitido = { mesReferencia: string; valor: number; numero: string; codigoVerificacao: string }

const ROTULO_SITUACAO: Record<MensalidadeDoPainel["situacao"], string> = {
  atrasada: "atrasada",
  parcial: "paga em parte",
  a_vencer: "a vencer",
}

function linkWhatsApp(telefone: string, aluno: string, m: MensalidadeDoPainel) {
  const fone = telefone.replace(/\D/g, "")
  const valor = m.restante.toFixed(2).replace(".", ",")
  const msg = `Olá! 👋 A mensalidade de *${aluno}* referente a *${m.mesReferencia}* está em aberto.\n\nValor: *R$ ${valor}*\n\nObrigado! ⚽`
  return `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`
}

export function BaixaForm({
  aluno,
  mensalidades,
}: {
  aluno: { id: number; nome: string; telefone: string }
  mensalidades: MensalidadeDoPainel[]
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()
  const [marcadas, setMarcadas] = useState<Set<number>>(() => new Set(mensalidades.slice(0, 1).map((m) => m.id)))
  const [forma, setForma] = useState("PIX")
  const [data, setData] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [alterar, setAlterar] = useState(false)
  const [valor, setValor] = useState("")
  const [motivo, setMotivo] = useState("")
  const [emitidos, setEmitidos] = useState<ReciboEmitido[]>([])

  const selecionadas = mensalidades.filter((m) => marcadas.has(m.id))
  const total = selecionadas.reduce((soma, m) => soma + m.restante, 0)
  const podeAlterar = selecionadas.length === 1
  const alterando = alterar && podeAlterar
  const valorNumero = Number(valor.replace(",", "."))
  const valorOk = !alterando || (Number.isFinite(valorNumero) && valorNumero > 0 && motivo.trim().length > 0)
  const podeConfirmar = selecionadas.length > 0 && valorOk && !pendente

  function alternar(id: number) {
    setMarcadas((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
    setAlterar(false)
  }

  function confirmar() {
    iniciar(async () => {
      const novos: ReciboEmitido[] = []
      for (const m of selecionadas) {
        try {
          const resultado = await registrarBaixa(m.id, {
            valor: alterando ? valorNumero : m.restante,
            formaPagamento: forma,
            dataPagamento: data,
            observacao: alterando ? motivo.trim() : undefined,
          })
          if ("error" in resultado) {
            toast.error(`${m.mesReferencia}: ${resultado.error}`)
            break
          }
          if (resultado.recibo) {
            novos.push({
              mesReferencia: m.mesReferencia,
              valor: alterando ? valorNumero : m.restante,
              numero: resultado.recibo.numero,
              codigoVerificacao: resultado.recibo.codigoVerificacao,
            })
          }
        } catch {
          toast.error("Erro ao registrar a baixa")
          break
        }
      }
      if (novos.length > 0) {
        setEmitidos(novos)
        setAlterar(false)
        setValor("")
        setMotivo("")
        setMarcadas(new Set())
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {mensalidades.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mensalidade em aberto.</p>
      ) : (
        <ul className="divide-y divide-border rounded-[var(--radius-control)] border border-border">
          {mensalidades.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={marcadas.has(m.id)}
                  onChange={() => alternar(m.id)}
                  aria-label={`Mensalidade ${m.mesReferencia}`}
                  className="size-4 shrink-0 accent-foreground"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{m.mesReferencia}</span>
                  <span className="block text-xs text-muted-foreground">
                    vence {format(new Date(m.vencimento), "dd/MM/yyyy")} ·{" "}
                    <span className={cn(m.situacao === "atrasada" && "font-semibold text-danger-600")}>{ROTULO_SITUACAO[m.situacao]}</span>
                  </span>
                </span>
              </label>
              <span className="text-sm font-semibold" data-numeric>{formatMoney(m.restante)}</span>
              <span className="flex items-center gap-1">
                {m.externalId ? (
                  <CobrancaDialog
                    pagamentoId={m.id}
                    alunoNome={aluno.nome}
                    mesReferencia={m.mesReferencia}
                    pixCopiaECola={m.pixCopiaECola}
                    linhaDigitavel={m.linhaDigitavel}
                    externalUrl={m.externalUrl}
                    canalPrevisto={m.canalPrevisto}
                  >
                    <CobrancaBadge status={m.statusCobranca} />
                  </CobrancaDialog>
                ) : (
                  <CobrancaDialog pagamentoId={m.id} alunoNome={aluno.nome} mesReferencia={m.mesReferencia}>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                      <QrCode className="size-3" /> Gerar cobrança
                    </Button>
                  </CobrancaDialog>
                )}
                {aluno.telefone && (
                  <a
                    href={linkWhatsApp(aluno.telefone, aluno.nome, m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Cobrar ${m.mesReferencia} no WhatsApp`}
                    className="inline-flex size-9 items-center justify-center rounded-md text-success-600 transition-colors hover:bg-success-50 md:size-7"
                  >
                    <MessageCircle className="size-3.5" />
                  </a>
                )}
                <ConfirmDialog
                  title="Excluir mensalidade?"
                  description="Esta ação não pode ser desfeita."
                  confirmLabel="Excluir"
                  onConfirm={async () => {
                    try {
                      const r = await deletePagamento(m.id)
                      if ("error" in r) {
                        toast.error(r.error)
                        return
                      }
                      router.refresh()
                    } catch {
                      toast.error("Erro ao excluir mensalidade")
                    }
                  }}
                >
                  <Button variant="ghost" size="icon-sm" aria-label={`Excluir mensalidade ${m.mesReferencia}`}>
                    <Trash2Icon className="size-3.5 text-danger-600" />
                  </Button>
                </ConfirmDialog>
              </span>
            </li>
          ))}
        </ul>
      )}

      {mensalidades.length > 0 && (
        <div className="space-y-3 rounded-[var(--radius-control)] border border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="baixa-forma" className="text-sm font-medium">Forma de pagamento</label>
              <select
                id="baixa-forma"
                value={forma}
                onChange={(e) => setForma(e.target.value)}
                className="h-11 w-full rounded-[var(--radius-control)] border border-input bg-white px-3 text-sm"
              >
                {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="baixa-data" className="text-sm font-medium">Data do pagamento</label>
              <Input id="baixa-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
          </div>

          {alterando && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="baixa-valor" className="text-sm font-medium">Valor recebido</label>
                <Input id="baixa-valor" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label htmlFor="baixa-motivo" className="text-sm font-medium">Motivo</label>
                <Input id="baixa-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: pagou metade" />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" data-numeric>
              {selecionadas.length} {selecionadas.length === 1 ? "mensalidade" : "mensalidades"} ·{" "}
              <strong>{formatMoney(alterando && Number.isFinite(valorNumero) ? valorNumero : total)}</strong>
            </p>
            <div className="flex gap-2">
              {podeAlterar && !alterar && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => { setAlterar(true); setValor(String(selecionadas[0].restante)) }}
                >
                  Alterar valor
                </Button>
              )}
              {alterando && (
                <Button variant="ghost" type="button" onClick={() => setAlterar(false)}>Valor cheio</Button>
              )}
              <Button type="button" onClick={confirmar} disabled={!podeConfirmar} className="bg-brand-800 text-white hover:bg-brand-900">
                {pendente ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Dar baixa"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {emitidos.length > 0 && (
        <div role="status" className="space-y-2 rounded-[var(--radius-control)] border border-success-600/30 bg-success-50 p-3">
          <p className="text-sm font-semibold text-success-600">Baixa registrada</p>
          <ul className="space-y-1">
            {emitidos.map((r) => (
              <li key={r.numero} className="flex items-center justify-between gap-2 text-sm">
                <span>Recibo {r.numero} · {r.mesReferencia} · {formatMoney(r.valor)}</span>
                <a
                  href={urlImpressaoRecibo({ aluno: aluno.nome, referencia: r.mesReferencia, valor: String(r.valor), forma, data }, r)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-900"
                >
                  <Printer className="size-4" />
                  Imprimir PDF
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
