"use client"

import Link from "next/link"
import { useMemo, useRef, useState, useTransition } from "react"
import { Activity, CheckCircle2, ChevronRight, CircleAlert, Clock3, Copy, LoaderCircle, Search, Sparkles, Users, WandSparkles } from "lucide-react"
import { toast } from "sonner"
import { HistoricoCiclos, type CicloHistoricoView } from "@/components/desenvolvimento/historico-ciclos"
import { PendenciasCiclos } from "@/components/desenvolvimento/pendencias-ciclos"
import { PautaSemanalEditor } from "@/components/desenvolvimento/pauta-semanal-editor"
import type { OportunidadeResumo } from "@/lib/oportunidades"
import { aprovarRascunhoDesenvolvimento, atualizarAcaoDesenvolvimento, gerarRascunhoDesenvolvimento } from "@/app/actions/desenvolvimento"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { insightKeySemanal, type InsightDesenvolvimento, type PrioridadeDesenvolvimento } from "@/lib/desenvolvimento"
import { focosCopiloto, type PreferenciasCopiloto } from "@/lib/desenvolvimento-copiloto"

type ActionStatus = "pendente" | "concluida" | "ignorada"
type ActionSummary = {
  status: ActionStatus
  observacao: string | null
  usuario: string | null
  planoSemanal: string[] | null
  mensagemFamilia: string | null
  rascunhoFonte: string | null
  rascunhoAprovado: boolean
}

type CopilotDraft = {
  planoSemanal: string[]
  mensagemFamilia: string
  fonte: "ia" | "modelo_local"
  aviso?: string
}

const priorityLabel: Record<PrioridadeDesenvolvimento, string> = {
  alta: "Alta prioridade",
  media: "Média prioridade",
  baixa: "Acompanhamento",
}

const priorityStyle: Record<PrioridadeDesenvolvimento, string> = {
  alta: "border-danger-200 bg-danger-50 text-danger-700",
  media: "border-warning-200 bg-warning-50 text-warning-700",
  baixa: "border-info-200 bg-info-50 text-info-700",
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: React.ElementType; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" aria-hidden /></span>
        <div><p className="text-2xl font-bold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  )
}

