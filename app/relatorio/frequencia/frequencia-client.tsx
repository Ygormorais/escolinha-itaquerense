"use client"

import { useState, useMemo } from "react"
import { CalendarCheck, Download, Printer, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
import { printHTML } from "@/lib/print"
import { sanitizeCSVCell } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, subMonths } from "date-fns"
import type { StaffRole } from "@/lib/permissions"

type Stat = {
  id: number
  nome: string
  turma: string
  totalAulas: number
  totalPresencas: number
  percentual: number
}

type SortKey = "nome" | "turma" | "totalAulas" | "totalPresencas" | "percentual"

function SortIcon({ col, current, dir }: { col: SortKey; current: SortKey; dir: "asc" | "desc" }) {
  if (col !== current) return <ArrowUpDown className="ml-1 inline size-3 opacity-40" />
  return dir === "asc"
    ? <ArrowUp className="ml-1 inline size-3" />
    : <ArrowDown className="ml-1 inline size-3" />
}

export function RelatorioFrequenciaClient({
  stats,
  turmas,
  mesAtual,
  mesSelecionado,
  role,
}: {
  stats: Stat[]
  turmas: string[]
  mesAtual: string
  mesSelecionado: string
  role: StaffRole
}) {
  const router = useRouter()
  const [filtroTurma, setFiltroTurma] = useState("todas")
  const [filtroFreq, setFiltroFreq] = useState("todos")
  const [busca, setBusca] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("percentual")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let result = stats.filter((s) => {
      if (q && !s.nome.toLowerCase().includes(q)) return false
      if (filtroTurma !== "todas" && s.turma !== filtroTurma) return false
      if (filtroFreq === "altas" && s.percentual < 75) return false
      if (filtroFreq === "risco" && s.percentual >= 75) return false
      if (filtroFreq === "baixas" && s.percentual >= 50) return false
      if (filtroFreq === "criticas" && s.percentual >= 25) return false
      return true
    })

    result = [...result].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = typeof av === "string" ? av.localeCompare(bv as string, "pt-BR") : (av as number) - (bv as number)
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [stats, filtroTurma, filtroFreq, busca, sortKey, sortDir])

  const emRisco = stats.filter((s) => s.percentual < 75 && s.totalAulas > 0).length
  const criticos = stats.filter((s) => s.percentual < 25 && s.totalAulas > 0).length

  const mediaGeral = stats.length > 0
    ? Math.round(stats.reduce((s, a) => s + a.percentual, 0) / stats.length)
    : 0
  const mediaFiltrada = filtrados.length > 0
    ? Math.round(filtrados.reduce((s, a) => s + a.percentual, 0) / filtrados.length)
    : 0

  function navMes(delta: number) {
    const [ano, mes] = mesSelecionado.split("-").map(Number)
    const d = subMonths(new Date(ano, mes - 1, 1), -delta)
    router.push(`/relatorio/frequencia?mes=${format(d, "yyyy-MM")}`)
  }

  function imprimirPDF() {
    const linhas = filtrados.map((s) =>
      `<tr><td>${s.nome}</td><td>${s.turma}</td><td>${s.totalAulas}</td><td>${s.totalPresencas}</td><td>${s.percentual}%</td></tr>`
    ).join("")
    printHTML(`
      <h1>Relatório de Frequência — ${mesAtual}</h1>
      <p>${filtrados.length} alunos · Média ${mediaGeral}%</p>
      <table>
        <thead><tr><th>Aluno</th><th>Turma</th><th>Aulas</th><th>Presenças</th><th>Frequência</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, `Relatório de Frequência ${mesAtual}`)
  }

  function exportarCSV() {
    const header = "Nome;Turma;Aulas;Presenças;Frequência"
    const rows = filtrados.map((s) =>
      [s.nome, s.turma, s.totalAulas, s.totalPresencas, `${s.percentual}%`].map(sanitizeCSVCell).join(";")
    )
    const csv = "﻿" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-frequencia-${mesSelecionado}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const freqColor = (p: number) =>
    p >= 75 ? "text-success-600" : p >= 50 ? "text-warning-600" : "text-danger-600"

  const thClass = "cursor-pointer select-none hover:text-foreground transition-colors"

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <RelatorioNav role={role} />
      <PageHeader
        title="Relatório de Frequência"
        description={`${filtrados.length} alunos · Média ${mediaFiltrada}%`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={imprimirPDF}>
              <Printer className="size-4" />
              Imprimir PDF
            </Button>
            <Button size="sm" onClick={exportarCSV}>
              <Download className="size-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        }
      />

      {/* Seletor de mês */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => navMes(-1)} aria-label="Mês anterior">←</Button>
        <span className="min-w-[140px] text-center text-sm font-medium capitalize">{mesAtual}</span>
        <Button size="sm" variant="outline" onClick={() => navMes(1)} aria-label="Próximo mês">→</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{filtrados.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média</p>
          <p className={`mt-1 text-2xl font-extrabold ${mediaFiltrada >= 75 ? "text-success-600" : mediaFiltrada >= 50 ? "text-warning-600" : "text-danger-600"}`}>
            {mediaFiltrada}%
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Em Risco &lt;75%</p>
          <p className={`mt-1 text-2xl font-extrabold ${emRisco > 0 ? "text-warning-600" : "text-muted-foreground"}`}>
            {emRisco}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Críticos &lt;25%</p>
          <p className={`mt-1 text-2xl font-extrabold ${criticos > 0 ? "text-danger-600" : "text-muted-foreground"}`}>
            {criticos}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={filtroTurma} onValueChange={(v) => setFiltroTurma(v ?? "todas")}>
          <SelectTrigger className="h-9 w-36 text-sm" aria-label="Filtrar por turma">
            <SelectValue placeholder="Todas turmas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas turmas</SelectItem>
            {turmas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {[
            { key: "todos", label: "Todos" },
            { key: "altas", label: "≥75%" },
            { key: "risco", label: "<75%", alert: emRisco > 0 },
            { key: "baixas", label: "<50%" },
            { key: "criticas", label: "<25%" },
          ].map((s) => (
            <Button
              key={s.key}
              variant={filtroFreq === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroFreq(s.key)}
              className={`text-xs ${s.alert && filtroFreq !== s.key ? "border-warning-600 text-warning-600" : ""}`}
            >
              {s.label}{s.alert ? ` (${emRisco})` : ""}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarCheck className="size-4" /> Frequência por Aluno ({filtrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Nenhum aluno encontrado"
              description="Ajuste os filtros para ver resultados."
            />
          ) : (
            <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((s) => <article key={s.id} className="rounded-xl border bg-background p-4"><div className="flex justify-between gap-3"><div><Link href={`/alunos/${s.id}`} className="font-semibold text-brand-800 hover:underline">{s.nome}</Link><p className="mt-1 text-sm text-muted-foreground">{s.turma}</p></div><strong className={freqColor(s.percentual)}>{s.totalAulas === 0 ? "—" : `${s.percentual}%`}</strong></div><dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-sm"><div><dt className="text-xs text-muted-foreground">Aulas</dt><dd>{s.totalAulas}</dd></div><div><dt className="text-xs text-muted-foreground">Presenças</dt><dd>{s.totalPresencas}</dd></div></dl></article>)}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className={thClass} onClick={() => handleSort("nome")}>
                      Aluno <SortIcon col="nome" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={thClass} onClick={() => handleSort("turma")}>
                      Turma <SortIcon col="turma" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("totalAulas")}>
                      Aulas <SortIcon col="totalAulas" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("totalPresencas")}>
                      Presenças <SortIcon col="totalPresencas" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className={`text-center ${thClass}`} onClick={() => handleSort("percentual")}>
                      Frequência <SortIcon col="percentual" current={sortKey} dir={sortDir} />
                    </TableHead>
                    <TableHead className="w-32">Barra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <Link href={`/alunos/${s.id}`} className="hover:underline text-brand-800">{s.nome}</Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{s.turma}</Badge></TableCell>
                      <TableCell className="text-center text-sm">{s.totalAulas}</TableCell>
                      <TableCell className="text-center text-sm">{s.totalPresencas}</TableCell>
                      <TableCell className={`text-center text-sm font-semibold ${freqColor(s.percentual)}`}>
                        {s.totalAulas === 0 ? "—" : `${s.percentual}%`}
                      </TableCell>
                      <TableCell>
                        {s.totalAulas > 0 ? (
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${s.percentual >= 75 ? "bg-success-600" : s.percentual >= 50 ? "bg-warning-600" : "bg-danger-600"}`}
                              style={{ width: `${s.percentual}%` }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem chamada</span>
                        )}
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
    </div>
  )
}
