"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { salvarFrequencia, getFrequenciaPorTurmaData } from "@/app/actions/frequencia"

type AlunoFrequencia = { id: number; nome: string; presenca: string | null }
type PresencaValue = "Presente" | "Ausente" | "Justificado"

const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"]
const OPCOES: PresencaValue[] = ["Presente", "Ausente", "Justificado"]

export function FrequenciaClient() {
  const today = format(new Date(), "yyyy-MM-dd")
  const [turma, setTurma] = useState(TURMAS[0])
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
      await salvarFrequencia(registros)
    })
  }

  const presentes = Object.values(presencas).filter((v) => v === "Presente").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Turma</label>
          <Select value={turma} onValueChange={(v) => { setTurma(v); setLoaded(false) }}>
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Data</label>
          <Input
            type="date"
            value={data}
            onChange={(e) => { setData(e.target.value); setLoaded(false) }}
            className="mt-1 w-40"
          />
        </div>
        <Button
          onClick={handleLoad}
          disabled={loading}
          variant="outline"
        >
          {loading ? "Carregando..." : "Carregar"}
        </Button>
      </div>

      {loaded && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {presentes} de {alunos.length} presentes
            </p>
            <Button
              onClick={handleSalvar}
              disabled={saving || alunos.length === 0}
              className="bg-brand-800 text-white hover:bg-brand-900"
            >
              <SaveIcon className="size-4" />
              {saving ? "Salvando..." : "Salvar Frequência"}
            </Button>
          </div>

          <div className="rounded-xl border bg-white">
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
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum aluno ativo nesta turma
                    </TableCell>
                  </TableRow>
                )}
                {alunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
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
                                  ? "bg-green-600 text-white"
                                  : opcao === "Ausente"
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
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
