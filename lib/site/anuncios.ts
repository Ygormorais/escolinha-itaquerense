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

/**
 * O clube é de São Paulo e o servidor roda em UTC: as datas do período são gravadas
 * como instantes no horário de Brasília (sem horário de verão desde 2019, então -03:00).
 * O início vale a partir de 00:00 e o fim até 23:59:59.999 do dia escolhido.
 */
export const FUSO_CLUBE = "America/Sao_Paulo"
const OFFSET_CLUBE = "-03:00"

export function inicioDoDiaNoClube(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000${OFFSET_CLUBE}`)
}

export function fimDoDiaNoClube(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999${OFFSET_CLUBE}`)
}

/** Data (YYYY-MM-DD) de um instante no calendário do clube; para inputs type=date. */
export function diaNoClube(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_CLUBE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

/** No ar: ativo e dentro do período (início e fim são opcionais e já gravados como instantes). */
export function anuncioNoAr(a: Vigencia, agora: Date): boolean {
  if (!a.ativo) return false
  if (a.inicio && agora < a.inicio) return false
  if (a.fim && agora > a.fim) return false
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

function dataOpcional(converter: (ymd: string) => Date) {
  return z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida")
    .transform((v) => (v ? converter(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Data inválida")
}

export const AnuncioSchema = z
  .object({
    anunciante: z.string().trim().min(2, "Informe o anunciante").max(120),
    titulo: z.string().trim().min(3, "Descreva o banner em poucas palavras").max(160),
    imagemUrl: imagem,
    imagemMobileUrl: z.union([imagem, z.literal("")]).optional().transform((v) => v || null),
    link: z.string().trim().max(500).refine((v) => linkSeguro(v) !== null, "Use um link que comece com https://"),
    posicao: z.enum(Object.keys(POSICOES_ANUNCIO) as [PosicaoAnuncio, ...PosicaoAnuncio[]]),
    ativo: z.boolean(),
    inicio: dataOpcional(inicioDoDiaNoClube),
    fim: dataOpcional(fimDoDiaNoClube),
  })
  .refine((a) => !a.inicio || !a.fim || a.fim >= a.inicio, { message: "O fim precisa ser depois do início", path: ["fim"] })

export type AnuncioEntrada = z.input<typeof AnuncioSchema>
