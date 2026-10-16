"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { PontoEvolucao } from "./avaliacoes-utils"

/** Evolução das notas de um aluno por período. */
export function AvaliacoesGrafico({ dadosGrafico }: { dadosGrafico: PontoEvolucao[] }) {
  return (
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 text-sm font-semibold">Evolução por período</p>
        <ResponsiveContainer width="100%" height={220} initialDimension={{ width: 640, height: 220 }}>
          <LineChart data={dadosGrafico} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: unknown) => typeof value === "number" ? value.toFixed(1) : String(value)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Técnica" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Física" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Comportamento" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
  )
}
