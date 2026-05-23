"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { getFrequenciaAluno } from "@/app/actions/frequencia"

type Ponto = { label: string; total: number; presentes: number; pct: number | null }

export function FrequenciaChart({ alunoId }: { alunoId: number }) {
  const [data, setData] = useState<Ponto[]>([])

  useEffect(() => {
    getFrequenciaAluno(alunoId).then(setData)
  }, [alunoId])

  const temDados = data.some((d) => d.total > 0)
  if (!temDados) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presença — últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: number | null) => (v !== null ? `${v}%` : "Sem dados")}
              labelFormatter={(l) => `Mês: ${l}`}
            />
            <Bar dataKey="pct" name="% Presença" radius={[4, 4, 0, 0]}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={
                    entry.pct === null ? "#e2e8f0"
                    : entry.pct >= 75 ? "#16a34a"
                    : entry.pct >= 50 ? "#ca8a04"
                    : "#dc2626"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
