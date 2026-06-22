"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

type FreqItem = { data: Date; presenca: string }

type Props = {
  frequencias: FreqItem[]
}

function mesLabel(mesStr: string) {
  const [ano, mes] = mesStr.split("-")
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`
}

export function FrequenciaGrafico({ frequencias }: Props) {
  const porMes = new Map<string, { presentes: number; total: number }>()

  for (const f of frequencias) {
    const d = new Date(f.data)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const atual = porMes.get(chave) ?? { presentes: 0, total: 0 }
    porMes.set(chave, {
      presentes: atual.presentes + (f.presenca === "Presente" ? 1 : 0),
      total: atual.total + 1,
    })
  }

  const dados = Array.from(porMes.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, v]) => ({
      mes: mesLabel(mes),
      perc: v.total > 0 ? Math.round((v.presentes / v.total) * 100) : 0,
      presentes: v.presentes,
      total: v.total,
    }))

  if (dados.length === 0) return null

  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: unknown) => [`${value}%`, "Presença"]}
            labelClassName="font-semibold"
          />
          <Bar dataKey="perc" radius={[4, 4, 0, 0]}>
            {dados.map((d, i) => (
              <Cell
                key={i}
                fill={d.perc >= 75 ? "hsl(var(--success-500, 142 71% 45%))" : d.perc >= 50 ? "hsl(var(--warning-500, 38 92% 50%))" : "hsl(var(--danger-500, 0 84% 60%))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
