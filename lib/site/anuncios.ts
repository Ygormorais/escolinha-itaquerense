import { z } from "zod"

/**
 * Regras puras dos banners de publicidade: onde podem aparecer, quando estão no ar,
 * qual exibir e validação do cadastro. Sem Prisma: seguro para testes e client.
 */

export const POSICOES_ANUNCIO = {
  landing: "Página inicial, entre as notícias e a história",
  partidas: "Página de partidas, acima da classificação",
} as const

export type PosicaoAnuncio = keyof typeof POSICOES_ANUNCIO

export interface AnuncioPublico {
  id: number
  anunciante: string
  titulo: string
  imagemUrl: string
  imagemMobileUrl: string | null
}

interface Vigencia {
  ativo: boolean
  inicio: Date | null
  fim: Date | null
}

/** No ar: ativo e dentro do período (início e fim são opcionais; o fim vale o dia todo). */
export function anuncioNoAr(a: Vigencia, agora: Date): boolean {
  if (!a.ativo) return false
  if (a.inicio && agora < a.inicio) return false
  if (a.fim) {
    const fimDoDia = new Date(a.fim)
    fimDoDia.setHours(23, 59, 59, 999)
    if (agora > fimDoDia) return false
  }
  return true
}

/** Situação mostrada no admin. */
export function statusAnuncio(a: Vigencia, agora: Date): "no-ar" | "agendado" | "encerrado" | "pausado" {
  if (!a.ativo) return "pausado"
  if (a.inicio && agora < a.inicio) return "agendado"
  if (!anuncioNoAr(a, agora)) return "encerrado"
  return "no-ar"
}

/** Sorteia um dos banners no ar, para dividir a exibição entre patrocinadores da mesma posição. */
export function sortearAnuncio<T extends Vigencia>(lista: T[], agora: Date, aleatorio: () => number = Math.random): T | null {
  const noAr = lista.filter((a) => anuncioNoAr(a, agora))
  if (noAr.length === 0) return null
  return noAr[Math.min(noAr.length - 1, Math.floor(aleatorio() * noAr.length))]
}

/** Só http(s): o redirecionamento de clique nunca leva a javascript:, data: etc. */
export function linkSeguro(url: string): string | null {
  try {
    const u = new URL(url)
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null
  } catch {
    return null
  }
}

const imagem = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/uploads/publicidade/") || linkSeguro(v) !== null, "Imagem inválida")

const dataOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(`${v}T00:00:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "Data inválida")

export const AnuncioSchema = z
  .object({
    anunciante: z.string().trim().min(2, "Informe o anunciante").max(120),
    titulo: z.string().trim().min(3, "Descreva o banner em poucas palavras").max(160),
    imagemUrl: imagem,
    imagemMobileUrl: z.union([imagem, z.literal("")]).optional().transform((v) => v || null),
    link: z.string().trim().max(500).refine((v) => linkSeguro(v) !== null, "Use um link que comece com https://"),
    posicao: z.enum(Object.keys(POSICOES_ANUNCIO) as [PosicaoAnuncio, ...PosicaoAnuncio[]]),
    ativo: z.boolean(),
    inicio: dataOpcional,
    fim: dataOpcional,
  })
  .refine((a) => !a.inicio || !a.fim || a.fim >= a.inicio, { message: "O fim precisa ser depois do início", path: ["fim"] })

export type AnuncioEntrada = z.input<typeof AnuncioSchema>
