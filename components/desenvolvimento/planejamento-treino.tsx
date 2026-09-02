"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { objetivosTreino, prepararPlanoTreino, type PreferenciasTreino } from "@/lib/planejamento-treino"
import { listarPlanosTreino, salvarPlanoTreino } from "@/app/actions/planejamento-treino"
import { useAvisoEdicoes } from "./use-aviso-edicoes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RetornoPlanoTreino } from "@/components/desenvolvimento/retorno-plano-treino"

type PlanoSalvo = NonNullable<Awaited<ReturnType<typeof salvarPlanoTreino>>["salvo"]>
const control = "h-11 w-full rounded-lg border bg-background px-3 text-sm"
export function PlanejamentoTreino() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<PreferenciasTreino>({ turma: "", faixa: "9–11", duracao: 45, objetivo: "passes", bolas: false, cones: false })
  const [base, setBase] = useState<{ prefs: PreferenciasTreino; texto: string } | null>(null)
  const [texto, setTexto] = useState("")
  const [salvo, setSalvo] = useState("")
  const [revisado, setRevisado] = useState(false)
  const [substituir, setSubstituir] = useState(false)
  const [pending, start] = useTransition()
  const [copiando, setCopiando] = useState(false)
  const [itens, setItens] = useState<PlanoSalvo[] | null>(null)
  const [pagina, setPagina] = useState<number | null>(null)
  const dirty = base !== null && texto.trim() !== (salvo || base.texto).trim()
  const opcoesMudaram = base !== null && JSON.stringify(base.prefs) !== JSON.stringify(prefs)
  useAvisoEdicoes(dirty)
  const alterar = (p: Partial<PreferenciasTreino>) => { setPrefs({ ...prefs, ...p }); setRevisado(false); setSubstituir(false); if (p.turma !== undefined) { setItens(null); setPagina(null) } }
  const historico = (antesDe?: number) => start(async () => { try { const r = await listarPlanosTreino({ turma: prefs.turma, antesDe }); if (r.itens) { setItens((old) => antesDe ? [...(old ?? []), ...r.itens] : r.itens); setPagina(r.proximaPagina) } else toast.error(r.error) } catch { toast.error("Não foi possível consultar o histórico. Tente novamente.") } })
  return <section className="rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="planejamento-title">
    <h2 id="planejamento-title" className="font-heading text-xl font-bold">Planejamento de treino assistido</h2>
    <p className="my-2 text-sm text-muted-foreground">Sugestões por faixa etária, duração, objetivo e materiais. Catálogo local, sem API; a comissão precisa validar as atividades antes do uso.</p>
    <Button variant="outline" onClick={() => setOpen(true)}>Planejar treino</Button>
    {!open && dirty && <p role="status" className="mt-2 text-sm">Há edições não salvas no plano. Abra novamente para retomar antes de sair da página.</p>}
    <Dialog open={open} onOpenChange={(v) => { if (!pending && !copiando) setOpen(v) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Plano de treino local</DialogTitle><DialogDescription>O técnico revisa e adapta a proposta. Salvar não agenda treino nem envia mensagens.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="treino-turma">Turma do treino</Label><Input id="treino-turma" maxLength={100} disabled={pending || copiando} value={prefs.turma} onChange={(e) => alterar({ turma: e.target.value })} /></div>
        <div className="space-y-2"><Label htmlFor="treino-faixa">Faixa etária de referência</Label><select id="treino-faixa" className={control} disabled={pending || copiando} value={prefs.faixa} onChange={(e) => alterar({ faixa: e.target.value as PreferenciasTreino["faixa"] })}>{["6–8", "9–11", "12–15", "16–17"].map((v) => <option key={v}>{v}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="treino-tempo">Duração em minutos</Label><select id="treino-tempo" className={control} disabled={pending || copiando} value={prefs.duracao} onChange={(e) => alterar({ duracao: Number(e.target.value) as PreferenciasTreino["duracao"] })}>{[30, 45, 60].map((v) => <option key={v}>{v}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="treino-objetivo">Objetivo do treino</Label><select id="treino-objetivo" className={control} disabled={pending || copiando} value={prefs.objetivo} onChange={(e) => alterar({ objetivo: e.target.value as PreferenciasTreino["objetivo"] })}>{Object.entries(objetivosTreino).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>
      </div>
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">Materiais disponíveis</legend>{(["bolas", "cones"] as const).map((key) => <label key={key} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={prefs[key]} disabled={pending || copiando} onChange={(e) => alterar({ [key]: e.target.checked })} />{key === "bolas" ? "Bolas disponíveis" : "Cones disponíveis"}</label>)}</fieldset>
      {dirty && <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={substituir} disabled={pending || copiando} onChange={(e) => setSubstituir(e.target.checked)} />Permitir substituir minhas edições do treino.</label>}
      <Button disabled={pending || copiando || (dirty && !substituir)} onClick={() => { const r = prepararPlanoTreino(prefs); if (!r.plano) { toast.error(r.error); return } setBase({ prefs: { ...prefs }, texto: r.plano.texto }); setTexto(r.plano.texto); setSalvo(""); setRevisado(false); setSubstituir(false) }}>Preparar proposta de treino</Button>
      {base && <div className="space-y-3">
        {opcoesMudaram && <p role="alert" className="text-sm">As opções mudaram. Prepare outra proposta ou retorne às opções originais antes de revisar, salvar ou copiar.</p>}
        <Label htmlFor="treino-texto">Plano para revisão do técnico</Label><Textarea id="treino-texto" value={texto} rows={14} maxLength={8000} disabled={pending || copiando} onChange={(e) => { setTexto(e.target.value); setRevisado(false); setSubstituir(false) }} />
        {dirty && <p role="status" className="text-sm">Alterações não salvas. Salve antes de sair da página; o aviso de saída depende do navegador.</p>}
        <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={revisado} disabled={pending || copiando || opcoesMudaram} onChange={(e) => setRevisado(e.target.checked)} />Revisei as atividades, tempos e adaptações para esta turma.</label>
        <div className="flex flex-wrap gap-2"><Button disabled={pending || copiando || !revisado || opcoesMudaram || texto.trim().length < 80 || texto.trim() === salvo} onClick={() => start(async () => { try { const r = await salvarPlanoTreino({ preferencias: base.prefs, texto, revisado }); if (r.salvo) { setSalvo(r.salvo.texto); toast.success("Plano revisado salvo. Nenhum treino foi agendado."); setItens(null); setPagina(null) } else toast.error(r.error) } catch { toast.error("Não foi possível salvar. O texto foi preservado.") } })}>{texto.trim() === salvo ? "Plano salvo" : "Salvar plano revisado"}</Button><Button variant="outline" disabled={pending || copiando || !revisado || opcoesMudaram || texto.trim().length < 80} onClick={async () => { setCopiando(true); try { await navigator.clipboard.writeText(texto); toast.success("Plano copiado.") } catch { toast.error("Não foi possível copiar. Selecione o texto manualmente.") } finally { setCopiando(false) } }}>Copiar plano</Button></div>
      </div>}
      <section className="space-y-3 border-t pt-4" aria-labelledby="treino-historico"><h3 id="treino-historico" className="font-semibold">Planos salvos da turma informada</h3><Button variant="outline" disabled={pending || copiando || !prefs.turma.trim()} onClick={() => historico()}>Consultar planos salvos</Button>{itens?.length === 0 && <p className="text-sm">Nenhum plano salvo nesta turma.</p>}{itens?.map((p) => <details key={p.id} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer break-words">{p.turma} · {new Date(p.createdAt).toLocaleString("pt-BR")} · {p.usuario}</summary><p className="mt-3 whitespace-pre-wrap break-words">{p.texto}</p><RetornoPlanoTreino planoId={p.id} /></details>)}{pagina && <Button disabled={pending || copiando} variant="outline" onClick={() => historico(pagina)}>Carregar planos anteriores</Button>}</section>
    </DialogContent></Dialog>
  </section>
}
