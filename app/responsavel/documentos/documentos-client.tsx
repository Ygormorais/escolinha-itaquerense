"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"
import { aceitarDocumento } from "@/app/actions/documentos"
import { Button } from "@/components/ui/button"

type Item = { documentoId: number; titulo: string; categoria: string; versaoId: number; versao: string; conteudo: string; url: string | null; obrigatorio: boolean; publicadoEm: Date | string; aluno: { id: number; nome: string; turma: string }; aceite: Date | string | null }

export function DocumentosFamilia({ itens }: { itens: Item[] }) {
  const [confirmados, setConfirmados] = useState<Record<string, boolean>>({})
  const [aceites, setAceites] = useState<Record<string, string | null>>(Object.fromEntries(itens.map((item) => [`${item.versaoId}:${item.aluno.id}`, item.aceite ? new Date(item.aceite).toISOString() : null])))
  const [pending, startTransition] = useTransition()
  if (itens.length === 0) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum documento vigente para os atletas vinculados.</p>

  function aceitar(item: Item) {
    const chave = `${item.versaoId}:${item.aluno.id}`
    startTransition(async () => {
      const resultado = await aceitarDocumento(item.versaoId, item.aluno.id, confirmados[chave] === true)
      if ("error" in resultado) { toast.error(resultado.error); return }
      setAceites((atual) => ({ ...atual, [chave]: new Date().toISOString() }))
      toast.success("Aceite registrado para esta versão.")
    })
  }

  return <section className="grid gap-4 lg:grid-cols-2" aria-label="Documentos vigentes">{itens.map((item) => { const chave = `${item.versaoId}:${item.aluno.id}`; const aceite = aceites[chave]; return <article key={`${item.documentoId}:${item.aluno.id}`} className="flex flex-col rounded-xl border bg-card p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden><FileText className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-heading text-lg font-bold">{item.titulo}</h2><p className="text-xs text-muted-foreground">{item.categoria} · versão {item.versao} · {item.aluno.nome}</p></div>{aceite && <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-[10px] font-bold uppercase text-success-700"><CheckCircle2 className="size-3" />Aceito</span>}</div></div></div><div className="mt-4 flex-1 whitespace-pre-wrap rounded-lg bg-muted/35 p-3 text-sm leading-relaxed">{item.conteudo}</div>{item.url && <a href={item.url} target={item.url.startsWith("http") ? "_blank" : undefined} rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Abrir conteúdo complementar <ExternalLink className="size-3.5" /></a>}{aceite ? <p className="mt-4 text-xs text-muted-foreground">Aceite registrado em {new Date(aceite).toLocaleString("pt-BR")} para esta versão.</p> : <div className="mt-4 space-y-3"><label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 shrink-0" checked={confirmados[chave] ?? false} onChange={(event) => setConfirmados((atual) => ({ ...atual, [chave]: event.target.checked }))} /><span>Li o documento completo e confirmo {item.obrigatorio ? "o aceite desta versão" : "a ciência desta versão"} para {item.aluno.nome}.</span></label><Button type="button" disabled={pending || !confirmados[chave]} onClick={() => aceitar(item)}>{item.obrigatorio ? "Registrar aceite" : "Registrar ciência"}</Button></div>}</article> })}</section>
}
