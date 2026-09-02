import { MIN_REGISTROS } from "@/lib/frequencia-alertas"

const DAY = 86400000
function diaCivilBrasil(date: Date): Date {
  const civil = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
  return new Date(`${civil}T00:00:00Z`)
}
const deslocar = (date: Date, dias: number) => new Date(date.getTime() + dias * DAY)

export function janelasAcompanhamento(concluidaEm: Date, now: Date) {
  if (!Number.isFinite(concluidaEm.getTime()) || concluidaEm > now) return null
  const dia = diaCivilBrasil(concluidaEm)
  const hoje = diaCivilBrasil(now)
  const inicioDepois = deslocar(dia, 1)
  const fimDepois = deslocar(dia, 31)
  return {
    dia, inicioAntes: deslocar(dia, -30), fimAntes: dia, inicioDepois, fimDepois,
    limiteConsulta: new Date(Math.min(fimDepois.getTime(), deslocar(hoje, 1).getTime())),
    diasCompletos: Math.max(0, Math.min(30, Math.floor((hoje.getTime() - inicioDepois.getTime()) / DAY))),
  }
}

type Frequencia = { data: Date; presenca: string }
function resumirJanela(registros: Frequencia[], inicio: Date, fim: Date) {
  const items = registros.filter((item) => item.data >= inicio && item.data < fim)
  const presentes = items.filter((item) => item.presenca === "Presente").length
  const ausentes = items.filter((item) => item.presenca === "Ausente").length
  const justificados = items.filter((item) => item.presenca === "Justificado").length
  const total = presentes + ausentes + justificados
  return { presentes, ausentes, justificados, total, desconsiderados: items.length - total, percentual: total ? presentes / total * 100 : null }
}

export function compararFrequenciaAposAcao(concluidaEm: Date, registros: Frequencia[], now: Date) {
  const janela = janelasAcompanhamento(concluidaEm, now)
  if (!janela) return null
  const antes = resumirJanela(registros, janela.inicioAntes, janela.fimAntes)
  const depois = resumirJanela(registros, janela.inicioDepois, janela.limiteConsulta)
  const situacao = janela.diasCompletos < 30 ? "em_observacao" : antes.total < MIN_REGISTROS || depois.total < MIN_REGISTROS ? "amostra_insuficiente" : "comparavel"
  return {
    concluidaEm: concluidaEm.toISOString(), consultadoEm: now.toISOString(),
    inicioAntes: janela.inicioAntes.toISOString().slice(0, 10), fimAntes: deslocar(janela.fimAntes, -1).toISOString().slice(0, 10),
    inicioDepois: janela.inicioDepois.toISOString().slice(0, 10), fimDepois: deslocar(janela.fimDepois, -1).toISOString().slice(0, 10),
    diasCompletos: janela.diasCompletos, minimoRegistros: MIN_REGISTROS, situacao,
    antes, depois,
    variacao: situacao === "comparavel" ? Math.round((depois.percentual! - antes.percentual!) * 10) / 10 : null,
  }
}

export type AcompanhamentoFrequencia = NonNullable<ReturnType<typeof compararFrequenciaAposAcao>>
