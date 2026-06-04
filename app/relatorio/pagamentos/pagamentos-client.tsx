"use client"

import { useState, useMemo } from "react"
import { Download, PrinterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"
import { printHTML } from "@/lib/print"
import { getPaymentChannel, type PaymentChannel } from "@/lib/payment-channel"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: RscDate
  dataPagamento: RscDate | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string }
}

export function RelatorioPagamentosClient({ pagamentos, ano }: { pagamentos: Pagamento[]; ano: number }) {
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroCanal, setFiltroCanal] = useState<PaymentChannel | "todos">("todos")

  const filtrados = useMemo(() => {
    return pagamentos.filter((p) => {
      if (filtroStatus === "pagos" && !p.dataPagamento) return false
      if (filtroStatus === "pendentes" && p.dataPagamento) return false
      if (filtroStatus === "atrasados" && (p.dataPagamento || new Date(p.dataVencimento) >= new Date())) return false
      if (filtroCanal !== "todos" && getPaymentChannel(p.formaPagamento) !== filtroCanal) return false
      return true
    })
  }, [pagamentos, filtroCanal, filtroStatus])

  const totalRecebido = pagamentos.filter((p) => p.dataPagamento).reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const totalPendente = pagamentos.filter((p) => !p.dataPagamento).reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const canais = useMemo(() => {
    const base: Array<PaymentChannel | "Sem registro"> = ["PIX", "Boleto", "Maquininha", "Transferência", "Dinheiro", "Outro", "Sem registro"]
    return base.map((canal) => {
      const items = pagamentos.filter((p) => getPaymentChannel(p.formaPagamento) === canal)
      const total = items.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
      const pagos = items.filter((p) => p.dataPagamento).length
      return { canal, total, quantidade: items.length, pagos }
    }).filter((item) => item.quantidade > 0)
  }, [pagamentos])

  function imprimirPDF() {
    const linhas = filtrados.map((p) => {
      const status = p.dataPagamento ? "Pago" : new Date(p.dataVencimento) < new Date() ? "Atrasado" : "Pendente"
      const canal = getPaymentChannel(p.formaPagamento)
      return `<tr><td>${p.aluno.nome}</td><td>${p.aluno.turma}</td><td>${p.mesReferencia}</td><td>${canal}</td><td>${format(new Date(p.dataVencimento), "dd/MM/yyyy")}</td><td>${p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</td><td>R$ ${(p.valorRecebido ?? 0).toFixed(2)}</td><td>${status}</td></tr>`
    }).join("")
    printHTML(`
      <h1>Relatório de Pagamentos — ${ano}</h1>
      <p>${filtrados.length} registros · Recebido: R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · Pendente: R$ ${totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      <table>
        <thead><tr><th>Aluno</th><th>Turma</th><th>Mês Ref</th><th>Canal</th><th>Vencimento</th><th>Pagamento</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, `Relatório de Pagamentos ${ano}`)
  }

  function exportarCSV() {
    const header = "Aluno;Turma;Mês Ref;Canal;Data Vencimento;Data Pagamento;Valor;Status"
    const rows = filtrados.map((p) => {
      const status = p.dataPagamento
        ? "Pago"
        : new Date(p.dataVencimento) < new Date()
        ? "Atrasado"
        : "Pendente"
      const canal = getPaymentChannel(p.formaPagamento)
      return [
        p.aluno.nome,
        p.aluno.turma,
        p.mesReferencia,
        canal,
        format(new Date(p.dataVencimento), "dd/MM/yyyy"),
        p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "",
        `R$ ${(p.valorRecebido ?? 0).toFixed(2)}`,
        status,
      ].join(";")
    })
    const csv = "\uFEFF" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-pagamentos-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Relatório de Pagamentos"
        description={`${filtrados.length} registros em ${ano}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={imprimirPDF}>
              <PrinterIcon className="size-4 mr-1" /> PDF
            </Button>
            <Button size="sm" onClick={exportarCSV}>
              <Download className="size-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success-600">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-success-600">
              R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-warning-600">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-warning-600">
              R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{pagamentos.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_2fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Canais de recebimento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canais.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum canal registrado neste ano.</p>
            )}
            {canais.map((item) => (
              <div key={item.canal} className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{item.canal}</p>
                  <p className="text-xs text-muted-foreground">{item.quantidade} registro(s) · {item.pagos} pago(s)</p>
                </div>
                <p className="text-sm font-semibold">
                  R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {[
                { key: "todos", label: "Todos" },
                { key: "pagos", label: "Pagos" },
                { key: "pendentes", label: "Pendentes" },
                { key: "atrasados", label: "Atrasados" },
              ].map((s) => (
                <Button key={s.key} variant={filtroStatus === s.key ? "default" : "outline"} size="sm" onClick={() => setFiltroStatus(s.key)} className="text-xs">
                  {s.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              <Button variant={filtroCanal === "todos" ? "default" : "outline"} size="sm" onClick={() => setFiltroCanal("todos")} className="text-xs">
                Todos os canais
              </Button>
              {canais.map((item) => (
                <Button
                  key={item.canal}
                  variant={filtroCanal === item.canal ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltroCanal(item.canal)}
                  className="text-xs"
                >
                  {item.canal}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0 pt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Mês Ref</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      Nenhum pagamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
                {filtrados.map((p) => {
                  const status = p.dataPagamento
                    ? "Pago"
                    : new Date(p.dataVencimento) < new Date()
                    ? "Atrasado"
                    : "Pendente"
                  const canal = getPaymentChannel(p.formaPagamento)
                  const variant = status === "Pago" ? "default" : status === "Atrasado" ? "outline" : "secondary"
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{p.aluno.turma}</Badge></TableCell>
                      <TableCell className="text-sm">{p.mesReferencia}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{canal}</Badge></TableCell>
                      <TableCell className="text-sm">{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm">
                        {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">R$ {(p.valorRecebido ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={variant} className="text-xs">{status}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
