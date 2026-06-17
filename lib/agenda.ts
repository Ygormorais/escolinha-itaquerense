import { format } from "date-fns"

export function eventoAplicaATurma(turmas: string, turmaAluno: string): boolean {
  const lista = turmas.split(",").map((t) => t.trim()).filter(Boolean)
  return lista.includes("Todas") || lista.includes(turmaAluno)
}

export type ItemAgenda = {
  tipo: "treino" | "jogo" | "evento" | "reuniao"
  data: Date
  hora: string | null
  titulo: string
  local: string | null
  descricao?: string | null
  jogo?: { escalacaoId: number; confirmacao: string | null; adversario: string }
}
export type DiaAgenda = { data: Date; itens: ItemAgenda[] }

export type EventoInput = {
  tipo: string
  data: Date
  horaInicio: string | null
  titulo: string
  local: string | null
  descricao: string | null
}
export type JogoInput = {
  escalacaoId: number
  confirmacao: string | null
  partida: { data: Date; adversario: string; local: string }
}

function tipoDeEvento(tipo: string): ItemAgenda["tipo"] {
  const t = tipo.toLowerCase()
  if (t.includes("trein")) return "treino"
  if (t.includes("reuni")) return "reuniao"
  return "evento"
}

export function montarAgenda(eventos: EventoInput[], jogos: JogoInput[]): DiaAgenda[] {
  const itens: ItemAgenda[] = [
    ...eventos.map((e) => ({
      tipo: tipoDeEvento(e.tipo),
      data: e.data,
      hora: e.horaInicio,
      titulo: e.titulo,
      local: e.local,
      descricao: e.descricao,
    })),
    ...jogos.map((j) => ({
      tipo: "jogo" as const,
      data: j.partida.data,
      hora: format(j.partida.data, "HH:mm"),
      titulo: `Jogo vs ${j.partida.adversario}`,
      local: j.partida.local,
      jogo: { escalacaoId: j.escalacaoId, confirmacao: j.confirmacao, adversario: j.partida.adversario },
    })),
  ]

  const chaveDia = (d: Date) => format(d, "yyyy-MM-dd")
  const horaSort = (h: string | null) => h ?? "99:99"

  itens.sort((a, b) => {
    const da = chaveDia(a.data)
    const db = chaveDia(b.data)
    if (da !== db) return da < db ? -1 : 1
    const ha = horaSort(a.hora)
    const hb = horaSort(b.hora)
    return ha < hb ? -1 : ha > hb ? 1 : 0
  })

  const dias: DiaAgenda[] = []
  for (const item of itens) {
    const last = dias[dias.length - 1]
    if (last && chaveDia(last.data) === chaveDia(item.data)) last.itens.push(item)
    else dias.push({ data: item.data, itens: [item] })
  }
  return dias
}
