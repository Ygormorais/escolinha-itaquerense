"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Download, Printer, Search, X, SearchX } from "lucide-react"
import { formatMoney, sanitizeCSVCell } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { RelatorioNav } from "@/components/relatorio/relatorio-nav"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"
import { printHTML } from "@/lib/print"
import { getPaymentChannel, type PaymentChannel } from "@/lib/payment-channel"
import { TURMAS } from "@/lib/constants"
import type { StaffRole } from "@/lib/permissions"
import { REPORT_PAGE_SIZE, type PagamentoReportFilters } from "@/lib/report-query"
import { Pagination } from "@/components/ui/pagination"
import { getPagamentosRelatorioCompleto } from "@/app/relatorio/export-actions"

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

type CanalResumo = { canal: PaymentChannel; total: number; quantidade: number; pagos: number }

export function RelatorioPagamentosClient({
  pagamentos,
  role,
  filters,
  total,
  totalPages,
  resumo,
}: {
  pagamentos: Pagamento[]
  role: StaffRole
  filters: PagamentoReportFilters
  total: number
  totalPages: number
  resumo: {
    totalRecebido: number
    totalPendente: number
    totalAtrasado: number
    ticketMedio: number
    taxaRecebimento: number
    counts: Record<(typeof STATUS_OPTS)[number]["key"], number>
    canais: CanalResumo[]
  }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busca, setBusca] = useState(filters.q)
  const [anoInput, setAnoInput] = useState(String(filters.ano))
  const [exportando, setExportando] = useState(false)
  const canais = resumo.canais
  const canalLider = canais[0] ?? null
  const filtrosAtivos = filters.status !== "todos" || filters.turma !== "todas" || filters.canal !== "todos" || filters.q

  async function carregarRelatorioCompleto() {
    setExportando(true)
    try {
      return await getPagamentosRelatorioCompleto(filters)
    } finally {
      setExportando(false)
    }
  }

  function navegar(changes: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "todos" || value === "todas") params.delete(key)
      else params.set(key, String(value))
    }
    if (!("pagina" in changes)) params.delete("pagina")
    router.push(`/relatorio/pagamentos?${params.toString()}`, { scroll: false })
  }

  function limparFiltros() {
    setBusca("")
    router.push(`/relatorio/pagamentos?ano=${filters.ano}`, { scroll: false })
  }

  async function imprimirPDF() {
    const completos = await carregarRelatorioCompleto()
    const linhas = completos.map((p) => {
      const st = calcStatus(p)
      const canal = getPaymentChannel(p.formaPagamento)
      return `<tr><td>${p.aluno.nome}</td><td>${p.aluno.turma}</td><td>${p.mesReferencia}</td><td>${canal}</td><td>${format(new Date(p.dataVencimento), "dd/MM/yyyy")}</td><td>${p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</td><td>R$ ${(p.valorRecebido ?? 0).toFixed(2)}</td><td>${st}</td></tr>`
    }).join("")
    printHTML(`
      <h1>Relatório de Pagamentos — ${filters.ano}</h1>
      <p>${completos.length} registros filtrados · Recebido: ${formatMoney(resumo.totalRecebido)} · Pendente: ${formatMoney(resumo.totalPendente)} · Em atraso: ${formatMoney(resumo.totalAtrasado)}</p>
      <table>
        <thead><tr><th>Aluno</th><th>Turma</th><th>Mês Ref</th><th>Canal</th><th>Vencimento</th><th>Pagamento</th><th>Valor</th><th>Status</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, `Relatório de Pagamentos ${filters.ano}`)
  }

  async function exportarCSV() {
    const completos = await carregarRelatorioCompleto()
    const header = "Aluno;Turma;Mês Ref;Canal;Data Vencimento;Data Pagamento;Valor;Status"
    const rows = completos.map((p) => {
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
    a.download = `relatorio-pagamentos-${filters.ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <RelatorioNav role={role} />
      <PageHeader
        title="Relatório de Pagamentos"
        description={`${total} registros filtrados — ${filters.ano}`}
        action={
          <div className="flex gap-2">
            <Input
              type="number"
              min={2020}
              max={2099}
              value={anoInput}
              aria-label="Ano do relatório"
              className="h-9 w-24"
              onChange={(e) => {
                const value = e.target.value
                setAnoInput(value)
                if (/^\d{4}$/.test(value)) router.push(`/relatorio/pagamentos?ano=${value}`)
              }}
            />
            <Button size="sm" variant="outline" onClick={imprimirPDF} disabled={exportando || total === 0}>
              <Printer className="size-4" /> Imprimir PDF
            </Button>
            <Button size="sm" onClick={exportarCSV} disabled={exportando || total === 0}>
              <Download className="size-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-brand-200/70">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Leitura executiva</CardTitle>
            <CardDescription>
              Panorama anual do caixa escolar com foco em recebimento, atraso e distribuicao por canal.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recebido</p>
              <p className="mt-1 font-heading text-2xl font-bold text-success-600">{formatMoney(resumo.totalRecebido)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{resumo.counts.pagos} pagamento(s) confirmados</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pendente</p>
              <p className="mt-1 font-heading text-2xl font-bold text-warning-600">{formatMoney(resumo.totalPendente)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{resumo.counts.pendentes} aguardando baixa</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Em atraso</p>
              <p className="mt-1 font-heading text-2xl font-bold text-danger-600">{formatMoney(resumo.totalAtrasado)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{resumo.counts.atrasados} vencido(s)</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Taxa de recebimento</p>
              <p className="mt-1 font-heading text-2xl font-bold">{resumo.taxaRecebimento.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Ticket médio: {formatMoney(resumo.ticketMedio)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Canal lider</CardTitle>
            <CardDescription>
              Canal com maior volume acumulado no periodo analisado.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <p className="font-heading text-2xl font-bold">{canalLider?.canal ?? "Sem dados"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canalLider ? `${formatMoney(canalLider.total)} em ${canalLider.quantidade} registro(s)` : "Nenhum pagamento com canal identificado"}
            </p>
            {canais.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {canais.slice(0, 4).map((item) => (
                  <Badge key={item.canal} variant="outline" className="text-xs">
                    {item.canal}: {item.quantidade}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        {/* Busca */}
        <form className="flex min-w-[220px] flex-1 gap-2" onSubmit={(event) => { event.preventDefault(); navegar({ q: busca.trim() }) }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">Buscar</Button>
        </form>

        {/* Turma */}
        <Select value={filters.turma} onValueChange={(v) => navegar({ turma: v ?? "todas" })}>
          <SelectTrigger className="h-9 w-36 text-sm">
            <SelectValue placeholder="Turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas turmas</SelectItem>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Canal */}
        <Select value={filters.canal} onValueChange={(v) => navegar({ canal: v ?? "todos" })}>
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
              onClick={() => navegar({ status: s.key })}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filters.status === s.key
                  ? "bg-brand-800 text-white"
                  : "border border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {s.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                filters.status === s.key ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {resumo.counts[s.key]}
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

      {/* Detalhamento móvel */}
      <div className="grid gap-3 md:hidden" data-slot="payment-report-mobile-list">
        {pagamentos.map((p) => {
          const st = calcStatus(p)
          const canal = getPaymentChannel(p.formaPagamento)
          return <article key={p.id} className="rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/alunos/${p.aluno.id}`} className="block truncate font-semibold text-brand-800 hover:underline">{p.aluno.nome}</Link><p className="mt-1 text-xs text-muted-foreground">{p.aluno.turma} · {p.mesReferencia} · {canal}</p></div><span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[st]}`}>{st}</span></div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Vencimento</dt><dd>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</dd></div><div><dt className="text-xs text-muted-foreground">Valor</dt><dd data-numeric className="font-semibold">{formatMoney(p.valorRecebido ?? p.aluno.mensalidade ?? 0)}</dd></div></dl>
          </article>
        })}
      </div>

      {/* Tabela */}
      <Card className="hidden md:block">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Detalhamento dos pagamentos</CardTitle>
          <CardDescription>
            Tabela filtravel para conferencia operacional, exportacao e impressao.
          </CardDescription>
        </CardHeader>
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
                {pagamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <SearchX className="size-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Nenhum pagamento encontrado para os filtros selecionados.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {pagamentos.map((p) => {
                  const st = calcStatus(p)
                  const canal = getPaymentChannel(p.formaPagamento)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                      </TableCell>
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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total === 0 ? "Nenhum pagamento" : `${(filters.page - 1) * REPORT_PAGE_SIZE + 1}–${Math.min(filters.page * REPORT_PAGE_SIZE, total)} de ${total}`}</span>
        <Pagination page={filters.page} totalPages={totalPages} onPageChange={(page) => navegar({ pagina: page })} />
      </div>

      {/* Resumo por canal */}
      {canais.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Canais de recebimento</CardTitle>
            <CardDescription>
              Use os cards para filtrar rapidamente a origem dos recebimentos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-5">
            <div className="flex flex-wrap gap-3">
              {canais.map((item) => (
                <button
                  key={item.canal}
                  onClick={() => navegar({ canal: filters.canal === item.canal ? "todos" : item.canal })}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    filters.canal === item.canal
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
