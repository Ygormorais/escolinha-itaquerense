"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type TurmaRow = {
  turma: string
  total: number
  pagos: number
  inadimplentes: number
  receitaPrevista: number
  receitaRealizada: number
  taxaPagamento: number
  taxaPresenca: number | null
}

export function ExportTurmasButton({ data, mes }: { data: TurmaRow[]; mes: string }) {
  function handleExport() {
    const linhas = [
      ["Turma", "Alunos", "Pagos", "Inadimplentes", "Adimplência %", "Receita Prevista", "Receita Realizada", "Presença %"],
      ...data.map((t) => [
        t.turma,
        String(t.total),
        String(t.pagos),
        String(t.inadimplentes),
        String(t.taxaPagamento),
        t.receitaPrevista.toFixed(2),
        t.receitaRealizada.toFixed(2),
        t.taxaPresenca !== null ? String(t.taxaPresenca) : "—",
      ]),
    ]
    const csv = linhas.map((l) => l.join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `turmas-${mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
      <Download className="size-3.5" />
      Exportar CSV
    </Button>
  )
}
