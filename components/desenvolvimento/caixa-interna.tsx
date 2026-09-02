"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { atualizarPreferenciaNotificacoesInternas, listarNotificacoesInternas, marcarNotificacaoInternaLida } from "@/app/actions/fluxo-desenvolvimento"
import { Button } from "@/components/ui/button"

type Dados = NonNullable<Awaited<ReturnType<typeof listarNotificacoesInternas>>["dados"]>

export function CaixaInterna() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const carregar = () => startTransition(async () => { setErro(""); try { const resposta = await listarNotificacoesInternas(); if (resposta.dados) setDados(resposta.dados); else { setDados(null); setErro(resposta.error ?? "Caixa indisponível.") } } catch { setDados(null); setErro("Não foi possível consultar a caixa interna.") } })
  const abrir = (id: number, href: string) => startTransition(async () => { await marcarNotificacaoInternaLida(id); window.location.assign(href) })
  const alternar = (ativa: boolean) => startTransition(async () => { const resposta = await atualizarPreferenciaNotificacoesInternas(ativa); if (resposta.error) setErro(resposta.error); else setDados((atual) => atual ? { ...atual, notificacoesAtivas: ativa } : atual) })
  return <section aria-labelledby="caixa-interna" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"><div><h2 id="caixa-interna" className="font-heading text-xl font-bold">Caixa interna da comissão</h2><p className="mt-1 text-sm text-muted-foreground">Atribuições e menções recebidas dentro do sistema. Nenhuma mensagem é enviada por e-mail ou WhatsApp.</p></div><Button variant="outline" disabled={pending} onClick={carregar}>{pending ? "Consultando..." : dados ? "Atualizar caixa" : "Consultar caixa interna"}</Button>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}{dados && <div role="status" className="space-y-3"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-4" checked={dados.notificacoesAtivas} disabled={pending} onChange={(event) => alternar(event.target.checked)} />Receber novas atribuições e menções nesta caixa interna</label><p className="text-sm font-semibold">{dados.naoLidas} não lida(s)</p>{dados.itens.length ? <ul className="space-y-2">{dados.itens.map((item) => <li key={item.id} className={`rounded-lg border p-3 text-sm ${item.lidaEm ? "opacity-70" : "border-brand-300 bg-brand-50/40"}`}><Link href={item.href} onClick={(event) => { event.preventDefault(); abrir(item.id, item.href) }} className="font-semibold text-brand-700 underline">{item.titulo}</Link><p className="mt-1 text-xs text-muted-foreground">{item.tipo === "mencao" ? "Menção" : "Atribuição"} · {new Date(item.createdAt).toLocaleString("pt-BR")}{item.lidaEm ? " · Lida" : ""}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma notificação interna.</p>}</div>}</section>
}
