"use client"

import { useState, useTransition } from "react"
import { consultarAtividadeSemanalComissao } from "@/app/actions/evolucao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarAtividadeSemanalComissao>>["dados"]>

export function AtividadeSemanalComissao({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const imprimir = () => { document.body.dataset.printSection = "atividade-comissao"; window.addEventListener("afterprint", () => { delete document.body.dataset.printSection }, { once: true }); window.print() }
  const consultar = () => startTransition(async () => {
    setErro("")
    try {
      const resposta = await consultarAtividadeSemanalComissao({ turma: turma ? turma.slice(2) : undefined })
      if (resposta.dados) setDados(resposta.dados)
      else { setDados(null); setErro(resposta.error ?? "Não foi possível consultar.") }
    } catch { setDados(null); setErro("Não foi possível consultar a atividade da comissão.") }
  })

  return <section data-print-target="atividade-comissao" aria-labelledby="atividade-comissao" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="atividade-comissao" className="font-heading text-xl font-bold">Atividade semanal da comissão</h2><p className="mt-1 text-sm text-muted-foreground">Consolida quem registrou ações, pautas e planos nesta semana. Autoria de registro não significa atribuição de responsabilidade.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="turma-atividade-comissao">Turma da atividade</Label><select id="turma-atividade-comissao" value={turma} disabled={pending} onChange={(event) => { setTurma(event.target.value); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item} value={`t:${item}`}>{item || "Sem turma"}</option>)}</select></div><Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar atividade" : "Consultar atividade semanal"}</Button></div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {dados && <div role="status" className="space-y-3"><div className="flex justify-end print:hidden"><Button type="button" variant="outline" onClick={imprimir}>Imprimir semana / salvar PDF</Button></div>
      <p className="text-xs text-muted-foreground">Ciclo de {dados.cicloInicio.split("-").reverse().join("/")} a {dados.cicloFim.split("-").reverse().join("/")}. Os números mostram registros salvos no sistema, não carga de trabalho ou desempenho individual.</p>
      {dados.integrantes.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum integrante ou registro localizado.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dados.integrantes.map((item) => <article key={item.usuario} className="min-w-0 rounded-lg border p-3"><h3 className="break-words font-semibold">{item.nome}</h3><p className="text-xs text-muted-foreground">Usuário: {item.usuario}</p><dl className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-xs text-muted-foreground">Ações</dt><dd>{item.acoes.pendentes} pendente(s) · {item.acoes.concluidas} concluída(s) · {item.acoes.ignoradas} ignorada(s)</dd></div><div><dt className="text-xs text-muted-foreground">Planejamento</dt><dd>{item.pautas} pauta(s) · {item.planos} plano(s) · {item.planosComRetorno} com retorno</dd></div></dl></article>)}</div>}
      {dados.semAutoria > 0 && <p className="text-sm font-semibold text-warning-700">{dados.semAutoria} ação(ões) do ciclo não possuem autoria registrada.</p>}
    </div>}
  </section>
}
