"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { perguntarDesenvolvimento, consultarResultadosAcoes } from "@/app/actions/consultas-desenvolvimento"
import { perguntasDesenvolvimento } from "@/lib/perguntas-desenvolvimento"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ResultadosAcoes() {
  const [dados, setDados] = useState<Awaited<ReturnType<typeof consultarResultadosAcoes>> | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  return <section aria-labelledby="resultados-acoes" className="rounded-xl border bg-card p-4 sm:p-5">
    <h2 id="resultados-acoes" className="font-heading text-xl font-bold">Resultados do acompanhamento</h2>
    <p className="my-2 text-sm text-muted-foreground">Contagem de todos os ciclos registrados, sem o limite de 40 itens do histórico. Concluir uma ação não comprova melhora esportiva.</p>
    <Button variant="outline" disabled={pending} onClick={() => start(async () => { setErro(""); try { setDados(await consultarResultadosAcoes()) } catch { setErro("Não foi possível consultar. Confira sua sessão e tente novamente.") } })}>{pending ? "Consultando..." : "Atualizar resultados das ações"}</Button>
    {erro && <p role="alert" className="mt-2 text-sm">{erro}</p>}
    {dados && <div role="status" className="mt-4 space-y-2 text-sm"><p>{dados.pendentes} pendente(s) · {dados.concluidas} concluída(s) · {dados.ignoradas} ignorada(s)</p><p className="text-muted-foreground">Consultado em {new Date(dados.consultadoEm).toLocaleString("pt-BR")}. No histórico abaixo, abra o acompanhamento de cada ação concluída para comparar a frequência antes/depois. A comparação exige período completo e amostra suficiente; não demonstra causa e efeito.</p></div>}
  </section>
}

type Resposta = NonNullable<Awaited<ReturnType<typeof perguntarDesenvolvimento>>["resposta"]>
export function ConsultasLocais({ turmas }: { turmas: string[] }) {
  // Começa vazio também no SSR; a escolha explícita evita assumir uma pergunta
  // e mantém os atributos de estado da Base UI iguais durante a hidratação.
  const [pergunta, setPergunta] = useState("")
  const [turma, setTurma] = useState("")
  const [resposta, setResposta] = useState<Resposta | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const limpar = () => { setResposta(null); setErro("") }
  return <section aria-labelledby="consultas-locais" className="min-w-0 space-y-3 rounded-xl border bg-card p-4 sm:p-5">
    <h2 id="consultas-locais" className="font-heading text-xl font-bold">Pergunte aos registros</h2>
    <p className="text-sm text-muted-foreground">Consultas locais com perguntas reconhecidas, sem IA generativa ou API externa. Não faz previsões, diagnósticos nem ranking de atletas.</p>
    <div className="flex flex-wrap gap-2">{Object.values(perguntasDesenvolvimento).map((exemplo) => <Button key={exemplo} variant="outline" className="h-auto min-h-11 max-w-full whitespace-normal break-words text-left" disabled={pending} onClick={() => { limpar(); setPergunta(exemplo) }}>{exemplo}</Button>)}</div>
    <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
      <div className="space-y-2"><Label htmlFor="pergunta-local">Pergunta sobre os registros</Label><Input id="pergunta-local" value={pergunta} placeholder="Escolha uma pergunta acima" maxLength={200} disabled={pending} onChange={(e) => { limpar(); setPergunta(e.target.value) }} /></div>
      <div className="space-y-2"><Label htmlFor="turma-consulta">Turma da consulta</Label><select id="turma-consulta" value={turma} disabled={pending} onChange={(e) => { limpar(); setTurma(e.target.value) }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Todas as turmas</option>{turmas.map((t) => <option key={t} value={`t:${t}`}>{t || "Sem turma"}</option>)}</select></div>
    </div>
    <Button disabled={pending || !pergunta.trim()} onClick={() => start(async () => { limpar(); try { const r = await perguntarDesenvolvimento({ pergunta, turma: turma ? turma.slice(2) : undefined }); if (r.resposta) setResposta(r.resposta); else setErro(r.error ?? "Consulta indisponível.") } catch { setErro("Não foi possível consultar. Verifique sua sessão e conexão.") } })}>{pending ? "Consultando..." : "Consultar registros"}</Button>
    {erro && <p role="alert" className="text-sm">{erro}</p>}
    {resposta && <div className="space-y-3 text-sm"><p role="status" className="font-semibold">{resposta.total} {resposta.unidade} encontrado(s). Exibindo {resposta.itens.length}.</p><p className="text-muted-foreground">{resposta.criterio}</p><p className="text-xs text-muted-foreground">Consulta em {new Date(resposta.consultadoEm).toLocaleString("pt-BR")}. Atualize a consulta após alterar registros.</p><ul className="space-y-2">{resposta.itens.map((item) => <li key={item.id} className="min-w-0 overflow-hidden rounded-lg border p-3">{item.href ? <Link href={item.href} className="block break-words font-semibold underline">{item.nome} · {item.turma || "Sem turma"}</Link> : <p className="break-words font-semibold">{item.nome}</p>}<p className="break-words">{item.detalhe}</p></li>)}</ul>{resposta.total > resposta.itens.length && <p>Há mais resultados. Selecione uma turma para reduzir a consulta.</p>}</div>}
  </section>
}
