"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { enviarMensagemFamilia } from "@/app/actions/conversas-familia"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type Conversa = { id: number; titulo: string; contextoTipo: string; status: string; aluno: { nome: string }; mensagens: { id: number; autorTipo: string; texto: string; createdAt: Date | string }[] }
export function ConversasFamiliaClient({ conversas }: { conversas: Conversa[] }) {
  const [itens, setItens] = useState(conversas); const [respostas, setRespostas] = useState<Record<number, string>>({}); const [pending, startTransition] = useTransition()
  const enviar = (id: number) => startTransition(async () => { const texto = respostas[id] ?? ""; const r = await enviarMensagemFamilia(id, texto); if ("error" in r) { toast.error(r.error); return } setItens((atuais) => atuais.map((c) => c.id === id ? { ...c, mensagens: [...c.mensagens, { id: -Date.now(), autorTipo: "familia", texto, createdAt: new Date().toISOString() }] } : c)); setRespostas((a) => ({ ...a, [id]: "" })); toast.success("Mensagem enviada à equipe.") })
  if (!itens.length) return <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma conversa iniciada pela equipe.</p>
  return <section className="space-y-4" aria-label="Conversas com a equipe">{itens.map((c) => <article key={c.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-heading text-lg font-bold">{c.titulo}</h2><p className="text-xs text-muted-foreground">{c.aluno.nome} · {c.contextoTipo}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase">{c.status}</span></div><div className="mt-4 space-y-2">{c.mensagens.map((m) => <div key={m.id} className={`rounded-lg p-3 text-sm ${m.autorTipo === "familia" ? "ml-6 bg-brand-50" : "mr-6 bg-muted"}`}><strong>{m.autorTipo === "familia" ? "Você" : "Equipe"}</strong><p className="mt-1 whitespace-pre-wrap">{m.texto}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleString("pt-BR")}</p></div>)}</div>{c.status === "aberta" && <div className="mt-3 space-y-2"><Textarea value={respostas[c.id] ?? ""} onChange={(e) => setRespostas((a) => ({ ...a, [c.id]: e.target.value }))} maxLength={2000} rows={3} placeholder="Escreva sua resposta" /><Button size="sm" disabled={pending || (respostas[c.id]?.trim().length ?? 0) < 2} onClick={() => enviar(c.id)}>Enviar resposta</Button></div>}</article>)}</section>
}
