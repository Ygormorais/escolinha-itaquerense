/**
 * Cadastro manual de escudos de adversários.
 *
 * Edite: lib/landing/escudos-manuais.json
 * Arquivos: public/landing/escudos/<nome>.png
 *
 * Prioridade máxima na resolução de escudos (acima de logodetimes/wiki/FPFS).
 */

import manuais from "@/lib/landing/escudos-manuais.json"

export type EscudoManual = {
  /** Match exato (case-insensitive, normalizado) */
  equals?: string
  /** Substring no nome do adversário (case-insensitive) */
  contains?: string
  /** Regex em string, ex.: "INDAIATUBA|A\\.D\\. INDAIATUBA" */
  pattern?: string
  /**
   * Caminho local (/landing/escudos/x.png) ou URL https externa.
   * Locais: arquivo em public/landing/escudos/
   */
  src: string
  nota?: string
}

const entries = manuais as EscudoManual[]

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
}

/**
 * Retorna o src manual se o nome do adversário casar com alguma entrada.
 * Não valida se o arquivo existe em disco (o browser faz fallback se 404).
 */
export function escudoManual(nomeAdversario: string): string | null {
  const nome = nomeAdversario.trim()
  if (!nome) return null
  const n = norm(nome)

  for (const e of entries) {
    if (!e?.src) continue
    if (e.equals && norm(e.equals) === n) return e.src
    if (e.contains && n.includes(norm(e.contains))) return e.src
    if (e.pattern) {
      try {
        if (new RegExp(e.pattern, "i").test(nome)) return e.src
      } catch {
        /* regex inválida no JSON — ignora */
      }
    }
  }
  return null
}

export function listarEscudosManuais(): EscudoManual[] {
  return entries.slice()
}
