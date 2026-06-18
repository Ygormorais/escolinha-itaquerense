"use client"

import { useState, useMemo } from "react"
import { Users, Download, Printer, Search } from "lucide-react"
import { formatMoney, sanitizeCSVCell } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
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
}

export function RelatorioAlunosClient({ alunos, turmas }: { alunos: Aluno[]; turmas: string[] }) {
  const [filtroTurma, setFiltroTurma] = useState("todas")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [busca, setBusca] = useState("")

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return alunos.filter((a) => {
      if (q && !a.nome.toLowerCase().includes(q) && !(a.responsavel ?? "").toLowerCase().includes(q)) return false
      if (filtroTurma !== "todas" && a.turma !== filtroTurma) return false
      if (filtroStatus === "ativos" && a.status !== "Ativo") return false
      if (filtroStatus === "inativos" && a.status === "Ativo") return false
      return true
    })
  }, [alunos, filtroTurma, filtroStatus, busca])

  const totalMensalidade = filtrados
    .filter((a) => a.status === "Ativo")
    .reduce((s, a) => s + a.mensalidade, 0)

  function imprimirPDF() {
    const linhas = filtrados.map((a) =>
      `<tr><td>${a.nome}</td><td>${a.turma}</td><td>${a.horario}</td><td>${a.status}</td><td>${a.responsavel ?? "—"}</td><td>${a.telefone ?? "—"}</td><td>R$ ${a.mensalidade.toFixed(2)}</td><td>${format(new Date(a.dataMatricula), "dd/MM/yyyy")}</td></tr>`
    ).join("")
    printHTML(`
      <h1>Relatório de Alunos</h1>
      <p>${filtrados.length} alunos · Receita mensal ${formatMoney(totalMensalidade)}</p>
      <table>
        <thead><tr><th>Nome</th><th>Turma</th><th>Horário</th><th>Status</th><th>Responsável</th><th>Telefone</th><th>Mensalidade</th><th>Matrícula</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    `, "Relatório de Alunos")
  }

  function exportarCSV() {
    const header = "Nome;Turma;Horário;Status;Responsável;Telefone;Mensalidade;Data Matrícula"
    const rows = filtrados.map((a) =>
      [
        a.nome,
        a.turma,
        a.horario,
        a.status,
        a.responsavel ?? "",
        a.telefone ?? "",
        formatMoney(a.mensalidade),
        format(new Date(a.dataMatricula), "dd/MM/yyyy"),
      ].map(sanitizeCSVCell).join(";")
    )
    const csv = "\uFEFF" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-alunos-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
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
          <SelectTrigger className="h-12 w-36 text-sm" aria-label="Filtrar por turma">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Mensalidade</TableHead>
                  <TableHead>Matrícula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{a.turma}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.horario}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "Ativo" ? "default" : "outline"} className="text-xs">
                        {a.status}
                      </Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}
