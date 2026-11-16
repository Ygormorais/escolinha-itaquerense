// Prefixos das chaves de pendência por grupo (ver lib/pendencias-data.ts).
const PREFIXOS_ADMINISTRATIVOS = ["pag", "sol", "ren", "esp", "doc"] as const
const PREFIXOS_TECNICOS = ["rot", "obj", "conv", "med"] as const

/** A chave pertence a um grupo que o perfil enxerga na central de pendências? */
export function perfilPodeTratarChave(role: string, chave: string): boolean {
  const prefixo = chave.split("-")[0]
  if (role === "admin") return [...PREFIXOS_ADMINISTRATIVOS, ...PREFIXOS_TECNICOS].some((p) => p === prefixo)
  if (role === "secretaria") return PREFIXOS_ADMINISTRATIVOS.some((p) => p === prefixo)
  if (role === "tecnico") return PREFIXOS_TECNICOS.some((p) => p === prefixo)
  return false
}
