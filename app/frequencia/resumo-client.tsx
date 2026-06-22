"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { sanitizeCSVCell } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MonthInput } from "@/components/ui/month-input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Download, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { getResumoFrequenciaMes, getPresencaPorTurma } from "@/app/actions/frequencia"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TURMAS } from "@/lib/constants"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

type Resumo = {
  id: number
  nome: string
  total: number
  presentes: number
  ausentes: number
  justificados: number
  pct: number | null
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground text-xs">—</span>
  const cor =
    pct >= 75 ? "bg-success-50 text-success-600" :
    pct >= 50 ? "bg-warning-50 text-warning-600" :
    "bg-danger-50 text-danger-600"
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cor}`}>
      {pct}%
    </span>
  )
}

function exportarCSV(resumo: Resumo[], turma: string, mes: string) {
  const linhas = [
    ["Aluno", "Aulas", "Presentes", "Ausentes", "Justificados", "% Presença"],
    ...resumo.map((r) => [
      r.nome,
      String(r.total),
      String(r.presentes),
      String(r.ausentes),
      String(r.justificados),
      r.pct !== null ? `${r.pct}%` : "—",
    ]),
  ]
  const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `frequencia-${turma}-${mes}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ResumoFrequenciaClient() {
  const now = new Date()
  const mesAtual = format(now, "yyyy-MM")
  const [turma, setTurma] = useState(TURMAS[0])
  const [mes, setMes] = useState(mesAtual)
  const [resumo, setResumo] = useState<Resumo[]>([])
  const [porTurma, setPorTurma] = useState<{ turma: string; pct: number }[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, startLoading] = useTransition()

  function handleCarregar() {
    startLoading(async () => {
      const [data, turmaData] = await Promise.all([
        getResumoFrequenciaMes(turma, mes),
        getPresencaPorTurma(mes),
      ])
      setResumo(data)
      setPorTurma(turmaData)
      setLoaded(true)
    })
  }

  return (
    <div className="space-y-4 p-6 lg:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-muted-foreground">Turma</Label>
          <Select value={turma} onValueChange={(v) => { if (v) { setTurma(v); setLoaded(false) } }}>
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="resumo-mes" className="text-muted-foreground">Mês</Label>
          <MonthInput
            id="resumo-mes"
            value={mes}
            onChange={(v) => { setMes(v); setLoaded(false) }}
            className="mt-1"
          />
        </div>
        <Button onClick={handleCarregar} disabled={loading} variant="outline">
          {loading ? <><Loader2 className="size-4 animate-spin" /> Carregando...</> : "Gerar Resumo"}
        </Button>
        {loaded && resumo.length > 0 && (
          <Button variant="outline" onClick={() => exportarCSV(resumo, turma, mes)}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {loaded && porTurma.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presença por Turma — {mes}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porTurma} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFE6E6" />
                <XAxis dataKey="turma" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: unknown) => (typeof v === "number" ? `${v}%` : String(v))} />
                <Bar dataKey="pct" name="% Presença" radius={[4, 4, 0, 0]}>
                  {porTurma.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.pct >= 75 ? "#0F7A5A" : entry.pct >= 50 ? "#A86417" : "#B3261E"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loaded && resumo.length > 0 && (() => {
        const media = resumo.filter((r) => r.pct !== null).reduce((s, r) => s + (r.pct ?? 0), 0) / (resumo.filter((r) => r.pct !== null).length || 1)
        const emRisco = resumo.filter((r) => r.pct !== null && r.pct < 75).length
        const perfeitos = resumo.filter((r) => r.pct === 100).length
        return (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Alunos</p>
              <p className="mt-1 text-2xl font-extrabold text-brand-800">{resumo.length}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Presença</p>
              <p className={`mt-1 text-2xl font-extrabold ${media >= 75 ? "text-success-700" : media >= 50 ? "text-warning-600" : "text-danger-600"}`}>{media.toFixed(0)}%</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Em Risco &lt;75%</p>
              <p className={`mt-1 text-2xl font-extrabold ${emRisco > 0 ? "text-warning-600" : "text-success-700"}`}>{emRisco}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Presença Perfeita</p>
              <p className="mt-1 text-2xl font-extrabold text-success-700">{perfeitos}</p>
            </div>
          </div>
        )
      })()}

      {loaded && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead className="text-center">Aulas</TableHead>
                <TableHead className="text-center">Presentes</TableHead>
                <TableHead className="text-center">Ausentes</TableHead>
                <TableHead className="text-center">Justificados</TableHead>
                <TableHead className="text-center">% Presença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumo.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum registro de frequência neste período
                  </TableCell>
                </TableRow>
              )}
              {resumo.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/alunos/${r.id}`} className="hover:underline text-brand-800">{r.nome}</Link>
                  </TableCell>
                  <TableCell className="text-center">{r.total || "—"}</TableCell>
                  <TableCell className="text-center text-success-600">{r.presentes || "—"}</TableCell>
                  <TableCell className="text-center text-danger-600">{r.ausentes || "—"}</TableCell>
                  <TableCell className="text-center text-info-600">{r.justificados || "—"}</TableCell>
                  <TableCell className="text-center">
                    <PctBadge pct={r.pct} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
