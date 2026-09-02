"use client"

import { useState, useTransition } from "react"
import { consultarComparativoDesenvolvimento } from "@/app/actions/evolucao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarComparativoDesenvolvimento>>["dados"]>
type Linha = Dados["porTurma"][number]

function GradeComparativa({ titulo, linhas, planos = false }: { titulo: string; linhas: Linha[] | Dados["porFaixa"]; planos?: boolean }) {
  return <div className="space-y-2"><h3 className="font-semibold">{titulo}</h3>{linhas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum grupo com atletas ativos.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{linhas.map((item) => <article key={item.nome} className="rounded-lg border p-3"><h4 className="font-semibold">{item.nome}</h4><dl className="mt-2 space-y-1 text-sm"><div className="flex justify-between gap-3"><dt>Atletas ativos</dt><dd className="font-semibold tabular-nums">{item.atletas}</dd></div><div className="flex justify-between gap-3"><dt>Com avaliação cadastrada</dt><dd className="font-semibold tabular-nums">{item.avaliados}</dd></div><div className="flex justify-between gap-3"><dt>Presença registrada</dt><dd className="font-semibold tabular-nums">{item.frequencia.percentualPresenca === null ? "Sem registros" : `${item.frequencia.percentualPresenca.toLocaleString("pt-BR")}%`}</dd></div><div className="flex justify-between gap-3"><dt>Ações pendentes</dt><dd className="font-semibold tabular-nums">{item.acoes.pendentes}</dd></div>{planos && "planos" in item && <><div className="flex justify-between gap-3"><dt>Planos salvos</dt><dd className="font-semibold tabular-nums">{item.planos}</dd></div><div className="flex justify-between gap-3"><dt>Planos com retorno</dt><dd className="font-semibold tabular-nums">{item.planosComRetorno}</dd></div></>}</dl><p className="mt-2 text-xs text-muted-foreground">{item.frequencia.presentes} presença(s), {item.frequencia.ausentes} ausência(s) e {item.frequencia.justificados} justificativa(s) em {item.frequencia.validos} registro(s) válido(s).</p></article>)}</div>}</div>
}

export function ComparativoDesenvolvimento() {
  const [periodoDias, setPeriodoDias] = useState<30 | 60 | 90>(30)
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const imprimir = () => { document.body.dataset.printSection = "comparativo-desenvolvimento"; window.addEventListener("afterprint", () => { delete document.body.dataset.printSection }, { once: true }); window.print() }
  const exportarCsv = () => {
    if (!dados) return
    const escapar = (valor: string | number | null) => `"${String(valor ?? "").replaceAll('"', '""')}"`
    const cabecalho = ["agrupamento", "grupo", "atletas_ativos", "avaliados", "presenca_percentual", "acoes_pendentes", "planos_salvos", "planos_com_retorno"]
    const linhas = [
      ...dados.porTurma.map((item) => ["turma", item.nome, item.atletas, item.avaliados, item.frequencia.percentualPresenca, item.acoes.pendentes, item.planos, item.planosComRetorno]),
      ...dados.porFaixa.map((item) => ["faixa", item.nome, item.atletas, item.avaliados, item.frequencia.percentualPresenca, item.acoes.pendentes, "", ""]),
    ]
    const arquivo = new Blob(["\uFEFF", [cabecalho, ...linhas].map((linha) => linha.map((valor) => escapar(valor)).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement("a"); link.href = url; link.download = `comparativo-desenvolvimento-${dados.periodoDias}-dias.csv`; link.click(); URL.revokeObjectURL(url)
  }
  const consultar = () => startTransition(async () => { setErro(""); try { const resposta = await consultarComparativoDesenvolvimento({ periodoDias }); if (resposta.dados) setDados(resposta.dados); else { setDados(null); setErro(resposta.error ?? "Comparativo indisponível.") } } catch { setDados(null); setErro("Não foi possível consultar o comparativo.") } })

  return <section data-print-target="comparativo-desenvolvimento" aria-labelledby="comparativo-desenvolvimento" className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="comparativo-desenvolvimento" className="font-heading text-xl font-bold">Comparativo descritivo de grupos</h2><p className="mt-1 text-sm text-muted-foreground">Apresenta os mesmos indicadores por turma e faixa etária, em ordem nominal. Não produz ranking, nota ou previsão sobre atletas.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="periodo-comparativo">Período dos registros</Label><select id="periodo-comparativo" value={periodoDias} disabled={pending} onChange={(event) => { setPeriodoDias(Number(event.target.value) as 30 | 60 | 90); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value={30}>Últimos 30 dias</option><option value={60}>Últimos 60 dias</option><option value={90}>Últimos 90 dias</option></select></div><Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar comparativo" : "Consultar comparativo"}</Button></div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {dados && <div role="status" className="space-y-5"><div className="flex flex-wrap justify-end gap-2 print:hidden"><Button type="button" variant="outline" onClick={exportarCsv}>Exportar CSV</Button><Button type="button" variant="outline" onClick={imprimir}>Imprimir / salvar PDF</Button></div><p className="text-xs text-muted-foreground">Janela móvel de {dados.periodoDias} dias. Avaliações usam a data de cadastro; frequência usa somente estados reconhecidos. Ausência de registros não significa falta.</p><GradeComparativa titulo="Por turma" linhas={dados.porTurma} planos /><GradeComparativa titulo="Por faixa etária civil" linhas={dados.porFaixa} /><p className="text-xs text-muted-foreground">Diferenças podem refletir calendário, tamanho dos grupos e quantidade de registros. Este quadro não demonstra causa e efeito.</p></div>}
  </section>
}
