"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { AlertCircle, CalendarClock, Check, ChevronRight, Download, Printer, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { tratarPendencia } from "@/app/actions/tratamento-pendencias"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PendenciaGrupo } from "@/lib/pendencias-data"

export function PendenciasClient({ grupos: gruposIniciais }: { grupos: PendenciaGrupo[] }) {
  const [grupos, setGrupos] = useState(gruposIniciais)
  const [busca, setBusca] = useState("")
  const [prioridade, setPrioridade] = useState("todas")
  const [situacao, setSituacao] = useState("todas")
  const [grupoAtivo, setGrupoAtivo] = useState("todos")
  const [pending, startTransition] = useTransition()

  const gruposFiltrados = useMemo(() => grupos.map((grupo) => ({
    ...grupo,
    itens: grupo.itens.filter((item) => {
      const termo = busca.trim().toLocaleLowerCase("pt-BR")
      return (grupoAtivo === "todos" || grupo.titulo === grupoAtivo)
        && (prioridade === "todas" || item.prioridade === prioridade)
        && (situacao === "todas" || item.situacao === situacao)
        && (!termo || `${item.titulo} ${item.detalhe} ${item.responsavel ?? ""}`.toLocaleLowerCase("pt-BR").includes(termo))
    }),
  })).filter((grupo) => grupo.itens.length), [busca, grupoAtivo, grupos, prioridade, situacao])
  const total = gruposFiltrados.reduce((soma, grupo) => soma + grupo.itens.length, 0)

  function exportar() {
    const linhas = [["area", "titulo", "detalhe", "prioridade", "situacao", "responsavel"], ...gruposFiltrados.flatMap((grupo) => grupo.itens.map((item) => [grupo.titulo, item.titulo, item.detalhe, item.prioridade, item.situacao, item.responsavel ?? ""]))]
    const csv = linhas.map((linha) => linha.map((valor) => `"${valor.replaceAll('"', '""')}"`).join(";")).join("\r\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a"); link.href = url; link.download = "pendencias.csv"; link.click(); URL.revokeObjectURL(url)
  }

  function agir(chave: string, acao: "resolver" | "adiar" | "atribuir") {
    startTransition(async () => {
      const resultado = await tratarPendencia({ chave, acao, dias: acao === "adiar" ? 7 : undefined })
      if ("error" in resultado) { toast.error(resultado.error); return }
      if (acao === "atribuir") {
        setGrupos((atuais) => atuais.map((grupo) => ({ ...grupo, itens: grupo.itens.map((item) => item.chave === chave ? { ...item, responsavel: resultado.responsavel } : item) })))
        toast.success("Pendência atribuída a você.")
      } else {
        setGrupos((atuais) => atuais.map((grupo) => ({ ...grupo, itens: grupo.itens.filter((item) => item.chave !== chave) })))
        toast.success(acao === "resolver" ? "Pendência marcada como resolvida." : "Pendência adiada por 7 dias.")
      }
    })
  }

  return <div className="space-y-4">
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
      <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pendência..." aria-label="Buscar pendência" />
      <select value={grupoAtivo} onChange={(e) => setGrupoAtivo(e.target.value)} className="h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Filtrar por área"><option value="todos">Todas as áreas</option>{grupos.map((grupo) => <option key={grupo.titulo} value={grupo.titulo}>{grupo.titulo}</option>)}</select>
      <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className="h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Filtrar por prioridade"><option value="todas">Todas as prioridades</option><option value="alta">Prioridade alta</option><option value="normal">Prioridade normal</option></select>
      <select value={situacao} onChange={(e) => setSituacao(e.target.value)} className="h-11 rounded-lg border bg-background px-3 text-sm" aria-label="Filtrar por situação"><option value="todas">Todas as situações</option><option value="atrasada">Atrasadas</option><option value="proxima">Próximas</option><option value="informativa">Informativas</option></select>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{total} resultado(s) com os filtros atuais.</p><div className="flex gap-2 print:hidden"><Button size="sm" variant="outline" disabled={!total} onClick={exportar}><Download className="size-4" /> Exportar CSV</Button><Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Imprimir</Button></div></div>
    {total === 0 ? <div className="rounded-xl border border-dashed bg-card p-10 text-center"><AlertCircle className="mx-auto size-8 text-muted-foreground/40" /><p className="mt-3 font-semibold">Nenhuma pendência encontrada</p><p className="text-sm text-muted-foreground">Altere os filtros ou aguarde novos registros.</p></div> : <div className="grid items-start gap-4 xl:grid-cols-2">{gruposFiltrados.map((grupo) => <section key={grupo.titulo} className="min-w-0 rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><div><h2 className="font-heading text-lg font-bold">{grupo.titulo}</h2><p className="text-xs text-muted-foreground">{grupo.descricao}</p></div><span className="h-fit rounded-full bg-muted px-2.5 py-1 text-xs font-bold">{grupo.itens.length}</span></div><ul className="mt-4 divide-y">{grupo.itens.map((item) => <li key={item.chave} className="py-3"><div className="flex min-w-0 items-start gap-3"><div className={`mt-1 size-2 shrink-0 rounded-full ${item.prioridade === "alta" ? "bg-danger-600" : item.situacao === "proxima" ? "bg-warning-600" : "bg-muted-foreground/40"}`} aria-hidden /><div className="min-w-0 flex-1"><Link href={item.href} className="group flex min-w-0 items-start justify-between gap-2 hover:text-brand-700"><div className="min-w-0"><p className="break-words font-semibold">{item.titulo}</p><p className="break-words text-xs text-muted-foreground">{item.detalhe}</p>{item.responsavel && <p className="mt-1 text-xs font-medium text-brand-700">Responsável: {item.responsavel}</p>}</div><ChevronRight className="mt-1 size-4 shrink-0" /></Link><div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => agir(item.chave, "atribuir")}><UserCheck className="size-3.5" /> Assumir</Button><Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => agir(item.chave, "adiar")}><CalendarClock className="size-3.5" /> Adiar 7 dias</Button><Button size="sm" className="h-8" disabled={pending} onClick={() => agir(item.chave, "resolver")}><Check className="size-3.5" /> Resolver</Button></div></div></div></li>)}</ul></section>)}</div>}
  </div>
}
