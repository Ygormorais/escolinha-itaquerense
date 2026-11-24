"use client"

import { useState, useTransition } from "react"
import { CalendarPlus, Check, MessageCircle, Trash2, UserCheck, UserX, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TURMAS } from "@/lib/constants"
import { plural } from "@/lib/utils"
import {
  ROTULO_STATUS_AULA,
  dataCompleta,
  formatarTelefone,
  rotuloDia,
  vagasDaJanela,
  type StatusAula,
} from "@/lib/aula-experimental"
import {
  atualizarJanelaAula,
  atualizarStatusAula,
  converterAulaEmPreMatricula,
  criarJanelaAula,
  excluirJanelaAula,
} from "@/app/actions/aula-experimental"

type JanelaRow = {
  id: number
  turma: string
  data: string
  hora: string
  duracaoMin: number
  local: string | null
  capacidade: number
  ativa: boolean
  ocupadas: number
}

type AulaRow = {
  id: number
  nomeAtleta: string
  dataNascimento: string
  nomeResponsavel: string
  telefone: string
  email: string | null
  status: string
  turma: string
  data: string
  hora: string
  lembreteEnviado: boolean
  podeConverter: boolean
  whatsappHref: string | null
}

type Resumo = {
  inscritas: number
  compareceram: number
  convertidas: number
  comparecimento: number | null
  conversao: number | null
}

const COR_STATUS: Record<string, string> = {
  agendada: "bg-secondary text-secondary-foreground",
  compareceu: "bg-success-50 text-success-600",
  faltou: "bg-warning-50 text-warning-600",
  convertida: "bg-success-50 text-success-600",
  cancelada: "bg-destructive/10 text-destructive",
}

const pct = (v: number | null) => (v == null ? "—" : `${v}%`)

