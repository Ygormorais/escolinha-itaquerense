"use client"

import { useState, useTransition } from "react"
import { Activity, Download } from "lucide-react"
import { consultarEvolucaoColetiva } from "@/app/actions/evolucao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarEvolucaoColetiva>>["dados"]>

function exportarCsv(dados: Dados) {
  const linhas = [
    ["tipo", "periodo", "atletas_com_registro", "registros_validos", "presenca_percentual", "media_tecnica", "media_fisica", "media_comportamento"],
    ...dados.frequenciaMensal.map((item) => ["frequencia", item.key, item.atletasComRegistro, item.registrosValidos, item.percentualPresenca ?? "", "", "", ""]),
    ...dados.avaliacoesPorPeriodo.map((item) => ["avaliacao", item.periodo, item.atletasAvaliados, "", "", item.tecnica ?? "", item.fisica ?? "", item.comportamento ?? ""]),
  ]
  const csv = linhas.map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(";")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `evolucao-coletiva-${dados.turma}-${dados.mesesSolicitados}-meses.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function BarraPresenca({ valor }: { valor: number | null }) {
  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${valor ?? 0}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums">{valor == null ? "Sem registros" : `${valor.toLocaleString("pt-BR")}%`}</span>
    </div>
  )
}

export function EvolucaoColetiva({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState(turmas[0] ?? "")
  const [meses, setMeses] = useState<6 | 12>(6)
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()

  function consultar() {
    if (!turma) return
    startTransition(async () => {
      setErro("")
      try {
        const resultado = await consultarEvolucaoColetiva({ turma, meses })
        if (resultado.dados) setDados(resultado.dados)
        else {
          setDados(null)
          setErro(resultado.error ?? "Não foi possível consultar a evolução coletiva.")
        }
      } catch {
        setDados(null)
        setErro("Não foi possível consultar a evolução coletiva.")
      }
    })
  }

  return (
    <section aria-labelledby="evolucao-coletiva" className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
          <Activity className="size-5" />
        </span>
        <div>
          <h2 id="evolucao-coletiva" className="font-heading text-xl font-bold">Evolução coletiva por turma</h2>
          <p className="mt-1 text-sm text-muted-foreground">Acompanha participação e registros de avaliação ao longo do tempo. Não classifica atletas nem atribui causa às variações.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="turma-evolucao-coletiva">Turma</Label>
          <select id="turma-evolucao-coletiva" className="h-11 w-full rounded-lg border bg-background px-3 text-sm" value={turma} disabled={pending} onChange={(event) => { setTurma(event.target.value); setDados(null) }}>
            {turmas.length === 0 && <option value="">Nenhuma turma disponível</option>}
            {turmas.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="janela-evolucao-coletiva">Janela</Label>
          <select id="janela-evolucao-coletiva" className="h-11 w-full rounded-lg border bg-background px-3 text-sm" value={meses} disabled={pending} onChange={(event) => { setMeses(Number(event.target.value) as 6 | 12); setDados(null) }}>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>
        <Button type="button" variant="outline" disabled={pending || !turma} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar" : "Consultar"}</Button>
      </div>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      {dados && (
        <div className="space-y-5" role="status">
          <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{dados.turma} · {dados.atletasAtivos} atleta{dados.atletasAtivos === 1 ? " ativo" : "s ativos"}</p>
              <p className="text-xs text-muted-foreground">Variação entre o primeiro e o último mês com registros: {dados.variacaoPresenca == null ? "amostra insuficiente" : `${dados.variacaoPresenca > 0 ? "+" : ""}${dados.variacaoPresenca.toLocaleString("pt-BR")} p.p.`}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => exportarCsv(dados)}><Download className="size-4" aria-hidden />Exportar CSV</Button>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Participação registrada por mês</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {dados.frequenciaMensal.map((item) => (
                <article key={item.key} className="rounded-lg border p-3">
                  <h4 className="text-sm font-semibold capitalize">{item.label}</h4>
                  <div className="mt-3"><BarraPresenca valor={item.percentualPresenca} /></div>
                  <p className="mt-2 text-[11px] text-muted-foreground">{item.atletasComRegistro} atleta(s) · {item.registrosValidos} registro(s)</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Registros coletivos de avaliação</h3>
            {dados.avaliacoesPorPeriodo.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhuma avaliação cadastrada para a composição atual da turma.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[38rem] text-left text-sm">
                  <thead className="bg-muted/60 text-xs"><tr><th className="p-3">Período</th><th className="p-3">Cobertura</th><th className="p-3">Técnica</th><th className="p-3">Física</th><th className="p-3">Comportamento</th></tr></thead>
                  <tbody>{dados.avaliacoesPorPeriodo.map((item) => <tr key={item.periodo} className="border-t"><th scope="row" className="p-3 font-semibold">{item.periodo}</th><td className="p-3">{item.atletasAvaliados}/{dados.atletasAtivos}</td>{([item.tecnica, item.fisica, item.comportamento] as const).map((valor, indice) => <td key={indice} className={cn("p-3 font-semibold tabular-nums", valor == null && "font-normal text-muted-foreground")}>{valor == null ? "Amostra < 3" : valor.toLocaleString("pt-BR")}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{dados.regraPrivacidade} Percentuais refletem somente registros existentes; ausência de cadastro não significa ausência do atleta.</p>
        </div>
      )}
    </section>
  )
}
