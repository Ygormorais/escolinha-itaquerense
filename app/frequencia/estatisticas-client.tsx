"use client"

import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getEstatisticasFrequencia } from "@/app/actions/frequencia"
import { format } from "date-fns"
import { TrendingDown } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

type RankingItem = { id: number; nome: string; turma: string; total: number; presentes: number; pct: number }
type HeatmapItem = { dia: string; total: number; presentes: number; pct: number | null }

function PctBar({ pct }: { pct: number }) {
  const cor = pct >= 75 ? "bg-success-600" : pct >= 50 ? "bg-warning-600" : "bg-danger-600"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${pct >= 75 ? "text-success-600" : pct >= 50 ? "text-warning-600" : "text-danger-600"}`}>
        {pct}%
      </span>
    </div>
  )
}

export function EstatisticasFrequencia() {
  const now = new Date()
  const [mes, setMes] = useState(format(now, "yyyy-MM"))
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, startLoading] = useTransition()

  function handleCarregar() {
    startLoading(async () => {
      const r = await getEstatisticasFrequencia(mes)
      setRanking(r.ranking)
      setHeatmap(r.heatmap)
      setLoaded(true)
    })
  }

  const baixaFrequencia = ranking.filter((a) => a.pct < 75 && a.total >= 3)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => { setMes(e.target.value); setLoaded(false) }}
            className="mt-1 w-40"
          />
        </div>
        <Button onClick={handleCarregar} disabled={loading} variant="outline">
          {loading ? "Carregando..." : "Gerar Estatísticas"}
        </Button>
      </div>

      {loaded && (
        <>
          {baixaFrequencia.length > 0 && (
            <Card className="border-warning-300 bg-warning-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-warning-700 text-sm">
                  <TrendingDown className="size-4" />
                  {baixaFrequencia.length} aluno(s) com frequência abaixo de 75%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {baixaFrequencia.map((a) => (
                    <a
                      key={a.id}
                      href={`/alunos/${a.id}`}
                      className="rounded-full bg-warning-100 px-3 py-1 text-xs font-medium text-warning-800 hover:bg-warning-200 transition-colors"
                    >
                      {a.nome} ({a.pct}%)
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Presença por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={heatmap.filter((d) => d.total > 0)} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v: unknown) => (typeof v === "number" ? `${v}%` : String(v))} />
                    <Bar dataKey="pct" name="% Presença" radius={[4, 4, 0, 0]}>
                      {heatmap.filter((d) => d.total > 0).map((d, i) => (
                        <Cell
                          key={i}
                          fill={(d.pct ?? 0) >= 75 ? "#16a34a" : (d.pct ?? 0) >= 50 ? "#ca8a04" : "#dc2626"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top ausentes — {mes}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[...ranking].sort((a, b) => a.pct - b.pct).slice(0, 8).map((a) => (
                  <div key={a.id}>
                    <div className="flex items-center justify-between mb-0.5">
                      <a href={`/alunos/${a.id}`} className="text-sm font-medium hover:underline truncate max-w-[60%]">{a.nome}</a>
                      <span className="text-xs text-muted-foreground">{a.turma} · {a.presentes}/{a.total}</span>
                    </div>
                    <PctBar pct={a.pct} />
                  </div>
                ))}
                {ranking.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum dado de frequência neste mês.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranking completo — {ranking.length} aluno(s)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ranking.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-6 text-xs text-muted-foreground text-right shrink-0">{i + 1}.</span>
                  <a href={`/alunos/${a.id}`} className="w-40 text-sm font-medium truncate hover:underline shrink-0">{a.nome}</a>
                  <span className="w-20 text-xs text-muted-foreground shrink-0">{a.turma}</span>
                  <div className="flex-1">
                    <PctBar pct={a.pct} />
                  </div>
                  <span className="w-16 text-xs text-muted-foreground shrink-0 text-right">{a.presentes}/{a.total} aulas</span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
