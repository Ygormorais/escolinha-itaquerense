"use client"

import { useState, useMemo } from "react"
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
  turmaInicial = "todas",
}: {
  alunos: Aluno[]
  turmas: string[]
  turmaInicial?: string
}) {
  const [filtroTurma, setFiltroTurma] = useState(turmaInicial)
  const [filtroStatus, setFiltroStatus] = useState("ativos")
  const [filtroFaixa, setFiltroFaixa] = useState("todas")
  const [busca, setBusca] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("nome")
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
    const faixa = FAIXAS.find((f) => f.key === filtroFaixa)

    let result = alunos.filter((a) => {
      if (q && !a.nome.toLowerCase().includes(q) && !(a.responsavel ?? "").toLowerCase().includes(q)) return false
      if (filtroTurma !== "todas" && a.turma !== filtroTurma) return false
      if (filtroStatus === "ativos" && a.status !== "Ativo") return false
      if (filtroStatus === "inativos" && a.status === "Ativo") return false
      if (faixa && faixa.key !== "todas" && faixa.min !== undefined && faixa.max !== undefined) {
        const idade = calcIdade(a.dataNascimento)
        if (idade < faixa.min || idade > faixa.max) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "nome": cmp = a.nome.localeCompare(b.nome, "pt-BR"); break
        case "turma": cmp = a.turma.localeCompare(b.turma, "pt-BR"); break
        case "horario": cmp = a.horario.localeCompare(b.horario, "pt-BR"); break
        case "status": cmp = a.status.localeCompare(b.status, "pt-BR"); break
        case "idade": cmp = calcIdade(a.dataNascimento) - calcIdade(b.dataNascimento); break
        case "mensalidade": cmp = a.mensalidade - b.mensalidade; break
        case "dataMatricula": cmp = new Date(a.dataMatricula).getTime() - new Date(b.dataMatricula).getTime(); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [alunos, filtroTurma, filtroStatus, filtroFaixa, busca, sortKey, sortDir])

  const ativos = filtrados.filter((a) => a.status === "Ativo")
  const inativos = filtrados.filter((a) => a.status !== "Ativo")
  const totalMensalidade = ativos.reduce((s, a) => s + a.mensalidade, 0)
  const mediaMensalidade = ativos.length > 0 ? totalMensalidade / ativos.length : 0

  function imprimirPDF() {
    const linhas = filtrados.map((a) =>
      `<tr><td>${a.nome}</td><td>${a.turma}</td><td>${a.horario}</td><td>${a.status}</td><td>${calcIdade(a.dataNascimento)}</td><td>${a.responsavel ?? "—"}</td><td>${a.telefone ?? "—"}</td><td>R$ ${a.mensalidade.toFixed(2)}</td><td>${format(new Date(a.dataMatricula), "dd/MM/yyyy")}</td></tr>`
    ).join("")
    printHTML(`
      <h1>Relatório de Alunos</h1>
      <p>${filtrados.length} alunos · Receita mensal ${formatMoney(totalMensalidade)}</p>
      <table>
        <thead><tr><th>Nome</th><th>Turma</th><th>Horário</th><th>Status</th><th>Idade</th><th>Responsável</th><th>Telefone</th><th>Mensalidade</th><th>Matrícula</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, "Relatório de Alunos")
  }

  function exportarCSV() {
    const header = "Nome;Turma;Horário;Status;Idade;Responsável;Telefone;Mensalidade;Data Matrícula"
    const rows = filtrados.map((a) =>
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
      <RelatorioNav />
      <PageHeader
        title="Relatório de Alunos"
        description={`${filtrados.length} alunos · Receita mensal ${formatMoney(totalMensalidade)}`}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ativos</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{ativos.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Inativos</p>
          <p className="mt-1 text-2xl font-extrabold text-muted-foreground">{inativos.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Receita Mensal</p>
          <p className="mt-1 text-xl font-extrabold text-success-700">{formatMoney(totalMensalidade)}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Mensalidade</p>
          <p className="mt-1 text-xl font-extrabold">{formatMoney(mediaMensalidade)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou responsável…"
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
        <Select value={filtroFaixa} onValueChange={(v) => setFiltroFaixa(v ?? "todas")}>
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
            <Button key={s.key} variant={filtroStatus === s.key ? "default" : "outline"} size="sm" onClick={() => setFiltroStatus(s.key)} className="text-xs">
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="size-4" /> Alunos ({filtrados.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum aluno encontrado"
              description="Ajuste os filtros ou a busca para ver resultados."
            />
          ) : (
            <div className="overflow-x-auto">
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
                  {filtrados.map((a) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
