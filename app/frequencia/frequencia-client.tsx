"use client"

import { useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import { SaveIcon, Printer, QrCode, ClipboardList, Loader2, Download, RefreshCw, Users } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { salvarFrequencia, getFrequenciaPorTurmaData } from "@/app/actions/frequencia"
import { Label } from "@/components/ui/label"
import { TURMAS } from "@/lib/constants"
import { sanitizeCSVCell } from "@/lib/utils"

type AlunoFrequencia = { id: number; nome: string; presenca: string | null }
type PresencaValue = "Presente" | "Ausente" | "Justificado"

const OPCOES: PresencaValue[] = ["Presente", "Ausente", "Justificado"]

export function FrequenciaClient({ turmaInicial }: { turmaInicial?: string }) {
  const today = format(new Date(), "yyyy-MM-dd")
  const [turma, setTurma] = useState(turmaInicial ?? TURMAS[0])
  const [data, setData] = useState(today)
  const [alunos, setAlunos] = useState<AlunoFrequencia[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, startSaving] = useTransition()
  const [loading, startLoading] = useTransition()
  const [presencas, setPresencas] = useState<Record<number, PresencaValue>>({})

  function handleLoad() {
    startLoading(async () => {
      const result = await getFrequenciaPorTurmaData(turma, data)
      setAlunos(result)
      const initial: Record<number, PresencaValue> = {}
      for (const a of result) {
        if (a.presenca) initial[a.id] = a.presenca as PresencaValue
      }
      setPresencas(initial)
      setLoaded(true)
    })
  }

  // Auto-recarrega ao trocar turma ou data.
  useEffect(() => {
    handleLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turma, data])

  function togglePresenca(id: number, value: PresencaValue) {
    setPresencas((prev) => ({ ...prev, [id]: value }))
  }

  function handleSalvar() {
    const registros = alunos.map((a) => ({
      alunoId: a.id,
      data,
      presenca: presencas[a.id] ?? "Ausente",
    }))
    startSaving(async () => {
      const result = await salvarFrequencia(registros)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Frequência salva")
      }
    })
  }

  const presentes = Object.values(presencas).filter((v) => v === "Presente").length

  function marcarTodos(opcao: PresencaValue) {
    const todos: Record<number, PresencaValue> = {}
    for (const a of alunos) todos[a.id] = opcao
    setPresencas(todos)
  }

  function handleImprimir() {
    const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR")
    const linhas = alunos.map((a) => `<tr><td>${a.nome}</td><td style="width:80px"></td><td style="width:80px"></td><td style="width:80px"></td></tr>`).join("")
    const html = `<html><head><style>
      body{font-family:sans-serif;padding:24px}
      h2{margin-bottom:4px}p{margin:0 0 16px;color:#666}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:8px 12px;text-align:left}
      th{background:#f1f5f9;font-size:12px;text-transform:uppercase}
    </style></head><body>
      <h2>Lista de Presença — ${turma}</h2>
      <p>Data: ${dataFormatada}</p>
      <table><thead><tr><th>Aluno</th><th>Presente</th><th>Ausente</th><th>Justificado</th></tr></thead>
      <tbody>${linhas}</tbody></table>
    </body></html>`
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.print()
  }

  function exportarCSV() {
    const linhas = [
      ["Aluno", "Turma", "Data", "Presença"],
      ...alunos.map((a) => [
        a.nome,
        turma,
        new Date(data + "T12:00:00").toLocaleDateString("pt-BR"),
        presencas[a.id] ?? "Ausente",
      ]),
    ]
    const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `frequencia-${turma.replace(/\s+/g, "-")}-${data}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 p-6 lg:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="block text-muted-foreground">Turma</Label>
          <Select value={turma} onValueChange={(v) => { if (v) setTurma(v) }}>
            <SelectTrigger className="mt-1 h-12 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="freq-data" className="block text-muted-foreground">Data</Label>
          <Input
            id="freq-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1 w-40"
          />
        </div>
        <Button onClick={handleLoad} disabled={loading} variant="outline" className="h-12" title="Recarregar">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        </Button>
        <Link href={`/frequencia/scanner?data=${data}`}>
          <Button variant="outline" className="h-12 gap-2"><QrCode className="size-4" /> Scanner QR</Button>
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin opacity-40" />
          <p className="text-sm">Carregando...</p>
        </div>
      )}

      {!loaded && !loading && (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <ClipboardList className="size-10 opacity-30" />
          <p className="text-sm">Selecione a turma e a data.</p>
        </div>
      )}

      {loaded && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {presentes} de {alunos.length} presentes
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => marcarTodos("Presente")}
                  className="h-7 rounded-full bg-success-100 px-2.5 text-xs font-medium text-success-700 hover:bg-success-200 border-0"
                >
                  Todos presentes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => marcarTodos("Ausente")}
                  className="h-7 rounded-full bg-danger-100 px-2.5 text-xs font-medium text-danger-700 hover:bg-danger-200 border-0"
                >
                  Todos ausentes
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportarCSV} disabled={alunos.length === 0}>
                <Download className="size-4" />
                Exportar CSV
              </Button>
              <Button
                variant="outline"
                onClick={handleImprimir}
                disabled={alunos.length === 0}
              >
                <Printer className="size-4" />
                Imprimir PDF
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={saving || alunos.length === 0}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
                {saving ? "Salvando..." : "Salvar Frequência"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <Users className="size-7 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Nenhum aluno ativo nesta turma</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {alunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">
                      <Link href={`/alunos/${aluno.id}`} className="hover:underline text-brand-800">{aluno.nome}</Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {OPCOES.map((opcao) => (
                          <button
                            key={opcao}
                            type="button"
                            onClick={() => togglePresenca(aluno.id, opcao)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              presencas[aluno.id] === opcao
                                ? opcao === "Presente"
                                  ? "bg-success-600 text-white"
                                  : opcao === "Ausente"
                                  ? "bg-danger-600 text-white"
                                  : "bg-info-600 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
