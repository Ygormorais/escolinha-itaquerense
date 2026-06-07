"use client"

import { useRouter } from "next/navigation"
import { Download, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { formatMoney } from "@/lib/utils"

type MesData = {
  mes: number
  label: string
  receita: number
  custo: number
  saldo: number
}

export function RelatorioHeader({ ano, meses }: { ano: number; meses: MesData[] }) {
  const router = useRouter()

  function exportarCSV() {
    const linhas = [
      ["Mês", "Receita (R$)", "Custos (R$)", "Saldo (R$)"],
      ...meses.map((m) => [
        m.label,
        m.receita.toFixed(2),
        m.custo.toFixed(2),
        m.saldo.toFixed(2),
      ]),
      [
        "Total",
        meses.reduce((s, m) => s + m.receita, 0).toFixed(2),
        meses.reduce((s, m) => s + m.custo, 0).toFixed(2),
        meses.reduce((s, m) => s + m.saldo, 0).toFixed(2),
      ],
    ]
    const csv = linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `relatorio-${ano}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={2020}
        max={2099}
        value={ano}
        onChange={(e) => router.push(`/relatorio?ano=${e.target.value}`)}
        className="w-24"
      />
      <Button variant="outline" onClick={exportarCSV}>
        <Download className="size-4" />
        Exportar CSV
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="size-4" />
        Imprimir PDF
      </Button>
    </div>
  )
}

export function RelatorioPrintStyle() {
  return (
    <style>{`
      @media print {
        aside, header, nav, [aria-label="Navegação principal"], [aria-label="Navegação rápida"] {
          display: none !important;
        }
        .no-print { display: none !important; }
        .relatorio-print { width: 100% !important; padding: 0 !important; }
        main { padding: 0 !important; overflow: visible !important; }
        @page { margin: 1.5cm; size: A4; }
      }
    `}</style>
  )
}

const PIE_COLORS = ["#C62828", "#1565C0", "#2E7D32", "#F57F17", "#6A1B9A", "#00695C", "#4E342E"]

export function RelatorioChart({
  ano,
  meses,
  categorias,
}: {
  ano: number
  meses: MesData[]
  categorias: [string, number][]
}) {
  const fmtCurrency = (v: unknown) =>
    typeof v === "number"
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : String(v)

  const pieData = categorias.map(([name, value]) => ({ name, value }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 p-6 lg:p-8">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Receita × Custos — {ano}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={meses} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EFE6E6" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                }
              />
              <Tooltip formatter={fmtCurrency} />
              <Legend />
              <Bar dataKey="receita" name="Receita" fill="#C62828" radius={[4, 4, 0, 0]} />
              <Bar dataKey="custo" name="Custos" fill="#6B6363" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent }: { percent?: number }) => percent ? `${(percent * 100).toFixed(0)}%` : ""}
                  labelLine={false}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={fmtCurrency} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-col gap-1 w-full">
              {pieData.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="font-medium">
                    {formatMoney(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
