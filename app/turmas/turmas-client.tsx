"use client"

import { useState, useMemo } from "react"
import { plural, formatMoney } from "@/lib/utils"
import Link from "next/link"
import { Phone, MessageCircle, TrendingUp, Search, Filter, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"

type Aluno = {
  id: number
  nome: string
  turma: string
  horario: string
  telefone: string
  responsavel: string
  status: string
  mensalidade: number
  pagamentos: { id: number }[]
}

export function TurmasClient({
  alunos,
  turmas,
  capacidade,
}: {
  alunos: Aluno[]
  turmas: readonly string[]
  capacidade: number
}) {
  const [filtroStatus, setFiltroStatus] = useState<string>("Ativo")
  const [search, setSearch] = useState("")

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) => {
      if (filtroStatus !== "todos" && a.status !== filtroStatus) return false
      if (search && !a.nome.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [alunos, filtroStatus, search])

  const turmasData = turmas.map((turma) => {
    const membros = alunosFiltrados.filter((a) => a.turma === turma)
    const totalInadimplentes = membros.filter((a) => a.pagamentos.length > 0).length
    const receitaMensal = membros.reduce((s, a) => s + a.mensalidade, 0)
    const pct = capacidade > 0 ? Math.min(100, Math.round((membros.length / capacidade) * 100)) : 0
    const ativos = membros.filter((a) => a.status === "Ativo").length
    const inativos = membros.filter((a) => a.status !== "Ativo").length
    return { turma, membros, totalInadimplentes, receitaMensal, pct, ativos, inativos }
  })

  const totalExibidos = alunosFiltrados.length

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Turmas"
        description={`${plural(totalExibidos, "aluno", "alunos", "nenhum")} em ${plural(turmas.length, "turma", "turmas", "nenhuma")}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="size-4 text-muted-foreground" />
          {["todos", "Ativo", "Inativo"].map((s) => (
            <Button
              key={s}
              variant={filtroStatus === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus(s)}
              className="text-xs capitalize"
            >
              {s === "todos" ? "Todos" : s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {turmasData.map(({ turma, membros, totalInadimplentes, receitaMensal, pct, ativos, inativos }) => (
          <Card key={turma} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{turma}</CardTitle>
                <div className="flex items-center gap-2">
                  {totalInadimplentes > 0 && (
                    <Badge className="bg-danger-50 text-danger-600 text-xs">
                      {totalInadimplentes} inad.
                    </Badge>
                  )}
                  {inativos > 0 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {inativos} inat.
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {membros.length}/{capacidade}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-danger-600" : pct >= 70 ? "bg-warning-600" : "bg-success-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{pct}% ocupado · {plural(ativos, "ativo", "ativos", "nenhum")}</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  {formatMoney(receitaMensal)}/mês
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {membros.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Users className="size-7 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhum aluno nesta turma</p>
                </div>
              ) : (
                <div className="divide-y divide-muted">
                  {membros.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-6 py-2.5 transition-colors hover:bg-muted/40">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/alunos/${a.id}`}
                            className="text-sm font-medium hover:text-brand-800 hover:underline truncate"
                          >
                            {a.nome}
                          </Link>
                          {a.status !== "Ativo" && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 leading-none">
                              {a.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {a.horario} · {a.responsavel?.split(" ")[0] ?? "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {a.pagamentos.length > 0 && (
                          <Badge className="bg-danger-50 text-danger-600 text-xs px-1.5 py-0">
                            atrasado
                          </Badge>
                        )}
                        {a.telefone && (
                          <a
                            href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${a.responsavel?.split(" ")[0] ?? ""}!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-6 rounded text-success-600 hover:bg-success-50 transition-colors"
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        )}
                        <a
                          href={`tel:${a.telefone}`}
                          className="inline-flex items-center justify-center size-6 rounded text-brand-800 hover:bg-brand-50 transition-colors"
                          aria-label="Ligar"
                        >
                          <Phone className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
