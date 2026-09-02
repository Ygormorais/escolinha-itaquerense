"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { Search } from "lucide-react"
import { buscarOperacaoLocal } from "@/app/actions/busca-operacional"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Dados = NonNullable<Awaited<ReturnType<typeof buscarOperacaoLocal>>["dados"]>

export function BuscaOperacionalLocal() {
  const [pergunta, setPergunta] = useState("")
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState("")
  const [pending, startTransition] = useTransition()
  const buscar = (event: React.FormEvent) => { event.preventDefault(); startTransition(async () => { setErro(""); try { const resultado = await buscarOperacaoLocal(pergunta); if (resultado.dados) setDados(resultado.dados); else setErro(resultado.error ?? "Busca indisponível.") } catch { setErro("Não foi possível executar a busca local.") } }) }
  return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="busca-operacional"><div><h2 id="busca-operacional" className="font-heading text-xl font-bold">Busca operacional local</h2><p className="mt-1 text-sm text-muted-foreground">Pergunte por faltas, documentos, objetivos, rotinas, vagas ou procure um atleta. Funciona sem API de IA.</p></div><form onSubmit={buscar} className="flex flex-col gap-2 sm:flex-row"><Input value={pergunta} onChange={(e) => setPergunta(e.target.value)} minLength={3} maxLength={240} required placeholder="Ex.: quais turmas estão lotadas e têm lista de espera?" /><Button type="submit" disabled={pending}><Search className="size-4" />{pending ? "Buscando..." : "Buscar"}</Button></form>{erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}{dados && <div role="status" className="space-y-3"><p className="text-xs text-muted-foreground">Critérios: {dados.criterios.join("; ")}. {dados.aviso}</p>{dados.resultados.length ? <ul className="grid gap-2 md:grid-cols-2">{dados.resultados.map((item) => <li key={item.id} className="rounded-lg border p-3"><Link href={item.href} className="font-semibold text-brand-700 hover:underline">{item.titulo}</Link><p className="mt-1 text-sm text-muted-foreground">{item.detalhe}</p></li>)}</ul> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum resultado para os critérios reconhecidos.</p>}</div>}</section>
}
