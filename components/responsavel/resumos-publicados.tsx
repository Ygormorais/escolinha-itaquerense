"use client"

import { useState, useTransition } from "react"
import { listarResumosPublicados, confirmarLeituraResumo } from "@/app/actions/publicacao-resumo"
import { Button } from "@/components/ui/button"

type Item = NonNullable<Awaited<ReturnType<typeof listarResumosPublicados>>["itens"]>[number]
export function ResumosPublicados() {
  const [itens, setItens] = useState<Item[] | null>(null)
  const [pagina, setPagina] = useState<number | null>(null)
  const [erro, setErro] = useState("")
  const [pending, start] = useTransition()
  const consultar = (antesDe?: number) => start(async () => { setErro(""); try { const r = await listarResumosPublicados(antesDe); if (r.itens) { setItens((old) => antesDe ? [...(old ?? []), ...r.itens] : r.itens); setPagina(r.proximaPagina) } else { setItens(null); setPagina(null); setErro(r.error ?? "Não foi possível consultar.") } } catch { setErro("Não foi possível consultar os resumos. Verifique a conexão e tente novamente.") } })
  return <section aria-labelledby="resumos-equipe" className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
    <h2 id="resumos-equipe" className="font-heading text-xl font-bold">Resumos da equipe</h2>
    <p className="text-sm text-muted-foreground">Acompanhamentos mensais revisados e publicados pela equipe. A confirmação de leitura é opcional e não significa concordância com o conteúdo.</p>
    <Button variant="outline" disabled={pending} onClick={() => consultar()}>{pending ? "Consultando..." : itens ? "Atualizar resumos" : "Consultar resumos da equipe"}</Button>
    {erro && <p role="alert" className="text-sm">{erro}</p>}
    {itens?.length === 0 && <p role="status" className="text-sm">Nenhum resumo publicado para seus atletas ativos.</p>}
    {itens?.map((item) => <details key={item.id} className="rounded-lg border p-4 text-sm"><summary className="cursor-pointer font-semibold break-words">{item.alunoNome} · {item.mes.split("-").reverse().join("/")}</summary><p className="mt-3 text-xs text-muted-foreground">Publicado em {new Date(item.publicadoEm).toLocaleString("pt-BR")}. Retrato do período informado, não uma avaliação em tempo real.</p><p className="my-4 whitespace-pre-wrap break-words">{item.texto}</p>{item.lidoEm ? <p role="status">Leitura confirmada em {new Date(item.lidoEm).toLocaleString("pt-BR")}.</p> : <Button disabled={pending} onClick={() => start(async () => { setErro(""); try { const r = await confirmarLeituraResumo(item.id); if (r.lidoEm) setItens((old) => old?.map((v) => v.id === item.id ? { ...v, lidoEm: r.lidoEm } : v) ?? null); else { setItens((old) => old?.filter((v) => v.id !== item.id) ?? null); setErro(r.error ?? "Resumo indisponível.") } } catch { setErro("Não foi possível confirmar a leitura. Tente novamente.") } })}>Confirmar que li este resumo</Button>}</details>)}
    {pagina !== null && <Button disabled={pending} variant="outline" onClick={() => consultar(pagina)}>Carregar resumos anteriores</Button>}
  </section>
}
