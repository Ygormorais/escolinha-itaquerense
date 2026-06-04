const BASE = "https://eventos.admfutsal.com.br/evento"

export function urlClassificacao(eventoId: number): string {
  return `${BASE}/${eventoId}`
}
export function urlJogos(eventoId: number): string {
  return `${BASE}/${eventoId}/jogos`
}
export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "escolinha-itaquerense/1.0 (+sync FPFS)" },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`FPFS ${res.status} ao buscar ${url}`)
  return res.text()
}
