"use client"

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  alturaGraficoTurmas, formatarMoeda, formatarMoedaCompacta, ordenarReceitaPorTurma,
  type ReceitaTurmaData,
} from "@/lib/dashboard-charts"

export function ChartReceitaPorTurma({ data }: { data: ReceitaTurmaData[] }) {
  const chartData = ordenarReceitaPorTurma(data)

  return (
    <Card data-slot="chart-receita-turma">
      <CardHeader>
        <CardTitle>Receita por Turma — Mês Atual</CardTitle>
        <CardDescription>Turmas ordenadas pelo valor recebido no período.</CardDescription>
      </CardHeader>
      <CardContent className="tabular-nums">
        {chartData.length > 0 ? (
          <>
            <div className="min-w-0" style={{ height: alturaGraficoTurmas(chartData.length) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 72, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={formatarMoedaCompacta} tickLine={false} />
                  <YAxis type="category" dataKey="turma" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} width={64} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "var(--rule-thin) solid var(--border)", borderRadius: "var(--radius-control)", color: "var(--popover-foreground)" }}
                    formatter={(value) => typeof value === "number" ? formatarMoeda(value) : String(value)}
                  />
                  <Bar dataKey="receita" name="Receita recebida" fill="var(--success-600)" radius={[0, 4, 4, 0]} maxBarSize={30}>
                    <LabelList
                      dataKey="receita"
                      position="right"
                      formatter={(value) => typeof value === "number" ? formatarMoedaCompacta(value) : ""}
                      fill="var(--ink-700)"
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>Receita recebida por turma no mês atual</caption>
              <thead><tr><th>Turma</th><th>Receita recebida</th><th>Alunos considerados</th></tr></thead>
              <tbody>{chartData.map((item) => (
                <tr key={item.turma}><th>{item.turma}</th><td>{formatarMoeda(item.receita)}</td><td>{item.alunos}</td></tr>
              ))}</tbody>
            </table>
          </>
        ) : (
          <p className="flex h-46 items-center justify-center text-center text-sm text-muted-foreground">Nenhuma receita por turma registrada neste mês.</p>
        )}
      </CardContent>
    </Card>
  )
}
