"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart2 } from "lucide-react"

type Pagamento = {
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
}

type Props = {
  pagamentos: Pagamento[]
}

function getStatus(p: Pagamento): "Pago" | "Vencido" | "Pendente" {
  if (p.dataPagamento) return "Pago"
  if (new Date(p.dataVencimento) < new Date()) return "Vencido"
  return "Pendente"
}

const COR: Record<string, string> = {
  Pago: "#0F7A5A",
  Vencido: "#B3261E",
  Pendente: "#6B6363",
}

export function AdimplenciaChart({ pagamentos }: Props) {
  // últimos 12 meses ordenados
  const sorted = [...pagamentos]
    .sort((a, b) => a.mesReferencia.localeCompare(b.mesReferencia))
    .slice(-12)

  const data = sorted.map((p) => {
    const [ano, mes] = p.mesReferencia.split("-")
    const label = new Date(Number(ano), Number(mes) - 1).toLocaleString("pt-BR", {
      month: "short",
      year: "2-digit",
    })
    const status = getStatus(p)
    return { mes: label, status, valor: 1 }
  })

  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="size-4 text-brand-800" />
          Adimplência — últimos 12 meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-3">
          {["Pago", "Vencido", "Pendente"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm" style={{ background: COR[s] }} />
              <span className="text-xs text-muted-foreground">{s}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} barSize={28} margin={{ top: 18, bottom: 0, left: 0, right: 0 }}>
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6B6363" }}
            />
            <YAxis hide domain={[0, 1]} />
            <Tooltip
              formatter={() => [null, null]}
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as { mes: string; status: string }
                return (
                  <div className="rounded-lg border bg-white px-3 py-1.5 text-xs shadow-md">
                    <span className="font-semibold">{d.mes}</span>
                    {" — "}
                    <span style={{ color: COR[d.status] }}>{d.status}</span>
                  </div>
                )
              }}
            />
            <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={COR[entry.status]} />
              ))}
              <LabelList
                dataKey="status"
                position="top"
                style={{ fontSize: 9, fill: "#6B6363" }}
                formatter={(v: unknown) => typeof v === "string" ? v[0] : ""}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="text-success-600 font-semibold">
            {data.filter((d) => d.status === "Pago").length} pago(s)
          </span>
          <span className="text-danger-600 font-semibold">
            {data.filter((d) => d.status === "Vencido").length} vencido(s)
          </span>
          <span className="text-muted-foreground">
            {data.filter((d) => d.status === "Pendente").length} pendente(s)
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
