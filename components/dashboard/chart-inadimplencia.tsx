"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DataPoint = { mes: string; pagas: number; vencidas: number; taxa: number }

export function ChartInadimplencia({ data }: { data: DataPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inadimplência — Últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EFE6E6" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6B6363" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6B6363" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #EFE6E6" }}
            />
            <Legend />
            <Bar dataKey="pagas" name="Pagas" fill="#0F7A5A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="vencidas" name="Vencidas" fill="#B3261E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
