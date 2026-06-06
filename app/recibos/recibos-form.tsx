"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Printer, Trash2 } from "lucide-react"
import { salvarRecibo, deleteRecibo } from "@/app/actions/recibos"
import type { ClubConfig } from "@/lib/config"

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
}

interface ReciboData {
  numero: string
  aluno: string
  responsavel: string
  referencia: string
  valor: string
  forma: string
  dataPagamento: string
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
  })

  const [salvando, setSalvando] = useState(false)
  const [searchRecibo, setSearchRecibo] = useState("")
  const router = useRouter()

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleImprimir() {
    setSalvando(true)
    try {
      const { numero } = await salvarRecibo({
        alunoNome: form.aluno,
        responsavel: form.responsavel,
        mesReferencia: form.referencia,
        valor: parseFloat(form.valor) || 0,
        formaPagamento: form.forma,
        dataPagamento: form.dataPagamento,
      })
      setForm((prev) => ({ ...prev, numero }))
      window.print()
    } finally {
      setSalvando(false)
    }
  }

  const valorFormatado = form.valor
    ? parseFloat(form.valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "R$ 0,00"

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

      <div className="flex flex-col gap-6 p-6 no-print">
        <PageHeader
          title="Recibos"
          description="Geração e impressão de recibos de pagamento"
          action={
            <Button
              onClick={handleImprimir}
              disabled={salvando}
              className="flex items-center gap-2"
            >
              <Printer className="size-4" />
              {salvando ? "Salvando..." : "Imprimir PDF"}
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
                <label htmlFor="numero" className="text-sm font-medium">Número</label>
                <input
                  id="numero"
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="referencia" className="text-sm font-medium">Referência</label>
                <input
                  id="referencia"
                  name="referencia"
                  placeholder="Ex: Abril/2025"
                  value={form.referencia}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="aluno" className="text-sm font-medium">Aluno</label>
                <input
                  id="aluno"
                  name="aluno"
                  value={form.aluno}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="responsavel" className="text-sm font-medium">Responsável</label>
                <input
                  id="responsavel"
                  name="responsavel"
                  value={form.responsavel}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="valor" className="text-sm font-medium">Valor (R$)</label>
                <input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="forma" className="text-sm font-medium">Forma de Pagamento</label>
                <select
                  id="forma"
                  name="forma"
                  value={form.forma}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                >
                  <option>PIX</option>
                  <option>Dinheiro</option>
                  <option>Transferência</option>
                  <option>Cartão</option>
                  <option>Boleto</option>
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor="dataPagamento" className="text-sm font-medium">Data do Pagamento</label>
                <input
                  id="dataPagamento"
                  name="dataPagamento"
                  type="date"
                  value={form.dataPagamento}
                  onChange={handleChange}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
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
          <div className="divide-y divide-border">
            <ReceiptRow label="Aluno" value={form.aluno || "—"} />
            <ReceiptRow label="Responsável" value={form.responsavel || "—"} />
            <ReceiptRow label="Referência" value={form.referencia || "—"} />
            <ReceiptRow label="Valor" value={valorFormatado} highlight />
            <ReceiptRow label="Forma de Pagamento" value={form.forma} />
            <ReceiptRow label="Data do Pagamento" value={dataFormatada || "—"} />
          </div>

          {/* Signature lines */}
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
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-brand-50"}>
                    <td className="px-4 py-3 font-bold text-brand-800">#{r.numero}</td>
                    <td className="px-4 py-3 font-medium">{r.alunoNome}</td>
                    <td className="px-4 py-3">{r.mesReferencia}</td>
                    <td className="px-4 py-3 text-right">{r.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
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
                            })
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                          className="text-xs text-brand-800 hover:underline font-medium"
                        >
                          Re-imprimir
                        </button>
                        <ConfirmDialog title="Excluir recibo?" description={`Excluir recibo #${r.numero}?`} confirmLabel="Excluir" onConfirm={async () => { await deleteRecibo(r.id); router.refresh() }}>
                          <button className="text-danger-600 hover:text-danger-600" title="Excluir recibo">
                            <Trash2 className="size-3.5" />
                          </button>
                        </ConfirmDialog>
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
