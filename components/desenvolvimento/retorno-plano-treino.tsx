"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { listarRetornosPlanoTreino, registrarRetornoPlanoTreino } from "@/app/actions/planejamento-treino"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type Retorno = NonNullable<Awaited<ReturnType<typeof registrarRetornoPlanoTreino>>["retorno"]>
const labels: Record<string, string> = { adequado: "Aplicado como planejado", adaptado: "Aplicado com adaptações", nao_utilizado: "Não utilizado" }

export function RetornoPlanoTreino({ planoId }: { planoId: number }) {
  const [open, setOpen] = useState(false)
  const [aplicadoEm, setAplicadoEm] = useState("")
  const [resultado, setResultado] = useState("adaptado")
  const [observacao, setObservacao] = useState("")
  const [confirmado, setConfirmado] = useState(false)
  const [retornos, setRetornos] = useState<Retorno[] | null>(null)
  const [pagina, setPagina] = useState<number | null>(null)
  const [pending, start] = useTransition()
  const consultar = (antesDe?: number) => start(async () => {
    try {
      const r = await listarRetornosPlanoTreino({ planoId, antesDe })
      if (!r.itens) { toast.error(r.error ?? "Não foi possível consultar os retornos."); return }
      setRetornos((old) => antesDe ? [...(old ?? []), ...r.itens] : r.itens)
      setPagina(r.proximaPagina)
    } catch { toast.error("Não foi possível consultar os retornos. Tente novamente.") }
  })
  const salvar = () => start(async () => {
    try {
      const r = await registrarRetornoPlanoTreino({ planoId, aplicadoEm, resultado, observacao, confirmado })
      if (!r.retorno) { toast.error(r.error ?? "Não foi possível registrar o retorno."); return }
      setRetornos((old) => old === null ? null : [r.retorno, ...old.filter((item) => item.id !== r.retorno!.id)].sort((a, b) => b.id - a.id))
      setOpen(false); setAplicadoEm(""); setObservacao(""); setConfirmado(false)
      toast.success("Retorno da comissão registrado sem alterar o plano original.")
    } catch { toast.error("Não foi possível registrar o retorno. Os campos foram preservados.") }
  })
  return <section aria-label="Validação da comissão" className="mt-3 space-y-3 border-t pt-3">
    <p className="text-xs text-muted-foreground">Registre como a proposta foi utilizada. O retorno não altera o plano original nem mede desempenho dos atletas.</p>
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={pending} onClick={() => setOpen(true)}>Registrar retorno da comissão</Button><Button size="sm" variant="outline" disabled={pending} onClick={() => consultar()}>{retornos === null ? "Consultar retornos" : "Atualizar retornos"}</Button></div>
    {retornos?.length === 0 && <p role="status">Nenhum retorno registrado para este plano.</p>}
    {retornos?.map((item) => <div key={item.id} className="rounded-lg bg-muted/50 p-3"><p className="font-semibold">{labels[item.resultado] ?? "Resultado não reconhecido"} · {item.aplicadoEm.split("-").reverse().join("/")}</p><p className="mt-1 whitespace-pre-wrap break-words">{item.observacao}</p><p className="mt-1 text-xs text-muted-foreground">Registrado por {item.usuario} em {new Date(item.createdAt).toLocaleString("pt-BR")}.</p></div>)}
    {pagina !== null && <Button size="sm" variant="outline" disabled={pending} onClick={() => consultar(pagina)}>Carregar retornos anteriores</Button>}
    <Dialog open={open} onOpenChange={(value) => { if (!pending) setOpen(value) }}><DialogContent>
      <DialogHeader><DialogTitle>Retorno da comissão</DialogTitle><DialogDescription>Registre fatos observados depois de usar ou decidir não usar este plano. O registro é histórico e não será tratado como avaliação individual.</DialogDescription></DialogHeader>
      <div className="space-y-2"><Label htmlFor={`retorno-data-${planoId}`}>Data de aplicação ou decisão</Label><input id={`retorno-data-${planoId}`} type="date" value={aplicadoEm} disabled={pending} onChange={(e) => { setAplicadoEm(e.target.value); setConfirmado(false) }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm" /></div>
      <div className="space-y-2"><Label htmlFor={`retorno-resultado-${planoId}`}>Como o plano foi utilizado</Label><select id={`retorno-resultado-${planoId}`} value={resultado} disabled={pending} onChange={(e) => { setResultado(e.target.value); setConfirmado(false) }} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"><option value="adequado">Aplicado como planejado</option><option value="adaptado">Aplicado com adaptações</option><option value="nao_utilizado">Não utilizado</option></select></div>
      <div className="space-y-2"><Label htmlFor={`retorno-observacao-${planoId}`}>O que funcionou ou precisou mudar</Label><Textarea id={`retorno-observacao-${planoId}`} rows={5} maxLength={1000} value={observacao} disabled={pending} onChange={(e) => { setObservacao(e.target.value); setConfirmado(false) }} placeholder="Descreva participação do grupo, ajustes de espaço, tempo ou material, sem ranking individual." /></div>
      <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={confirmado} disabled={pending} onChange={(e) => setConfirmado(e.target.checked)} />Confirmo que este retorno descreve a utilização do plano e não uma avaliação automática dos atletas.</label>
      <DialogFooter><Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={pending || !confirmado || !aplicadoEm || observacao.trim().length < 3} onClick={salvar}>{pending ? "Registrando..." : "Registrar retorno"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </section>
}
