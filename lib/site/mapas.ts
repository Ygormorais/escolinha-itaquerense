/**
 * Links "Como chegar" sem API paga e sem chave: abrem o app de mapas do
 * celular (Google Maps ou Waze) já com a rota até o local de treino.
 * Preferem as coordenadas configuradas; sem elas, usam o endereço em texto.
 */

export type LocalTreino = {
  endereco?: string | null
  cidade?: string | null
  latitude?: string | null
  longitude?: string | null
}

export type RotasLocal = { googleMaps: string; waze: string }

/** Lê "-23,5395" ou "-23.5395" como número; null se inválido ou fora do intervalo. */
function coordenada(valor: string | null | undefined, limite: number): number | null {
  const texto = valor?.trim().replace(",", ".")
  if (!texto || !/^-?\d+(\.\d+)?$/.test(texto)) return null
  const n = Number(texto)
  return Math.abs(n) <= limite ? n : null
}

export function coordenadasDoLocal(local: LocalTreino): { lat: number; lng: number } | null {
  const lat = coordenada(local.latitude, 90)
  const lng = coordenada(local.longitude, 180)
  return lat !== null && lng !== null ? { lat, lng } : null
}

/** Endereço em uma linha para busca em mapas ("Rua X, 10, Itaquera — São Paulo/SP"). */
export function enderecoEmUmaLinha(local: LocalTreino): string {
  return [local.endereco, local.cidade]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(", ")
}

/** Rotas até o local; null quando não há coordenadas nem endereço configurados. */
export function rotasDoLocal(local: LocalTreino): RotasLocal | null {
  const coords = coordenadasDoLocal(local)
  if (coords) {
    const ll = `${coords.lat},${coords.lng}`
    return {
      googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ll)}`,
      waze: `https://waze.com/ul?ll=${encodeURIComponent(ll)}&navigate=yes`,
    }
  }
  const endereco = enderecoEmUmaLinha(local)
  if (!endereco) return null
  const q = encodeURIComponent(endereco)
  return {
    googleMaps: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  }
}
