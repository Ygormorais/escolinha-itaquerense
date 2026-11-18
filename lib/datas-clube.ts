/** Dia de hoje (AAAA-MM-DD) no fuso do clube (America/Sao_Paulo). */
export function hojeNoClube(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(agora)
}

/**
 * Início do dia de hoje no clube, como meia-noite UTC. Vencimentos são gravados à meia-noite UTC
 * do dia, então "vencido" é `dataVencimento < inicioDeHojeUtc()`: o próprio dia do vencimento
 * ainda está no prazo.
 */
export function inicioDeHojeUtc(agora: Date = new Date()): Date {
  return new Date(`${hojeNoClube(agora)}T00:00:00.000Z`)
}

/** Data gravada à meia-noite UTC no formato dd/MM/aaaa, sem recuar um dia no fuso do navegador. */
export function formatarDataUtc(data: Date | string): string {
  return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" })
}
