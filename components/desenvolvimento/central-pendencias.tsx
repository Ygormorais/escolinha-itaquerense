"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { consultarPendenciasOperacionais } from "@/app/actions/operacao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarPendenciasOperacionais>>["dados"]>
export function CentralPendencias({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const consultar = () => start(async () => {
    setErro("")
    try {
      const r = await consultarPendenciasOperacionais({ turma: turma ? turma.slice(2) : undefined })
      if (r.dados) setDados(r.dados); else { setDados(null); setErro(r.error ?? "Não foi possível consultar.") }
    } catch { setErro("Não foi possível consultar as pendências. Verifique sua sessão e conexão.") }
  })
  return <section aria-labelledby="central-pendencias" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="central-pendencias" className="font-heading text-xl font-bold">Central de pendências internas</h2><p className="mt-1 text-sm text-muted-foreground">Lembretes consultados pela equipe. Nenhuma mensagem, notificação externa ou ação é disparada automaticamente.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="turma-pendencias">Turma das pendências</Label><select id="turma-pendencias" value={turma} disabled={pending} onChange={(e) => { setTurma(e.target.value); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todas as turmas</option>{turmas.map((item) => <option key={item} value={`t:${item}`}>{item || "Sem turma"}</option>)}</select></div><Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar pendências" : "Consultar pendências internas"}</Button></div>
    {erro && <p role="alert" className="text-sm">{erro}</p>}
    {dados && <><div role="status" className="grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.planos.total}</p><p className="text-xs">Planos sem retorno</p></div><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.publicacoes.total}</p><p className="text-xs">Publicações sem leitura</p></div><div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{dados.acoes.total}</p><p className="text-xs">Ações fora do ciclo atual</p></div></div>
      <p className="text-xs text-muted-foreground">Exibindo até {dados.limite} itens de cada grupo. Os totais não são limitados. Consultado em {new Date(dados.consultadoEm).toLocaleString("pt-BR")}.</p>
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-2"><h3 className="font-semibold">Planos aguardando retorno</h3>{dados.planos.itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> : <ul className="space-y-2">{dados.planos.itens.map((item) => <li key={item.id} className="break-words rounded-lg border p-3 text-sm"><strong>{item.turma || "Sem turma"}</strong><p>Salvo em {new Date(item.createdAt).toLocaleDateString("pt-BR")} por {item.usuario}.</p></li>)}</ul>}<a href="#validacao-catalogo" className="inline-block text-sm font-semibold text-brand-700 underline">Abrir validação do catálogo</a></div>
        <div className="min-w-0 space-y-2"><h3 className="font-semibold">Resumos sem confirmação</h3>{dados.publicacoes.itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> : <ul className="space-y-2">{dados.publicacoes.itens.map((item) => <li key={item.id} className="break-words rounded-lg border p-3 text-sm"><Link href={`/alunos/${item.alunoId}`} className="font-semibold text-brand-700 underline">{item.nome} · {item.turma || "Sem turma"}</Link><p>{item.mes.split("-").reverse().join("/")} · Destinatário da publicação: {item.destinatarioOriginal}.</p>{!item.vinculoAtual && <p className="mt-1 font-semibold text-warning-700">Vínculo alterado: indisponível à família atual{item.responsavelAtual ? ` (${item.responsavelAtual})` : ""}. Revise ou retire a publicação.</p>}</li>)}</ul>}</div>
        <div className="min-w-0 space-y-2"><h3 className="font-semibold">Ações fora da semana atual</h3>{dados.acoes.itens.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : <ul className="space-y-2">{dados.acoes.itens.map((item) => <li key={item.id} className="break-words rounded-lg border p-3 text-sm"><Link href={`/alunos/${item.alunoId}`} className="font-semibold text-brand-700 underline">{item.nome} · {item.turma || "Sem turma"}</Link><p>{item.titulo}</p><p className="text-xs text-muted-foreground">Ciclo informado: {/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(item.cicloInicio) ? item.cicloInicio.split("-").reverse().join("/") : "não reconhecido"}.</p></li>)}</ul>}<a href="#pendencias-todos-ciclos" className="inline-block text-sm font-semibold text-brand-700 underline">Abrir ações pendentes</a></div>
      </div>
    </>}
  </section>
}
