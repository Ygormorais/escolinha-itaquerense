"use client"

import dynamic from "next/dynamic"

const FrequenciaGrafico = dynamic(
  () => import("./frequencia-grafico").then((m) => m.FrequenciaGrafico),
  {
    loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" />,
    ssr: false,
  },
)

type FreqItem = { data: Date; presenca: string }

/** Carrega Recharts só no cliente, sem bloquear o HTML inicial da página. */
export function FrequenciaGraficoLazy({ frequencias }: { frequencias: FreqItem[] }) {
  return <FrequenciaGrafico frequencias={frequencias} />
}
