"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { consultarQualidadeCadastrosDesenvolvimento } from "@/app/actions/qualidade-desenvolvimento"
import { Button } from "@/components/ui/button"

type Dados = NonNullable<Awaited<ReturnType<typeof consultarQualidadeCadastrosDesenvolvimento>>["dados"]>
type Aluno = { id?: number; alunoId?: number; nome: string; turma: string }

function GrupoQualidade({ titulo, explicacao, itens }: { titulo: string; explicacao: string; itens: Aluno[] }) {
  return <article className="rounded-lg border p-3"><h3 className="font-semibold">{titulo} <span className="tabular-nums">({itens.length})</span></h3><p className="mt-1 text-xs text-muted-foreground">{explicacao}</p>{itens.length ? <ul className="mt-3 space-y-2 text-sm">{itens.map((item, index) => <li key={`${item.id ?? item.alunoId}-${index}`}><Link href={`/alunos/${item.id ?? item.alunoId}`} className="break-words font-semibold text-brand-700 underline">{item.nome}</Link><span className="text-muted-foreground"> · {item.turma || "Sem turma"}</span></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhuma ocorrência.</p>}</article>
}

export function QualidadeCadastros() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const consultar = () => startTransition(async () => { setErro(""); try { const resposta = await consultarQualidadeCadastrosDesenvolvimento(); setDados(resposta.dados) } catch { setDados(null); setErro("Não foi possível consultar a qualidade dos cadastros.") } })
  return <section aria-labelledby="qualidade-cadastros" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"><div><h2 id="qualidade-cadastros" className="font-heading text-xl font-bold">Qualidade dos cadastros</h2><p className="mt-1 text-sm text-muted-foreground">Aponta registros que precisam de revisão humana. Nenhuma informação é corrigida automaticamente.</p></div><Button variant="outline" disabled={pending} onClick={consultar}>{pending ? "Consultando..." : dados ? "Atualizar ocorrências" : "Consultar ocorrências"}</Button>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}{dados && <div role="status" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><GrupoQualidade titulo="Sem responsável ativo" explicacao="Atleta ativo sem vínculo válido no Portal da Família." itens={dados.semResponsavel} /><GrupoQualidade titulo="Sem turma" explicacao="Atleta ativo com o campo de turma vazio." itens={dados.semTurma} /><GrupoQualidade titulo="Sem avaliação recente" explicacao="Nenhuma avaliação cadastrada nos últimos 90 dias." itens={dados.semAvaliacao} /><GrupoQualidade titulo="Sem frequência recente" explicacao="Nenhuma frequência registrada nos últimos 30 dias; isso não significa ausência." itens={dados.semFrequencia} /><GrupoQualidade titulo="Publicação com vínculo antigo" explicacao="Resumo ativo cujo destinatário não corresponde mais ao vínculo atual." itens={dados.vinculosPublicadosAntigos} /></div>}</section>
}
