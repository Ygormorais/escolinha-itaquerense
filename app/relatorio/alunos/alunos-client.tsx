"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, Download, Printer, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { formatMoney, sanitizeCSVCell } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { RelatorioNav } from "@/components/relatorio/relatorio-nav"
import { EmptyState } from "@/components/ui/empty-state"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"
import { printHTML } from "@/lib/print"
import type { StaffRole } from "@/lib/permissions"
import { REPORT_PAGE_SIZE, type AlunoReportFilters } from "@/lib/report-query"
import { Pagination } from "@/components/ui/pagination"
import { getAlunosRelatorioCompleto } from "@/app/relatorio/export-actions"

type Aluno = {
  id: number
  nome: string
  turma: string
  horario: string
  status: string
  responsavel: string | null
  telefone: string | null
  mensalidade: number
  dataMatricula: RscDate
  dataNascimento: RscDate
}

function calcIdade(dataNasc: RscDate): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  return hoje.getFullYear() - nasc.getFullYear() - (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
}

type Faixa = { key: string; label: string; min?: number; max?: number }
const FAIXAS: Faixa[] = [
  { key: "todas", label: "Todas idades" },
  { key: "sub9",  label: "Sub-9 (≤8)",    min: 0,  max: 8  },
  { key: "sub11", label: "Sub-11 (9-10)",  min: 9,  max: 10 },
  { key: "sub13", label: "Sub-13 (11-12)", min: 11, max: 12 },
  { key: "sub15", label: "Sub-15 (13-14)", min: 13, max: 14 },
  { key: "sub17", label: "Sub-17 (15-16)", min: 15, max: 16 },
  { key: "adulto",label: "Adulto (17+)",   min: 17, max: 99 },
]

type SortKey = "nome" | "turma" | "horario" | "status" | "idade" | "mensalidade" | "dataMatricula"

function SortIcon({ col, current, dir }: { col: SortKey; current: SortKey; dir: "asc" | "desc" }) {
  if (col !== current) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
  return dir === "asc"
    ? <ArrowUp className="ml-1 inline size-3" />
    : <ArrowDown className="ml-1 inline size-3" />
}

