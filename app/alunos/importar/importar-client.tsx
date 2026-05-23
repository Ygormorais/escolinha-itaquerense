"use client"

import { useState, useTransition } from "react"
import { Upload, CheckCircle, AlertCircle, FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { importarAlunosCSV } from "@/app/actions/importar"
import { toast } from "sonner"

type AlunoRow = {
  nome: string; dataNascimento: string; turma: string; horario: string
  responsavel: string; telefone: string; email: string; dataMatricula: string
  mensalidade: number; status?: string; observacoes?: string
}

const COLUNAS = ["nome", "dataNascimento", "turma", "horario", "responsavel", "telefone", "email", "dataMatricula", "mensalidade", "status", "observacoes"]

function parseCSV(text: string): AlunoRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = lines[0].split(/[;,]/).map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase())
  return lines.slice(1).map((line) => {
    const cols = line.split(/[;,]/).map((c) => c.trim().replace(/^"|"$/g, ""))
    const row: Record<string, string> = {}
    header.forEach((h, i) => { row[h] = cols[i] ?? "" })
    return {
      nome: row.nome ?? "",
      dataNascimento: row.datanascimento ?? row["data nascimento"] ?? "",
      turma: row.turma ?? "",
      horario: row.horario ?? "",
      responsavel: row.responsavel ?? "",
      telefone: row.telefone ?? "",
      email: row.email ?? "",
      dataMatricula: row.datamatricula ?? row["data matricula"] ?? "",
      mensalidade: parseFloat(row.mensalidade?.replace(",", ".") ?? "0"),
      status: row.status || "Ativo",
      observacoes: row.observacoes,
    }
  }).filter((r) => r.nome.trim())
}

function baixarTemplate() {
  const header = COLUNAS.join(";")
  const exemplo = `João da Silva;2010-03-15;Sub-13;Terça/Quinta 15h;Maria da Silva;(11) 99999-1234;maria@email.com;2025-01-10;150;Ativo;`
  const csv = `${header}\n${exemplo}`
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = "modelo-importacao-alunos.csv"
  a.click()
}

export function ImportarAlunosClient() {
  const [preview, setPreview] = useState<AlunoRow[]>([])
  const [fileName, setFileName] = useState("")
  const [resultado, setResultado] = useState<{ importados: number; erros: { linha: number; erro: string }[] } | null>(null)
  const [pending, start] = useTransition()

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResultado(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setPreview(parseCSV(text))
    }
    reader.readAsText(file, "UTF-8")
  }

  function handleImportar() {
    start(async () => {
      const r = await importarAlunosCSV(preview)
      if ("error" in r) { toast.error(r.error); return }
      setResultado(r)
      if (r.importados > 0) toast.success(`${r.importados} aluno(s) importado(s) com sucesso`)
      if (r.erros.length > 0) toast.warning(`${r.erros.length} linha(s) com erro`)
    })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-brand-800" />
            Formato do arquivo CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            O arquivo deve ter as seguintes colunas (separador <code className="rounded bg-muted px-1 font-mono text-xs">;</code> ou <code className="rounded bg-muted px-1 font-mono text-xs">,</code>):
          </p>
          <div className="rounded-lg bg-muted px-4 py-3 font-mono text-xs overflow-x-auto whitespace-nowrap">
            {COLUNAS.join(" | ")}
          </div>
          <p className="text-xs text-muted-foreground">
            Datas no formato <strong>AAAA-MM-DD</strong>. Campos opcionais: horario, responsavel, telefone, email, status, observacoes.
          </p>
          <Button variant="outline" size="sm" onClick={baixarTemplate} className="gap-2">
            <Download className="size-4" />
            Baixar modelo CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="size-4 text-brand-800" />
            Upload do arquivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-10 transition-colors hover:bg-muted/60">
            <Upload className="size-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium">{fileName || "Clique para selecionar um arquivo CSV"}</span>
            <span className="text-xs text-muted-foreground mt-1">CSV até 5MB</span>
            <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </label>

          {preview.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {preview.length} linha(s) encontrada(s) — pré-visualização:
              </p>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      {["Nome", "Nasc.", "Turma", "Mensalidade", "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <td className="px-3 py-2 font-medium">{r.nome}</td>
                        <td className="px-3 py-2">{r.dataNascimento}</td>
                        <td className="px-3 py-2">{r.turma}</td>
                        <td className="px-3 py-2">R$ {Number(r.mensalidade).toFixed(2)}</td>
                        <td className="px-3 py-2">{r.status}</td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-muted-foreground">
                          ... e mais {preview.length - 10} linha(s)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!resultado && (
                <Button
                  onClick={handleImportar}
                  disabled={pending}
                  className="bg-brand-800 text-white hover:bg-brand-900"
                >
                  {pending ? "Importando..." : `Importar ${preview.length} aluno(s)`}
                </Button>
              )}
            </div>
          )}

          {resultado && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success-600">
                <CheckCircle className="size-5" />
                <span className="font-medium">{resultado.importados} aluno(s) importado(s) com sucesso</span>
              </div>
              {resultado.erros.length > 0 && (
                <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <div className="flex items-center gap-2 text-danger-700 font-medium mb-2">
                    <AlertCircle className="size-4" />
                    {resultado.erros.length} linha(s) com erro:
                  </div>
                  <ul className="space-y-1 text-xs text-danger-700">
                    {resultado.erros.map((e) => (
                      <li key={e.linha}>Linha {e.linha}: {e.erro}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button variant="outline" onClick={() => { setPreview([]); setFileName(""); setResultado(null) }}>
                Importar outro arquivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
