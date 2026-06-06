"use client"

import { useState, useEffect, useRef } from "react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts"
import { Play, Pause, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

export type AvaliacaoSnapshot = {
  label: string
  data: Date
  notas: { tecnica: number; fisico: number; comportamento: number }
}

function toRadar(notas: AvaliacaoSnapshot["notas"]) {
  return [
    { habilidade: "Técnica", valor: notas.tecnica },
    { habilidade: "Físico", valor: notas.fisico },
    { habilidade: "Comportamento", valor: notas.comportamento },
  ]
}

export function RadarEvolutionChart({ snapshots }: { snapshots: AvaliacaoSnapshot[] }) {
  const [index, setIndex] = useState(snapshots.length > 0 ? snapshots.length - 1 : 0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i >= snapshots.length - 1) { setPlaying(false); return i }
        return i + 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, snapshots.length])

  if (snapshots.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="Avaliações ainda não realizadas"
        description="Aguarde o próximo ciclo de avaliações técnicas."
      />
    )
  }

  const atual = snapshots[Math.min(index, snapshots.length - 1)]
  const radarData = toRadar(atual.notas)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-muted-foreground">{atual.label}</span>
        {snapshots.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { if (!playing) setIndex(0); setPlaying((p) => !p) }}
            className="gap-1"
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {playing ? "Pausar" : "Reproduzir"}
          </Button>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="habilidade" tick={{ fontSize: 12 }} />
          <Radar
            name="Nota"
            dataKey="valor"
            stroke="#B71C1C"
            fill="#B71C1C"
            fillOpacity={0.3}
            isAnimationActive
          />
          <Tooltip formatter={(v: number) => [`${v}/10`, "Nota"]} />
        </RadarChart>
      </ResponsiveContainer>

      {snapshots.length > 1 && (
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={index}
            onChange={(e) => { setPlaying(false); setIndex(Number(e.target.value)) }}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{snapshots[0].label}</span>
            <span>{snapshots[snapshots.length - 1].label}</span>
          </div>
        </div>
      )}
    </div>
  )
}
