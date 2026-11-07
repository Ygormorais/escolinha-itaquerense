"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, FileUp, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatMoney, plural } from "@/lib/utils"
import { filtrarDevedores, gerarCSVDevedores, type AlunoDevedor, type FiltroCentral } from "@/lib/central-pagamentos"
import { GerarMensalidades } from "./gerar-mensalidades"

type Situacao = Exclude<FiltroCentral["situacao"], "pagos">

const FILTROS: { rotulo: string; href: string; valor: Situacao | "mes" }[] = [
  { rotulo: "Em aberto", href: "/pagamentos", valor: "aberto" },
  { rotulo: "Atrasados", href: "/pagamentos?filtro=atrasados", valor: "atrasados" },
  { rotulo: "Com desconto", href: "/pagamentos?filtro=com_desconto", valor: "com_desconto" },
  { rotulo: "Mês", href: "/pagamentos?filtro=mes", valor: "mes" },
]

function SeloSituacao({ aluno }: { aluno: AlunoDevedor }) {
  if (aluno.atrasadas > 0) {
    return (
      <span data-situacao="atrasada" className="text-xs font-semibold text-danger-600">
        {plural(aluno.atrasadas, "atrasada", "atrasadas")}
      </span>
    )
  }
  const parcial = aluno.mensalidades.some((m) => m.situacao === "parcial")
  return (
    <span data-situacao={parcial ? "parcial" : "a_vencer"} className="text-xs font-medium text-muted-foreground">
      {parcial ? "paga em parte" : "a vencer"}
    </span>
  )
}

export function CentralClient({
  devedores,
  situacao,
  mesAtual,
  alunoSelecionado,
  painel,
}: {
  devedores: AlunoDevedor[]
  situacao: Situacao
  mesAtual: string
  alunoSelecionado: number | null
  painel?: ReactNode
}) {
  const router = useRouter()
  const [busca, setBusca] = useState("")
  const [turma, setTurma] = useState("")
  const [marcados, setMarcados] = useState<Set<number>>(new Set())

  const turmas = useMemo(() => [...new Set(devedores.map((d) => d.turma))].sort((a, b) => a.localeCompare(b, "pt-BR")), [devedores])
  const lista = useMemo(() => filtrarDevedores(devedores, { busca, situacao, turma }), [devedores, busca, situacao, turma])
  const totalAberto = lista.reduce((soma, a) => soma + a.totalRestante, 0)

  function alternar(id: number) {
    setMarcados((anterior) => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function exportarCSV() {
    const blob = new Blob(["﻿" + gerarCSVDevedores(lista)], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pagamentos-em-aberto-${mesAtual}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtros" className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const ativo = f.valor === situacao
            return (
              <Link
                key={f.valor}
                href={f.href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-[var(--radius-control)] border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  ativo ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:bg-muted",
                )}
              >
                {f.rotulo}
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-wrap gap-2">
          <GerarMensalidades mes={mesAtual} />
          <Button variant="outline" onClick={() => router.push("/pagamentos/importar")}>
            <FileUp className="size-4" />
            Importar extrato
          </Button>
          <Button variant="outline" onClick={exportarCSV} disabled={lista.length === 0}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-label="Quem tem mensalidade em aberto" className="min-w-0 rounded-[var(--radius-card)] border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno ou responsável"
                aria-label="Buscar aluno ou responsável"
                className="pl-9"
              />
            </div>
            <select
              value={turma}
              onChange={(e) => setTurma(e.target.value)}
              aria-label="Filtrar por turma"
              className="h-11 rounded-[var(--radius-control)] border border-input bg-white px-3 text-sm"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground" data-numeric>
            {plural(lista.length, "aluno", "alunos")} · {formatMoney(totalAberto)} em aberto
          </p>

          <ul data-slot="lista-devedores" className="max-h-[70vh] divide-y divide-border overflow-y-auto">
            {lista.length === 0 ? (
              <li className="p-6 text-center text-sm text-muted-foreground">
                {busca || turma || situacao !== "aberto" ? "Ninguém encontrado para esses filtros." : "Nenhuma mensalidade em aberto."}
              </li>
            ) : (
              lista.map((aluno) => {
                const escolhido = aluno.id === alunoSelecionado
                return (
                  <li key={aluno.id} className={cn("flex items-center gap-3 px-3 py-2.5", escolhido && "bg-muted")}>
                    <input
                      type="checkbox"
                      checked={marcados.has(aluno.id)}
                      onChange={() => alternar(aluno.id)}
                      aria-label={`Selecionar ${aluno.nome}`}
                      className="size-4 shrink-0 accent-foreground"
                    />
                    <Link
                      href={`/pagamentos?${new URLSearchParams({ ...(situacao !== "aberto" ? { filtro: situacao } : {}), aluno: String(aluno.id) })}`}
                      scroll={false}
                      aria-current={escolhido ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{aluno.nome}</span>
                        <span className="block truncate text-xs text-muted-foreground">{aluno.turma} · {aluno.responsavel}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-semibold" data-numeric>{formatMoney(aluno.totalRestante)}</span>
                        <SeloSituacao aluno={aluno} />
                      </span>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </section>

        {painel ?? (
          <section aria-label="Aluno" className="min-w-0 rounded-[var(--radius-card)] border border-border bg-card p-6 text-sm text-muted-foreground">
            Escolha um aluno na lista para dar baixa.
          </section>
        )}
      </div>
    </div>
  )
}
