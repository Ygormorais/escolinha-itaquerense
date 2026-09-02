"use client"

import { useEffect, useState, useTransition } from "react"
import { format } from "date-fns"
import { SaveIcon, Printer, QrCode, ClipboardList, Loader2, Download, RefreshCw, Users, WifiOff } from "lucide-react"
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
import { appendPrintElement, buildInternalHref, openPrintDocument } from "@/lib/browser-safety"

type AlunoFrequencia = { id: number; nome: string; presenca: string | null }
type PresencaValue = "Presente" | "Ausente" | "Justificado"

const OPCOES: PresencaValue[] = ["Presente", "Ausente", "Justificado"]
const FILA_FREQUENCIA_KEY = "escolinha:frequencia:manual-offline:v1"
type ItemFila = { chave: string; registros: { alunoId: number; data: string; presenca: string }[]; criadoEm: string }
const lerFila = (): ItemFila[] => { try { const valor = JSON.parse(localStorage.getItem(FILA_FREQUENCIA_KEY) ?? "[]"); return Array.isArray(valor) ? valor : [] } catch { return [] } }
const gravarFila = (fila: ItemFila[]) => localStorage.setItem(FILA_FREQUENCIA_KEY, JSON.stringify(fila))

const FREQUENCIA_PRINT_STYLES = `
  body { font-family: sans-serif; padding: 24px; }
  h2 { margin-bottom: 4px; }
  p { margin: 0 0 16px; color: #666; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; }
  th:not(:first-child), td:not(:first-child) { width: 80px; }
`

export function FrequenciaClient({ turmaInicial }: { turmaInicial?: string }) {
  const today = format(new Date(), "yyyy-MM-dd")
  const [turma, setTurma] = useState(turmaInicial ?? TURMAS[0])
  const [data, setData] = useState(today)
  const [alunos, setAlunos] = useState<AlunoFrequencia[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, startSaving] = useTransition()
  const [loading, startLoading] = useTransition()
  const [presencas, setPresencas] = useState<Record<number, PresencaValue>>({})
  const [pendentesOffline, setPendentesOffline] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)

  async function sincronizarFila() {
    if (!navigator.onLine || sincronizando) return
    const fila = lerFila(); if (!fila.length) return
    setSincronizando(true)
    const restantes: ItemFila[] = []
    let enviados = 0
    for (const item of fila) {
      try { const resposta = await salvarFrequencia(item.registros); if ("error" in resposta) restantes.push(item); else enviados++ } catch { restantes.push(item) }
    }
    gravarFila(restantes); setPendentesOffline(restantes.length); setSincronizando(false)
    if (enviados) toast.success(`${enviados} lançamento(s) offline sincronizado(s).`)
  }

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

  useEffect(() => {
    const online = () => void sincronizarFila()
    window.addEventListener("online", online)
    const inicializacao = window.setTimeout(() => {
      setPendentesOffline(lerFila().length)
      if (navigator.onLine) void sincronizarFila()
    }, 0)
    return () => { window.clearTimeout(inicializacao); window.removeEventListener("online", online) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      if (!navigator.onLine) {
        const chave = `${turma}:${data}`; const fila = lerFila().filter((item) => item.chave !== chave); const nova = [...fila, { chave, registros, criadoEm: new Date().toISOString() }]; gravarFila(nova); setPendentesOffline(nova.length); toast.success("Frequência salva no aparelho para sincronização."); return
      }
      try { const result = await salvarFrequencia(registros); if ("error" in result) toast.error(result.error); else toast.success("Frequência salva") } catch { const chave = `${turma}:${data}`; const fila = lerFila().filter((item) => item.chave !== chave); const nova = [...fila, { chave, registros, criadoEm: new Date().toISOString() }]; gravarFila(nova); setPendentesOffline(nova.length); toast.success("Conexão indisponível. Frequência guardada no aparelho.") }
    })
  }

  const presentes = Object.values(presencas).filter((v) => v === "Presente").length
  const scannerHref = buildInternalHref("/frequencia/scanner", { data })

  function marcarTodos(opcao: PresencaValue) {
    const todos: Record<number, PresencaValue> = {}
    for (const a of alunos) todos[a.id] = opcao
    setPresencas(todos)
  }

  function handleImprimir() {
    const dataFormatada = new Date(data + "T12:00:00").toLocaleDateString("pt-BR")

    openPrintDocument({
      title: `Lista de Presença — ${turma}`,
      styles: FREQUENCIA_PRINT_STYLES,
      render(document, body) {
        appendPrintElement(document, body, "h2", { text: `Lista de Presença — ${turma}` })
        appendPrintElement(document, body, "p", { text: `Data: ${dataFormatada}` })

        const table = appendPrintElement(document, body, "table")
        const header = appendPrintElement(document, appendPrintElement(document, table, "thead"), "tr")
        for (const label of ["Aluno", "Presente", "Ausente", "Justificado"]) {
          appendPrintElement(document, header, "th", { text: label })
        }

        const tableBody = appendPrintElement(document, table, "tbody")
        for (const aluno of alunos) {
          const row = appendPrintElement(document, tableBody, "tr")
          appendPrintElement(document, row, "td", { text: aluno.nome })
          appendPrintElement(document, row, "td")
          appendPrintElement(document, row, "td")
          appendPrintElement(document, row, "td")
        }
      },
    })
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
        <Link href={scannerHref}>
          <Button variant="outline" className="h-12 gap-2"><QrCode className="size-4" /> Scanner QR</Button>
        </Link>
      </div>

      {pendentesOffline > 0 && <div className="flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between" role="status"><div className="flex items-start gap-2"><WifiOff className="mt-0.5 size-5 text-warning-700" aria-hidden /><div><p className="font-semibold text-warning-900">{pendentesOffline} lançamento(s) aguardando sincronização</p><p className="text-xs text-warning-800">Os dados permanecem neste aparelho até a confirmação do servidor.</p></div></div><Button size="sm" variant="outline" disabled={sincronizando} onClick={() => void sincronizarFila()}>{sincronizando ? "Sincronizando..." : "Sincronizar agora"}</Button></div>}

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
                  className="h-7 rounded-full bg-success-50 px-2.5 text-xs font-medium text-success-600 hover:bg-success-50/80 border border-success-600/20"
                >
                  Todos presentes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => marcarTodos("Ausente")}
                  className="h-7 rounded-full bg-danger-50 px-2.5 text-xs font-medium text-danger-600 hover:bg-danger-50/80 border border-danger-600/20"
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
                  <TableRow key={aluno.id} className="hover:bg-muted/40 transition-colors">
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
