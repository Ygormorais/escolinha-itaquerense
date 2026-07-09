"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"
import type { PontoEvolucao } from "@/lib/evolucao"

const RadarEvolutionChart = dynamic(
  () => import("@/components/responsavel/radar-evolution-chart").then((m) => m.RadarEvolutionChart),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />, ssr: false },
)
const EvolucaoChart = dynamic(
  () => import("@/components/responsavel/evolucao-chart").then((m) => m.EvolucaoChart),
  { loading: () => <div className="h-56 animate-pulse rounded-xl bg-muted" />, ssr: false },
)

type AlunoDesempenho = {
  id: number
  nome: string
  snapshots: AvaliacaoSnapshot[]
  pontos: PontoEvolucao[]
}

export function DesempenhoAlunoSwitcher({ alunos }: { alunos: AlunoDesempenho[] }) {
  const [alunoId, setAlunoId] = useState(alunos[0]?.id)
  const atual = alunos.find((a) => a.id === alunoId) ?? alunos[0]
  if (!atual) return null

  return (
    <div className="space-y-4">
      {alunos.length > 1 && (
        <label className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-ink-700)]">
          Aluno
          <select
            value={atual.id}
            onChange={(e) => setAlunoId(Number(e.target.value))}
            className="rounded-xl border border-brand-200 bg-[var(--color-paper-50)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-950)] shadow-sm outline-none ring-brand-600/20 focus:ring-2 dark:bg-card"
          >
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </label>
      )}
      {atual.snapshots.length > 0 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-black/5 pb-3">
            <CardTitle className="font-heading text-lg font-extrabold">Visão por período</CardTitle>
          </CardHeader>
          <CardContent className="pt-4"><RadarEvolutionChart snapshots={atual.snapshots} /></CardContent>
        </Card>
      )}
      {atual.pontos.length >= 2 && (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-black/5 pb-3">
            <CardTitle className="font-heading text-lg font-extrabold">Evolução</CardTitle>
          </CardHeader>
          <CardContent className="pt-4"><EvolucaoChart pontos={atual.pontos} /></CardContent>
        </Card>
      )}
    </div>
  )
}
