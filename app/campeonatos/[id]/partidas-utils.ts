import { format } from "date-fns"
import type { PartidaCampeonato } from "@/components/campeonatos/types"

export type PartidaForm = {
  rodada: string
  data: string
  adversario: string
  local: string
  golsPro: string
  golsContra: string
  observacoes: string
}

export type PlacarForm = { golsPro: string; golsContra: string }

export type FiltroStatusPartida = "todas" | "realizadas" | "pendentes"

export function formPartidaVazio(): PartidaForm {
  return { rodada: "1", data: "", adversario: "", local: "Casa", golsPro: "", golsContra: "", observacoes: "" }
}

export function formDaPartida(p: PartidaCampeonato): PartidaForm {
  return {
    rodada: String(p.rodada),
    data: format(new Date(p.data), "yyyy-MM-dd"),
    adversario: p.adversario,
    local: p.local,
    golsPro: p.golsPro != null ? String(p.golsPro) : "",
    golsContra: p.golsContra != null ? String(p.golsContra) : "",
    observacoes: p.observacoes || "",
  }
}

/** Campos enviados à action; gols em branco viram null e observação vazia some. */
export function payloadPartida(form: PartidaForm) {
  return {
    rodada: Number(form.rodada),
    data: form.data,
    adversario: form.adversario,
    local: form.local,
    golsPro: form.golsPro ? Number(form.golsPro) : null,
    golsContra: form.golsContra ? Number(form.golsContra) : null,
    observacoes: form.observacoes || undefined,
  }
}

export function placarDaPartida(p: PartidaCampeonato): PlacarForm {
  return {
    golsPro: p.golsPro != null ? String(p.golsPro) : "",
    golsContra: p.golsContra != null ? String(p.golsContra) : "",
  }
}

export function filtrarPartidas(partidas: PartidaCampeonato[], filtroStatus: FiltroStatusPartida, search: string) {
  return partidas.filter((p) => {
    if (filtroStatus === "realizadas" && p.resultado == null) return false
    if (filtroStatus === "pendentes" && p.resultado != null) return false
    if (search && !p.adversario.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}
