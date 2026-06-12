"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadarEvolutionChart, type AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"
import { EvolucaoChart } from "@/components/responsavel/evolucao-chart"
import type { PontoEvolucao } from "@/lib/evolucao"

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
        <select
          value={atual.id}
          onChange={(e) => setAlunoId(Number(e.target.value))}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          aria-label="Selecionar aluno"
        >
          {alunos.map((a) => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
      )}
      {atual.snapshots.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Visão por período</CardTitle></CardHeader>
          <CardContent><RadarEvolutionChart snapshots={atual.snapshots} /></CardContent>
        </Card>
      )}
      {atual.pontos.length >= 2 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Evolução</CardTitle></CardHeader>
          <CardContent><EvolucaoChart pontos={atual.pontos} /></CardContent>
        </Card>
      )}
    </div>
  )
}
