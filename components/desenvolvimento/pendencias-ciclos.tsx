"use client"

import { useState, useTransition } from "react"
import { listarPendenciasDesenvolvimento } from "@/app/actions/pendencias-desenvolvimento"
import { HistoricoCiclos, type CicloHistoricoView } from "@/components/desenvolvimento/historico-ciclos"
import { Button } from "@/components/ui/button"

export function PendenciasCiclos({ alunoId }: { alunoId?: number }) {
  const [itens, setItens] = useState<CicloHistoricoView[] | null>(null)
  const [proxima, setProxima] = useState<number | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const carregar = (depoisDe?: number) => {
    setErro("")
    startTransition(async () => {
      try {
        const result = await listarPendenciasDesenvolvimento({ alunoId, depoisDe })
        if (result.error || !result.itens) { setErro(result.error ?? "Não foi possível consultar as pendências."); return }
        const rows = result.itens
        setItens((current) => depoisDe ? [...(current ?? []), ...rows.filter((row) => !current?.some((item) => item.id === row.id))] : rows)
        setProxima(result.proximaPagina)
      } catch { setErro("Não foi possível consultar as pendências. Verifique sua sessão e tente novamente.") }
    })
  }
  return <section id="pendencias-todos-ciclos" aria-label="Pendências de todos os ciclos" className="my-5 scroll-mt-4 space-y-3">
    <h3 className="font-heading text-lg font-semibold">Pendências de todos os ciclos</h3>
    <p className="text-sm text-muted-foreground">Ações ainda abertas, na ordem em que foram registradas. Esta consulta não depende dos indicadores atuais nem do limite do histórico recente.</p>
    <Button variant="outline" disabled={pending} onClick={() => carregar()}>{itens === null ? "Consultar pendências" : "Atualizar pendências"}</Button>
    {pending && <p role="status" className="text-sm">Consultando pendências...</p>}
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {itens && (itens.length ? <HistoricoCiclos itens={itens} mostrarAtleta={!alunoId} onEncerrado={(id) => setItens((current) => current?.filter((item) => item.id !== id) ?? null)} /> : <p className="text-sm text-muted-foreground">Nenhuma pendência nesta página.</p>)}
    {proxima !== null && <Button variant="outline" disabled={pending} onClick={() => carregar(proxima)}>Carregar mais pendências</Button>}
  </section>
}
