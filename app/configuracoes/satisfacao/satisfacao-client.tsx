"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { criarPesquisa, encerrarPesquisa } from "@/app/actions/satisfacao"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PERGUNTA_PADRAO } from "@/lib/satisfacao"

function hojeIso(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

export function NovaPesquisa({ bloqueada }: { bloqueada: boolean }) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [pergunta, setPergunta] = useState(PERGUNTA_PADRAO)
  const [inicio, setInicio] = useState(() => hojeIso())
  const [fim, setFim] = useState(() => somarDias(hojeIso(), 14))
  const [lembrete, setLembrete] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function criar(event: React.FormEvent) {
    event.preventDefault()
    setErro(null)
    startTransition(async () => {
      const resultado = await criarPesquisa({ titulo, pergunta, inicio, fim, lembrete })
      if ("error" in resultado) {
        setErro(resultado.error)
        return
      }
      toast.success("Pesquisa criada.")
      setAberto(false)
      setTitulo("")
    })
  }

  if (!aberto) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="button" onClick={() => setAberto(true)} disabled={bloqueada} aria-describedby={bloqueada ? "nova-pesquisa-aviso" : undefined}>Nova pesquisa</Button>
        {bloqueada && <p id="nova-pesquisa-aviso" className="text-sm text-muted-foreground">Já existe uma pesquisa aberta ou agendada. Encerre-a para criar outra.</p>}
      </div>
    )
  }

  return (
    <form onSubmit={criar} className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2" aria-label="Nova pesquisa de satisfação">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="pesq-titulo">Título (as famílias veem)</Label>
        <Input id="pesq-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} required minLength={3} placeholder="Pesquisa do 2º semestre de 2026" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="pesq-pergunta">Pergunta (nota de 0 a 10)</Label>
        <Input id="pesq-pergunta" value={pergunta} onChange={(e) => setPergunta(e.target.value)} maxLength={200} required minLength={10} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pesq-inicio">Início</Label>
        <Input id="pesq-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pesq-fim">Fim (inclusive)</Label>
        <Input id="pesq-fim" type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} required />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm sm:col-span-2">
        <input type="checkbox" className="mt-1 size-4 shrink-0" checked={lembrete} onChange={(e) => setLembrete(e.target.checked)} />
        <span>Enviar uma notificação de lembrete nos últimos 3 dias, só para quem ainda não respondeu e ativou as notificações do portal.</span>
      </label>
      {erro && <p role="alert" className="text-sm font-medium text-destructive sm:col-span-2">{erro}</p>}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>{pending ? "Criando..." : "Criar pesquisa"}</Button>
        <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </form>
  )
}

export function EncerrarPesquisa({ id, titulo }: { id: number; titulo: string }) {
  const [pending, startTransition] = useTransition()
  function encerrar() {
    if (!window.confirm(`Encerrar a pesquisa "${titulo}"? As famílias não poderão mais responder.`)) return
    startTransition(async () => {
      const resultado = await encerrarPesquisa(id)
      if ("error" in resultado) toast.error(resultado.error)
      else toast.success("Pesquisa encerrada.")
    })
  }
  return <Button type="button" variant="outline" onClick={encerrar} disabled={pending}>{pending ? "Encerrando..." : "Encerrar pesquisa"}</Button>
}
