"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

type Avaliacao = {
  id: number
  periodo: string
  notaTecnica: number | null
  notaFisica: number | null
  notaComportamento: number | null
  frequencia: number | null
  observacoes: string | null
}

function NotaBadge({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-muted-foreground text-xs">—</span>
  const cls = valor >= 7 ? "bg-success-50 text-success-700" : valor >= 5 ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700"
  return <Badge className={`text-xs ${cls}`}>{valor.toFixed(1)}</Badge>
}

export function AvaliacoesCard({ alunoId, avaliacoes }: { alunoId: number; avaliacoes: Avaliacao[] }) {
  const [expanded, setExpanded] = useState(false)

  if (avaliacoes.length === 0) return null

  const sorted = [...avaliacoes].sort((a, b) => b.periodo.localeCompare(a.periodo))
  const ultima = sorted[0]
  const visiveis = expanded ? sorted : sorted.slice(0, 2)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-heading">
          <span className="flex items-center gap-2">
            <ClipboardList className="size-4 text-brand-600" /> Avaliações
          </span>
          <Link href="/avaliacoes" className="text-xs font-normal text-brand-700 hover:underline">
            Ver todas →
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Último período em destaque */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Último período: {ultima.periodo}
          </p>
          <div className="grid grid-cols-4 gap-3 text-center">
            {([
              { label: "Técnica", valor: ultima.notaTecnica, isFreq: false },
              { label: "Física", valor: ultima.notaFisica, isFreq: false },
              { label: "Comport.", valor: ultima.notaComportamento, isFreq: false },
              { label: "Freq.", valor: ultima.frequencia, isFreq: true },
            ] as { label: string; valor: number | null; isFreq: boolean }[]).map(({ label, valor, isFreq }) => (
              <div key={label}>
                <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
                {isFreq ? (
                  valor !== null
                    ? <Badge className={`text-xs ${valor >= 75 ? "bg-success-50 text-success-700" : valor >= 50 ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700"}`}>{valor.toFixed(0)}%</Badge>
                    : <span className="text-muted-foreground text-xs">—</span>
                ) : (
                  <NotaBadge valor={valor} />
                )}
              </div>
            ))}
          </div>
          {ultima.observacoes && (
            <p className="mt-2 text-xs text-muted-foreground italic border-t pt-2">{ultima.observacoes}</p>
          )}
        </div>

        {/* Histórico compacto */}
        {sorted.length > 1 && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? "Ocultar histórico" : `Ver histórico (${sorted.length - 1} período${sorted.length > 2 ? "s" : ""} anteriores)`}
            </button>
            {expanded && (
              <div className="mt-2 space-y-2">
                {visiveis.slice(1).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs rounded border px-3 py-2">
                    <span className="font-medium text-muted-foreground">{a.periodo}</span>
                    <div className="flex gap-3">
                      <NotaBadge valor={a.notaTecnica} />
                      <NotaBadge valor={a.notaFisica} />
                      <NotaBadge valor={a.notaComportamento} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
