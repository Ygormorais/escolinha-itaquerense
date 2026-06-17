"use client"

import { useState, useMemo } from "react"
import { Download, Printer, Search, X } from "lucide-react"
import { formatMoney, sanitizeCSVCell } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"
import { printHTML } from "@/lib/print"
import { getPaymentChannel, type PaymentChannel } from "@/lib/payment-channel"
import { TURMAS } from "@/lib/constants"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: RscDate
  dataPagamento: RscDate | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string; mensalidade: number }
}

const STATUS_OPTS = [
  { key: "todos",      label: "Todos" },
  { key: "pagos",      label: "Pagos" },
  { key: "pendentes",  label: "Pendentes" },
  { key: "atrasados",  label: "Atrasados" },
] as const

const statusBadge: Record<string, string> = {
  Pago:     "bg-success-50 text-success-600",
  Atrasado: "bg-danger-50 text-danger-600",
  Pendente: "bg-muted text-muted-foreground",
}

function calcStatus(p: Pagamento): "Pago" | "Atrasado" | "Pendente" {
  if (p.dataPagamento) return "Pago"
  return new Date(p.dataVencimento) < new Date() ? "Atrasado" : "Pendente"
}

export function RelatorioPagamentosClient({ pagamentos, ano }: { pagamentos: Pagamento[]; ano: number }) {
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroTurma, setFiltroTurma]   = useState("todas")
  const [filtroCanal, setFiltroCanal]   = useState<PaymentChannel | "todos">("todos")
  const [busca, setBusca]               = useState("")

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return pagamentos.filter((p) => {
      if (q && !p.aluno.nome.toLowerCase().includes(q)) return false
      if (filtroTurma !== "todas" && p.aluno.turma !== filtroTurma) return false
      const st = calcStatus(p)
      if (filtroStatus === "pagos"     && st !== "Pago")     return false
      if (filtroStatus === "pendentes" && st !== "Pendente") return false
      if (filtroStatus === "atrasados" && st !== "Atrasado") return false
      if (filtroCanal !== "todos" && getPaymentChannel(p.formaPagamento) !== filtroCanal) return false
      return true
    })
  }, [pagamentos, filtroCanal, filtroStatus, filtroTurma, busca])

  const totalRecebido = pagamentos.filter((p) => p.dataPagamento).reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const totalPendente = pagamentos.filter((p) => !p.dataPagamento).reduce((s, p) => s + (p.aluno.mensalidade ?? 0), 0)
  const totalAtrasado = pagamentos.filter((p) => calcStatus(p) === "Atrasado").reduce((s, p) => s + (p.aluno.mensalidade ?? 0), 0)

  const canais = useMemo(() => {
    const base: Array<PaymentChannel | "Sem registro"> = ["PIX", "Boleto", "Maquininha", "Transferência", "Dinheiro", "Outro", "Sem registro"]
    return base.map((canal) => {
      const items = pagamentos.filter((p) => getPaymentChannel(p.formaPagamento) === canal)
      const total = items.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
      const pagos = items.filter((p) => p.dataPagamento).length
      return { canal, total, quantidade: items.length, pagos }
    }).filter((item) => item.quantidade > 0)
  }, [pagamentos])

  const countPorStatus = useMemo(() => ({
    todos:     pagamentos.length,
    pagos:     pagamentos.filter((p) => calcStatus(p) === "Pago").length,
    pendentes: pagamentos.filter((p) => calcStatus(p) === "Pendente").length,
    atrasados: pagamentos.filter((p) => calcStatus(p) === "Atrasado").length,
  }), [pagamentos])

  const filtrosAtivos = filtroStatus !== "todos" || filtroTurma !== "todas" || filtroCanal !== "todos" || busca.trim()

  function limparFiltros() {
    setFiltroStatus("todos")
    setFiltroTurma("todas")
    setFiltroCanal("todos")
    setBusca("")
  }

  function imprimirPDF() {
    const linhas = filtrados.map((p) => {
      const st = calcStatus(p)
      const canal = getPaymentChannel(p.formaPagamento)
      return `<tr><td>${p.aluno.nome}</td><td>${p.aluno.turma}</td><td>${p.mesReferencia}</td><td>${canal}</td><td>${format(new Date(p.dataVencimento), "dd/MM/yyyy")}</td><td>${p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</td><td>R$ ${(p.valorRecebido ?? 0).toFixed(2)}</td><td>${st}</td></tr>`
    }).join("")
    printHTML(`
      <h1>Relatório de Pagamentos — ${ano}</h1>
      <p>${filtrados.length} registros · Recebido: R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
      <table>
        <thead><tr><th>Aluno</th><th>Turma</th><th>Mês Ref</th><th>Canal</th><th>Vencimento</th><th>Pagamento</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, `Relatório de Pagamentos ${ano}`)
  }

  function exportarCSV() {
    const header = "Aluno;Turma;Mês Ref;Canal;Data Vencimento;Data Pagamento;Valor;Status"
    const rows = filtrados.map((p) => {
      const st = calcStatus(p)
      const canal = getPaymentChannel(p.formaPagamento)
      return [
        p.aluno.nome, p.aluno.turma, p.mesReferencia, canal,
        format(new Date(p.dataVencimento), "dd/MM/yyyy"),
        p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "",
        formatMoney(p.valorRecebido ?? 0), st,
      ].map(sanitizeCSVCell).join(";")
    })
    const csv = "﻿" + header + "\n" + rows.join("\n")
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
        description={`${filtrados.length} de ${pagamentos.length} registros — ${ano}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={imprimirPDF}>
              <Printer className="size-4" /> Imprimir PDF
            </Button>
            <Button size="sm" onClick={exportarCSV}>
              <Download className="size-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-success-600/20">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recebido</p>
            <p className="mt-1 font-heading text-2xl font-bold text-success-600">
              {formatMoney(totalRecebido)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{countPorStatus.pagos} pagamentos</p>
          </CardContent>
        </Card>
        <Card className="border-warning-600/20">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pendente</p>
            <p className="mt-1 font-heading text-2xl font-bold text-warning-600">
              {formatMoney(totalPendente)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{countPorStatus.pendentes} pagamentos</p>
          </CardContent>
        </Card>
        <Card className="border-danger-600/20">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Em atraso</p>
            <p className="mt-1 font-heading text-2xl font-bold text-danger-600">
              {formatMoney(totalAtrasado)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{countPorStatus.atrasados} pagamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        {/* Busca */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Turma */}
        <Select value={filtroTurma} onValueChange={(v) => setFiltroTurma(v ?? "todas")}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas turmas</SelectItem>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Canal */}
        <Select value={filtroCanal} onValueChange={(v) => setFiltroCanal((v ?? "todos") as PaymentChannel | "todos")}>
          <SelectTrigger className="h-9 w-40 text-sm">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os canais</SelectItem>
            {canais.map((c) => <SelectItem key={c.canal} value={c.canal}>{c.canal}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status — chip buttons */}
        <div className="flex gap-1">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setFiltroStatus(s.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filtroStatus === s.key
                  ? "bg-brand-800 text-white"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                filtroStatus === s.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {countPorStatus[s.key]}
              </span>
            </button>
          ))}
        </div>

        {filtrosAtivos && (
          <Button variant="ghost" size="sm" onClick={limparFiltros} className="h-9 gap-1 text-xs text-muted-foreground">
            <X className="size-3.5" /> Limpar
          </Button>
        )}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0 pt-1">
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
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum pagamento encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
                {filtrados.map((p) => {
                  const st = calcStatus(p)
                  const canal = getPaymentChannel(p.formaPagamento)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{p.aluno.turma}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{p.mesReferencia}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{canal}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm">
                        {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatMoney(p.valorRecebido ?? p.aluno.mensalidade ?? 0)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[st]}`}>
                          {st}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por canal */}
      {canais.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canais de recebimento</p>
            <div className="flex flex-wrap gap-3">
              {canais.map((item) => (
                <button
                  key={item.canal}
                  onClick={() => setFiltroCanal(filtroCanal === item.canal ? "todos" : item.canal)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    filtroCanal === item.canal
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  <div>
                    <p className="font-medium">{item.canal}</p>
                    <p className="text-xs text-muted-foreground">{item.pagos}/{item.quantidade} pagos</p>
                  </div>
                  <p className="font-semibold">{formatMoney(item.total)}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
