"use client"

import { useState, useTransition } from "react"
import { consultarValidacaoCatalogo } from "@/app/actions/planejamento-treino"
import { RetornoPlanoTreino } from "@/components/desenvolvimento/retorno-plano-treino"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarValidacaoCatalogo>>["dados"]>
export function ValidacaoCatalogo({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const consultar = () => start(async () => {
    setErro("")
    try {
      const r = await consultarValidacaoCatalogo({ turma: turma ? turma.slice(2) : undefined })
      if (r.dados) setDados(r.dados); else { setDados(null); setErro(r.error ?? "Não foi possível consultar.") }
    } catch { setErro("Não foi possível consultar a validação do catálogo. Verifique sua sessão e conexão.") }
  })
  return <section aria-labelledby="validacao-catalogo" className="scroll-mt-4 space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="validacao-catalogo" className="font-heading text-xl font-bold">Validação do catálogo pela comissão</h2><p className="mt-1 text-sm text-muted-foreground">Cobertura dos retornos registrados. As contagens descrevem o uso dos planos; não medem eficácia, evolução ou desempenho individual.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2"><Label htmlFor="turma-validacao-catalogo">Turma da validação</Label><select id="turma-validacao-catalogo" value={turma} disabled={pending} onChange={(e) => { setTurma(e.target.value); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item} value={`t:${item}`}>{item || "Sem turma"}</option>)}</select></div>
      <Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar validação" : "Consultar validação"}</Button>
    </div>
    {erro && <p role="alert" className="text-sm">{erro}</p>}
    {dados && <>
      <div role="status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.totalPlanos}</p><p className="text-xs">Planos salvos</p></div>
        <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.comRetorno}</p><p className="text-xs">Com retorno</p></div>
        <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.semRetorno}</p><p className="text-xs">Aguardando retorno</p></div>
        <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.totalRetornos}</p><p className="text-xs">Registros de uso</p></div>
      </div>
      <p className="text-sm">Aplicado como planejado: {dados.resultados.adequado} · Com adaptações: {dados.resultados.adaptado} · Não utilizado: {dados.resultados.naoUtilizado}{dados.resultados.naoReconhecido ? ` · Situação antiga não reconhecida: ${dados.resultados.naoReconhecido}` : ""}.</p>
      <p className="text-xs text-muted-foreground">Um plano pode ter vários registros de uso; por isso, o total de registros pode ser maior que o número de planos. Consultado em {new Date(dados.consultadoEm).toLocaleString("pt-BR")}.</p>
      <section aria-labelledby="planos-sem-retorno" className="space-y-3"><h3 id="planos-sem-retorno" className="font-semibold">Planos aguardando primeiro retorno</h3>
        {dados.semRetorno === 0 && <p className="text-sm">Todos os planos deste filtro têm ao menos um retorno.</p>}
        {dados.pendentes.map((plano) => <details key={plano.id} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer break-words font-medium">{plano.turma || "Sem turma"} · {new Date(plano.createdAt).toLocaleString("pt-BR")} · {plano.usuario}</summary><p className="mt-3 whitespace-pre-wrap break-words">{plano.texto}</p><RetornoPlanoTreino planoId={plano.id} /></details>)}
        {dados.semRetorno > dados.pendentes.length && <p className="text-sm">Exibindo os {dados.limitePendentes} planos mais recentes. Selecione uma turma para reduzir a lista.</p>}
      </section>
    </>}
  </section>
}
