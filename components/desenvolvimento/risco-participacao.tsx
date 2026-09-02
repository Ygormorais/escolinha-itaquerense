"use client"

import Link from "next/link"
import { Download, Printer, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InsightDesenvolvimento } from "@/lib/desenvolvimento"

const pesoPorTipo: Partial<Record<InsightDesenvolvimento["tipo"], number>> = {
  frequencia_em_queda: 80,
  baixa_frequencia: 75,
  avaliacao_atrasada: 35,
  poucas_oportunidades: 25,
  avaliacao_estavel: 15,
}

type Linha = { alunoId: number; nome: string; turma: string; pontuacao: number; nivel: "alto" | "moderado" | "observacao"; evidencias: string[] }

function preparar(insights: InsightDesenvolvimento[]): Linha[] {
  const atletas = new Map<number, Omit<Linha, "pontuacao" | "nivel"> & { pesos: number[] }>()
  for (const insight of insights) {
    if (insight.positivo || !pesoPorTipo[insight.tipo]) continue
    const atual = atletas.get(insight.alunoId) ?? { alunoId: insight.alunoId, nome: insight.alunoNome, turma: insight.turma, evidencias: [], pesos: [] }
    atual.pesos.push(pesoPorTipo[insight.tipo]!)
    atual.evidencias.push(...insight.evidencias)
    atletas.set(insight.alunoId, atual)
  }
  return [...atletas.values()].map(({ pesos, ...atleta }) => {
    const pontuacao = Math.min(100, Math.max(...pesos) + Math.max(0, pesos.length - 1) * 5)
    const nivel: Linha["nivel"] = pontuacao >= 70 ? "alto" : pontuacao >= 35 ? "moderado" : "observacao"
    return { ...atleta, pontuacao, nivel }
  }).sort((a, b) => b.pontuacao - a.pontuacao || a.nome.localeCompare(b.nome, "pt-BR"))
}

function exportarCsv(linhas: Linha[]) {
  const csv = [["atleta", "turma", "nivel", "pontuacao", "evidencias"], ...linhas.map((linha) => [linha.nome, linha.turma, linha.nivel, linha.pontuacao, linha.evidencias.join(" | ")])].map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a"); link.href = url; link.download = "acompanhamento-participacao.csv"; link.click(); URL.revokeObjectURL(url)
}

export function RiscoParticipacao({ insights }: { insights: InsightDesenvolvimento[] }) {
  const linhas = preparar(insights)
  return <section aria-labelledby="risco-participacao" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-700"><ShieldAlert className="size-5" /></span><div><h2 id="risco-participacao" className="font-heading text-xl font-bold">Acompanhamento de permanência</h2><p className="mt-1 text-sm text-muted-foreground">Sinalização explicável baseada somente em frequência, avaliações e oportunidades registradas. Não prevê evasão nem substitui conversa com atleta e família.</p></div></div><div className="flex gap-2 print:hidden"><Button size="sm" variant="outline" disabled={!linhas.length} onClick={() => exportarCsv(linhas)}><Download className="size-4" /> CSV</Button><Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Imprimir</Button></div></div>
    {linhas.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum sinal de acompanhamento com amostra suficiente no ciclo atual.</p> : <div className="grid gap-3 lg:grid-cols-2">{linhas.map((linha) => <article key={linha.alunoId} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><Link href={`/alunos/${linha.alunoId}`} className="font-semibold text-brand-700 hover:underline">{linha.nome}</Link><p className="text-xs text-muted-foreground">{linha.turma}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${linha.nivel === "alto" ? "bg-danger-50 text-danger-700" : linha.nivel === "moderado" ? "bg-warning-50 text-warning-700" : "bg-info-50 text-info-700"}`}>{linha.nivel === "alto" ? "Atenção alta" : linha.nivel === "moderado" ? "Atenção moderada" : "Observar"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-label={`Pontuação explicativa ${linha.pontuacao} de 100`}><div className="h-full bg-brand-600" style={{ width: `${linha.pontuacao}%` }} /></div><ul className="mt-3 space-y-1 text-xs text-muted-foreground">{linha.evidencias.slice(0, 3).map((evidencia) => <li key={evidencia}>• {evidencia}</li>)}</ul></article>)}</div>}
    <p className="text-xs text-muted-foreground">Pontuação local: queda ou baixa frequência recebe maior peso; avaliação vencida e ausência de oportunidades apenas complementam o sinal. Sem registros suficientes, o atleta não é classificado.</p>
  </section>
}
