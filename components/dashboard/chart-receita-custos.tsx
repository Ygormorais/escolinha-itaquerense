"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChartData = { mes: string; recebido: number; custos: number }

export function ChartReceitaCustos({ data }: { data: ChartData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs Custos — Últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
              }
            />
            <Tooltip
              formatter={(v) =>
                (v as number).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
            />
            <Legend />
            <Bar dataKey="recebido" name="Recebido" fill="#C62828" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custos" name="Custos" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