export function AulaExperimentalAdmin({
  hoje,
  resumo,
  janelas,
  aulas,
}: {
  hoje: string
  resumo: Resumo
  janelas: JanelaRow[]
  aulas: AulaRow[]
}) {
  return (
    <div className="space-y-10">
      <dl className="grid gap-3 sm:grid-cols-4" aria-label="Resumo da aula experimental">
        {[
          ["Inscrições", String(resumo.inscritas)],
          ["Compareceram", String(resumo.compareceram + resumo.convertidas)],
          ["Taxa de comparecimento", pct(resumo.comparecimento)],
          ["Viraram pré-matrícula", `${resumo.convertidas} (${pct(resumo.conversao)})`],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded-xl border bg-card p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{rotulo}</dt>
            <dd className="mt-1 font-heading text-2xl font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="inscricoes-title" className="border-t-2 border-brand-800 pt-4">
        <h2 id="inscricoes-title" className="mb-4 font-heading text-xl font-semibold">Inscrições</h2>
        <ListaInscricoes aulas={aulas} />
      </section>

      <section aria-labelledby="janelas-title" className="border-t-2 border-brand-800 pt-4">
        <h2 id="janelas-title" className="mb-1 font-heading text-xl font-semibold">Datas e vagas</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Só as datas ativas e futuras aparecem no site. Cada data aceita inscrições até o número de vagas.
        </p>
        <NovaJanela hoje={hoje} />
        <ListaJanelas janelas={janelas} hoje={hoje} />
      </section>
    </div>
  )
}

function ListaInscricoes({ aulas }: { aulas: AulaRow[] }) {
  const [filtro, setFiltro] = useState("todas")
  const [, startTransition] = useTransition()
  const filtradas = filtro === "todas" ? aulas : aulas.filter((a) => a.status === filtro)

  function mudarStatus(id: number, status: StatusAula) {
    startTransition(async () => {
      const res = await atualizarStatusAula(id, status)
      if ("error" in res) toast.error(res.error)
      else toast.success(`Marcada como ${ROTULO_STATUS_AULA[status].toLowerCase()}`)
    })
  }

  function converter(id: number) {
    startTransition(async () => {
      const res = await converterAulaEmPreMatricula(id)
      if ("error" in res) toast.error(res.error)
      else toast.success("Pré-matrícula criada. Ela aparece em Pré-matrículas.")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
        <div className="w-full sm:w-56">
          <Label htmlFor="filtro-aulas" className="mb-1.5 block">Status</Label>
          <Select value={filtro} onValueChange={(v) => { if (v) setFiltro(v) }}>
            <SelectTrigger id="filtro-aulas" className="h-11 w-full" aria-label="Filtrar por status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              {Object.entries(ROTULO_STATUS_AULA).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="pb-3 text-sm text-muted-foreground" aria-live="polite">
          {plural(filtradas.length, "inscrição", "inscrições", "nenhuma")}
        </span>
      </div>

      <div className="rounded-xl border bg-card">
        {filtradas.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma inscrição por aqui ainda.</p>
        ) : (
          <ul className="divide-y">
            {filtradas.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{a.nomeAtleta}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COR_STATUS[a.status] ?? COR_STATUS.agendada}`}>
                      {ROTULO_STATUS_AULA[a.status as StatusAula] ?? a.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    <span className="capitalize">{rotuloDia(a.data)}</span> às {a.hora} · {a.turma} · nasc. {dataCompleta(a.dataNascimento)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {a.nomeResponsavel} · {formatarTelefone(a.telefone)}
                    {a.email && <> · {a.email}</>}
                  </p>
                  {a.lembreteEnviado && <p className="mt-1 text-xs text-muted-foreground">Lembrete da véspera enviado.</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                  {a.whatsappHref && (
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<a href={a.whatsappHref} target="_blank" rel="noopener noreferrer" />}
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      WhatsApp<span className="sr-only"> para {a.nomeResponsavel} (abre em nova aba)</span>
                    </Button>
                  )}
                  {a.status !== "convertida" && a.status !== "cancelada" && (
                    <>
                      {a.status !== "compareceu" && (
                        <Button size="sm" variant="outline" onClick={() => mudarStatus(a.id, "compareceu")}>
                          <UserCheck className="size-4" aria-hidden />
                          Compareceu<span className="sr-only">: {a.nomeAtleta}</span>
                        </Button>
                      )}
                      {a.status !== "faltou" && (
                        <Button size="sm" variant="outline" onClick={() => mudarStatus(a.id, "faltou")}>
                          <UserX className="size-4" aria-hidden />
                          Faltou<span className="sr-only">: {a.nomeAtleta}</span>
                        </Button>
                      )}
                    </>
                  )}
                  {a.podeConverter && (
                    <ConfirmDialog
                      title="Converter em pré-matrícula?"
                      description={`Cria uma pré-matrícula de ${a.nomeAtleta} com os dados desta inscrição. Depois é só aprovar em Pré-matrículas.`}
                      confirmLabel="Converter"
                      onConfirm={() => converter(a.id)}
                    >
                      <Button size="sm" variant="outline" className="border-success-600 text-success-600 hover:bg-success-50">
                        <Check className="size-4" aria-hidden />
                        Converter em pré-matrícula<span className="sr-only">: {a.nomeAtleta}</span>
                      </Button>
                    </ConfirmDialog>
                  )}
                  {a.status === "agendada" && (
                    <ConfirmDialog
                      title="Cancelar inscrição?"
                      description="A vaga volta a ficar livre no site."
                      confirmLabel="Cancelar inscrição"
                      onConfirm={() => mudarStatus(a.id, "cancelada")}
                    >
                      <Button size="sm" variant="ghost" aria-label={`Cancelar inscrição de ${a.nomeAtleta}`} className="text-muted-foreground hover:text-destructive">
                        <X className="size-4" aria-hidden />
                      </Button>
                    </ConfirmDialog>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function NovaJanela({ hoje }: { hoje: string }) {
  const [turma, setTurma] = useState("")
  const [data, setData] = useState("")
  const [hora, setHora] = useState("")
  const [duracao, setDuracao] = useState("60")
  const [local, setLocal] = useState("")
  const [capacidade, setCapacidade] = useState("12")
  const [pending, startTransition] = useTransition()

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await criarJanelaAula({
        turma,
        data,
        hora,
        duracaoMin: Number(duracao),
        local,
        capacidade: Number(capacidade),
      })
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      toast.success("Data aberta no site")
      setData("")
      setHora("")
    })
  }

  return (
    <form onSubmit={salvar} className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6" aria-label="Abrir nova data">
      <div className="lg:col-span-1">
        <Label htmlFor="nova-turma" className="mb-1.5 block">Turma</Label>
        <Select value={turma} onValueChange={(v) => { if (v) setTurma(v) }}>
          <SelectTrigger id="nova-turma" className="h-11 w-full" aria-label="Turma">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="nova-data" className="mb-1.5 block">Data</Label>
        <Input id="nova-data" type="date" min={hoje} value={data} onChange={(e) => setData(e.target.value)} required className="h-11" />
      </div>
      <div>
        <Label htmlFor="nova-hora" className="mb-1.5 block">Horário</Label>
        <Input id="nova-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required className="h-11" />
      </div>
      <div>
        <Label htmlFor="nova-duracao" className="mb-1.5 block">Duração (min)</Label>
        <Input id="nova-duracao" type="number" min={15} max={240} value={duracao} onChange={(e) => setDuracao(e.target.value)} required className="h-11" />
      </div>
      <div>
        <Label htmlFor="nova-capacidade" className="mb-1.5 block">Vagas</Label>
        <Input id="nova-capacidade" type="number" min={1} max={60} value={capacidade} onChange={(e) => setCapacidade(e.target.value)} required className="h-11" />
      </div>
      <div>
        <Label htmlFor="novo-local" className="mb-1.5 block">Local (opcional)</Label>
        <Input id="novo-local" value={local} onChange={(e) => setLocal(e.target.value)} maxLength={120} placeholder="Quadra principal" className="h-11" />
      </div>
      <div className="sm:col-span-2 lg:col-span-6">
        <Button type="submit" disabled={pending || !turma}>
          <CalendarPlus className="size-4" aria-hidden />
          {pending ? "Salvando…" : "Abrir data no site"}
        </Button>
      </div>
    </form>
  )
}

function ListaJanelas({ janelas, hoje }: { janelas: JanelaRow[]; hoje: string }) {
  const [, startTransition] = useTransition()

  function alternar(j: JanelaRow) {
    startTransition(async () => {
      const res = await atualizarJanelaAula(j.id, { ativa: !j.ativa })
      if ("error" in res) toast.error(res.error)
      else toast.success(j.ativa ? "Data fechada no site" : "Data reaberta no site")
    })
  }

  function excluir(id: number) {
    startTransition(async () => {
      const res = await excluirJanelaAula(id)
      if ("error" in res) toast.error(res.error)
      else toast.success("Data removida")
    })
  }

  if (janelas.length === 0) {
    return <p className="rounded-xl border bg-card py-10 text-center text-sm text-muted-foreground">Nenhuma data cadastrada.</p>
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {janelas.map((j) => {
        const vagas = vagasDaJanela(j.capacidade, j.ocupadas)
        const passada = j.data < hoje
        return (
          <li key={j.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">
                <span className="capitalize">{rotuloDia(j.data)}</span> às {j.hora} · {j.turma}
                {!j.ativa && <span className="ml-2 text-xs font-normal text-muted-foreground">(fechada)</span>}
                {passada && <span className="ml-2 text-xs font-normal text-muted-foreground">(já passou)</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {j.ocupadas} de {j.capacidade} vagas ocupadas{vagas.lotada ? " · lotada" : ""} · {j.duracaoMin} min
                {j.local ? ` · ${j.local}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => alternar(j)}>
                {j.ativa ? "Fechar no site" : "Reabrir"}
              </Button>
              {j.ocupadas === 0 && (
                <ConfirmDialog title="Excluir esta data?" description="Ela some do site. Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => excluir(j.id)}>
                  <Button size="sm" variant="ghost" aria-label={`Excluir data de ${j.data} às ${j.hora}`} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </ConfirmDialog>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
