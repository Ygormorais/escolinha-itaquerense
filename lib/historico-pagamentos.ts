export type StatusMes = "pago" | "pendente" | "atrasado" | "sem-registro"

export type MesHistorico = {
  mes: string   // "YYYY-MM"
  label: string // "jan", "fev", ...
  status: StatusMes
}

export type PagamentoMin = {
  mesReferencia: string
  dataPagamento: string | null
  dataVencimento: string
}

const LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function calcularHistorico(pagamentos: PagamentoMin[], hoje: Date = new Date()): MesHistorico[] {
  const meses: MesHistorico[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = LABELS[d.getMonth()]
    const pag = pagamentos.find((p) => p.mesReferencia === mes)
    let status: StatusMes
    if (!pag) {
      status = "sem-registro"
    } else if (pag.dataPagamento) {
      status = "pago"
    } else {
      const diaVenc = pag.dataVencimento.slice(0, 10)
      const diaHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`
      status = diaVenc >= diaHoje ? "pendente" : "atrasado"
    }
    meses.push({ mes, label, status })
  }
  return meses
}
