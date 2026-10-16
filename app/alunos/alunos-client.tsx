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
import { Label } from "@/components/ui/label"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { FilterBar } from "@/components/ui/filter-bar"
import { toast } from "sonner"
import { inativarAluno, reativarAluno } from "@/app/actions/alunos"
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
  canManage: boolean
}

export function AlunosClient({ alunos, total, page, totalPages, filters, frequenciaBaixa = [], canManage }: AlunosClientProps) {
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
    try {
      const result = await inativarAluno(id)
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Aluno inativado")
      router.refresh()
    } catch {
      toast.error("Erro ao inativar aluno")
    }
  }

  async function handleReativar(id: number) {
    try {
      const result = await reativarAluno(id)
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Aluno reativado")
      router.refresh()
    } catch {
      toast.error("Erro ao reativar aluno")
    }
  }

  function handlePageChange(p: number) {
    router.push(`/alunos?${montarQueryAlunos(filters.q, filters, { chave: "page", valor: p > 1 ? String(p) : "1", padrao: "1" })}`)
  }

  const activeFiltersCount =
    (filters.turma !== "Todas" ? 1 : 0) + (filters.status !== "Todos" ? 1 : 0)

  return (
    <div className="space-y-4">
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Buscar por nome...",
          "aria-label": "Buscar aluno",
        }}
        filters={[
          <div key="turma" className="min-w-0 space-y-1.5">
            <Label id="alunos-turma-label" className="text-xs">Turma</Label>
            <Select value={filters.turma} onValueChange={(v) => pushFilter("turma", v ?? "Todas", "Todas")}>
              <SelectTrigger aria-labelledby="alunos-turma-label" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as turmas</SelectItem>
                {TURMAS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>,
          <div key="status" className="min-w-0 space-y-1.5">
            <Label id="alunos-status-label" className="text-xs">Status</Label>
            <Select value={filters.status} onValueChange={(v) => pushFilter("status", v ?? "Todos", "Todos")}>
              <SelectTrigger aria-labelledby="alunos-status-label" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>,
        ]}
        activeFiltersCount={activeFiltersCount}
        actions={
          <>
            <Link href="/alunos/importar">
              <Button variant="outline">
                <Upload className="size-4" />
                Importar CSV
              </Button>
            </Link>
            <Button variant="outline" onClick={exportarCSV} disabled={alunos.length === 0}>
              <Download className="size-4" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>{plural(total, "aluno encontrado", "alunos encontrados", "nenhum")}</span>
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <AlunosTabela
        alunos={alunos}
        frequenciaBaixa={baixaSet}
        canManage={canManage}
        onInativar={handleInativar}
        onReativar={handleReativar}
      />
    </div>
  )
}
