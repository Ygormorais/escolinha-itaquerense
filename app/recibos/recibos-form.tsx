"use client"

import { useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Printer, Ban, Loader2, ShieldCheck, ExternalLink } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { salvarRecibo, cancelarRecibo } from "@/app/actions/recibos"
import type { ClubConfig } from "@/lib/config"
import { formatMoney } from "@/lib/utils"

type Recibo = {
  id: number
  numero: string
  alunoNome: string
  responsavel: string
  mesReferencia: string
  valor: number
  formaPagamento: string
  dataPagamento: Date
  createdAt: Date
  codigoVerificacao: string | null
  canceladoAt: Date | null
}

interface ReciboData {
  numero: string
  aluno: string
  responsavel: string
  referencia: string
  valor: string
  forma: string
  dataPagamento: string
  codigoVerificacao: string
}

export default function RecibosForm({ recibos, config }: { recibos: Recibo[]; config: ClubConfig }) {
  const searchParams = useSearchParams()
  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState<ReciboData>({
    numero: "001",
    aluno: searchParams.get("aluno") ?? "",
    responsavel: searchParams.get("responsavel") ?? "",
    referencia: searchParams.get("referencia") ?? "",
    valor: searchParams.get("valor") ?? "",
    forma: searchParams.get("forma") ?? "PIX",
    dataPagamento: searchParams.get("data") ?? today,
    codigoVerificacao: "",
  })

  const [salvando, startSalvando] = useTransition()
  const [searchRecibo, setSearchRecibo] = useState("")
  const router = useRouter()
  const origin = typeof window === "undefined" ? "" : window.location.origin

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImprimir() {
    startSalvando(async () => {
      try {
        const result = await salvarRecibo({
          alunoNome: form.aluno,
          responsavel: form.responsavel,
          mesReferencia: form.referencia,
          valor: parseFloat(form.valor) || 0,
          formaPagamento: form.forma,
          dataPagamento: form.dataPagamento,
        })
        if ("error" in result) { toast.error(result.error); return }
        const { numero, codigoVerificacao } = result
        setForm((prev) => ({ ...prev, numero, codigoVerificacao }))
        toast.success("Recibo emitido e registrado")
        setTimeout(() => window.print(), 100)
      } catch {
        toast.error("Erro ao salvar recibo")
      }
    })
  }

  const valorFormatado = form.valor ? formatMoney(parseFloat(form.valor)) : "R$ 0,00"

  const dataFormatada = form.dataPagamento
    ? new Date(form.dataPagamento + "T12:00:00").toLocaleDateString("pt-BR")
    : ""

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #recibo-print, #recibo-print * { visibility: visible; }
          #recibo-print { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 no-print dark:bg-transparent">
        <PageHeader
          title="Recibos"
          description="Emissão de recibos numerados, verificáveis e auditáveis"
          action={
            <Button
              onClick={handleImprimir}
              disabled={salvando}
              className="flex items-center gap-2"
            >
              <Printer className="size-4" />
              {salvando ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Imprimir PDF"}
            </Button>
          }
        />

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Dados do Recibo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="flex flex-col gap-1">
                <Label htmlFor="rec-numero">Número</Label>
                <Input id="rec-numero" name="numero" value={form.numero} readOnly aria-describedby="numero-ajuda" />
                <span id="numero-ajuda" className="text-xs text-muted-foreground">Gerado automaticamente na emissão.</span>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rec-referencia">Referência</Label>
                <Input id="rec-referencia" name="referencia" placeholder="Ex: Abril/2025" value={form.referencia} onChange={handleChange} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-aluno">Aluno</Label>
                <Input id="rec-aluno" name="aluno" value={form.aluno} onChange={handleChange} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-responsavel">Responsável</Label>
                <Input id="rec-responsavel" name="responsavel" value={form.responsavel} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rec-valor">Valor (R$)</Label>
                <Input id="rec-valor" name="valor" type="number" step="0.01" value={form.valor} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Forma de Pagamento</Label>
                <Select value={form.forma} onValueChange={(v) => { if (v) setForm((prev) => ({ ...prev, forma: v })) }}>
                  <SelectTrigger aria-label="Forma de Pagamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-data">Data do Pagamento</Label>
                <Input
                  id="rec-data"
                  name="dataPagamento"
                  type="date"
                  value={form.dataPagamento}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Printable Receipt */}
      <div id="recibo-print" className="mx-auto mt-8 w-full max-w-[680px] overflow-x-auto border border-border shadow-md print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-brand-800 px-8 py-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{config.nome}</h2>
              <p className="mt-0.5 text-sm text-white/80">
                Recibo de Pagamento — Escolinha de Futebol
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 uppercase tracking-wide">Recibo Nº</p>
              <p className="text-lg font-bold">{form.numero}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white px-8 py-6">
          <p className="mb-5 text-sm leading-6 text-foreground">
            Declaramos ter recebido de <strong>{form.responsavel || "—"}</strong> a quantia de <strong>{valorFormatado}</strong>, referente a <strong>{form.referencia || "—"}</strong> do aluno <strong>{form.aluno || "—"}</strong>, dando quitação exclusivamente ao pagamento descrito neste recibo.
          </p>
          <div className="divide-y divide-border">
            <ReceiptRow label="Aluno" value={form.aluno || "—"} />
            <ReceiptRow label="Responsável" value={form.responsavel || "—"} />
            <ReceiptRow label="Referência" value={form.referencia || "—"} />
            <ReceiptRow label="Valor" value={valorFormatado} highlight />
            <ReceiptRow label="Forma de Pagamento" value={form.forma} />
            <ReceiptRow label="Data do Pagamento" value={dataFormatada || "—"} />
          </div>

          <div className="mt-8 flex items-end justify-between gap-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold text-brand-900">
                <ShieldCheck className="size-4" /> Recibo verificável
              </div>
              {form.codigoVerificacao ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">Confira a autenticidade e o status pelo QR code.</p>
                  <p className="mt-2 break-all font-mono text-xs font-bold">Código: {form.codigoVerificacao}</p>
                </>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">O código de validação será criado ao emitir.</p>
              )}
            </div>
            {form.codigoVerificacao && origin ? (
              <QRCodeSVG value={`${origin}/validar-recibo/${form.codigoVerificacao}`} size={82} level="M" aria-label="QR code de validação do recibo" />
            ) : null}
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="w-full border-t border-foreground/40" />
              <p className="text-xs text-muted-foreground">Assinatura do Responsável</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-full border-t border-foreground/40" />
              <p className="text-xs text-muted-foreground">Assinatura do Clube</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-8 py-3 text-center text-xs text-muted-foreground">
          {config.endereco}{config.cidade ? ` — ${config.cidade}` : ""}{config.telefone ? ` · ${config.telefone}` : ""}
        </div>
      </div>

      {/* History section - hidden on print */}
      <div className="print:hidden mt-8 w-full max-w-4xl mx-auto px-6 pb-8 no-print">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold">Recibos Emitidos</h2>
          <Input
            placeholder="Buscar por aluno ou referência..."
            value={searchRecibo}
            onChange={(e) => setSearchRecibo(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {recibos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recibo emitido ainda.</p>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brand-800 text-white text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nº</th>
                  <th className="px-4 py-3 text-left">Aluno</th>
                  <th className="px-4 py-3 text-left">Referência</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-left">Forma</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recibos
                  .filter((r) => {
                    const q = searchRecibo.toLowerCase()
                    return !q || r.alunoNome.toLowerCase().includes(q) || r.mesReferencia.toLowerCase().includes(q)
                  })
                  .map((r, i) => (
                  <tr key={r.id} className={`${i % 2 === 0 ? "bg-white" : "bg-brand-50"} ${r.canceladoAt ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-bold text-brand-800">#{r.numero}{r.canceladoAt ? <span className="ml-2 rounded bg-danger-100 px-2 py-0.5 text-[10px] text-danger-700">CANCELADO</span> : null}</td>
                    <td className="px-4 py-3 font-medium">{r.alunoNome}</td>
                    <td className="px-4 py-3">{r.mesReferencia}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(r.valor)}</td>
                    <td className="px-4 py-3">{r.formaPagamento}</td>
                    <td className="px-4 py-3">{new Date(r.dataPagamento).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setForm({
                              numero: r.numero,
                              aluno: r.alunoNome,
                              responsavel: r.responsavel,
                              referencia: r.mesReferencia,
                              valor: String(r.valor),
                              forma: r.formaPagamento,
                              dataPagamento: new Date(r.dataPagamento).toISOString().slice(0, 10),
                              codigoVerificacao: r.codigoVerificacao ?? "",
                            })
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="text-xs text-brand-800 hover:underline font-medium"
                        >
                          Re-imprimir
                        </button>
                        {r.codigoVerificacao ? <a href={`/validar-recibo/${r.codigoVerificacao}`} target="_blank" rel="noreferrer" className="text-brand-800" aria-label="Validar recibo"><ExternalLink className="size-3.5" /></a> : null}
                        {!r.canceladoAt ? <ConfirmDialog title="Cancelar recibo?" description={`O recibo #${r.numero} continuará no histórico e aparecerá como cancelado.`} confirmLabel="Cancelar recibo" onConfirm={async () => { await cancelarRecibo(r.id); router.refresh() }}>
                          <button className="text-danger-600 hover:text-danger-700" aria-label="Cancelar recibo">
                            <Ban className="size-3.5" />
                          </button>
                        </ConfirmDialog> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function ReceiptRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          highlight
            ? "text-base font-bold text-brand-800"
            : "text-sm font-medium text-foreground"
        }
      >
        {value}
      </span>
    </div>
  )
}
