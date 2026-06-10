# Radar Chart de Evolução Técnica — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Responsável vê a evolução técnica do filho num gráfico radar animado com slider de datas na página `/responsavel/desempenho`.

**Architecture:** Componente client `RadarEvolutionChart` recebe array de snapshots (uma avaliação por ponto no tempo). Slider controla qual snapshot exibir; botão Play avança automaticamente. Dados vêm do model `Avaliacao` existente com campos `notaTecnica`, `notaFisica`, `notaComportamento`. Recharts já está instalado.

**Tech Stack:** Next.js 16, Recharts (já instalado), `@base-ui/react/slider` (já disponível via shadcn), Vitest (renderToStaticMarkup).

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `components/responsavel/radar-evolution-chart.tsx` | Create — componente client com radar + slider |
| `components/responsavel/__tests__/radar-evolution-chart.test.tsx` | Create |
| `app/responsavel/desempenho/page.tsx` | Modify — passa snapshots ao componente |

---

## Task 1: Componente `RadarEvolutionChart` (TDD)

**Files:**
- Create: `components/responsavel/radar-evolution-chart.tsx`
- Create: `components/responsavel/__tests__/radar-evolution-chart.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Crie `components/responsavel/__tests__/radar-evolution-chart.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { RadarEvolutionChart } from "@/components/responsavel/radar-evolution-chart"
import type { AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"

const snapshots: AvaliacaoSnapshot[] = [
  {
    label: "1S/2026",
    data: new Date("2026-01-01"),
    notas: { tecnica: 7, fisico: 8, comportamento: 9 },
  },
  {
    label: "2S/2026",
    data: new Date("2026-07-01"),
    notas: { tecnica: 8, fisico: 9, comportamento: 9 },
  },
]

describe("RadarEvolutionChart", () => {
  it("renderiza sem erros com multiplos snapshots", () => {
    expect(() => renderToStaticMarkup(<RadarEvolutionChart snapshots={snapshots} />)).not.toThrow()
  })

  it("renderiza EmptyState quando sem snapshots", () => {
    const html = renderToStaticMarkup(<RadarEvolutionChart snapshots={[]} />)
    expect(html).toContain("Avaliações ainda não")
  })

  it("nao renderiza slider quando ha apenas 1 snapshot", () => {
    const html = renderToStaticMarkup(<RadarEvolutionChart snapshots={[snapshots[0]]} />)
    expect(html).not.toContain("slider")
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run components/responsavel/__tests__/radar-evolution-chart.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `components/responsavel/radar-evolution-chart.tsx`**

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts"
import { Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { BarChart2 } from "lucide-react"

export type AvaliacaoSnapshot = {
  label: string
  data: Date
  notas: { tecnica: number; fisico: number; comportamento: number }
}

function snapshot_to_radar(notas: AvaliacaoSnapshot["notas"]) {
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
  const radarData = snapshot_to_radar(atual.notas)

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
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run components/responsavel/__tests__/radar-evolution-chart.test.tsx`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add components/responsavel/radar-evolution-chart.tsx components/responsavel/__tests__/radar-evolution-chart.test.tsx
git commit -m "feat(radar): RadarEvolutionChart com slider e reproducao automatica"
```

---

## Task 2: Integrar na página `/responsavel/desempenho`

**Files:**
- Modify: `app/responsavel/desempenho/page.tsx`

- [ ] **Step 1: Adicionar query de avaliações e snapshot**

Em `app/responsavel/desempenho/page.tsx`, dentro do include do `db.responsavel.findUnique`, adicione:

```ts
          avaliacoes: {
            orderBy: { createdAt: "asc" },
          },
```

Após a query, adicione o mapeamento para snapshots (antes do return):

```tsx
import { RadarEvolutionChart, type AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"
import { format } from "date-fns"

// dentro do componente, após buscar responsavel:
const snapshots: AvaliacaoSnapshot[] = (responsavel?.alunos[0]?.avaliacoes ?? [])
  .filter((a) => a.notaTecnica != null)
  .map((a) => ({
    label: a.periodo, // ex: "2026-1S"
    data: a.createdAt,
    notas: {
      tecnica: a.notaTecnica ?? 0,
      fisico: a.notaFisica ?? 0,
      comportamento: a.notaComportamento ?? 0,
    },
  }))
```

- [ ] **Step 2: Adicionar o componente no JSX**

No início do JSX da página (antes dos cards existentes), adicione:

```tsx
      <div className="mb-6">
        <h2 className="font-heading text-lg font-semibold mb-3">Evolução Técnica</h2>
        <RadarEvolutionChart snapshots={snapshots} />
      </div>
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i "desempenho\|radar" | head -5`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/responsavel/desempenho/page.tsx
git commit -m "feat(radar): pagina desempenho exibe RadarEvolutionChart com historico"
```

---

## Task 3: Verificação final

- [ ] **Step 1: Rodar testes**

Run: `npx vitest run components/responsavel/__tests__/radar-evolution-chart.test.tsx`
Expected: PASS (3 testes).

- [ ] **Step 2: Typecheck completo**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 3: Push**

```bash
git push origin develop
```
