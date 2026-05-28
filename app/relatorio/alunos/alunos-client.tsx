"use client"

import { useState, useMemo } from "react"
import { Users, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"

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

  const filtrados = useMemo(() => {
    return alunos.filter((a) => {
      if (filtroTurma !== "todas" && a.turma !== filtroTurma) return false
      if (filtroStatus === "ativos" && a.status !== "Ativo") return false
      if (filtroStatus === "inativos" && a.status === "Ativo") return false
      return true
    })
  }, [alunos, filtroTurma, filtroStatus])

  const totalMensalidade = filtrados
    .filter((a) => a.status === "Ativo")
    .reduce((s, a) => s + a.mensalidade, 0)

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
        `R$ ${a.mensalidade.toFixed(2)}`,
        format(new Date(a.dataMatricula), "dd/MM/yyyy"),
      ].join(";")
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
        description={`${filtrados.length} alunos · Receita mensal R$ ${totalMensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
        action={
          <Button size="sm" onClick={exportarCSV}>
            <Download className="size-4 mr-1" /> Exportar CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filtroTurma}
          onChange={(e) => setFiltroTurma(e.target.value)}
        >
          <option value="todas">Todas turmas</option>
          {turmas.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
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
                    <TableCell className="text-right text-sm">R$ {a.mensalidade.toFixed(2)}</TableCell>
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
