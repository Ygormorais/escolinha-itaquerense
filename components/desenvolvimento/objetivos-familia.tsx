"use client"

import { useState, useTransition } from "react"
import { Target } from "lucide-react"
import { toast } from "sonner"
import { atualizarStatusObjetivo, criarObjetivoCompartilhado, listarObjetivosComissao } from "@/app/actions/objetivos-familia"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Dados = Awaited<ReturnType<typeof listarObjetivosComissao>>["dados"]

const statusLabel: Record<string, string> = {
  proposto: "Aguardando família",
  combinado: "Combinado",
  revisao_solicitada: "Revisão solicitada",
  concluido: "Concluído",
  cancelado: "Cancelado",
}

export function ObjetivosFamilia() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [alunoId, setAlunoId] = useState("")
  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [prazo, setPrazo] = useState("")
  const [pending, startTransition] = useTransition()

  function carregar() {
    startTransition(async () => {
      try {
        const resultado = await listarObjetivosComissao()
        setDados(resultado.dados)
        if (!alunoId && resultado.dados.alunos[0]) setAlunoId(String(resultado.dados.alunos[0].id))
      } catch {
        toast.error("Não foi possível carregar os objetivos.")
      }
    })
  }

  function criar(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      const resultado = await criarObjetivoCompartilhado({ alunoId: Number(alunoId), titulo, descricao, prazo })
      if ("error" in resultado) {
        toast.error(resultado.error)
        return
      }
      toast.success("Objetivo enviado para revisão da família.")
      setTitulo(""); setDescricao(""); setPrazo("")
      const atualizado = await listarObjetivosComissao()
      setDados(atualizado.dados)
    })
  }

  function mudarStatus(id: number, status: "concluido" | "cancelado" | "proposto") {
    startTransition(async () => {
      const resultado = await atualizarStatusObjetivo(id, status)
      if ("error" in resultado) {
        toast.error(resultado.error)
        return
      }
      const atualizado = await listarObjetivosComissao()
      setDados(atualizado.dados)
      toast.success("Objetivo atualizado.")
    })
  }

  return (
    <section aria-labelledby="objetivos-familia" className="space-y-5 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-50 text-info-700" aria-hidden><Target className="size-5" /></span><div><h2 id="objetivos-familia" className="font-heading text-xl font-bold">Objetivos combinados com a família</h2><p className="mt-1 text-sm text-muted-foreground">A comissão propõe um objetivo; a família confirma ou solicita conversa. Nada é publicado automaticamente.</p></div></div>
      {!dados ? <Button type="button" variant="outline" disabled={pending} onClick={carregar}>{pending ? "Carregando..." : "Abrir objetivos"}</Button> : <>
        <form onSubmit={criar} className="grid gap-3 rounded-xl border bg-muted/25 p-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="objetivo-atleta">Atleta</Label><select id="objetivo-atleta" value={alunoId} onChange={(event) => setAlunoId(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm" required>{dados.alunos.map((aluno) => <option key={aluno.id} value={aluno.id}>{aluno.nome} · {aluno.turma}</option>)}</select></div>
          <div className="space-y-2"><Label htmlFor="objetivo-titulo">Objetivo</Label><Input id="objetivo-titulo" value={titulo} onChange={(event) => setTitulo(event.target.value)} minLength={3} maxLength={120} required placeholder="Ex.: manter rotina de chegada" /></div>
          <div className="space-y-2"><Label htmlFor="objetivo-prazo">Prazo opcional</Label><Input id="objetivo-prazo" type="date" value={prazo} onChange={(event) => setPrazo(event.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="objetivo-descricao">Como escola e família podem colaborar</Label><Textarea id="objetivo-descricao" value={descricao} onChange={(event) => setDescricao(event.target.value)} minLength={10} maxLength={1200} required rows={4} /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={pending || dados.alunos.length === 0}>Enviar para a família</Button></div>
        </form>
        <div className="space-y-3">
          {dados.objetivos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum objetivo compartilhado.</p> : dados.objetivos.map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{item.titulo}</h3><p className="text-xs text-muted-foreground">{item.aluno.nome} · {item.aluno.turma}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase">{statusLabel[item.status] ?? item.status}</span></div><p className="mt-3 text-sm">{item.descricao}</p>{item.respostaFamilia && <p className="mt-2 rounded-lg bg-brand-50 p-3 text-sm"><strong>Família:</strong> {item.respostaFamilia}</p>}<div className="mt-3 flex flex-wrap gap-2">{item.status !== "concluido" && item.status !== "cancelado" && <Button size="sm" variant="outline" disabled={pending} onClick={() => mudarStatus(item.id, "concluido")}>Concluir</Button>}{item.status !== "cancelado" && <Button size="sm" variant="ghost" disabled={pending} onClick={() => mudarStatus(item.id, "cancelado")}>Cancelar</Button>}{(item.status === "concluido" || item.status === "cancelado") && <Button size="sm" variant="outline" disabled={pending} onClick={() => mudarStatus(item.id, "proposto")}>Reabrir</Button>}</div></article>)}
        </div>
      </>}
    </section>
  )
}
