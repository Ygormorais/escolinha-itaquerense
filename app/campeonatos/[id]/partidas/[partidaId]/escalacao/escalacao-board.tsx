"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Shirt, X, Save, Eraser, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { POSICOES_QUADRA, LABEL_POSICAO, type Posicao } from "@/lib/escalacao/posicoes"
import { corDaTurma } from "@/lib/escalacao/cores"
import { salvarEscalacao } from "@/app/actions/escalacao-partida"

type Aluno = { id: number; nome: string; turma: string; posicao: string | null }
type Placed = { alunoId: number; nome: string; turma: string; posicao: Posicao; numero: number | null; ordem: number }

type Props = {
  campeonatoId: number
  partida: { id: number; adversario: string; rodada: number; data: Date | string }
  inscritos: Aluno[]
  escalacaoInicial: Placed[]
}

// posições na quadra horizontal (losango 1-2-1 do futsal), em % da quadra.
// Goleiro à direita (próprio gol); Fixo (último homem); Alas nas pontas
// (cima/baixo); Pivô avançado à esquerda (gol adversário).
const SLOT_POS: Record<(typeof POSICOES_QUADRA)[number], { left: string; top: string }> = {
  PIVO: { left: "22%", top: "50%" },
  ALA_DIR: { left: "45%", top: "24%" },
  ALA_ESQ: { left: "45%", top: "76%" },
  FIXO: { left: "64%", top: "50%" },
  GOLEIRO: { left: "83%", top: "50%" },
}

export function EscalacaoBoard({ campeonatoId, partida, inscritos, escalacaoInicial }: Props) {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<Placed[]>(escalacaoInicial)
  const [filtroTurma, setFiltroTurma] = useState<string>("todas")
  const [busca, setBusca] = useState("")
  const [salvando, start] = useTransition()
  const [draggingPosicao, setDraggingPosicao] = useState<string | null>(null)

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
      const ordem = posicao === "BANCO"
        ? novo.filter((j) => j.posicao === "BANCO").reduce((max, j) => Math.max(max, j.ordem), -1) + 1
        : 0
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
    setDraggingPosicao(null)
    const alunoId = Number(e.dataTransfer.getData("alunoId"))
    if (alunoId) colocar(alunoId, posicao)
  }

  function sugerirEscalacao() {
    const posOrder: Posicao[] = ["GOLEIRO", "FIXO", "ALA_ESQ", "ALA_DIR", "PIVO"]
    const disponivelSet = inscritos.filter((a) => !escaladosIds.has(a.id))
    const usado = new Set<number>()
    const sugestoes: { alunoId: number; nome: string; turma: string; posicao: Posicao }[] = []

    for (const pos of posOrder) {
      if (jogadorEm(pos)) continue // slot já preenchido
      const match = disponivelSet.find((a) => a.posicao === pos && !usado.has(a.id))
        ?? disponivelSet.find((a) => !a.posicao && !usado.has(a.id))
      if (match) {
        usado.add(match.id)
        sugestoes.push({ alunoId: match.id, nome: match.nome, turma: match.turma, posicao: pos })
      }
    }

    if (sugestoes.length === 0) return
    setJogadores((prev) => {
      let novo = [...prev]
      for (const s of sugestoes) {
        novo = novo.filter((j) => j.alunoId !== s.alunoId && j.posicao !== s.posicao)
        novo.push({ ...s, numero: null, ordem: 0 })
      }
      return novo
    })
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
      toast.success("Convocação salva")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/campeonatos/${campeonatoId}`}>
            <Button variant="ghost" size="icon-sm" aria-label="Voltar ao campeonato"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Convocação</h1>
            <p className="text-sm text-muted-foreground">
              Itaquerense x {partida.adversario} · Rodada {partida.rodada} · {format(new Date(partida.data), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={sugerirEscalacao} disabled={salvando}>
            <Wand2 className="size-4" /> Sugerir
          </Button>
          <Button variant="outline" onClick={() => setJogadores([])} disabled={salvando}>
            <Eraser className="size-4" /> Limpar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando} className="bg-brand-800 text-white hover:bg-brand-900">
            <Save className="size-4" /> {salvando ? "Salvando..." : "Salvar convocação"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Quadra */}
        <div className="rounded-xl border border-border p-4">
          <div
            className="relative mx-auto w-full overflow-hidden rounded-lg border-[6px] border-blue-700"
            style={{ background: "#1a56a0", aspectRatio: "4 / 3", maxHeight: "380px" }}
          >
            {/* linhas externas */}
            <div className="pointer-events-none absolute inset-3 rounded-sm border-2 border-white/70" />
            {/* linha central vertical */}
            <div className="pointer-events-none absolute bottom-3 top-3 left-1/2 w-0.5 -translate-x-1/2 bg-white/70" />
            {/* círculo central */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-white/20" />
            {/* área do gol (esquerda) */}
            <div className="pointer-events-none absolute left-3 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-white/20" />
            {/* área do gol (direita — onde fica o goleiro) */}
            <div className="pointer-events-none absolute right-3 top-1/2 size-28 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-white/20" />
            {POSICOES_QUADRA.map((pos) => {
              const j = jogadorEm(pos)
              return (
                <div
                  key={pos}
                  className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: SLOT_POS[pos].left, top: SLOT_POS[pos].top }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, pos)}
                >
                  {j ? (
                    <PlacedCard placed={j} onRemove={() => remover(j.alunoId)} onNumero={(n) => setNumero(j.alunoId, n)} />
                  ) : (
                    <div className={`flex h-24 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center text-[10px] font-semibold uppercase transition-colors ${draggingPosicao === pos ? "border-warning-50 bg-warning-50/25 text-warning-50" : "border-white/50 text-white/80"}`}>
                      {LABEL_POSICAO[pos]}
                      <span className="mt-1 text-[9px] font-normal opacity-70">a definir</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Banco */}
          <div
            className="mt-4 min-h-32 rounded-lg border border-border bg-muted/40 p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, "BANCO")}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banco de Reservas</p>
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
          <p className="mb-3 text-sm font-semibold">Jogadores (alunos ativos)</p>
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
                onDragStart={(e) => {
                  e.dataTransfer.setData("alunoId", String(a.id))
                  setDraggingPosicao(a.posicao ?? null)
                }}
                onDragEnd={() => setDraggingPosicao(null)}
                className={`flex w-20 cursor-grab flex-col items-center gap-1 rounded-lg border p-2 text-center active:cursor-grabbing ${corDaTurma(a.turma)}`}
              >
                <Shirt className="size-5" />
                <span className="truncate text-[11px] font-semibold leading-tight">{a.nome.split(" ")[0]}</span>
                <span className="text-[9px] opacity-80">{a.turma}</span>
                {a.posicao && (
                  <span className="rounded bg-black/10 px-1 py-0.5 text-[8px] font-bold uppercase leading-none tracking-wide">
                    {a.posicao === "GOLEIRO" ? "GOL" : a.posicao === "ALA_ESQ" || a.posicao === "ALA_DIR" ? "ALA" : a.posicao === "PIVO" ? "PIV" : a.posicao}
                  </span>
                )}
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
        min={1}
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
