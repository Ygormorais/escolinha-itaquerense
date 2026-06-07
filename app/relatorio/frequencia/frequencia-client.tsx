"use client"

import { useState, useMemo } from "react"
import { CalendarCheck, Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/layout/page-header"
import { printHTML } from "@/lib/print"
import { sanitizeCSVCell } from "@/lib/utils"

type Stat = {
  id: number
  nome: string
  turma: string
  totalAulas: number
  totalPresencas: number
  percentual: number
}

export function RelatorioFrequenciaClient({ stats, turmas, mesAtual }: { stats: Stat[]; turmas: string[]; mesAtual: string }) {
  const [filtroTurma, setFiltroTurma] = useState("todas")
  const [filtroFreq, setFiltroFreq] = useState("todos")

  const filtrados = useMemo(() => {
    return stats.filter((s) => {
      if (filtroTurma !== "todas" && s.turma !== filtroTurma) return false
      if (filtroFreq === "altas" && s.percentual < 75) return false
      if (filtroFreq === "risco" && s.percentual >= 75) return false
      if (filtroFreq === "baixas" && s.percentual >= 50) return false
      if (filtroFreq === "criticas" && s.percentual >= 25) return false
      return true
    })
  }, [stats, filtroTurma, filtroFreq])

  const emRisco = stats.filter((s) => s.percentual < 75 && s.totalAulas > 0).length

  const mediaGeral = stats.length > 0
    ? Math.round(stats.reduce((s, a) => s + a.percentual, 0) / stats.length)
    : 0

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
    const csv = "\uFEFF" + header + "\n" + rows.join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-frequencia-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const freqColor = (p: number) =>
    p >= 75 ? "text-success-600" : p >= 50 ? "text-warning-600" : "text-danger-600"

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Relatório de Frequência"
        description={`${filtrados.length} alunos · Média ${mediaGeral}% · ${mesAtual}`}
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
            <CalendarCheck className="size-4" /> Frequência por Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="text-center">Aulas</TableHead>
                  <TableHead className="text-center">Presenças</TableHead>
                  <TableHead className="text-center">Frequência</TableHead>
                  <TableHead className="w-32">Barra</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{s.turma}</Badge></TableCell>
                    <TableCell className="text-center text-sm">{s.totalAulas}</TableCell>
                    <TableCell className="text-center text-sm">{s.totalPresencas}</TableCell>
                    <TableCell className={`text-center text-sm font-semibold ${freqColor(s.percentual)}`}>
                      {s.percentual}%
                    </TableCell>
                    <TableCell>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${s.percentual >= 75 ? "bg-success-600" : s.percentual >= 50 ? "bg-warning-600" : "bg-danger-600"}`}
                          style={{ width: `${s.percentual}%` }}
                        />
                      </div>
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
