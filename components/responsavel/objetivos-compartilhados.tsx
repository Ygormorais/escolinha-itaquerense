"use client"

import { useState, useTransition } from "react"
import { Target } from "lucide-react"
import { toast } from "sonner"
import { responderObjetivoFamilia } from "@/app/actions/objetivos-familia"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Objetivo = { id: number; titulo: string; descricao: string; prazo: string | Date | null; status: string; respostaFamilia: string | null; aluno: { nome: string } }

const statusLabel: Record<string, string> = { proposto: "Aguardando sua resposta", combinado: "Combinado", revisao_solicitada: "Conversa solicitada", concluido: "Concluído", cancelado: "Cancelado" }

export function ObjetivosCompartilhados({ objetivos }: { objetivos: Objetivo[] }) {
  const [comentarios, setComentarios] = useState<Record<number, string>>(Object.fromEntries(objetivos.map((item) => [item.id, item.respostaFamilia ?? ""])))
  const [status, setStatus] = useState<Record<number, string>>(Object.fromEntries(objetivos.map((item) => [item.id, item.status])))
  const [pending, startTransition] = useTransition()
  if (objetivos.length === 0) return null

  function responder(id: number, resposta: "combinado" | "revisao_solicitada") {
    startTransition(async () => {
      const resultado = await responderObjetivoFamilia(id, resposta, comentarios[id] ?? "")
      if ("error" in resultado) {
        toast.error(resultado.error)
        return
      }
      setStatus((atual) => ({ ...atual, [id]: resposta }))
      toast.success(resposta === "combinado" ? "Objetivo combinado com a escola." : "Pedido de conversa enviado.")
    })
  }

  return <section className="space-y-3" aria-labelledby="objetivos-compartilhados-familia"><div className="flex items-center gap-2"><Target className="size-5 text-brand-700" aria-hidden /><div><h2 id="objetivos-compartilhados-familia" className="font-heading text-xl font-bold">Objetivos em conjunto</h2><p className="text-sm text-muted-foreground">Combine com a comissão ou sinalize quando precisar conversar.</p></div></div>{objetivos.map((item) => <article key={item.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{item.titulo}</h3><p className="text-xs text-muted-foreground">{item.aluno.nome}{item.prazo ? ` · até ${new Date(item.prazo).toLocaleDateString("pt-BR")}` : ""}</p></div><span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase text-brand-800">{statusLabel[status[item.id]] ?? status[item.id]}</span></div><p className="mt-3 text-sm">{item.descricao}</p>{!["concluido", "cancelado"].includes(status[item.id]) && <div className="mt-3 space-y-2"><Textarea value={comentarios[item.id] ?? ""} onChange={(event) => setComentarios((atual) => ({ ...atual, [item.id]: event.target.value }))} maxLength={800} rows={3} placeholder="Comentário opcional ao confirmar; obrigatório para pedir conversa" aria-label={`Comentário sobre ${item.titulo}`} /><div className="flex flex-col gap-2 sm:flex-row"><Button size="sm" disabled={pending} onClick={() => responder(item.id, "combinado")}>Combinar objetivo</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => responder(item.id, "revisao_solicitada")}>Quero conversar antes</Button></div></div>}</article>)}</section>
}
