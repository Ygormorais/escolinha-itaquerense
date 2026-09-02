"use client"

import {
  Bar, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { temMensalidades, type InadimplenciaData } from "@/lib/dashboard-charts"

export function ChartInadimplencia({ data }: { data: InadimplenciaData[] }) {
  return (
    <Card data-slot="chart-inadimplencia">
      <CardHeader>
        <CardTitle>Inadimplência — Últimos 6 meses</CardTitle>
        <CardDescription>Mensalidades pagas, vencidas e percentual em atraso.</CardDescription>
      </CardHeader>
      <CardContent className="tabular-nums">
        {temMensalidades(data) ? (
          <>
            <div className="h-60 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} barGap={4} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis yAxisId="quantidade" allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} width={38} />
                  <YAxis yAxisId="taxa" orientation="right" domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(value: number) => `${value}%`} tickLine={false} width={38} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "var(--rule-thin) solid var(--border)", borderRadius: "var(--radius-control)", color: "var(--popover-foreground)" }}
                    formatter={(value, name) => name === "Taxa de inadimplência" ? `${value}%` : `${value} mensalidade(s)`}
                  />
                  <Legend iconSize={10} />
                  <Bar yAxisId="quantidade" dataKey="pagas" name="Pagas" fill="var(--success-600)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="quantidade" dataKey="vencidas" name="Vencidas" fill="var(--danger-600)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="taxa" dataKey="taxa" name="Taxa de inadimplência" type="monotone" stroke="var(--brand-950)" strokeWidth={2} dot={{ r: 3, fill: "var(--paper-raised)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>Mensalidades pagas, vencidas e taxa de inadimplência dos últimos 6 meses</caption>
              <thead><tr><th>Mês</th><th>Pagas</th><th>Vencidas</th><th>Taxa de inadimplência</th></tr></thead>
              <tbody>{data.map((item) => (
                <tr key={item.mes}><th>{item.mes}</th><td>{item.pagas}</td><td>{item.vencidas}</td><td>{item.taxa}%</td></tr>
              ))}</tbody>
            </table>
          </>
        ) : (
          <p className="flex h-60 items-center justify-center text-center text-sm text-muted-foreground">Nenhuma mensalidade registrada nos últimos 6 meses.</p>
        )}
      </CardContent>
    </Card>
  )
}