export function RelatorioAlunosClient({
  alunos,
  turmas,
  role,
  filters,
  total,
  totalPages,
  resumo,
}: {
  alunos: Aluno[]
  turmas: string[]
  role: StaffRole
  filters: AlunoReportFilters
  total: number
  totalPages: number
  resumo: { ativos: number; inativos: number; totalMensalidade: number; mediaMensalidade: number }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [busca, setBusca] = useState(filters.q)
  const [exportando, setExportando] = useState(false)
  const sortKey = filters.sort
  const sortDir = filters.dir

  async function carregarRelatorioCompleto() {
    setExportando(true)
    try {
      return await getAlunosRelatorioCompleto(filters)
    } finally {
      setExportando(false)
    }
  }

  function navegar(changes: Record<string, string | number>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (!value || value === "todas" || (key === "status" && value === "ativos")) params.delete(key)
      else params.set(key, String(value))
    }
    if (!("pagina" in changes)) params.delete("pagina")
    router.push(`/relatorio/alunos?${params.toString()}`, { scroll: false })
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      navegar({ sort: key, dir: sortDir === "asc" ? "desc" : "asc" })
    } else {
      navegar({ sort: key, dir: "asc" })
    }
  }

  async function imprimirPDF() {
    const completos = await carregarRelatorioCompleto()
    const linhas = completos.map((a) =>
      `<tr><td>${a.nome}</td><td>${a.turma}</td><td>${a.horario}</td><td>${a.status}</td><td>${calcIdade(a.dataNascimento)}</td><td>${a.responsavel ?? "—"}</td><td>${a.telefone ?? "—"}</td><td>R$ ${a.mensalidade.toFixed(2)}</td><td>${format(new Date(a.dataMatricula), "dd/MM/yyyy")}</td></tr>`
    ).join("")
    printHTML(`
      <h1>Relatório de Alunos</h1>
      <p>${completos.length} alunos · Receita mensal ${formatMoney(resumo.totalMensalidade)}</p>
      <table>
        <thead><tr><th>Nome</th><th>Turma</th><th>Horário</th><th>Status</th><th>Idade</th><th>Responsável</th><th>Telefone</th><th>Mensalidade</th><th>Matrícula</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, "Relatório de Alunos")
  }

  async function exportarCSV() {
    const completos = await carregarRelatorioCompleto()
    const header = "Nome;Turma;Horário;Status;Idade;Responsável;Telefone;Mensalidade;Data Matrícula"
    const rows = completos.map((a) =>
      [
        a.nome,
        a.turma,
        a.horario,
        a.status,
        String(calcIdade(a.dataNascimento)),
        a.responsavel ?? "",
        a.telefone ?? "",
        formatMoney(a.mensalidade),
        format(new Date(a.dataMatricula), "dd/MM/yyyy"),
      ].map(sanitizeCSVCell).join(";")
    )
    const csv = "﻿" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-alunos-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const thClass = "cursor-pointer select-none hover:text-foreground transition-colors"

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <RelatorioNav role={role} />
      <PageHeader
        title="Relatório de Alunos"
        description={`${total} alunos · Receita mensal ${formatMoney(resumo.totalMensalidade)}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={imprimirPDF} disabled={exportando || total === 0}>
              <Printer className="size-4" />
              Imprimir PDF
            </Button>
            <Button size="sm" onClick={exportarCSV} disabled={exportando || total === 0}>
              <Download className="size-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{resumo.ativos}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inativos</p>
          <p className="mt-1 text-2xl font-extrabold text-muted-foreground">{resumo.inativos}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Receita Mensal</p>
          <p className="mt-1 text-xl font-extrabold text-success-600">{formatMoney(resumo.totalMensalidade)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Mensalidade</p>
          <p className="mt-1 text-xl font-extrabold">{formatMoney(resumo.mediaMensalidade)}</p>
        </div>
      </div>

      <form
        className="flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          navegar({ q: busca.trim() })
        }}
      >
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou responsável…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">Buscar</Button>
        <Select value={filters.turma} onValueChange={(v) => navegar({ turma: v ?? "todas" })}>
          <SelectTrigger className="h-9 w-36 text-sm" aria-label="Filtrar por turma">
            <SelectValue placeholder="Todas turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas turmas</SelectItem>
            {turmas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.faixa} onValueChange={(v) => navegar({ faixa: v ?? "todas" })}>
          <SelectTrigger className="h-9 w-44 text-sm" aria-label="Filtrar por faixa etária">
            <SelectValue placeholder="Todas idades" />
          </SelectTrigger>
          <SelectContent>
            {FAIXAS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {[
            { key: "todos", label: "Todos" },
            { key: "ativos", label: "Ativos" },
            { key: "inativos", label: "Inativos" },
          ].map((s) => (
            <Button type="button" key={s.key} variant={filters.status === s.key ? "default" : "outline"} size="sm" onClick={() => navegar({ status: s.key })} className="text-xs">
              {s.label}
            </Button>
          ))}
        </div>
      </form>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4" /> Alunos ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alunos.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum aluno encontrado"
              description="Ajuste os filtros ou a busca para ver resultados."
            />
          ) : (
            <>
            <div className="grid gap-3 p-4 md:hidden">
              {alunos.map((a) => <article key={a.id} className="rounded-xl border bg-background p-4"><div className="flex justify-between gap-3"><div><Link href={`/alunos/${a.id}`} className="font-semibold text-brand-800 hover:underline">{a.nome}</Link><p className="mt-1 text-sm text-muted-foreground">{a.turma} · {a.horario}</p></div><Badge variant={a.status === "Ativo" ? "default" : "outline"}>{a.status}</Badge></div><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><dt className="text-xs text-muted-foreground">Responsável</dt><dd>{a.responsavel ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Mensalidade</dt><dd>{formatMoney(a.mensalidade)}</dd></div><div><dt className="text-xs text-muted-foreground">Telefone</dt><dd>{a.telefone ?? "—"}</dd></div><div><dt className="text-xs text-muted-foreground">Idade</dt><dd>{calcIdade(a.dataNascimento)} anos</dd></div></dl></article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass} onClick={() => handleSort("nome")}>
                      Nome <SortIcon col="nome" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass} onClick={() => handleSort("turma")}>
                      Turma <SortIcon col="turma" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass} onClick={() => handleSort("horario")}>
                      Horário <SortIcon col="horario" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass} onClick={() => handleSort("status")}>
                      Status <SortIcon col="status" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("idade")}>
                      Idade <SortIcon col="idade" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className={`text-right ${thClass}`} onClick={() => handleSort("mensalidade")}>
                      Mensalidade <SortIcon col="mensalidade" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass} onClick={() => handleSort("dataMatricula")}>
                      Matrícula <SortIcon col="dataMatricula" current={sortKey} dir={sortDir} />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <Link href={`/alunos/${a.id}`} className="hover:underline text-brand-800">{a.nome}</Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{a.turma}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.horario}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "Ativo" ? "default" : "outline"} className="text-xs">
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {calcIdade(a.dataNascimento)} anos
                      </TableCell>
                      <TableCell className="text-sm">{a.responsavel ?? "—"}</TableCell>
                      <TableCell className="text-sm">{a.telefone ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm">{formatMoney(a.mensalidade)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(a.dataMatricula), "dd/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total === 0 ? "Nenhum aluno" : `${(filters.page - 1) * REPORT_PAGE_SIZE + 1}–${Math.min(filters.page * REPORT_PAGE_SIZE, total)} de ${total}`}</span>
        <Pagination page={filters.page} totalPages={totalPages} onPageChange={(page) => navegar({ pagina: page })} />
      </div>
    </div>
  )
}