function IndicatorCard({ insight, action, cycleDate, onAction, onCopilot }: {
  insight: InsightDesenvolvimento
  action?: ActionSummary
  cycleDate: Date
  onAction: (insight: InsightDesenvolvimento, status: ActionStatus) => void
  onCopilot: (insight: InsightDesenvolvimento) => void
}) {
  return (
    <article className={cn(
      "rounded-[var(--radius-card)] border bg-card p-4 shadow-sm sm:p-5",
      action?.status === "concluida" && "border-success-200 bg-success-50/30",
      action?.status === "ignorada" && "opacity-70"
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={priorityStyle[insight.prioridade]}>{priorityLabel[insight.prioridade]}</Badge>
            {action && <Badge variant={action.status === "concluida" ? "success" : action.status === "ignorada" ? "outline" : "info"}>
              {action.status === "concluida" ? "Concluída" : action.status === "ignorada" ? "Ignorada" : "Na fila"}
            </Badge>}
            {action?.rascunhoAprovado && <Badge variant="success"><WandSparkles />Plano aprovado</Badge>}
          </div>
          <h2 className="font-heading text-lg font-bold leading-tight">{insight.titulo}</h2>
          <Link href={`/alunos/${insight.alunoId}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            {insight.alunoNome} · {insight.turma}<ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{insight.explicacao}</p>
      <div className="mt-3 rounded-xl border border-border bg-muted/35 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Por que apareceu</p>
        <ul className="mt-2 space-y-1 text-sm">
          {insight.evidencias.map((evidence) => <li key={evidence} className="flex gap-2"><span aria-hidden>•</span><span>{evidence}</span></li>)}
        </ul>
      </div>
      <p className="mt-3 text-sm"><span className="font-semibold">Próximo passo sugerido:</span> {insight.acaoSugerida}</p>
      {action?.observacao && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"><strong>Registro da equipe:</strong> {action.observacao}</p>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button size="sm" variant="outline" onClick={() => onCopilot(insight)}><WandSparkles />{action?.rascunhoAprovado ? "Abrir plano" : "Preparar plano"}</Button>
        {!action && <Button size="sm" onClick={() => onAction(insight, "pendente")}><Clock3 />Adicionar à fila</Button>}
        {action?.status === "pendente" && <Button size="sm" onClick={() => onAction(insight, "concluida")}><CheckCircle2 />Marcar concluída</Button>}
        {action?.status !== "ignorada" && action?.status !== "concluida" && <Button size="sm" variant="outline" onClick={() => onAction(insight, "ignorada")}>Ignorar com justificativa</Button>}
        {(action?.status === "concluida" || action?.status === "ignorada") && <Button size="sm" variant="outline" onClick={() => onAction(insight, "pendente")}>Reabrir</Button>}
      </div>
      <span className="sr-only">Chave semanal {insightKeySemanal(insight, cycleDate)}</span>
    </article>
  )
}

export function DesenvolvimentoClient({ cicloInicio, insights, acoes, historico, oportunidades, iaExternaHabilitada = false }: {
  iaExternaHabilitada?: boolean
  cicloInicio: string
  insights: InsightDesenvolvimento[]
  acoes: Record<string, ActionSummary>
  historico: CicloHistoricoView[]
  oportunidades: OportunidadeResumo[]
}) {
  const cycleDate = new Date(`${cicloInicio}T12:00:00`)
  const [query, setQuery] = useState("")
  const [priority, setPriority] = useState<"todas" | PrioridadeDesenvolvimento>("todas")
  const actions = acoes
  const [selected, setSelected] = useState<{ insight: InsightDesenvolvimento; status: ActionStatus } | null>(null)
  const [note, setNote] = useState("")
  const [copilotInsight, setCopilotInsight] = useState<InsightDesenvolvimento | null>(null)
  const [draft, setDraft] = useState<CopilotDraft | null>(null)
  const [planText, setPlanText] = useState("")
  const [familyMessage, setFamilyMessage] = useState("")
  const [preferencias, setPreferencias] = useState<PreferenciasCopiloto>({ foco: "geral", modo: "local" })
  const [reviewed, setReviewed] = useState(false)
  const [edited, setEdited] = useState(false)
  const [replaceEdits, setReplaceEdits] = useState(false)
  const [generationError, setGenerationError] = useState("")
  const requestVersion = useRef(0)
  const [isPending, startTransition] = useTransition()
  const [isGenerating, startGenerating] = useTransition()
  const [isApproving, startApproving] = useTransition()

  const actionable = insights.filter((insight) => !insight.positivo)
  const positives = insights.filter((insight) => insight.positivo)
  const visible = useMemo(() => actionable.filter((insight) => {
    const matchesQuery = `${insight.alunoNome} ${insight.turma} ${insight.titulo}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
    return matchesQuery && (priority === "todas" || insight.prioridade === priority)
  }), [actionable, priority, query])

  const getAction = (insight: InsightDesenvolvimento) => actions[insightKeySemanal(insight, cycleDate)]
  const openAction = (insight: InsightDesenvolvimento, status: ActionStatus) => {
    setNote(getAction(insight)?.observacao ?? "")
    setSelected({ insight, status })
  }
  const applyDraft = (value: CopilotDraft) => {
    setDraft(value)
    setPlanText(value.planoSemanal.map((item) => `• ${item}`).join("\n"))
    setFamilyMessage(value.mensagemFamilia)
    setReviewed(false)
    setEdited(false)
    setReplaceEdits(false)
  }
  const generateDraft = (insight: InsightDesenvolvimento) => {
    if (isGenerating || isApproving || (edited && !replaceEdits)) return
    const version = ++requestVersion.current
    setGenerationError("")
    startGenerating(async () => {
      try {
        const result = await gerarRascunhoDesenvolvimento(insight.id, preferencias)
        if (version !== requestVersion.current) return
        if (result.error || !result.draft) {
          setGenerationError(result.error ?? "Não foi possível gerar o rascunho.")
          return
        }
        applyDraft(result.draft)
      } catch {
        if (version === requestVersion.current) setGenerationError("Não foi possível gerar o rascunho. Confira sua conexão e sessão e tente novamente. Seu texto anterior foi preservado.")
      }
    })
  }
  const closeCopilot = () => {
    if (isApproving) return
    requestVersion.current += 1
    setCopilotInsight(null)
  }
  const openCopilot = (insight: InsightDesenvolvimento) => {
    requestVersion.current += 1
    setCopilotInsight(insight)
    setPreferencias({ foco: "geral", modo: "local" })
    setGenerationError("")
    setReviewed(false)
    setEdited(false)
    setReplaceEdits(false)
    const action = getAction(insight)
    if (action?.planoSemanal && action.mensagemFamilia) {
      applyDraft({
        planoSemanal: action.planoSemanal,
        mensagemFamilia: action.mensagemFamilia,
        fonte: action.rascunhoFonte === "modelo_local" ? "modelo_local" : "ia",
      })
    } else {
      setDraft(null)
      setPlanText("")
      setFamilyMessage("")
    }
  }
  const approveDraft = () => {
    if (!copilotInsight || !draft || !reviewed || isGenerating || isApproving) return
    const plan = planText
      .split("\n")
      .map((item) => item.replace(/^\s*[•*-]\s*/, "").trim())
      .filter(Boolean)
    startApproving(async () => {
      try {
        const result = await aprovarRascunhoDesenvolvimento({
          revisado: reviewed,
          insightId: copilotInsight.id,
          planoSemanal: plan,
          mensagemFamilia: familyMessage,
          fonte: draft.fonte,
        })
        if (result.error) {
          toast.error(result.error)
          return
        }
        toast.success("Plano aprovado e salvo na fila.")
        setCopilotInsight(null)
      } catch {
        toast.error("Não foi possível salvar. Confira sua conexão e sessão e tente novamente. Seu texto foi preservado.")
      }
    })
  }
  const submit = () => {
    if (!selected) return
    startTransition(async () => {
      const result = await atualizarAcaoDesenvolvimento({ insightId: selected.insight.id, status: selected.status, observacao: note })
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Ação atualizada.")
      setSelected(null)
    })
  }

  const highPriority = actionable.filter((item) => item.prioridade === "alta").length
  const queued = actionable.filter((item) => getAction(item)?.status === "pendente").length
  const completed = actionable.filter((item) => getAction(item)?.status === "concluida").length

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-4 sm:p-6 lg:p-8 dark:bg-transparent">
      <PageHeader title="Desenvolvimento" description="Indicadores explicáveis para orientar o acompanhamento semanal da comissão técnica." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Alta prioridade" value={highPriority} icon={CircleAlert} tone="bg-danger-50 text-danger-600" />
        <KpiCard label="Na fila semanal" value={queued} icon={Clock3} tone="bg-info-50 text-info-600" />
        <KpiCard label="Concluídas" value={completed} icon={CheckCircle2} tone="bg-success-50 text-success-600" />
        <KpiCard label="Evoluções" value={positives.length} icon={Sparkles} tone="bg-warning-50 text-warning-600" />
      </div>

      <section aria-labelledby="action-queue-title">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div><h2 id="action-queue-title" className="font-heading text-xl font-bold">Fila da semana</h2><p className="text-sm text-muted-foreground">Ciclo iniciado em {cycleDate.toLocaleDateString("pt-BR")}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Label className="relative min-w-0 sm:w-72"><span className="sr-only">Buscar indicador</span><Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atleta, turma ou indicador" className="pl-9" /></Label>
            <Label><span className="sr-only">Filtrar prioridade</span><select value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} className="h-11 w-full rounded-[var(--radius-control)] border border-input bg-background px-3 text-sm sm:w-44"><option value="todas">Todas as prioridades</option><option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Acompanhamento</option></select></Label>
          </div>
        </div>
        {visible.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{visible.map((insight) => <IndicatorCard key={insight.id} insight={insight} action={getAction(insight)} cycleDate={cycleDate} onAction={openAction} onCopilot={openCopilot} />)}</div> : <div className="rounded-[var(--radius-card)] border border-dashed bg-card py-12 text-center"><Users className="mx-auto size-8 text-muted-foreground/40" /><p className="mt-3 font-semibold">Nenhum indicador neste filtro</p><p className="text-sm text-muted-foreground">Os alertas só aparecem quando há amostra suficiente.</p></div>}
      </section>

      {positives.length > 0 && <section aria-labelledby="positive-title"><h2 id="positive-title" className="mb-4 flex items-center gap-2 font-heading text-xl font-bold"><Activity className="size-5 text-success-600" />Evoluções para reconhecer</h2><div className="grid gap-3 lg:grid-cols-2">{positives.map((insight) => <article key={insight.id} className="rounded-[var(--radius-card)] border border-success-200 bg-success-50/40 p-4"><p className="font-semibold">{insight.alunoNome} · {insight.turma}</p><p className="mt-1 text-sm">{insight.titulo}</p><p className="mt-2 text-xs text-muted-foreground">{insight.evidencias.join(" · ")}</p></article>)}</div></section>}

      <PautaSemanalEditor base={{ cicloInicio, insights, acoes: actions, atletas: oportunidades }} />
      <PendenciasCiclos />

      <section aria-labelledby="cycle-history-title">
        <h2 id="cycle-history-title" className="mb-2 font-heading text-xl font-bold">Histórico de ciclos</h2>
        <p className="mb-4 text-sm text-muted-foreground">Até 40 ciclos mais recentes, incluindo pendências de semanas anteriores. Cada item mostra seu estado atual.</p>
        <HistoricoCiclos itens={historico.filter((item) => `${item.alunoNome} ${item.turma} ${item.titulo}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")))} />
      </section>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected?.status === "ignorada" ? "Ignorar recomendação" : selected?.status === "concluida" ? "Concluir ação" : "Adicionar à fila"}</DialogTitle><DialogDescription>{selected?.insight.alunoNome} — {selected?.insight.acaoSugerida}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="development-note">{selected?.status === "ignorada" ? "Justificativa (obrigatória)" : selected?.status === "concluida" ? "Resultado da ação (obrigatório)" : "Observação da equipe (opcional)"}</Label><Textarea id="development-note" value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={500} placeholder="Registre contexto útil para a comissão." /></div>
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)} disabled={isPending}>Cancelar</Button><Button onClick={submit} disabled={isPending || ((selected?.status === "ignorada" || selected?.status === "concluida") && note.trim().length < 3)}>{isPending ? "Salvando..." : "Confirmar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copilotInsight !== null} onOpenChange={(open) => !open && closeCopilot()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><WandSparkles className="size-5 text-brand-600" />Copiloto de desenvolvimento</DialogTitle>
            <DialogDescription>{copilotInsight?.alunoNome} — rascunho baseado somente nas evidências exibidas no indicador.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="copilot-focus">Foco do próximo rascunho</Label>
              <select id="copilot-focus" className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm" value={preferencias.foco} disabled={isGenerating || isApproving} onChange={(event) => setPreferencias({ ...preferencias, foco: event.target.value as PreferenciasCopiloto["foco"] })}>
                {Object.entries(focosCopiloto).map(([value, foco]) => <option key={value} value={value}>{foco.label}</option>)}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="copilot-mode">Modo de geração</Label>
              <select id="copilot-mode" className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm" value={preferencias.modo} disabled={isGenerating || isApproving} onChange={(event) => setPreferencias({ ...preferencias, modo: event.target.value as PreferenciasCopiloto["modo"] })}>
                {iaExternaHabilitada && <option value="ia">IA com alternativa local</option>}
                <option value="local">Modelo local (sem IA)</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">A geração só começa ao clicar no botão. {iaExternaHabilitada ? "No modo IA, enviamos as evidências sem nome, turma ou contato. O modelo local não chama serviços de IA." : "A IA externa está desativada. Os rascunhos usam regras e modelos de texto do sistema, não IA generativa. Nenhuma API de IA é chamada."} As opções acima só se aplicam ao próximo rascunho.</p>
          {generationError && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm">{generationError}</p>}
          {isGenerating ? (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center" role="status"><LoaderCircle className="size-7 animate-spin text-brand-600" /><p className="font-semibold">Preparando plano e mensagem...</p><p className="text-xs text-muted-foreground">{preferencias.modo === "local" || !iaExternaHabilitada ? "Preparação local, sem chamada à API de IA." : "Nenhum nome ou contato é enviado ao modelo."}</p></div>
          ) : draft ? (
            <div className="space-y-4">
              <Badge variant="outline">{draft.fonte === "ia" ? "Origem: IA" : "Origem: modelo local (sem IA)"}</Badge>
              {draft.aviso && <p className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">{draft.aviso}</p>}
              <div className="space-y-2"><Label htmlFor="weekly-ai-plan">Plano da semana</Label><Textarea id="weekly-ai-plan" value={planText} disabled={isApproving} onChange={(event) => { setPlanText(event.target.value); setReviewed(false); setEdited(true); setReplaceEdits(false) }} rows={7} maxLength={1600} /><p className="text-xs text-muted-foreground">Uma ação por linha. Revise e adapte à rotina da comissão.</p></div>
              <div className="space-y-2"><div className="flex items-center justify-between gap-2"><Label htmlFor="family-ai-message">Rascunho para a família</Label><Button type="button" size="xs" variant="ghost" disabled={!reviewed || isApproving} onClick={async () => { try { await navigator.clipboard.writeText(familyMessage); toast.success("Mensagem copiada. Nenhuma mensagem foi enviada.") } catch { toast.error("Não foi possível copiar. Selecione e copie o texto manualmente.") } }}><Copy />Copiar</Button></div><Textarea id="family-ai-message" value={familyMessage} disabled={isApproving} onChange={(event) => { setFamilyMessage(event.target.value); setReviewed(false); setEdited(true); setReplaceEdits(false) }} rows={6} maxLength={1000} /><p className="text-xs text-muted-foreground">Copiar não envia a mensagem. A equipe escolhe se, quando e por qual canal entrar em contato.</p></div>
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground"><strong>Revisão humana obrigatória:</strong> este conteúdo é um rascunho e não deve ser tratado como diagnóstico, avaliação final ou decisão automática.</div>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 shrink-0" checked={reviewed} disabled={isApproving} onChange={(event) => setReviewed(event.target.checked)} />Revisei o plano e a mensagem antes de copiar ou salvar.</label>
              {edited && <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"><input type="checkbox" className="mt-1 size-4 shrink-0" checked={replaceEdits} disabled={isApproving} onChange={(event) => setReplaceEdits(event.target.checked)} />Permitir substituir minhas edições ao gerar outra versão.</label>}
            </div>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">Escolha o foco e o modo de geração para preparar um plano revisável. Nenhuma ação será salva ou mensagem enviada automaticamente.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeCopilot} disabled={isApproving}>Cancelar</Button>
            <Button variant="outline" onClick={() => copilotInsight && generateDraft(copilotInsight)} disabled={isGenerating || isApproving || (edited && !replaceEdits)}>{draft ? "Gerar outra versão" : "Gerar rascunho"}</Button>
            <Button onClick={approveDraft} disabled={!draft || !reviewed || isGenerating || isApproving || planText.trim().length < 20 || familyMessage.trim().length < 30}>{isApproving ? "Salvando..." : "Aprovar e salvar na fila"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
