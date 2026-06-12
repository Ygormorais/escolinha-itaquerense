"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { PontoEvolucao } from "@/lib/evolucao"

const SERIES = [
  { key: "tecnica", nome: "Técnica", cor: "#C62828" },
  { key: "fisica", nome: "Física", cor: "#0F7A5A" },
  { key: "comportamento", nome: "Comportamento", cor: "#A86417" },
  { key: "frequencia", nome: "Frequência", cor: "#6B6363" },
] as const

export function EvolucaoChart({ pontos }: { pontos: PontoEvolucao[] }) {
  if (pontos.length < 2) return null
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 10, right: 20, bottom: 0, left: -20 }}>
          <CartesianGrid stroke="#EFE6E6" strokeDasharray="3 3" />
          <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #EFE6E6" }} />
          <Legend />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.nome}
              stroke={s.cor}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
