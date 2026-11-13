/**
 * Feriados nacionais do Brasil, calculados sem API externa.
 * Datas são chaves de calendário "yyyy-MM-dd" (sem fuso).
 */

export type Feriado = { data: string; nome: string }

const pad = (n: number) => String(n).padStart(2, "0")

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
export function pascoa(ano: number): { mes: number; dia: number } {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return { mes, dia }
}

function chave(ano: number, mes: number, dia: number): string {
  return `${ano}-${pad(mes)}-${pad(dia)}`
}

function deslocar(ano: number, mes: number, dia: number, dias: number): string {
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return chave(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** Feriados nacionais do ano, em ordem de data. Consciência Negra vale desde 2024 (Lei 14.759/2023). */
export function feriadosNacionais(ano: number): Feriado[] {
  const { mes, dia } = pascoa(ano)
  const lista: Feriado[] = [
    { data: chave(ano, 1, 1), nome: "Confraternização Universal" },
    { data: deslocar(ano, mes, dia, -48), nome: "Carnaval" },
    { data: deslocar(ano, mes, dia, -47), nome: "Carnaval" },
    { data: deslocar(ano, mes, dia, -2), nome: "Sexta-feira Santa" },
    { data: chave(ano, 4, 21), nome: "Tiradentes" },
    { data: chave(ano, 5, 1), nome: "Dia do Trabalho" },
    { data: deslocar(ano, mes, dia, 60), nome: "Corpus Christi" },
    { data: chave(ano, 9, 7), nome: "Independência do Brasil" },
    { data: chave(ano, 10, 12), nome: "Nossa Senhora Aparecida" },
    { data: chave(ano, 11, 2), nome: "Finados" },
    { data: chave(ano, 11, 15), nome: "Proclamação da República" },
  ]
  if (ano >= 2024) lista.push({ data: chave(ano, 11, 20), nome: "Dia da Consciência Negra" })
  lista.push({ data: chave(ano, 12, 25), nome: "Natal" })
  return lista.sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0))
}

/** Mapa data → nome do feriado para os anos pedidos. */
export function mapaFeriados(anos: number[]): Map<string, string> {
  const mapa = new Map<string, string>()
  for (const ano of new Set(anos)) {
    for (const f of feriadosNacionais(ano)) mapa.set(f.data, f.nome)
  }
  return mapa
}
