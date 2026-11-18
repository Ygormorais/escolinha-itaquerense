import { randomBytes } from "node:crypto"
import { format } from "date-fns"
import { eventoAplicaATurma, horaDaPartida } from "@/lib/agenda"
import type { EventoIcs } from "@/lib/icalendar"
import { gerarTreinos, type BloqueioIntervalo, type SlotTreino } from "@/lib/treinos-agenda"

const TOKEN_RE = /^[0-9a-f]{48}$/

/** Token longo e aleatório (192 bits) do feed do responsável; revogável gerando outro. */
export function gerarTokenCalendario(): string {
  return randomBytes(24).toString("hex")
}

/** Aceita o token puro ou com a extensão ".ics" (a URL pública termina em .ics). */
export function extrairTokenCalendario(param: string): string | null {
  const limpo = param.replace(/\.ics$/i, "").toLowerCase()
  return TOKEN_RE.test(limpo) ? limpo : null
}

export type EventoFeedEntrada = {
  id: number
  tipo: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  titulo: string
  local: string | null
  turmas: string | null
  descricao: string | null
  status: string
}

export type ConvocacaoFeedEntrada = {
  id: number
  alunoNome: string
  partida: { data: Date; adversario: string; local: string }
}

export type EntradaFeed = {
  slotsTreino: SlotTreino[]
  eventos: EventoFeedEntrada[]
  convocacoes: ConvocacaoFeedEntrada[]
  feriados: Map<string, string>
  bloqueios: BloqueioIntervalo[]
  /** Janela do feed, chaves "yyyy-MM-dd" inclusive. */
  inicio: string
  fim: string
}

const DOMINIO_UID = "itaquerense"
const DURACAO_TREINO_MIN = 60
const DURACAO_JOGO_MIN = 90

function minutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

function duracaoEvento(inicio: string | null, fim: string | null): number {
  const i = inicio ? minutos(inicio) : null
  const f = fim ? minutos(fim) : null
  return i != null && f != null && f > i ? f - i : 60
}

function normalizarHora(hora: string | null): string | null {
  const m = hora ? /^(\d{1,2}):(\d{2})$/.exec(hora.trim()) : null
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : null
}

/** Texto curto sobre o mando de campo; "Casa"/"Fora" são valores do cadastro, não endereços. */
export function descricaoJogo(local: string): string | null {
  if (local === "Casa") return "Jogo em casa."
  if (local === "Fora") return "Jogo fora de casa."
  return null
}

export function eventosDoFeed(entrada: EntradaFeed): EventoIcs[] {
  const turmasAlunos = [...new Set(entrada.slotsTreino.map((s) => s.turma))]
  const resultado: EventoIcs[] = []

  for (const t of gerarTreinos(entrada.slotsTreino, entrada.inicio, entrada.fim, entrada.feriados, entrada.bloqueios)) {
    resultado.push({
      uid: `treino-${t.chave.replace("|", "-")}-${t.turmas.join("_").replace(/[^A-Za-z0-9_-]/g, "")}@${DOMINIO_UID}`,
      dia: t.dia,
      hora: t.hora,
      duracaoMin: DURACAO_TREINO_MIN,
      titulo: t.cancelado ? `CANCELADO · ${t.titulo}` : t.titulo,
      descricao: t.motivo,
      cancelado: t.cancelado,
    })
  }

  for (const e of entrada.eventos) {
    if (e.turmas == null || !turmasAlunos.some((turma) => eventoAplicaATurma(e.turmas!, turma))) continue
    const dia = format(e.data, "yyyy-MM-dd")
    if (dia < entrada.inicio || dia > entrada.fim) continue
    const cancelado = e.status === "cancelado"
    resultado.push({
      uid: `evento-${e.id}@${DOMINIO_UID}`,
      dia,
      hora: normalizarHora(e.horaInicio),
      duracaoMin: duracaoEvento(normalizarHora(e.horaInicio), normalizarHora(e.horaFim)),
      titulo: cancelado ? `CANCELADO · ${e.titulo}` : e.titulo,
      local: e.local,
      descricao: e.descricao,
      cancelado,
    })
  }

  for (const c of entrada.convocacoes) {
    const dia = format(c.partida.data, "yyyy-MM-dd")
    if (dia < entrada.inicio || dia > entrada.fim) continue
    resultado.push(eventoDeJogo(c))
  }

  return resultado.sort((a, b) => `${a.dia}${a.hora ?? ""}${a.uid}`.localeCompare(`${b.dia}${b.hora ?? ""}${b.uid}`))
}

/** Evento de uma partida do campeonato, sem aluno (botão avulso "Adicionar ao calendário"). */
export function eventoDePartida(p: { id: number; data: Date; adversario: string; local: string; campeonato?: { nome: string } | null }): EventoIcs {
  const partes = [p.campeonato?.nome, descricaoJogo(p.local)].filter(Boolean)
  return {
    uid: `partida-${p.id}@${DOMINIO_UID}`,
    dia: format(p.data, "yyyy-MM-dd"),
    hora: horaDaPartida(p.data),
    duracaoMin: DURACAO_JOGO_MIN,
    titulo: `Jogo vs ${p.adversario}`,
    local: p.local === "Casa" || p.local === "Fora" ? null : p.local,
    descricao: partes.join(" · ") || null,
  }
}

/** Evento de um jogo para a convocação; usado no feed e no .ics avulso de um jogo. */
export function eventoDeJogo(c: ConvocacaoFeedEntrada): EventoIcs {
  const primeiroNome = c.alunoNome.trim().split(/\s+/)[0] ?? ""
  const partes = [primeiroNome ? `${primeiroNome} foi convocado(a).` : null, descricaoJogo(c.partida.local)].filter(Boolean)
  return {
    uid: `jogo-${c.id}@${DOMINIO_UID}`,
    dia: format(c.partida.data, "yyyy-MM-dd"),
    hora: horaDaPartida(c.partida.data),
    duracaoMin: DURACAO_JOGO_MIN,
    titulo: `Jogo vs ${c.partida.adversario}${primeiroNome ? ` (${primeiroNome})` : ""}`,
    local: c.partida.local === "Casa" || c.partida.local === "Fora" ? null : c.partida.local,
    descricao: partes.join(" ") || null,
  }
}
