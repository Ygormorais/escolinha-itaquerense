"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Download, Upload } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { plural } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import { TURMAS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { inativarAluno, reativarAluno } from "@/app/actions/alunos"
import { AlunosListaMobile } from "./alunos-lista-mobile"
import { AlunosTabela } from "./alunos-tabela"
import { gerarCSVAlunos, montarQueryAlunos, type Aluno, type FiltrosAlunos } from "./alunos-utils"

export { AlunoFormDialog, NovoAlunoButton } from "./aluno-form-dialog"

type AlunosClientProps = {
  alunos: Aluno[]
  total: number
  page: number
  totalPages: number
  filters: FiltrosAlunos
  frequenciaBaixa?: number[]
}

export function AlunosClient({ alunos, total, page, totalPages, filters, frequenciaBaixa = [] }: AlunosClientProps) {
  const baixaSet = new Set(frequenciaBaixa)
  const [search, setSearch] = useState(filters.q)
  const debouncedSearch = useDebounce(search, 350)
  const router = useRouter()

  useEffect(() => {
    router.push(`/alunos?${montarQueryAlunos(debouncedSearch, { turma: filters.turma, status: filters.status })}`)
  }, [debouncedSearch, filters.turma, filters.status, router])

  function pushFilter(key: string, value: string, defaultVal: string) {
    router.push(`/alunos?${montarQueryAlunos(debouncedSearch, filters, { chave: key, valor: value, padrao: defaultVal })}`)
  }

  function exportarCSV() {
    const csv = gerarCSVAlunos(alunos)
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `alunos.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleInativar(id: number) {
    const result = await inativarAluno(id)
    if ("error" in result) { toast.error(result.error); return }
    toast.success("Aluno inativado")
    router.refresh()
  }

  async function handleReativar(id: number) {
    const result = await reativarAluno(id)
    if ("error" in result) { toast.error(result.error); return }
    toast.success("Aluno reativado")
    router.refresh()
  }

  function handlePageChange(p: number) {
    router.push(`/alunos?${montarQueryAlunos(filters.q, filters, { chave: "page", valor: p > 1 ? String(p) : "1", padrao: "1" })}`)
  }

  return (
    <div className="space-y-4">
      <div data-slot="student-filter-bar" className="grid min-w-0 gap-3 rounded-[var(--radius-card)] border bg-card p-4 xl:grid-cols-[minmax(14rem,1fr)_11rem_10rem_minmax(17rem,auto)] xl:items-end">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="alunos-busca" className="text-xs">Buscar aluno</Label>
          <Input
            id="alunos-busca"
            type="search"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label id="alunos-turma-label" className="text-xs">Turma</Label>
          <Select value={filters.turma} onValueChange={(v) => pushFilter("turma", v ?? "Todas", "Todas")}>
            <SelectTrigger aria-labelledby="alunos-turma-label" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as turmas</SelectItem>
              {TURMAS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label id="alunos-status-label" className="text-xs">Status</Label>
          <Select value={filters.status} onValueChange={(v) => pushFilter("status", v ?? "Todos", "Todos")}>
            <SelectTrigger aria-labelledby="alunos-status-label" className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os status</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <Link href="/alunos/importar" className="min-w-0">
            <Button variant="outline" className="h-12 w-full">
              <Upload className="size-4" />
              Importar CSV
            </Button>
          </Link>
          <Button variant="outline" className="h-12 w-full" onClick={exportarCSV} disabled={alunos.length === 0}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{plural(total, "aluno encontrado", "alunos encontrados", "nenhum")}</span>
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <AlunosListaMobile alunos={alunos} frequenciaBaixa={baixaSet} onInativar={handleInativar} onReativar={handleReativar} />

      <AlunosTabela alunos={alunos} frequenciaBaixa={baixaSet} onInativar={handleInativar} onReativar={handleReativar} />
    </div>
  )
}
