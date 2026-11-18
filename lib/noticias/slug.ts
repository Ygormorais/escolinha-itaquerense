/** Slug de notícia: só letras minúsculas sem acento, números e hífens. */

const MAX_BASE = 70

/** "Vitória do Sub-11 na Copa!" -> "vitoria-do-sub-11-na-copa". */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE)
    .replace(/-+$/g, "")
}

/** Slug no formato que `slugify` produz; rejeita lixo da URL antes de ir ao banco. */
export function slugValido(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120
}

/**
 * Gera um slug único a partir do título. `existe` diz se o slug já está em uso;
 * em colisão acrescenta -2, -3… Título sem letras/números vira "noticia".
 */
export async function gerarSlugUnico(
  titulo: string,
  existe: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(titulo) || "noticia"
  if (!(await existe(base))) return base
  for (let n = 2; n < 1000; n++) {
    const candidato = `${base}-${n}`
    if (!(await existe(candidato))) return candidato
  }
  return `${base}-${Date.now().toString(36)}`
}
