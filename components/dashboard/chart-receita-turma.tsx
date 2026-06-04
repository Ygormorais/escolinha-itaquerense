"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DataPoint = { turma: string; receita: number; alunos: number }

export function ChartReceitaPorTurma({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita por Turma — Mês Atual</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#EFE6E6" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#6B6363" }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
              }
            />
            <YAxis type="category" dataKey="turma" tick={{ fontSize: 12, fill: "#6B6363" }} width={60} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #EFE6E6" }}
              formatter={(v: unknown) =>
                typeof v === "number"
                  ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : String(v)
              }
            />
            <Bar dataKey="receita" name="Receita" fill="#C62828" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
