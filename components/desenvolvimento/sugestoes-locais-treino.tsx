"use client"

import { useState, useTransition } from "react"
import { consultarSugestoesLocaisTreino } from "@/app/actions/evolucao-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarSugestoesLocaisTreino>>["dados"]>

export function SugestoesLocaisTreino({ turmas }: { turmas: string[] }) {
  const [turma, setTurma] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const consultar = () => startTransition(async () => { setErro(""); try { const resposta = await consultarSugestoesLocaisTreino({ turma: turma.slice(2) }); if (resposta.dados) setDados(resposta.dados); else { setDados(null); setErro(resposta.error ?? "Sugestões indisponíveis.") } } catch { setDados(null); setErro("Não foi possível preparar as sugestões locais.") } })

  return <section aria-labelledby="sugestoes-locais-treino" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div><h2 id="sugestoes-locais-treino" className="font-heading text-xl font-bold">Sugestões locais para o próximo treino</h2><p className="mt-1 text-sm text-muted-foreground">Regras transparentes baseadas em frequência, avaliações, ações e retornos. Não usa IA externa, não prescreve atividades individuais e não salva um plano automaticamente.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="min-w-0 flex-1 space-y-2"><Label htmlFor="turma-sugestoes-locais">Turma para as sugestões</Label><select id="turma-sugestoes-locais" value={turma} disabled={pending} onChange={(event) => { setTurma(event.target.value); setDados(null); setErro("") }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Selecione uma turma</option>{turmas.map((item) => <option key={item} value={`t:${item}`}>{item || "Sem turma"}</option>)}</select></div><Button variant="outline" disabled={pending || !turma} onClick={consultar}>{pending ? "Preparando..." : dados ? "Atualizar sugestões" : "Preparar sugestões locais"}</Button></div>
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    {dados && <div role="status" className="space-y-3"><p className="text-xs text-muted-foreground">Recorte de {dados.turma}: {dados.criterios.atletasAtivos} atleta(s) ativo(s), {dados.criterios.frequenciaValida30Dias} frequência(s) válida(s) em 30 dias, {dados.criterios.avaliados90Dias} avaliado(s) em 90 dias, {dados.criterios.acoesPendentes} ação(ões) pendente(s) e {dados.criterios.planosSemRetorno} plano(s) sem retorno.</p><div className="grid gap-3 lg:grid-cols-2">{dados.sugestoes.map((item) => <article key={item.id} className="rounded-lg border p-3"><h3 className="font-semibold">{item.titulo}</h3><p className="mt-1 text-sm"><strong>Evidência:</strong> {item.evidencia}</p><p className="mt-2 text-sm text-muted-foreground"><strong>Sugestão para revisão:</strong> {item.sugestao}</p></article>)}</div><p className="text-xs text-muted-foreground">A comissão deve considerar calendário, espaço, materiais, saúde e contexto do grupo antes de usar qualquer sugestão.</p></div>}
  </section>
}
