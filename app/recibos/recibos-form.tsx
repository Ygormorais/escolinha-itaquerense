"use client"

import { PAGINA_ADMIN } from "@/components/layout/pagina"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Printer, Ban, Loader2 } from "lucide-react"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { salvarRecibo, cancelarRecibo } from "@/app/actions/recibos"
import type { ClubConfig } from "@/lib/config"
import { formatMoney } from "@/lib/utils"
import { ReciboDocumento } from "@/components/recibos/recibo-documento"

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
  aluno: string
  responsavel: string
  referencia: string
  valor: string
  forma: string
  dataPagamento: string
}

/**
 * Emissão de recibo avulso e histórico. Cada recibo emitido tem a própria página
 * (/recibos/[id]), onde é conferido e impresso; esta tela não reimprime nada.
 */
export default function RecibosForm({ recibos, config }: { recibos: Recibo[]; config: ClubConfig }) {
  const searchParams = useSearchParams()
  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState<ReciboData>(() => ({
    aluno: searchParams.get("aluno") ?? "",
    responsavel: searchParams.get("responsavel") ?? "",
    referencia: searchParams.get("referencia") ?? "",
    valor: searchParams.get("valor") ?? "",
    forma: searchParams.get("forma") || "PIX",
    dataPagamento: searchParams.get("data") || today,
  }))

  const [salvando, startSalvando] = useTransition()
  const [searchRecibo, setSearchRecibo] = useState("")
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleEmitir() {
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
        toast.success(`Recibo Nº ${result.numero} emitido`)
        router.push(`/recibos/${result.id}?imprimir=1`)
      } catch {
        toast.error("Erro ao salvar recibo")
      }
    })
  }

  const dataFormatada = form.dataPagamento
    ? new Date(form.dataPagamento + "T12:00:00").toLocaleDateString("pt-BR")
    : ""

  const filtrados = recibos.filter((r) => {
    const q = searchRecibo.toLowerCase()
    return !q || r.alunoNome.toLowerCase().includes(q) || r.mesReferencia.toLowerCase().includes(q) || r.numero.toLowerCase().includes(q)
  })

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader title="Recibos" description="Emissão de recibos numerados, verificáveis e auditáveis" />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Novo recibo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-aluno">Aluno</Label>
                <Input id="rec-aluno" name="aluno" value={form.aluno} onChange={handleChange} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-responsavel">Responsável</Label>
                <Input id="rec-responsavel" name="responsavel" value={form.responsavel} onChange={handleChange} />
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <Label htmlFor="rec-referencia">Referência</Label>
                <Input id="rec-referencia" name="referencia" placeholder="Ex: Abril/2025" value={form.referencia} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="rec-valor">Valor (R$)</Label>
                <Input id="rec-valor" name="valor" type="number" step="0.01" value={form.valor} onChange={handleChange} />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Forma de Pagamento</Label>
                <Select value={form.forma} onValueChange={(v) => { if (v) setForm((prev) => ({ ...prev, forma: v })) }}>
                  <SelectTrigger aria-label="Forma de Pagamento" className="w-full">
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
                <Input id="rec-data" name="dataPagamento" type="date" value={form.dataPagamento} onChange={handleChange} />
              </div>
            </div>

            <Button onClick={handleEmitir} disabled={salvando} className="mt-6 w-full">
              {salvando ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              {salvando ? "Emitindo..." : "Emitir e imprimir"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">O número e o código de validação são gerados na emissão.</p>
          </CardContent>
        </Card>

        <section aria-label="Prévia do recibo" className="flex min-w-0 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prévia</p>
          <ReciboDocumento
            config={config}
            urlValidacao={null}
            recibo={{
              numero: "—",
              alunoNome: form.aluno,
              responsavel: form.responsavel,
              mesReferencia: form.referencia,
              valor: parseFloat(form.valor) || 0,
              formaPagamento: form.forma,
              dataPagamento: dataFormatada,
              codigoVerificacao: null,
            }}
          />
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold">Recibos emitidos</h2>
          <Input
            placeholder="Buscar por aluno, referência ou número..."
            value={searchRecibo}
            onChange={(e) => setSearchRecibo(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {recibos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum recibo emitido ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-800 text-xs uppercase text-white">
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
                {filtrados.map((r, i) => (
                  <tr key={r.id} className={`${i % 2 === 0 ? "bg-white" : "bg-brand-50"} ${r.canceladoAt ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 font-bold text-brand-800">
                      <Link href={`/recibos/${r.id}`} className="hover:underline">#{r.numero}</Link>
                      {r.canceladoAt ? <span className="ml-2 rounded bg-danger-100 px-2 py-0.5 text-[10px] text-danger-700">CANCELADO</span> : null}
                    </td>
                    <td className="px-4 py-3 font-medium">{r.alunoNome}</td>
                    <td className="px-4 py-3">{r.mesReferencia}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(r.valor)}</td>
                    <td className="px-4 py-3">{r.formaPagamento}</td>
                    <td className="px-4 py-3">{new Date(r.dataPagamento).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/recibos/${r.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline">
                          <Printer className="size-3.5" /> {r.canceladoAt ? "Ver" : "Ver e imprimir"}
                        </Link>
                        {!r.canceladoAt ? (
                          <ConfirmDialog
                            title="Cancelar recibo?"
                            description={`O recibo #${r.numero} continuará no histórico e aparecerá como cancelado.`}
                            confirmLabel="Cancelar recibo"
                            onConfirm={async () => { await cancelarRecibo(r.id); router.refresh() }}
                          >
                            <button className="text-danger-600 hover:text-danger-700" aria-label="Cancelar recibo">
                              <Ban className="size-3.5" />
                            </button>
                          </ConfirmDialog>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
