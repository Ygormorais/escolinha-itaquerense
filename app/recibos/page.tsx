"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer } from "lucide-react"

interface ReciboData {
  numero: string
  aluno: string
  responsavel: string
  referencia: string
  valor: string
  forma: string
  dataPagamento: string
}

function RecibosForm() {
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePrint() {
    window.print()
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
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="size-4" />
              Imprimir Recibo
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
              <h2 className="text-xl font-bold">E.C. Itaquerense</h2>
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
          Rua das Palmeiras, 123 — Vila Futebol — São Paulo/SP
        </div>
      </div>
    </>
  )
}

export default function RecibosPage() {
  return (
    <Suspense fallback={null}>
      <RecibosForm />
    </Suspense>
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
