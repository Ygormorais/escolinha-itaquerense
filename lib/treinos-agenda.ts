/**
 * Treinos semanais como ocorrências virtuais: gerados na leitura a partir de
 * turma + horário dos alunos ativos (ex.: "Ter/Qui 14h"); nada é gravado por dia.
 */

export type TreinoOcorrencia = {
  chave: string // "yyyy-MM-dd|HH:mm"
  dia: string // "yyyy-MM-dd"
  hora: string // "HH:mm"
  turmas: string[]
  titulo: string
  cancelado: boolean
  motivo: string | null
}

export type SlotTreino = { turma: string; horario: string }
export type BloqueioIntervalo = { inicio: string; fim: string; motivo: string } // chaves yyyy-MM-dd

const DIAS: Record<string, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** "Seg/Qua/Sex 16h" → { dias: [1,3,5], hora: "16:00" }. Retorna null se não reconhecer. */
export function parseHorario(horario: string): { dias: number[]; hora: string } | null {
  const m = /^\s*([^\s\d]+(?:\s*\/\s*[^\s\d/]+)*)\s+(\d{1,2})\s*(?:h|:)\s*(\d{2})?\s*$/i.exec(horario)
  if (!m) return null
  const dias: number[] = []
  for (const tok of m[1].split("/")) {
    const d = DIAS[semAcento(tok.trim()).slice(0, 3)]
    if (d === undefined) return null
    if (!dias.includes(d)) dias.push(d)
  }
  const h = Number(m[2])
  const min = m[3] ? Number(m[3]) : 0
  if (h > 23 || min > 59) return null
  return { dias, hora: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}` }
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Gera os treinos do intervalo [inicio, fim] (chaves "yyyy-MM-dd", inclusive).
 * Dia com feriado ou bloqueio da quadra mantém o treino, marcado como cancelado com o motivo.
 */
export function gerarTreinos(
  slots: SlotTreino[],
  inicio: string,
  fim: string,
  feriados: Map<string, string>,
  bloqueios: BloqueioIntervalo[],
): TreinoOcorrencia[] {
  // agrupa turmas que treinam no mesmo horário
  const porHorario = new Map<string, { dias: number[]; hora: string; turmas: Set<string> }>()
  for (const s of slots) {
    const p = parseHorario(s.horario)
    if (!p) continue
    const k = `${p.dias.join(",")}|${p.hora}`
    const g = porHorario.get(k) ?? { dias: p.dias, hora: p.hora, turmas: new Set<string>() }
    g.turmas.add(s.turma)
    porHorario.set(k, g)
  }

  const [ai, mi, di] = inicio.split("-").map(Number)
  const [af, mf, df] = fim.split("-").map(Number)
  const fimMs = Date.UTC(af, mf - 1, df)
  const resultado: TreinoOcorrencia[] = []

  for (let ms = Date.UTC(ai, mi - 1, di); ms <= fimMs; ms += 86_400_000) {
    const d = new Date(ms)
    const dia = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    const semana = d.getUTCDay()
    const feriado = feriados.get(dia)
    const bloqueio = bloqueios.find((b) => b.inicio <= dia && dia <= b.fim)
    for (const g of porHorario.values()) {
      if (!g.dias.includes(semana)) continue
      const turmas = [...g.turmas].sort()
      resultado.push({
        chave: `${dia}|${g.hora}`,
        dia,
        hora: g.hora,
        turmas,
        titulo: `Treino ${turmas.join(", ")}`,
        cancelado: Boolean(feriado || bloqueio),
        motivo: feriado ? `Feriado: ${feriado}` : bloqueio ? `Quadra bloqueada: ${bloqueio.motivo}` : null,
      })
    }
  }
  return resultado.sort((a, b) => (a.chave < b.chave ? -1 : a.chave > b.chave ? 1 : 0))
}
