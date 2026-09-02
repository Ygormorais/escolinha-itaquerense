"use client"

import {
  Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  adicionarSaldo, formatarMoeda, formatarMoedaCompacta, temMovimentoFinanceiro,
  type ReceitaCustoData,
} from "@/lib/dashboard-charts"

export function ChartReceitaCustos({ data }: { data: ReceitaCustoData[] }) {
  const chartData = adicionarSaldo(data)

  return (
    <Card data-slot="chart-receita-custos">
      <CardHeader>
        <CardTitle>Receita vs Custos — Últimos 6 meses</CardTitle>
        <CardDescription>Entradas, saídas e saldo de cada mês.</CardDescription>
      </CardHeader>
      <CardContent className="tabular-nums">
        {temMovimentoFinanceiro(data) ? (
          <>
            <div className="h-60 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} barGap={4} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} />
                  <YAxis
                    domain={[
                      (minimum: number) => Math.min(0, minimum),
                      (maximum: number) => Math.max(0, maximum),
                    ]}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickFormatter={formatarMoedaCompacta}
                    tickLine={false}
                    width={58}
                  />
                  <ReferenceLine y={0} stroke="var(--ink-300)" />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "var(--rule-thin) solid var(--border)", borderRadius: "var(--radius-control)", color: "var(--popover-foreground)" }}
                    formatter={(value) => typeof value === "number" ? formatarMoeda(value) : String(value)}
                  />
                  <Legend iconSize={10} />
                  <Bar dataKey="recebido" name="Recebido" fill="var(--success-600)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" name="Custos" fill="var(--ink-500)" radius={[4, 4, 0, 0]} />
                  <Line dataKey="saldo" name="Saldo" type="monotone" stroke="var(--brand-800)" strokeWidth={2} dot={{ r: 3, fill: "var(--paper-raised)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>Receita, custos e saldo mensal dos últimos 6 meses</caption>
              <thead><tr><th>Mês</th><th>Recebido</th><th>Custos</th><th>Saldo</th></tr></thead>
              <tbody>{chartData.map((item) => (
                <tr key={item.mes}><th>{item.mes}</th><td>{formatarMoeda(item.recebido)}</td><td>{formatarMoeda(item.custos)}</td><td>{formatarMoeda(item.saldo)}</td></tr>
              ))}</tbody>
            </table>
          </>
        ) : (
          <p className="flex h-60 items-center justify-center text-center text-sm text-muted-foreground">Nenhum valor registrado nos últimos 6 meses.</p>
        )}
      </CardContent>
    </Card>
  )
}
