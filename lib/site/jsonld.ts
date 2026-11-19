import type { ClubConfig } from "@/lib/config"
import { coordenadasDoLocal } from "@/lib/site/mapas"
import type { PartidaLinha } from "@/lib/site/partidas"

/**
 * Dados estruturados (schema.org) do site público. Só o que o clube já divulga
 * (endereço, contato, redes); nada de dado de aluno ou responsável.
 */

type Config = Pick<
  ClubConfig,
  "nome" | "endereco" | "cidade" | "cep" | "latitude" | "longitude" | "telefone" | "whatsapp" | "instagram" | "facebook" | "youtube"
>

type Json = Record<string, unknown>

/** Telefone em E.164 (+55...) a partir do telefone ou, na falta, do WhatsApp; null se inválido. */
export function telefoneE164(...numeros: (string | null | undefined)[]): string | null {
  for (const bruto of numeros) {
    const digitos = bruto?.replace(/\D/g, "") ?? ""
    if (digitos.length >= 12 && digitos.startsWith("55")) return `+${digitos}`
    if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`
  }
  return null
}

/** "Itaquera — São Paulo/SP" vira { cidade: "São Paulo", uf: "SP", bairro: "Itaquera" }. */
export function partesDaCidade(texto: string | null | undefined): { bairro?: string; cidade?: string; uf?: string } {
  const bruto = texto?.trim()
  if (!bruto) return {}
  const [antes, depois] = bruto.includes("—") ? bruto.split("—").map((p) => p.trim()) : [undefined, bruto]
  const [cidade, uf] = (depois ?? "").split("/").map((p) => p.trim())
  return {
    bairro: antes || undefined,
    cidade: cidade || undefined,
    uf: uf && /^[A-Za-z]{2}$/.test(uf) ? uf.toUpperCase() : undefined,
  }
}

function urlHttps(valor: string | null | undefined): string | null {
  try {
    const url = new URL(valor?.trim() ?? "")
    return url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function enderecoPostal(config: Config): Json {
  const { cidade, uf } = partesDaCidade(config.cidade)
  return {
    "@type": "PostalAddress",
    ...(config.endereco.trim() ? { streetAddress: config.endereco.trim() } : {}),
    ...(config.cep.trim() ? { postalCode: config.cep.trim() } : {}),
    addressLocality: cidade ?? "São Paulo",
    addressRegion: uf ?? "SP",
    addressCountry: "BR",
  }
}

/** Organização esportiva + local de treino, para a home. */
export function montarJsonLdClube(config: Config, baseUrl: string): Json {
  const base = baseUrl.replace(/\/$/, "")
  const telefone = telefoneE164(config.telefone, config.whatsapp)
  const coords = coordenadasDoLocal(config)
  const sameAs = [config.instagram, config.facebook, config.youtube]
    .map(urlHttps)
    .filter((u): u is string => u !== null)
  const { bairro } = partesDaCidade(config.cidade)

  return {
    "@context": "https://schema.org",
    "@type": ["SportsClub", "SportsActivityLocation"],
    "@id": `${base}/#clube`,
    name: `${config.nome} — Escolinha de Futsal`,
    alternateName: config.nome,
    description:
      "Escolinha de futsal e categorias de base do E.C. Itaquerense em Itaquera, zona leste de São Paulo. Turmas por idade e pré-matrícula online.",
    url: base,
    logo: `${base}/logo.png`,
    image: `${base}/opengraph-image`,
    sport: "Futsal",
    ...(telefone ? { telephone: telefone } : {}),
    address: enderecoPostal(config),
    ...(coords ? { geo: { "@type": "GeoCoordinates", latitude: coords.lat, longitude: coords.lng } } : {}),
    areaServed: bairro ? `${bairro}, São Paulo` : "São Paulo",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }
}

/**
 * Próximos jogos em casa como SportsEvent. Só jogos em casa (o local é o do clube),
 * ainda não realizados; fora de casa não há endereço confiável para publicar.
 */
export function montarJsonLdPartidas(
  partidas: PartidaLinha[],
  config: Config,
  baseUrl: string,
  { agora = new Date(), limite = 10 }: { agora?: Date; limite?: number } = {},
): Json[] {
  const base = baseUrl.replace(/\/$/, "")
  return partidas
    .filter((p) => p.nosCasa && p.resultado === "Proximo" && new Date(p.data) >= agora)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, limite)
    .map((p) => ({
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${p.casa} x ${p.fora} — ${p.categoria}`,
      startDate: p.data,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      sport: "Futsal",
      url: `${base}/partidas`,
      location: {
        "@type": "Place",
        name: config.nome,
        address: enderecoPostal(config),
      },
      homeTeam: { "@type": "SportsTeam", name: p.casa },
      awayTeam: { "@type": "SportsTeam", name: p.fora },
    }))
}

/** Serializa para <script type="application/ld+json">, escapando "<" para não fechar a tag. */
export function serializarJsonLd(dados: Json | Json[]): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c")
}
