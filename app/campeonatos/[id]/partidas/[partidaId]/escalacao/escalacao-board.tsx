"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Shirt, X, Save, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { POSICOES_QUADRA, LABEL_POSICAO, type Posicao } from "@/lib/escalacao/posicoes"
import { corDaTurma } from "@/lib/escalacao/cores"
import { salvarEscalacao } from "@/app/actions/escalacao-partida"

type Aluno = { id: number; nome: string; turma: string }
type Placed = { alunoId: number; nome: string; turma: string; posicao: Posicao; numero: number | null; ordem: number }

type Props = {
  campeonatoId: number
  partida: { id: number; adversario: string; rodada: number; data: Date | string }
  inscritos: Aluno[]
  escalacaoInicial: Placed[]
}

// posições da quadra no grid visual (linha/coluna)
const SLOT_POS: Record<(typeof POSICOES_QUADRA)[number], string> = {
  PIVO: "row-start-1 col-start-2",
  ALA_ESQ: "row-start-2 col-start-1",
  ALA_DIR: "row-start-2 col-start-3",
  FIXO: "row-start-3 col-start-2",
  GOLEIRO: "row-start-4 col-start-2",
}

export function EscalacaoBoard({ campeonatoId, partida, inscritos, escalacaoInicial }: Props) {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<Placed[]>(escalacaoInicial)
  const [filtroTurma, setFiltroTurma] = useState<string>("todas")
  const [busca, setBusca] = useState("")
  const [salvando, start] = useTransition()

  const turmas = useMemo(
    () => Array.from(new Set(inscritos.map((a) => a.turma))).sort(),
    [inscritos]
  )

  const escaladosIds = useMemo(() => new Set(jogadores.map((j) => j.alunoId)), [jogadores])

  const disponiveis = useMemo(
    () =>
      inscritos
        .filter((a) => !escaladosIds.has(a.id))
        .filter((a) => filtroTurma === "todas" || a.turma === filtroTurma)
        .filter((a) => a.nome.toLowerCase().includes(busca.toLowerCase())),
    [inscritos, escaladosIds, filtroTurma, busca]
  )

  function jogadorEm(posicao: Posicao): Placed | undefined {
    return jogadores.find((j) => j.posicao === posicao)
  }

  const banco = useMemo(
    () => jogadores.filter((j) => j.posicao === "BANCO").sort((a, b) => a.ordem - b.ordem),
    [jogadores]
  )

  function colocar(alunoId: number, posicao: Posicao) {
    const aluno = inscritos.find((a) => a.id === alunoId)
    if (!aluno) return
    setJogadores((prev) => {
      // remove o aluno de onde estiver
      let novo = prev.filter((j) => j.alunoId !== alunoId)
      // se for slot de quadra (único), tira quem já estava lá
      if (posicao !== "BANCO") {
        novo = novo.filter((j) => j.posicao !== posicao)
      }
      const ordem = posicao === "BANCO" ? (novo.filter((j) => j.posicao === "BANCO").length) : 0
      return [...novo, { alunoId, nome: aluno.nome, turma: aluno.turma, posicao, numero: null, ordem }]
    })
  }

  function remover(alunoId: number) {
    setJogadores((prev) => prev.filter((j) => j.alunoId !== alunoId))
  }

  function setNumero(alunoId: number, numero: number | null) {
    setJogadores((prev) => prev.map((j) => (j.alunoId === alunoId ? { ...j, numero } : j)))
  }

  function onDrop(e: React.DragEvent, posicao: Posicao) {
    e.preventDefault()
    const alunoId = Number(e.dataTransfer.getData("alunoId"))
    if (alunoId) colocar(alunoId, posicao)
  }

  function handleSalvar() {
    start(async () => {
      const res = await salvarEscalacao(
        partida.id,
        jogadores.map((j) => ({ alunoId: j.alunoId, posicao: j.posicao, numero: j.numero, ordem: j.ordem }))
      )
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      toast.success("Escalação salva")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/campeonatos/${campeonatoId}`}>
            <Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Escalação</h1>
            <p className="text-sm text-muted-foreground">
              Itaquerense x {partida.adversario} · Rodada {partida.rodada} · {format(new Date(partida.data), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJogadores([])} disabled={salvando}>
            <Eraser className="size-4" /> Limpar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando} className="bg-brand-800 text-white hover:bg-brand-900">
            <Save className="size-4" /> {salvando ? "Salvando..." : "Salvar escalação"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Quadra */}
        <div className="rounded-xl border border-border p-4">
          <div
            className="relative grid aspect-[3/4] max-h-[640px] grid-cols-3 grid-rows-4 gap-2 rounded-lg p-4"
            style={{ background: "linear-gradient(180deg,#0f7a5a,#0c6249)" }}
          >
            <div className="pointer-events-none absolute inset-4 rounded-md border-2 border-white/40" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
            {POSICOES_QUADRA.map((pos) => {
              const j = jogadorEm(pos)
              return (
                <div
                  key={pos}
                  className={`${SLOT_POS[pos]} z-10 flex items-center justify-center`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, pos)}
                >
                  {j ? (
                    <PlacedCard placed={j} onRemove={() => remover(j.alunoId)} onNumero={(n) => setNumero(j.alunoId, n)} />
                  ) : (
                    <div className="flex h-24 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/50 text-center text-[10px] font-semibold uppercase text-white/80">
                      {LABEL_POSICAO[pos]}
                      <span className="mt-1 text-[9px] font-normal text-white/60">a definir</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Banco */}
          <div
            className="mt-4 rounded-lg border border-border bg-muted/40 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, "BANCO")}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banco</p>
            <div className="flex flex-wrap gap-2">
              {banco.length === 0 && <span className="text-xs text-muted-foreground">Arraste jogadores para o banco</span>}
              {banco.map((j) => (
                <PlacedCard key={j.alunoId} placed={j} onRemove={() => remover(j.alunoId)} onNumero={(n) => setNumero(j.alunoId, n)} />
              ))}
            </div>
          </div>
        </div>

        {/* Painel de jogadores disponíveis */}
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold">Jogadores inscritos</p>
          <div className="mb-3 flex gap-2">
            <Select value={filtroTurma} onValueChange={(v) => setFiltroTurma(v ?? "todas")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {turmas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {disponiveis.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhum jogador disponível.</span>
            )}
            {disponiveis.map((a) => (
              <div
                key={a.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("alunoId", String(a.id))}
                className={`flex w-20 cursor-grab flex-col items-center gap-1 rounded-lg border p-2 text-center active:cursor-grabbing ${corDaTurma(a.turma)}`}
              >
                <Shirt className="size-5" />
                <span className="truncate text-[11px] font-semibold leading-tight">{a.nome.split(" ")[0]}</span>
                <span className="text-[9px] opacity-80">{a.turma}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlacedCard({
  placed, onRemove, onNumero,
}: {
  placed: Placed
  onRemove: () => void
  onNumero: (n: number | null) => void
}) {
  return (
    <div className={`relative flex h-24 w-20 flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center shadow-sm ${corDaTurma(placed.turma)}`}>
      <button onClick={onRemove} className="absolute -right-1 -top-1 rounded-full bg-white/90 p-0.5 text-danger-600 shadow" aria-label="Remover">
        <X className="size-3" />
      </button>
      <Shirt className="size-4" />
      <input
        type="number"
        value={placed.numero ?? ""}
        onChange={(e) => onNumero(e.target.value === "" ? null : Number(e.target.value))}
        placeholder="nº"
        className="w-9 rounded bg-white/70 text-center text-xs text-foreground"
      />
      <span className="truncate text-[10px] font-semibold leading-tight">{placed.nome.split(" ")[0]}</span>
      <span className="text-[8px] opacity-80">{placed.turma}</span>
    </div>
  )
}
