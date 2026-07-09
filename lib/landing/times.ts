/**
 * Helpers puros de formatação de times/categorias (sem Node/Prisma).
 * Seguro para Client Components — não importar @/lib/db aqui.
 */

/** FPFS manda adversário em CAPS — normaliza para leitura. */
export function nomeTime(raw: string): string {
  const t = raw.trim()
  if (!t) return t
  // Já parece título (não é tudo maiúsculo) → mantém
  if (t !== t.toUpperCase()) return t
  return t
    .toLowerCase()
    .replace(/(^|[\s\-./])(\S)/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}

/**
 * Extrai a categoria de base a partir do nome do campeonato FPFS.
 * Ex.: "FPFS Categoria Sub-18 · ev.851" → "Sub-18"
 */
export function categoriaCurta(nomeCampeonato: string): string {
  const raw = nomeCampeonato.trim()
  const m = raw.match(/Sub[-\s]?(\d+)/i)
  if (m) return `Sub-${m[1]}`
  // Fallback: remove ruído FPFS / evento
  const limpo = raw
    .replace(/^FPFS\s*/i, "")
    .replace(/Categoria\s*/i, "")
    .replace(/\s*[·|].*$/, "")
    .replace(/\s*ev\.?\s*\d+/i, "")
    .trim()
  return limpo || raw
}
