"use client"

import { useState, useTransition } from "react"
import { consultarRelatorioGerencial } from "@/app/actions/operacao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarRelatorioGerencial>>["dados"]>
const dataCivil = (data: string) => data.split("-").reverse().join("/")
function PeriodoFrequencia({ titulo, inicio, fim, dados }: { titulo: string; inicio: string; fim: string; dados: Dados["frequencia"]["atual"] }) {
  return <div className="rounded-lg border p-3"><p className="font-semibold">{titulo}</p><p className="text-xs text-muted-foreground">{dataCivil(inicio)} a {dataCivil(fim)}</p><p className="mt-2 text-2xl font-bold tabular-nums">{dados.percentualPresenca === null ? "Sem registros" : `${dados.percentualPresenca.toLocaleString("pt-BR")}%`}</p><p className="text-sm">{dados.presentes} presença(s) em {dados.validos} registro(s) válido(s).</p><p className="text-xs text-muted-foreground">{dados.ausentes} ausência(s) · {dados.justificados} justificada(s){dados.desconhecidos ? ` · ${dados.desconhecidos} situação(ões) não reconhecida(s)` : ""}.</p></div>
}
export function RelatorioGerencial({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const imprimir = () => {
    document.body.dataset.printSection = "relatorio-gerencial"
    const limpar = () => { delete document.body.dataset.printSection }
    window.addEventListener("afterprint", limpar, { once: true })
    window.print()
  }
  const consultar = () => start(async () => { setErro(""); try { const r = await consultarRelatorioGerencial({ turma: turma ? turma.slice(2) : undefined }); if (r.dados) setDados(r.dados); else { setDados(null); setErro(r.error ?? "Relatório indisponível.") } } catch { setErro("Não foi possível consultar o relatório. Verifique sua sessão e conexão.") } })
  return <section data-print-target="relatorio-gerencial" aria-labelledby="relatorio-gerencial" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="relatorio-gerencial" className="font-heading text-xl font-bold">Relatório gerencial de desenvolvimento</h2><p className="mt-1 text-sm text-muted-foreground">Indicadores operacionais descritivos. Não classifica atletas, não faz previsões e não atribui mudanças a uma ação específica.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="turma-relatorio-gerencial">Turma do relatório</Label><select id="turma-relatorio-gerencial" value={turma} disabled={pending} onChange={(e) => { setTurma(e.target.value); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item} value={`t:${item}`}>{item || "Sem turma"}</option>)}</select></div><Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar relatório" : "Consultar relatório"}</Button></div>
    {erro && <p role="alert" className="text-sm">{erro}</p>}
    {dados && <div role="status" className="space-y-5">
      <div className="flex justify-end print:hidden"><Button type="button" variant="outline" onClick={imprimir}>Imprimir / salvar PDF</Button></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.atletasAtivos}</p><p className="text-xs">Atletas ativos</p></div><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.avaliacoes.avaliados}</p><p className="text-xs">Com avaliação cadastrada em 90 dias</p></div><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.planos.salvos}</p><p className="text-xs">Planos salvos</p></div><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.planos.comRetorno}</p><p className="text-xs">Planos com retorno</p></div></div>
      <div><h3 className="mb-2 font-semibold">Frequência registrada — duas janelas civis de 30 dias</h3><div className="grid gap-3 sm:grid-cols-2"><PeriodoFrequencia titulo="Período anterior" inicio={dados.frequencia.inicioAnterior} fim={dados.frequencia.fimAnterior} dados={dados.frequencia.anterior} /><PeriodoFrequencia titulo="Período mais recente" inicio={dados.frequencia.inicioAtual} fim={dados.frequencia.fimAtual} dados={dados.frequencia.atual} /></div>{dados.frequencia.variacao !== null && <p className="mt-2 text-sm font-semibold">Variação descritiva: {dados.frequencia.variacao > 0 ? "+" : ""}{dados.frequencia.variacao.toLocaleString("pt-BR")} pontos percentuais.</p>}<p className="mt-2 text-xs text-muted-foreground">Ausência de registros não significa falta. A variação pode refletir calendário, quantidade de registros e outros fatores; não demonstra causa e efeito.</p></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><p className="font-semibold">Avaliações — 90 dias</p><p>{dados.avaliacoes.avaliados} com cadastro · {dados.avaliacoes.semAvaliacao} sem cadastro.</p><p className="text-xs text-muted-foreground">Considera a data de cadastro, não o período avaliado.</p></div><div className="rounded-lg border p-3"><p className="font-semibold">Ações criadas — 90 dias</p><p>{dados.acoes.pendentes} pendente(s) · {dados.acoes.concluidas} concluída(s) · {dados.acoes.ignoradas} ignorada(s).</p></div><div className="rounded-lg border p-3"><p className="font-semibold">Planos — histórico total</p><p>{dados.planos.comRetorno} com retorno · {dados.planos.semRetorno} sem retorno.</p></div></div>
      <p className="text-xs text-muted-foreground">Consultado em {new Date(dados.consultadoEm).toLocaleString("pt-BR")}. Os dados podem mudar após correções de registros.</p>
    </div>}
  </section>
}
